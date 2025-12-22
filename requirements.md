# GAAIUS AI - Requirements & Architecture

## Original Problem Statement
Create AI that has same interface as Groq BUT it uses open source AI and it chooses the best AI for every task. Use Groq for chat, Replicate for image and video generation, OpenAI TTS and Whisper for voice. They must all act as one unified AI called GAAIUS AI.

## Architecture

### Backend (FastAPI)
- **Chat**: Groq API with Llama 3.3 70B Versatile
- **Image Generation**: Replicate API with Flux Schnell
- **Video Generation**: Replicate API with MiniMax Video-01
- **Text-to-Speech**: OpenAI TTS via Emergent integrations
- **Speech-to-Text**: OpenAI Whisper via Emergent integrations
- **Database**: MongoDB for sessions, messages, and generations

### Frontend (React)
- Modern glassmorphic "Electric Void" dark theme
- Mode switcher (Chat/Image/Video)
- Session management with sidebar
- Voice input/output controls
- Real-time chat with model indicators

## API Endpoints
- `GET /api/health` - Health check with model availability
- `POST /api/sessions` - Create chat session
- `GET /api/sessions` - List sessions
- `DELETE /api/sessions/{id}` - Delete session
- `POST /api/chat` - Send chat message
- `GET /api/chat/{session_id}/history` - Get chat history
- `POST /api/image/generate` - Generate image
- `POST /api/video/generate` - Generate video
- `POST /api/tts` - Text-to-speech
- `POST /api/stt` - Speech-to-text
- `GET /api/generations` - List generated media

## Tasks Completed
- [x] Backend with all AI integrations
- [x] Chat functionality with Groq Llama 3.3 70B
- [x] Image generation endpoint (Flux Schnell)
- [x] Video generation endpoint (MiniMax)
- [x] TTS with OpenAI via Emergent
- [x] STT with Whisper via Emergent
- [x] Session management in MongoDB
- [x] Modern glassmorphic UI
- [x] Mode switching (Chat/Image/Video)
- [x] Voice input/output controls
- [x] Chat history persistence
- [x] User-friendly error messages

## Next Tasks
- [ ] Add credits to Replicate account to enable image/video generation
- [ ] Add more voice options selector
- [ ] Implement chat session renaming
- [ ] Add image/video generation history to chat context
- [ ] Add streaming responses for chat
- [ ] Add more image generation options (aspect ratio, quality)
- [ ] Implement prompt templates/suggestions

## API Keys Required
- `GROQ_API_KEY` - For Llama 3.3 70B chat
- `REPLICATE_API_TOKEN` - For Flux/MiniMax generation
- `EMERGENT_LLM_KEY` - For OpenAI TTS/Whisper
