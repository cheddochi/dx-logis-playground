import re
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, get_settings
from models import AXProject
from schemas import AXProjectCreate, AXProjectUpdate, AXProjectOut, AXProjectSimpleCreate, AXProjectDetail

router = APIRouter()
logger = logging.getLogger(__name__)


def _html_dir() -> Path:
    return Path(get_settings().ax_html_dir)


def _html_file_path(project_id: int) -> Path:
    return _html_dir() / f"{project_id}.html"


def _write_html_file(project_id: int, html_content: str) -> None:
    """HTML을 디스크에 저장 (best-effort). 파일시스템 쓰기가 불가한 환경에서도 등록 자체는 실패하지 않도록 함."""
    try:
        dir_path = _html_dir()
        dir_path.mkdir(parents=True, exist_ok=True)
        (dir_path / f"{project_id}.html").write_text(html_content, encoding='utf-8')
    except OSError:
        logger.warning("HTML 파일 저장 실패 (project_id=%s)", project_id, exc_info=True)


async def sync_html_files_to_disk(db: AsyncSession) -> None:
    """DB에 저장된 과제의 업로드 HTML을 디스크에 동기화 (재배포로 디스크가 초기화된 경우 복구)."""
    result = await db.execute(
        select(AXProject.id, AXProject.html_content)
        .where(AXProject.html_content.is_not(None))
    )
    for row in result:
        file_path = _html_file_path(row.id)
        if not file_path.exists():
            _write_html_file(row.id, row.html_content)


def _validate_html_upload(filename: str | None, content: str) -> None:
    if not (filename or '').lower().endswith('.html'):
        raise HTTPException(status_code=400, detail="HTML(.html) 파일만 업로드 가능합니다.")
    if len(content.encode('utf-8')) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다.")


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
    if body.html_content:
        _validate_html_upload(body.html_filename, body.html_content)

    project = AXProject(**body.model_dump(), task_type='advanced')
    db.add(project)
    await db.commit()
    await db.refresh(project)

    if body.html_content:
        _write_html_file(project.id, body.html_content)

    return project


@router.post("/upload-html", response_model=AXProjectOut, status_code=201)
async def upload_html_project(body: AXProjectSimpleCreate, db: AsyncSession = Depends(get_db)):
    _validate_html_upload(body.html_filename, body.html_content)

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

    _write_html_file(project.id, body.html_content)

    return project


@router.get("/{project_id}/html")
async def get_project_html(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AXProject.html_content).where(AXProject.id == project_id)
    )
    row = result.first()
    if not row or not row.html_content:
        raise HTTPException(status_code=404, detail="HTML 콘텐츠를 찾을 수 없습니다.")

    file_path = _html_file_path(project_id)
    if file_path.exists():
        return FileResponse(file_path, media_type="text/html; charset=utf-8")

    return Response(content=row.html_content.encode('utf-8'), media_type="text/html; charset=utf-8")


@router.get("/{project_id}", response_model=AXProjectDetail)
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

    try:
        _html_file_path(project_id).unlink(missing_ok=True)
    except OSError:
        logger.warning("HTML 파일 삭제 실패 (project_id=%s)", project_id, exc_info=True)
