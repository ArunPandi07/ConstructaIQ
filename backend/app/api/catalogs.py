from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.crew_master_repository import CrewMasterRepository
from app.db.repositories.supplier_master_repository import SupplierMasterRepository
from app.db.repositories.supplier_material_repository import SupplierMaterialRepository
from app.db.session import get_db_required
from app.schemas.api_response import success_response
from app.schemas.crew_master import CrewMasterCreate, CrewMasterRead
from app.schemas.supplier_master import SupplierMasterCreate, SupplierMasterRead
from app.schemas.supplier_material import SupplierMaterialCreate, SupplierMaterialRead

router = APIRouter(tags=["Catalogs"])


@router.get("/suppliers")
async def list_suppliers(
    session: AsyncSession = Depends(get_db_required),
):
    repo = SupplierMasterRepository(session)
    suppliers = await repo.list_with_materials()
    return success_response([SupplierMasterRead.model_validate(s) for s in suppliers])


@router.post("/suppliers", status_code=status.HTTP_201_CREATED)
async def create_supplier(
    payload: SupplierMasterCreate,
    session: AsyncSession = Depends(get_db_required),
):
    repo = SupplierMasterRepository(session)
    supplier = await repo.create(payload)
    await session.commit()
    return success_response(SupplierMasterRead.model_validate(supplier))


@router.get("/suppliers/{supplier_id}/materials")
async def list_supplier_materials(
    supplier_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    master_repo = SupplierMasterRepository(session)
    supplier = await master_repo.get_by_id(supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")

    material_repo = SupplierMaterialRepository(session)
    materials = await material_repo.list_by_supplier(supplier_id)
    return success_response(
        [SupplierMaterialRead.model_validate(m) for m in materials]
    )


@router.post(
    "/suppliers/{supplier_id}/materials",
    status_code=status.HTTP_201_CREATED,
)
async def create_supplier_material(
    supplier_id: int,
    payload: SupplierMaterialCreate,
    session: AsyncSession = Depends(get_db_required),
):
    master_repo = SupplierMasterRepository(session)
    supplier = await master_repo.get_by_id(supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")

    material_repo = SupplierMaterialRepository(session)
    material = await material_repo.create(
        SupplierMaterialCreate(**{**payload.model_dump(), "supplier_id": supplier_id})
    )
    await session.commit()
    return success_response(SupplierMaterialRead.model_validate(material))


@router.get("/crew")
async def list_crew(
    session: AsyncSession = Depends(get_db_required),
):
    repo = CrewMasterRepository(session)
    crew = await repo.list()
    return success_response([CrewMasterRead.model_validate(c) for c in crew])


@router.post("/crew", status_code=status.HTTP_201_CREATED)
async def create_crew_member(
    payload: CrewMasterCreate,
    session: AsyncSession = Depends(get_db_required),
):
    repo = CrewMasterRepository(session)
    crew = await repo.create(payload)
    await session.commit()
    return success_response(CrewMasterRead.model_validate(crew))
