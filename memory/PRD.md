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
- **Speakable Chat Messages**: Multi-language TTS with language selector on each AI response
- **Auto-speak Toggle**: Voice On/Off button in chat header, persists in localStorage
- **Collapsible Sidebar**: Expand/collapse with icon-only mode, state persisted in localStorage
- **Audio Generation**: Advanced controls (voice, language, duration dropdowns in header), AI story/narration creation via gTTS
- **Image Generation**: Multi-provider fallback (Pollinations → HuggingFace SDXL → FLUX)
- **Video Generation**: Slideshow engine using Pollinations images
- **File Generation**: Supports PDF, DOCX, XLSX, code files via Groq AI
- **GAAIUS AI Builder**: Replit-like IDE with AI chat + live preview
- **GAAIUS AI Document Studio**: AI-driven document creation (invoices, contracts, proposals, CVs, etc.)
- **Projects Page**: CRUD for user projects
- **Auth System**: Register/Login with JWT tokens
- **Payment Integration**: PayPal (full flow) + PayFast (redirect flow with ITN callback)
- **Pro Plan**: $1/month subscription with ad removal
- **Ad System**: Periodic popup ads for non-logged-in users, dismissible

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
- Overhaul Build page with sandboxed preview environment for complex apps
- Implement AI Agents (AI Lawyer, AI Accountant) in Document Studio

## P2 (Nice to Have)
- Real-time collaboration in Document Studio
- True text-to-video generation (requires paid API)
- Better voice differentiation in audio generation
- Refactor App.js (~1700 lines) into separate components
- Refactor server.py (~1450 lines) into separate routers
