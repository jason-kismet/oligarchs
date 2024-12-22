from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Set
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
connections: Dict[str, WebSocket] = {}
games: Dict[str, Dict] = {}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connections[client_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "create_game":
                game_id = message["game_id"]
                games[game_id] = {
                    "players": [client_id],
                    "current_turn": client_id,
                    "state": "waiting"  # waiting, playing, finished
                }
                await websocket.send_json({
                    "type": "game_created",
                    "game_id": game_id
                })
                
            elif message["type"] == "join_game":
                game_id = message["game_id"]
                if game_id in games:
                    games[game_id]["players"].append(client_id)
                    games[game_id]["state"] = "playing"
                    # Notify all players in the game
                    for player_id in games[game_id]["players"]:
                        await connections[player_id].send_json({
                            "type": "game_started",
                            "game_id": game_id,
                            "players": games[game_id]["players"]
                        })
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        del connections[client_id] 