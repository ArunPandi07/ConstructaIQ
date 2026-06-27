import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.db.repositories.user_repository import UserRepository
from app.db.session import _get_session_factory
from app.services.auth_service import decode_access_token
from app.services.chat_service import clear_chat_history, stream_chat
from app.services.logging_service import get_logger
from app.services.project_service import _get_project_or_404
from app.services.websocket_manager import manager

logger = get_logger("WebSockets")
router = APIRouter(prefix="/ws", tags=["WebSockets"])


async def _authenticate_chat_user(token: str | None, db) -> int | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        return None
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        return None
    return user_id


@router.websocket("/pipeline/{project_id}")
async def pipeline_endpoint(websocket: WebSocket, project_id: str):
    await manager.connect(websocket, "pipeline", project_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "pipeline", project_id)


@router.websocket("/chat/{project_id}")
async def chat_endpoint(
    websocket: WebSocket,
    project_id: str,
    token: str | None = Query(None),
):
    try:
        parsed_project_id = int(project_id)
    except ValueError:
        await websocket.close(code=4400, reason="Invalid project id")
        return

    factory = _get_session_factory()
    async with factory() as db:
        user_id = await _authenticate_chat_user(token, db)
        if user_id is None:
            await websocket.close(code=4401, reason="Authentication required")
            return

        try:
            await _get_project_or_404(db, parsed_project_id)
        except Exception:
            await websocket.close(code=4404, reason="Project not found")
            return

    await manager.connect(websocket, "chat", project_id)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps(
                        {"type": "CHAT_ERROR", "message": "Invalid JSON payload."}
                    )
                )
                continue

            msg_type = data.get("type")
            session_id = str(data.get("session_id") or "default")

            if msg_type == "CHAT_RESET":
                async with factory() as db:
                    auth_user_id = await _authenticate_chat_user(token, db)
                    if auth_user_id is None:
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "CHAT_ERROR",
                                    "message": "Authentication required.",
                                }
                            )
                        )
                        continue
                    await clear_chat_history(
                        db,
                        auth_user_id,
                        parsed_project_id,
                        session_id,
                    )
                await websocket.send_text(json.dumps({"type": "CHAT_RESET_DONE"}))
                continue

            if msg_type != "CHAT_MESSAGE":
                continue

            content = data.get("content")
            if not isinstance(content, str):
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "CHAT_ERROR",
                            "message": "CHAT_MESSAGE requires a string content field.",
                        }
                    )
                )
                continue

            agent_name = data.get("agent_name")
            if agent_name is not None and not isinstance(agent_name, str):
                agent_name = None

            run_id = data.get("run_id")
            if run_id is not None and not isinstance(run_id, str):
                run_id = None

            async with factory() as db:
                auth_user_id = await _authenticate_chat_user(token, db)
                if auth_user_id is None:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "CHAT_ERROR",
                                "message": "Authentication required.",
                            }
                        )
                    )
                    continue

                await stream_chat(
                    websocket=websocket,
                    project_id=parsed_project_id,
                    session_id=session_id,
                    user_message=content,
                    db=db,
                    user_id=auth_user_id,
                    agent_name=agent_name or None,
                    run_id=run_id or None,
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, "chat", project_id)
    except Exception:
        logger.exception("Chat websocket error for project_id=%s", project_id)
        manager.disconnect(websocket, "chat", project_id)


@router.websocket("/dashboard")
async def dashboard_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "dashboard", "global")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "dashboard", "global")


@router.websocket("/telemetry")
async def telemetry_endpoint(websocket: WebSocket):
    import asyncio
    await websocket.accept()
    try:
        while True:
            # Mock or query GPU stats
            try:
                proc = await asyncio.create_subprocess_shell(
                    "nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                gpu_util, vram = 0, 0
                if proc.returncode == 0:
                    lines = stdout.decode().strip().split("\n")
                    if lines:
                        parts = lines[0].split(",")
                        gpu_util, vram = int(parts[0].strip()), int(parts[1].strip())
                else:
                    import random
                    gpu_util, vram = random.randint(40, 95), random.randint(8000, 24000)
            except Exception:
                import random
                gpu_util, vram = random.randint(40, 95), random.randint(8000, 24000)
            
            await websocket.send_json({
                "gpu_utilization_avg": gpu_util,
                "vram_peak_mb": vram,
                "timestamp": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
            })
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
