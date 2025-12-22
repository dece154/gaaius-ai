import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MessageSquare, 
  Image, 
  Video, 
  Mic, 
  MicOff,
  Send, 
  Plus, 
  Trash2, 
  Volume2,
  Loader2,
  Sparkles,
  Zap,
  Menu,
  X,
  Download,
  Play,
  Square
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mode configurations
const MODES = {
  chat: { 
    icon: MessageSquare, 
    label: "Chat", 
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    glowClass: "neon-glow"
  },
  image: { 
    icon: Image, 
    label: "Image", 
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    glowClass: "neon-glow-cyan"
  },
  video: { 
    icon: Video, 
    label: "Video", 
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/30",
    glowClass: "neon-glow-orange"
  }
};

// Message Component
const ChatMessage = ({ message, onSpeak }) => {
  const isUser = message.role === "user";
  
  return (
    <div 
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-in slide-in-from-bottom-2`}
      data-testid={`message-${message.id}`}
    >
      <div className={`max-w-[80%] ${isUser ? "message-user" : "message-assistant"} p-4`}>
        {message.model_used && (
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              {message.model_used}
            </span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {!isUser && (
          <button 
            onClick={() => onSpeak(message.content)}
            className="mt-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            data-testid="speak-button"
          >
            <Volume2 className="w-4 h-4 text-muted-foreground hover:text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

// Image Result Component
const ImageResult = ({ data }) => {
  // Handle both relative API paths and full URLs
  // API returns 'url' field for stored images, or 'image_url' from direct response
  const rawUrl = data.url || data.image_url || '';
  const imageUrl = rawUrl 
    ? (rawUrl.startsWith('/api') 
        ? `${BACKEND_URL}${rawUrl}` 
        : rawUrl)
    : '';
    
  if (!imageUrl) return null;
    
  return (
    <div 
      className="glass rounded-2xl overflow-hidden animate-in fade-in"
      data-testid={`image-result-${data.id}`}
    >
      <img 
        src={imageUrl} 
        alt={data.prompt}
        className="w-full h-auto"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs text-cyan-400 uppercase tracking-wider">
            {data.model_used}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{data.prompt}</p>
        <a 
          href={imageUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
        >
          <Download className="w-3 h-3" />
          Download
        </a>
      </div>
    </div>
  );
};

// Video Result Component
const VideoResult = ({ data }) => (
  <div 
    className="glass rounded-2xl overflow-hidden animate-in fade-in"
    data-testid={`video-result-${data.id}`}
  >
    <video 
      src={data.video_url} 
      controls
      className="w-full h-auto"
    />
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-4 h-4 text-orange-400" />
        <span className="font-mono text-xs text-orange-400 uppercase tracking-wider">
          {data.model_used}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{data.prompt}</p>
    </div>
  </div>
);

// Main App Component
function App() {
  const [mode, setMode] = useState("chat");
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generations, setGenerations] = useState([]);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
    fetchGenerations();
  }, []);

  // Fetch messages when session changes
  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    }
  }, [currentSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/sessions`);
      setSessions(res.data);
      if (res.data.length > 0 && !currentSession) {
        setCurrentSession(res.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await axios.get(`${API}/chat/${sessionId}/history`);
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchGenerations = async () => {
    try {
      const res = await axios.get(`${API}/generations`);
      setGenerations(res.data);
    } catch (error) {
      console.error("Failed to fetch generations:", error);
    }
  };

  const createSession = async () => {
    try {
      const res = await axios.post(`${API}/sessions?name=New Chat`);
      const newSession = res.data;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      toast.success("New chat created");
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API}/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setCurrentSession(remaining[0] || null);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userInput = input.trim();
    setInput("");
    setLoading(true);

    try {
      if (mode === "chat") {
        // Ensure we have a session
        let sessionId = currentSession?.id;
        if (!sessionId) {
          const res = await axios.post(`${API}/sessions?name=New Chat`);
          sessionId = res.data.id;
          setCurrentSession(res.data);
          setSessions(prev => [res.data, ...prev]);
        }

        // Add user message immediately
        const tempUserMsg = {
          id: `temp-${Date.now()}`,
          role: "user",
          content: userInput,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        // Send to API
        const res = await axios.post(`${API}/chat`, {
          session_id: sessionId,
          message: userInput
        });

        // Replace temp message and add response
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, 
            { ...tempUserMsg, id: `user-${Date.now()}` },
            {
              id: res.data.id,
              role: "assistant",
              content: res.data.content,
              model_used: res.data.model_used,
              timestamp: res.data.timestamp
            }
          ];
        });

      } else if (mode === "image") {
        toast.info("Generating image...", { duration: 10000 });
        const res = await axios.post(`${API}/image/generate`, {
          prompt: userInput,
          session_id: currentSession?.id
        });
        setGenerations(prev => [res.data, ...prev]);
        toast.success("Image generated!");

      } else if (mode === "video") {
        toast.info("Generating video... This may take a few minutes", { duration: 60000 });
        const res = await axios.post(`${API}/video/generate`, {
          prompt: userInput,
          session_id: currentSession?.id
        });
        setGenerations(prev => [res.data, ...prev]);
        toast.success("Video generated!");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (text) => {
    try {
      toast.info("Generating speech...");
      const res = await axios.post(`${API}/tts`, { text, voice: "nova" }, {
        responseType: 'blob'
      });
      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      toast.error("Failed to generate speech");
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          
          // Send to STT
          toast.info("Transcribing...");
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          try {
            const res = await axios.post(`${API}/stt`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            setInput(res.data.text);
            inputRef.current?.focus();
          } catch (error) {
            toast.error("Transcription failed");
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        toast.error("Microphone access denied");
      }
    }
  };

  const ModeConfig = MODES[mode];

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-[#050505] overflow-hidden">
        <Toaster position="top-center" theme="dark" />
        
        {/* Sidebar */}
        <aside 
          className={`fixed md:relative z-50 h-full w-72 glass border-r border-white/10 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
          data-testid="sidebar"
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center neon-glow">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-secondary text-xl font-bold tracking-tight">GAAIUS</h1>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">AI</p>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="p-4 border-b border-white/10">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">Mode</p>
            <div className="flex gap-2">
              {Object.entries(MODES).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setMode(key)}
                        className={`flex-1 p-3 rounded-xl transition-all ${
                          mode === key 
                            ? `${config.bgColor} ${config.borderColor} border ${config.glowClass}` 
                            : "hover:bg-white/5"
                        }`}
                        data-testid={`mode-${key}`}
                      >
                        <Icon className={`w-5 h-5 mx-auto ${mode === key ? config.color : "text-muted-foreground"}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{config.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Chats</p>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={createSession}
                className="h-8 w-8 p-0"
                data-testid="new-chat-btn"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 px-4">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all ${
                    currentSession?.id === session.id 
                      ? "bg-primary/20 border border-primary/30" 
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => {
                    setCurrentSession(session);
                    setSidebarOpen(false);
                  }}
                  data-testid={`session-${session.id}`}
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{session.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    data-testid={`delete-session-${session.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Model Info */}
          <div className="p-4 border-t border-white/10">
            <div className="glass-light rounded-xl p-3">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Models</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span className="text-muted-foreground">Chat: Groq Llama 3.3</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="text-muted-foreground">Image: FLUX.1 (HF)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  <span className="text-muted-foreground">Video: MiniMax</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 glass">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden p-2 hover:bg-white/5 rounded-lg"
                onClick={() => setSidebarOpen(true)}
                data-testid="menu-btn"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  mode === "chat" ? "bg-purple-400" : 
                  mode === "image" ? "bg-cyan-400" : "bg-orange-400"
                } animate-pulse`} />
                <span className="font-secondary text-sm font-semibold uppercase tracking-wide">
                  {MODES[mode].label} Mode
                </span>
              </div>
            </div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              {currentSession?.name || "Select a chat"}
            </div>
          </header>

          {/* Chat/Content Area */}
          <div className="flex-1 overflow-hidden">
            {mode === "chat" ? (
              <ScrollArea className="h-full">
                <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 neon-glow animate-float">
                        <Sparkles className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="font-secondary text-2xl font-bold mb-2">Welcome to GAAIUS</h2>
                      <p className="text-muted-foreground max-w-md">
                        Your unified AI assistant. Chat, generate images, create videos, and use voice - all in one place.
                      </p>
                      <div className="flex gap-3 mt-8">
                        {Object.entries(MODES).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <button
                              key={key}
                              onClick={() => setMode(key)}
                              className={`px-4 py-2 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center gap-2 transition-all hover:scale-105`}
                            >
                              <Icon className={`w-4 h-4 ${config.color}`} />
                              <span className={`text-sm ${config.color}`}>{config.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        onSpeak={handleSpeak}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="h-full">
                <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generations
                      .filter(g => mode === "image" ? g.type === "image" : g.type === "video")
                      .map(gen => (
                        mode === "image" 
                          ? <ImageResult key={gen.id} data={gen} />
                          : <VideoResult key={gen.id} data={gen} />
                      ))
                    }
                    {generations.filter(g => mode === "image" ? g.type === "image" : g.type === "video").length === 0 && (
                      <div className="col-span-full text-center py-20">
                        <div className={`w-20 h-20 rounded-2xl ${ModeConfig.bgColor} flex items-center justify-center mb-6 mx-auto ${ModeConfig.glowClass}`}>
                          <ModeConfig.icon className={`w-10 h-10 ${ModeConfig.color}`} />
                        </div>
                        <h2 className="font-secondary text-xl font-bold mb-2">
                          No {mode === "image" ? "images" : "videos"} yet
                        </h2>
                        <p className="text-muted-foreground">
                          Enter a prompt below to generate your first {mode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 md:left-72 p-4 md:p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className={`glass rounded-2xl p-2 flex items-center gap-2 ${ModeConfig.borderColor} border ${ModeConfig.glowClass}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`p-3 rounded-xl transition-all ${
                        isRecording 
                          ? "bg-red-500/20 text-red-400" 
                          : "hover:bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                      data-testid="voice-btn"
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isRecording ? "Stop recording" : "Voice input"}</p>
                  </TooltipContent>
                </Tooltip>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "chat" ? "Message GAAIUS..." :
                    mode === "image" ? "Describe the image you want to create..." :
                    "Describe the video you want to generate..."
                  }
                  className="flex-1 bg-transparent border-none outline-none text-base py-2 px-2 placeholder:text-muted-foreground"
                  disabled={loading}
                  data-testid="chat-input"
                />
                
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className={`rounded-xl px-4 ${ModeConfig.bgColor} hover:opacity-90 ${ModeConfig.glowClass}`}
                  data-testid="send-btn"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              
              <p className="text-center mt-3 font-mono text-xs text-muted-foreground">
                {mode === "chat" ? "Powered by Groq Llama 3.3 70B" :
                 mode === "image" ? "Powered by FLUX.1-dev via HuggingFace" :
                 "Powered by MiniMax Video-01 via Replicate"}
              </p>
            </form>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
