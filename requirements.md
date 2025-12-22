# GAAIUS AI - Requirements & Architecture

## Original Problem Statement
Create AI that has same interface as Groq BUT it uses open source AI and it chooses the best AI for every task. Use Groq for chat, Replicate for image and video generation, OpenAI TTS and Whisper for voice. They must all act as one unified AI called GAAIUS AI.

## Architecture

### Backend (FastAPI)
- **Chat**: Groq API with Llama 3.3 70B Versatile
- **Image Generation**: HuggingFace Inference API with FLUX.1-dev (FREE!)
- **Video Generation**: GAAIUS AI Keyframe Engine (combines FLUX + Groq)
  - Uses Groq to generate scene descriptions
  - Uses FLUX to generate AI keyframes
  - Stitches frames into video with smooth transitions
- **Text-to-Speech**: OpenAI TTS via Emergent integrations
- **Speech-to-Text**: OpenAI Whisper via Emergent integrations
- **Database**: MongoDB for sessions, messages, and generations

### Video Engine Features
- **Standard Video**: 5-second videos with 3+ AI-generated keyframes
- **Advanced Video**: Custom duration (up to 30s), multiple styles
- **Story Video**: Multi-chapter videos (up to 5 chapters, 15s each)
- **Styles**: cinematic, anime, realistic, artistic

### Frontend (React)
- Modern glassmorphic "Electric Void" dark theme
- Mode switcher (Chat/Image/Video)
- Session management with sidebar
- Voice input/output controls
- Real-time chat with model indicators
- Video player with download

## API Endpoints
- `GET /api/health` - Health check with model availability
- `POST /api/sessions` - Create chat session
- `GET /api/sessions` - List sessions
- `DELETE /api/sessions/{id}` - Delete session
- `POST /api/chat` - Send chat message
- `GET /api/chat/{session_id}/history` - Get chat history
- `POST /api/image/generate` - Generate image (HuggingFace FLUX)
- `POST /api/video/generate` - Generate video (AI Keyframe Engine)
- `POST /api/video/generate-advanced` - Advanced video with options
- `POST /api/video/generate-story` - Multi-chapter story video
- `POST /api/tts` - Text-to-speech
- `POST /api/stt` - Speech-to-text
- `GET /api/generations` - List generated media
- `GET /api/static/{filename}` - Serve generated images
- `GET /api/static/videos/{filename}` - Serve generated videos

## Tasks Completed
- [x] Backend with all AI integrations
- [x] Chat functionality with Groq Llama 3.3 70B
- [x] Image generation with HuggingFace FLUX.1-dev (FREE!)
- [x] Video generation with AI Keyframe Engine (FREE!)
- [x] TTS with OpenAI via Emergent
- [x] STT with Whisper via Emergent
- [x] Session management in MongoDB
- [x] Modern glassmorphic UI
- [x] Mode switching (Chat/Image/Video)
- [x] Voice input/output controls
- [x] Chat history persistence
- [x] Image gallery with downloads
- [x] Video gallery with downloads

## Next Tasks
- [ ] Add video style selector in UI
- [ ] Add story video mode in UI
- [ ] Implement video progress tracking
- [ ] Add background music to videos
- [ ] Add streaming chat responses

## API Keys Required
- `GROQ_API_KEY` - For Llama 3.3 70B chat + video scene generation
- `HF_TOKEN` - For HuggingFace FLUX image/video keyframe generation (FREE!)
- `EMERGENT_LLM_KEY` - For OpenAI TTS/Whisper
