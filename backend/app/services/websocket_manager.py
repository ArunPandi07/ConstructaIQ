import json
from typing import Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps channel (e.g. "pipeline", "chat", "dashboard") 
        # to a dict mapping identifiers (like project_id) to sets of WebSockets
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {
            "pipeline": {},
            "chat": {},
            "dashboard": {"global": set()},
        }

    async def connect(self, websocket: WebSocket, channel: str, identifier: str = "global"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = {}
        if identifier not in self.active_connections[channel]:
            self.active_connections[channel][identifier] = set()
        self.active_connections[channel][identifier].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str, identifier: str = "global"):
        try:
            self.active_connections[channel][identifier].remove(websocket)
            if not self.active_connections[channel][identifier]:
                del self.active_connections[channel][identifier]
        except KeyError:
            pass

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict, channel: str, identifier: str = "global"):
        if channel in self.active_connections and identifier in self.active_connections[channel]:
            # Create a copy of the set to avoid RuntimeError if connection drops during broadcast
            connections = list(self.active_connections[channel][identifier])
            msg_str = json.dumps(message)
            for connection in connections:
                try:
                    await connection.send_text(msg_str)
                except Exception:
                    self.disconnect(connection, channel, identifier)

manager = ConnectionManager()
