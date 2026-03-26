# GAAIUS AI - Product Requirements Document

## Original Problem Statement
Build a sophisticated AI assistant called "GAAIUS AI" - a unified interface for multiple AI models supporting Chat, Image, Video, Audio, and File generation. The app includes a "Build" page (Replit-like IDE), "Projects" page, and an AI-driven "Document Studio."

## Core Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + Groq AI + gTTS + Pollinations.ai + HuggingFace
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Zustand + Sonner toasts
- **Auth**: JWT-based with SHA256 password hashing
- **Payments**: PayPal + PayFast integrated

## What's Been Implemented

### Completed Features (as of March 16, 2026)
- **Multi-mode Chat System**: Chat, Image, Video, Audio, File modes with non-blocking generation
- **Groq-powered Chat**: With web search capability, date/time awareness, ChatGPT-like styling
- **ChatGPT-style Formatting**: System fonts, 1.7x line height, proper markdown (bold, code, headings, lists)
- **Speakable Chat Messages**: Multi-language TTS with language selector on each AI response
- **Auto-speak Toggle**: Voice On/Off button in chat header, persists in localStorage
- **Collapsible Sidebar**: Expand/collapse with icon-only mode, state persisted in localStorage
- **Audio Generation**: Advanced controls (voice, language, duration dropdowns), AI story/narration via gTTS
- **Image Generation**: Multi-provider fallback (Pollinations -> HuggingFace SDXL -> FLUX) with 3-attempt retry
- **Video Generation**: Slideshow engine using Pollinations images
- **File Generation**: Supports PDF, DOCX, XLSX, code files via Groq AI
- **GAAIUS AI Builder**: Replit-like IDE with AI chat, live preview, code editor, split view, file tabs, multi-file support
- **GAAIUS AI Document Studio**: AI-driven document creation with 6 specialized AI Agents (General, Lawyer, Accountant, HR, Marketing, Academic)
- **Projects Page**: CRUD for user projects
- **Auth System**: Register/Login with JWT tokens
- **Payment Integration**: PayPal (full flow) + PayFast (redirect flow with ITN callback)
- **Pro Plan**: $1/month subscription with ad removal

### Key API Endpoints
- `/api/chat` - Chat with AI (Groq Llama 3.3 70B)
- `/api/image/generate` - Multi-provider image generation
- `/api/video/generate` - Video generation (slideshow)
- `/api/audio/generate` - Audio/story generation with voice/language params
- `/api/tts/speak` - Text-to-speech in any language
- `/api/document/generate` - Document Studio AI generation
- `/api/build/generate` - Builder AI code generation
- `/api/file/generate` - File generation (PDF, DOCX, XLSX, code)
- `/api/projects` - Projects CRUD
- `/api/auth/*` - Authentication
- `/api/payment/*` - PayPal + PayFast payments

## Known Limitations
- **Image Generation**: Free Pollinations.ai API is intermittent (sometimes times out). Retry logic with 3 attempts (30s, 60s, 90s) implemented. HuggingFace token may expire - user needs to refresh at https://huggingface.co/settings/tokens
- **Video Generation**: Uses slideshow engine, not true text-to-video (no free API available)
- **Audio Voices**: gTTS doesn't support true voice selection (male/female) - parameter stored but not differentiated

## P0 Remaining (Critical)
- None currently blocking

## P1 (Important)
- Refactor App.js (~1700 lines) into separate components (Sidebar, ChatView, BuildPage, etc.)
- Refactor server.py (~1450 lines) into separate FastAPI routers (auth, chat, generation, payments)

## P2 (Nice to Have)
- Real-time collaboration in Document Studio
- True text-to-video generation (requires paid API like Sora)
- Better voice differentiation in audio generation (gTTS limitation)
- Sandboxed preview environment for Build page (running complex apps)
