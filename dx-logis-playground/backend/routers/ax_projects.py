import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import AXProject
from schemas import AXProjectCreate, AXProjectUpdate, AXProjectOut, AXProjectSimpleCreate

router = APIRouter()


def _to_slug(name: str) -> str:
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = slug.strip('-')
    return slug or f'project-{uuid.uuid4().hex[:8]}'


async def _unique_slug(base: str, db: AsyncSession, exclude_id: int | None = None) -> str:
    slug, counter = base, 1
    while True:
        q = select(AXProject).where(AXProject.slug == slug)
        if exclude_id:
            q = q.where(AXProject.id != exclude_id)
        if (await db.execute(q)).scalar_one_or_none() is None:
            return slug
        slug = f'{base}-{counter}'
        counter += 1


@router.get("/", response_model=list[AXProjectOut])
async def list_ax_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AXProject).order_by(AXProject.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=AXProjectOut, status_code=201)
async def create_ax_project(body: AXProjectCreate, db: AsyncSession = Depends(get_db)):
    project = AXProject(**body.model_dump(), task_type='advanced')
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.post("/upload-html", response_model=AXProjectOut, status_code=201)
async def upload_html_project(body: AXProjectSimpleCreate, db: AsyncSession = Depends(get_db)):
    if not body.html_filename.lower().endswith('.html'):
        raise HTTPException(status_code=400, detail="HTML(.html) 파일만 업로드 가능합니다.")

    if len(body.html_content.encode('utf-8')) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다.")

    slug = await _unique_slug(_to_slug(body.name), db)

    project = AXProject(
        name=body.name,
        slug=slug,
        description=body.description,
        developer=body.developer,
        task_type='simple',
        html_content=body.html_content,
        html_filename=body.html_filename,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}/html")
async def get_project_html(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AXProject).where(AXProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project or project.task_type != 'simple' or not project.html_content:
        raise HTTPException(status_code=404, detail="HTML 콘텐츠를 찾을 수 없습니다.")
    return Response(content=project.html_content, media_type="text/html; charset=utf-8")


@router.get("/{project_id}", response_model=AXProjectOut)
async def get_ax_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AXProject).where(AXProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=AXProjectOut)
async def update_ax_project(
    project_id: int, body: AXProjectUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AXProject).where(AXProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_ax_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AXProject).where(AXProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
