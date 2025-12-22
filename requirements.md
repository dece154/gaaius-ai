# GAAIUS AI - Requirements & Architecture

## Original Problem Statement
Create AI that has same interface as Groq BUT it uses open source AI and it chooses the best AI for every task. Use Groq for chat, HuggingFace for image/video/audio generation, free TTS and STT. All act as one unified AI called GAAIUS AI. Added user authentication, PayPal ($1 international) and PayFast (ZAR, South Africa) payment integration for Pro subscription, ad banners for free users, Projects page, Build/Vibe Coder page.

## Architecture

### Backend (FastAPI)
- **Chat**: Groq API with Llama 3.3 70B Versatile
- **Image Generation**: HuggingFace FLUX.1-dev (FREE!)
- **Video Generation**: GAAIUS AI Keyframe Engine (FLUX + Groq)
- **Audio Generation**: HuggingFace MusicGen
- **Text-to-Speech**: HuggingFace espnet/VITS, MMS-TTS (FREE!)
- **Speech-to-Text**: HuggingFace Whisper (FREE!)
- **File Generation**: Groq Llama 3.3 for code/docs/data
- **Authentication**: JWT tokens with email/password
- **Payments**: PayPal + PayFast integration
- **Database**: MongoDB

### Video Engine Features
- **Standard Video**: 5-30s with AI-generated keyframes
- **Story Video**: Multi-chapter (up to 5 chapters)
- **Styles**: cinematic, anime, realistic, artistic

### Frontend (React)
- **5 Modes**: Chat, Image, Video, Audio, Files
- **Projects Page**: User project management
- **Build Page**: Vibe Coder with split view (chat + preview)
- **Authentication**: Sign in/up modals
- **Pro Upgrade**: PayPal and PayFast payment modals
- **Ad Banners**: For non-pro users

## API Endpoints
### Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Payments
- `GET /api/payment/config` - Get payment config
- `POST /api/payment/paypal/create` - Create PayPal order
- `POST /api/payment/paypal/capture/{order_id}` - Capture PayPal payment
- `POST /api/payment/payfast/create` - Create PayFast payment
- `POST /api/payment/payfast/notify` - PayFast webhook

### Generation
- `POST /api/chat` - Chat with AI
- `POST /api/image/generate` - Generate image
- `POST /api/video/generate` - Generate video
- `POST /api/video/generate-story` - Generate story video
- `POST /api/audio/generate` - Generate music/audio
- `POST /api/tts` - Text-to-speech
- `POST /api/stt` - Speech-to-text
- `POST /api/file/generate` - Generate code/docs

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/{id}` - Get project

### Build
- `POST /api/build/generate` - Generate code for vibe coder

## Tasks Completed
- [x] All AI integrations (Groq, HuggingFace)
- [x] 5 generation modes (Chat, Image, Video, Audio, Files)
- [x] User authentication (JWT)
- [x] PayPal payment integration
- [x] PayFast payment integration (South Africa)
- [x] Pro subscription with ad removal
- [x] Projects page
- [x] Build/Vibe Coder page with split view
- [x] Mobile responsive design
- [x] TTS with fallback models
- [x] STT with Whisper

## API Keys Required
- `GROQ_API_KEY` - Groq Llama 3.3 70B
- `HF_TOKEN` - HuggingFace (FREE!)
- `PAYPAL_CLIENT_ID` - PayPal
- `PAYPAL_SECRET` - PayPal
- `PAYFAST_MERCHANT_ID` - PayFast
- `PAYFAST_MERCHANT_KEY` - PayFast
- `JWT_SECRET` - JWT authentication
