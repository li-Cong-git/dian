from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
from companion import VirtualCompanion
from config import settings

app = FastAPI(title="Virtual Companion API", root_path="/v1")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class Message(BaseModel):
    content: str
    role: str = "user"
    scenario: Optional[str] = None

class Conversation(BaseModel):
    messages: List[Message]

class CompanionProfile(BaseModel):
    name: str
    personality: str
    interests: List[str]
    background: str
    style_type: Optional[str] = "温柔型"

# 全局虚拟伴侣实例
companion = None

# 路由
@app.get("/")
async def root():
    return {"message": "Welcome to Virtual Companion API"}

@app.post("/companion/profile")
async def create_profile(profile: CompanionProfile):
    global companion
    companion = VirtualCompanion(
        name=profile.name,
        personality=profile.personality,
        interests=profile.interests,
        background=profile.background,
        style_type=profile.style_type  # 新增
    )
    return {"message": "Profile created successfully", "profile": companion.get_profile()}

@app.get("/companion/profile")
async def get_profile():
    if not companion:
        raise HTTPException(status_code=404, detail="Companion profile not created")
    return companion.get_profile()

@app.post("/chat")
async def chat(conversation: Conversation):
    if not companion:
        raise HTTPException(status_code=404, detail="Companion profile not created")
    if not conversation.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    # 用前端传来的所有历史，重建 conversation_history
    from datetime import datetime
    companion.conversation_history = [
        {
            "role": msg.role if msg.role != "companion" else "assistant",
            "content": msg.content,
            "timestamp": datetime.now().isoformat(),
            "scenario": getattr(msg, "scenario", None) or getattr(companion, "current_scenario", "casual")
        }
        for msg in conversation.messages
    ]
    last_message = conversation.messages[-1]
    result = companion.process_message(
        last_message.content,
        scenario=last_message.scenario
    )
    # 只返回字符串
    if isinstance(result, dict) and "text" in result:
        text = result["text"]
    elif isinstance(result, str):
        text = result
    else:
        text = str(result)
    # 如果 text 是 JSON 字符串，尝试只取 text 字段
    try:
        import json
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "text" in parsed:
            text = parsed["text"]
    except Exception:
        pass
    return {
        "text": text,
        "emotional_state": getattr(companion, "emotional_state", None),
        "behavior_patterns": getattr(companion, "behavior_patterns", None),
        "current_scenario": getattr(companion, "current_scenario", None)
    }

@app.get("/scenarios")
async def get_scenarios():
    return settings.CONVERSATION_SCENARIOS

@app.post("/scenario/{scenario_name}")
async def set_scenario(scenario_name: str):
    if not companion:
        raise HTTPException(status_code=404, detail="Companion profile not created")
    
    if companion.set_scenario(scenario_name):
        return {"message": f"Scenario set to {scenario_name}"}
    else:
        raise HTTPException(status_code=400, detail="Invalid scenario")
 
@app.get("/conversation/history")
async def get_conversation_history():
    if not companion:
        raise HTTPException(status_code=404, detail="Companion profile not created")
    return {"history": companion.conversation_history}

@app.post("/conversation/save")
async def save_conversation(filename: str = "conversation_history.json"):
    if not companion:
        raise HTTPException(status_code=404, detail="Companion profile not created")
    companion.save_conversation_history(filename)
    return {"message": f"Conversation history saved to {filename}"}

@app.post("/conversation/load")
async def load_conversation(filename: str = "conversation_history.json"):
    if not companion:
        raise HTTPException(status_code=404, detail="Companion profile not created")
    companion.load_conversation_history(filename)
    return {"message": f"Conversation history loaded from {filename}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)