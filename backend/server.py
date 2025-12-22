from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncio
import base64
import io

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
REPLICATE_API_TOKEN = os.environ.get('REPLICATE_API_TOKEN')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
HF_TOKEN = os.environ.get('HF_TOKEN')

# Set replicate token in environment
os.environ['REPLICATE_API_TOKEN'] = REPLICATE_API_TOKEN or ''

# Initialize Groq client
from groq import Groq
groq_client = Groq(api_key=GROQ_API_KEY)

# Initialize Replicate
import replicate

# Initialize Hugging Face client
from huggingface_hub import InferenceClient
hf_client = InferenceClient(api_key=HF_TOKEN)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # user, assistant
    content: str
    model_used: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str
    
class ChatResponse(BaseModel):
    id: str
    content: str
    model_used: str
    timestamp: str

class ImageGenerationRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None

class ImageGenerationResponse(BaseModel):
    id: str
    prompt: str
    image_url: str
    model_used: str
    timestamp: str

class VideoGenerationRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None

class VideoGenerationResponse(BaseModel):
    id: str
    prompt: str
    video_url: str
    model_used: str
    timestamp: str

class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Chat"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "GAAIUS AI Backend Running", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "groq": bool(GROQ_API_KEY),
        "replicate": bool(REPLICATE_API_TOKEN),
        "tts": bool(EMERGENT_LLM_KEY)
    }

# ============== SESSION ROUTES ==============

@api_router.post("/sessions", response_model=dict)
async def create_session(name: str = "New Chat"):
    session = Session(name=name)
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.sessions.insert_one(doc)
    return {"id": session.id, "name": session.name, "created_at": doc['created_at']}

@api_router.get("/sessions")
async def get_sessions():
    sessions = await db.sessions.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return sessions

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    await db.sessions.delete_one({"id": session_id})
    await db.messages.delete_many({"session_id": session_id})
    return {"status": "deleted"}

# ============== CHAT ROUTES (GROQ) ==============

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get chat history for context
        history = await db.messages.find(
            {"session_id": request.session_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(50)
        
        # Build messages for Groq
        messages = [
            {"role": "system", "content": "You are GAAIUS AI, a powerful unified AI assistant. You can help with text conversations, and your system also supports image generation, video generation, and voice capabilities. Be helpful, creative, and engaging."}
        ]
        
        for msg in history:
            messages.append({"role": msg['role'], "content": msg['content']})
        
        messages.append({"role": "user", "content": request.message})
        
        # Call Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=2048
        )
        
        response_content = completion.choices[0].message.content
        model_used = "Groq Llama 3.3 70B"
        
        # Save user message
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        user_doc = user_msg.model_dump()
        user_doc['timestamp'] = user_doc['timestamp'].isoformat()
        await db.messages.insert_one(user_doc)
        
        # Save assistant message
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response_content,
            model_used=model_used
        )
        assistant_doc = assistant_msg.model_dump()
        assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
        await db.messages.insert_one(assistant_doc)
        
        # Update session
        await db.sessions.update_one(
            {"id": request.session_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return ChatResponse(
            id=assistant_msg.id,
            content=response_content,
            model_used=model_used,
            timestamp=assistant_doc['timestamp']
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    messages = await db.messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    return messages

# ============== IMAGE GENERATION (REPLICATE) ==============

@api_router.post("/image/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    try:
        # Use Hugging Face Inference API with FLUX model
        image = hf_client.text_to_image(
            request.prompt,
            model="black-forest-labs/FLUX.1-dev"
        )
        
        # Convert PIL image to base64 for storage/display
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        image_url = f"data:image/png;base64,{img_base64}"
        
        model_used = "FLUX.1-dev (HuggingFace)"
        gen_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.generations.insert_one({
            "id": gen_id,
            "type": "image",
            "prompt": request.prompt,
            "url": image_url,
            "model_used": model_used,
            "session_id": request.session_id,
            "timestamp": timestamp
        })
        
        return ImageGenerationResponse(
            id=gen_id,
            prompt=request.prompt,
            image_url=image_url,
            model_used=model_used,
            timestamp=timestamp
        )
        
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        error_msg = str(e)
        if "402" in error_msg or "credit" in error_msg.lower() or "billing" in error_msg.lower():
            raise HTTPException(status_code=402, detail="Image generation requires API credits.")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {error_msg}")

# ============== VIDEO GENERATION (REPLICATE) ==============

@api_router.post("/video/generate", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest):
    try:
        # Use MiniMax video-01 for video generation
        output = replicate.run(
            "minimax/video-01",
            input={
                "prompt": request.prompt,
                "prompt_optimizer": True
            }
        )
        
        video_url = str(output) if output else ""
        
        model_used = "MiniMax Video-01"
        gen_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.generations.insert_one({
            "id": gen_id,
            "type": "video",
            "prompt": request.prompt,
            "url": video_url,
            "model_used": model_used,
            "session_id": request.session_id,
            "timestamp": timestamp
        })
        
        return VideoGenerationResponse(
            id=gen_id,
            prompt=request.prompt,
            video_url=video_url,
            model_used=model_used,
            timestamp=timestamp
        )
        
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        error_msg = str(e)
        if "402" in error_msg or "credit" in error_msg.lower() or "billing" in error_msg.lower():
            raise HTTPException(status_code=402, detail="Video generation requires Replicate API credits. Please add credits to your Replicate account.")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {error_msg}")

# ============== TEXT-TO-SPEECH (OpenAI via Emergent) ==============

@api_router.post("/tts")
async def text_to_speech(request: TTSRequest):
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_bytes = await tts.generate_speech(
            text=request.text,
            model="tts-1",
            voice=request.voice,
            response_format="mp3"
        )
        
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
        
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== SPEECH-TO-TEXT (Whisper via Emergent) ==============

@api_router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        # Read the uploaded file
        audio_content = await audio.read()
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.webm"
        
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json"
        )
        
        return {"text": response.text, "model_used": "Whisper"}
        
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== GENERATION HISTORY ==============

@api_router.get("/generations")
async def get_generations(gen_type: Optional[str] = None, limit: int = 20):
    query = {}
    if gen_type:
        query["type"] = gen_type
    
    generations = await db.generations.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    
    return generations

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
