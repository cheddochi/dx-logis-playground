from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import AXProject
from schemas import AXProjectCreate, AXProjectUpdate, AXProjectOut

router = APIRouter()


@router.get("/", response_model=list[AXProjectOut])
async def list_ax_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AXProject).order_by(AXProject.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=AXProjectOut, status_code=201)
async def create_ax_project(body: AXProjectCreate, db: AsyncSession = Depends(get_db)):
    project = AXProject(**body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
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
