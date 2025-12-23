import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { create } from "zustand";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Image, Video, Mic, MicOff, Send, Plus, Trash2, Volume2,
  Loader2, Sparkles, Zap, Menu, X, Download, User, LogOut, Crown, Music,
  FileCode, FolderOpen, Hammer, Eye, Code, Settings, CreditCard, Edit, Save
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Zustand store for auth
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("gaaius_token"),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem("gaaius_token", token);
    else localStorage.removeItem("gaaius_token");
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("gaaius_token");
    set({ user: null, token: null });
  }
}));

// API helper with auth
const api = axios.create({ baseURL: API });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gaaius_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mode configurations
const MODES = {
  chat: { icon: MessageSquare, label: "Chat", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/30" },
  image: { icon: Image, label: "Image", color: "text-cyan-400", bgColor: "bg-cyan-500/20", borderColor: "border-cyan-500/30" },
  video: { icon: Video, label: "Video", color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/30" },
  audio: { icon: Music, label: "Audio", color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500/30" },
  file: { icon: FileCode, label: "Files", color: "text-pink-400", bgColor: "bg-pink-500/20", borderColor: "border-pink-500/30" }
};

// Auth Modal Component
const AuthModal = ({ open, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const data = isLogin ? { email, password } : { email, password, name };
      const res = await api.post(endpoint, data);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-secondary">{isLogin ? "Welcome Back" : "Create Account"}</DialogTitle>
          <DialogDescription>Sign in to access all GAAIUS AI features</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10" />
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10" required />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? "Sign In" : "Sign Up")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Profile Modal Component
const ProfileModal = ({ open, onClose }) => {
  const { user, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-secondary flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> My Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{user.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.is_pro && <span className="text-xs text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3" /> Pro Member</span>}
            </div>
          </div>
          
          <div className="glass-light rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Account Type</label>
              <p className="text-sm">{user.is_pro ? "Pro" : "Free"}</p>
            </div>
          </div>
          
          <Button onClick={() => { logout(); onClose(); }} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Pro Upgrade Modal with PayPal
const ProModal = ({ open, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [paypalClientId, setPaypalClientId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/payment/config").then(res => setPaypalClientId(res.data.paypal_client_id)).catch(() => {});
  }, []);

  const handlePayPalApprove = async (data) => {
    setLoading(true);
    try {
      const res = await api.post(`/payment/paypal/capture/${data.orderID}`);
      if (res.data.success) {
        setUser({ ...user, is_pro: true });
        toast.success("Pro activated! Enjoy ad-free GAAIUS AI!");
        onClose();
      }
    } catch (error) {
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayFast = async () => {
    try {
      const res = await api.post("/payment/payfast/create");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = res.data.payment_url;
      Object.entries(res.data.data).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error("PayFast error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-secondary flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" /> Upgrade to Pro
          </DialogTitle>
          <DialogDescription>Remove all ads and get unlimited access for just $1/month</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="glass-light rounded-xl p-4">
            <h3 className="font-semibold mb-2">Pro Benefits:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ No ads - ever!</li>
              <li>✓ Priority generation</li>
              <li>✓ Longer videos (up to 60s)</li>
              <li>✓ HD image exports</li>
              <li>✓ Early access to new features</li>
            </ul>
          </div>
          
          {paypalClientId && (
            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
              <PayPalButtons
                style={{ layout: "vertical", color: "gold", shape: "pill" }}
                createOrder={(data, actions) => actions.order.create({
                  purchase_units: [{ amount: { value: "1.00" }, description: "GAAIUS AI Pro - 1 Month" }]
                })}
                onApprove={handlePayPalApprove}
                onError={() => toast.error("PayPal error")}
              />
            </PayPalScriptProvider>
          )}
          
          <div className="text-center text-muted-foreground text-sm">or</div>
          
          <Button onClick={handlePayFast} variant="outline" className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10">
            <CreditCard className="w-4 h-4 mr-2" /> Pay with PayFast (South Africa)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Ad Component - Fixed positioning to not block content
const AdBanner = ({ onUpgrade }) => {
  const ads = [
    { text: "🚀 Go Pro for just $1 - No more ads!", cta: "Upgrade Now" },
    { text: "⚡ Tired of ads? Pro users enjoy ad-free experience!", cta: "Get Pro" },
    { text: "🎨 Unlock HD exports and longer videos with Pro!", cta: "Upgrade" }
  ];
  const [ad] = useState(ads[Math.floor(Math.random() * ads.length)]);

  return (
    <div className="w-full p-2 glass border-t border-yellow-500/30">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <p className="text-xs">{ad.text}</p>
        <Button size="sm" onClick={onUpgrade} className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-2 py-1 h-7">
          {ad.cta}
        </Button>
      </div>
    </div>
  );
};

// Chat Message Component - Removed model labels
const ChatMessage = ({ message, onSpeak }) => {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`} data-testid={`message-${message.id}`}>
      <div className={`max-w-[80%] ${isUser ? "bg-primary/20 border-primary/30 rounded-br-sm" : "bg-secondary/50 border-white/5 rounded-bl-sm"} border rounded-2xl p-4`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {!isUser && (
          <button onClick={() => onSpeak(message.content)} className="mt-2 p-1.5 rounded-full hover:bg-white/10" data-testid="speak-button">
            <Volume2 className="w-4 h-4 text-muted-foreground hover:text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

// Generation Result Component - Removed model labels
const GenerationResult = ({ data, type }) => {
  const rawUrl = data.url || data.image_url || data.video_url || data.audio_url || "";
  const url = rawUrl.startsWith("/api") ? `${BACKEND_URL}${rawUrl}` : rawUrl;
  if (!url) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden" data-testid={`result-${data.id}`}>
      {type === "image" && <img src={url} alt={data.prompt} className="w-full h-auto" />}
      {type === "video" && <video src={url} controls className="w-full h-auto bg-black" />}
      {type === "audio" && <audio src={url} controls className="w-full mt-4" />}
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{data.prompt}</p>
        {type === "file" && data.content && (
          <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-auto max-h-40">{data.content}</pre>
        )}
        <a href={url} download target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80">
          <Download className="w-3 h-3" /> Download
        </a>
      </div>
    </div>
  );
};

// Build Page Component
const BuildPage = () => {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState('<div className="p-8 text-center">\n  <h1 className="text-3xl font-bold">Hello World</h1>\n  <p className="text-muted-foreground mt-2">Start building something amazing!</p>\n</div>');
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.post("/build/generate", { prompt, current_code: code });
      setCode(res.data.code);
      toast.success("Code generated!");
    } catch (error) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const handleSaveToProject = async () => {
    if (!projectName.trim()) return;
    try {
      const res = await api.post("/projects", { name: projectName, description: "Created from Build", type: "web" });
      await api.put(`/projects/${res.data.id}/files`, { "index.jsx": code });
      toast.success("Saved to project!");
      setShowSaveDialog(false);
      navigate("/projects");
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="h-full flex">
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="glass border-white/10">
          <DialogHeader><DialogTitle>Save to Project</DialogTitle></DialogHeader>
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name..." className="bg-white/5 border-white/10" />
          <Button onClick={handleSaveToProject} className="w-full bg-primary">Save</Button>
        </DialogContent>
      </Dialog>
      
      {/* Left: Chat */}
      <div className="w-1/2 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-secondary text-lg font-bold flex items-center gap-2">
            <Hammer className="w-5 h-5 text-primary" /> Vibe Coder
          </h2>
          <Button size="sm" onClick={() => setShowSaveDialog(true)} variant="outline" className="h-8">
            <Save className="w-4 h-4 mr-1" /> Save to Project
          </Button>
        </div>
        <div className="flex-1 p-4">
          <div className="glass-light rounded-xl p-4 h-full flex flex-col">
            <pre className="flex-1 text-xs overflow-auto">{code}</pre>
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to build..."
              className="flex-1 bg-white/5 border-white/10"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <Button onClick={handleGenerate} disabled={loading} className="bg-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right: Preview */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-secondary text-lg font-bold flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" /> Preview
          </h2>
        </div>
        <div className="flex-1 p-4 bg-white text-black overflow-auto">
          <div dangerouslySetInnerHTML={{ __html: code.replace(/className=/g, 'class=') }} />
        </div>
      </div>
    </div>
  );
};

// Projects Page Component
const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) api.get("/projects").then(res => setProjects(res.data)).catch(() => {});
  }, [user]);

  const createProject = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.post("/projects", { name: newName });
      setProjects(prev => [res.data, ...prev]);
      setNewName("");
      toast.success("Project created!");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const openProject = (project) => {
    setSelectedProject(project);
  };

  if (!user) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">Please sign in to view projects</p>
    </div>
  );

  if (selectedProject) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setSelectedProject(null)}>&larr; Back</Button>
          <h1 className="font-secondary text-2xl font-bold">{selectedProject.name}</h1>
        </div>
        
        <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-muted-foreground">{selectedProject.description || "No description"}</p>
          <p className="text-xs text-muted-foreground">Created: {new Date(selectedProject.created_at).toLocaleDateString()}</p>
          
          {selectedProject.files && Object.keys(selectedProject.files).length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-semibold">Files:</h3>
              {Object.entries(selectedProject.files).map(([name, content]) => (
                <div key={name} className="glass-light rounded-lg p-3">
                  <p className="text-sm font-mono">{name}</p>
                  <pre className="mt-2 text-xs overflow-auto max-h-40">{content}</pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No files yet. Go to Build to create content.</p>
          )}
          
          <Button onClick={() => navigate("/build")} className="bg-primary">
            <Hammer className="w-4 h-4 mr-2" /> Open in Build
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-secondary text-2xl font-bold mb-6 flex items-center gap-2">
        <FolderOpen className="w-6 h-6 text-primary" /> My Projects
      </h1>
      
      <div className="flex gap-2 mb-6">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New project name..." className="bg-white/5 border-white/10" />
        <Button onClick={createProject} className="bg-primary"><Plus className="w-4 h-4 mr-2" /> Create</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(project => (
          <div 
            key={project.id} 
            onClick={() => openProject(project)}
            className="glass rounded-xl p-4 hover:border-primary/50 border border-white/10 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{project.description || "No description"}</p>
            <p className="text-xs text-muted-foreground mt-2">Created: {new Date(project.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">No projects yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const [mode, setMode] = useState("chat");
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generations, setGenerations] = useState([]);
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [fileType, setFileType] = useState("code");
  const [showAuth, setShowAuth] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { user, token, logout } = useAuthStore();
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth on mount
  useEffect(() => {
    if (token) {
      api.get("/auth/me").then(res => useAuthStore.getState().setUser(res.data)).catch(() => useAuthStore.getState().logout());
    }
  }, [token]);

  useEffect(() => { fetchSessions(); fetchGenerations(); }, []);
  useEffect(() => { if (currentSession) fetchMessages(currentSession.id); }, [currentSession]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Check for projects/build routes
  if (location.pathname === "/projects") {
    return (
      <>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
        <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
        <div className="h-screen flex bg-[#050505] overflow-hidden">
          <Toaster position="top-center" theme="dark" />
          <Sidebar 
            mode={mode} setMode={setMode} sessions={sessions} currentSession={currentSession}
            setCurrentSession={setCurrentSession} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen}
            createSession={createSession} deleteSession={deleteSession} navigate={navigate}
            user={user} showAuth={() => setShowAuth(true)} showPro={() => setShowPro(true)} 
            showProfile={() => setShowProfile(true)} logout={logout}
          />
          {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 glass">
              <div className="flex items-center gap-4">
                <button className="md:hidden p-2 hover:bg-white/5 rounded-lg" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
                <span className="font-secondary text-sm font-semibold">Projects</span>
              </div>
            </header>
            <div className="flex-1 overflow-auto"><ProjectsPage /></div>
          </main>
        </div>
      </>
    );
  }

  if (location.pathname === "/build") {
    return (
      <div className="h-screen bg-[#050505]">
        <Toaster position="top-center" theme="dark" />
        <BuildPage />
      </div>
    );
  }

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data);
      if (res.data.length > 0 && !currentSession) setCurrentSession(res.data[0]);
    } catch (error) {}
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await api.get(`/chat/${sessionId}/history`);
      setMessages(res.data);
    } catch (error) {}
  };

  const fetchGenerations = async () => {
    try {
      const res = await api.get("/generations");
      setGenerations(res.data);
    } catch (error) {}
  };

  const createSession = async () => {
    try {
      const res = await api.post("/sessions?name=New Chat");
      setSessions(prev => [res.data, ...prev]);
      setCurrentSession(res.data);
      setMessages([]);
      toast.success("New chat created");
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
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

  // Auto-name session based on first message
  const autoNameSession = async (sessionId, message) => {
    const name = message.slice(0, 30) + (message.length > 30 ? "..." : "");
    try {
      await api.put(`/sessions/${sessionId}`, { name });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name } : s));
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userInput = input.trim();
    setInput("");
    setLoading(true);

    try {
      if (mode === "chat") {
        let sessionId = currentSession?.id;
        let isNewSession = false;
        if (!sessionId) {
          const res = await api.post("/sessions?name=New Chat");
          sessionId = res.data.id;
          setCurrentSession(res.data);
          setSessions(prev => [res.data, ...prev]);
          isNewSession = true;
        }
        const tempUserMsg = { id: `temp-${Date.now()}`, role: "user", content: userInput, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, tempUserMsg]);
        
        // Auto-name session on first message
        if (isNewSession || (messages.length === 0)) {
          autoNameSession(sessionId, userInput);
        }
        
        const res = await api.post("/chat", { session_id: sessionId, message: userInput });
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, { ...tempUserMsg, id: `user-${Date.now()}` }, { id: res.data.id, role: "assistant", content: res.data.content, timestamp: res.data.timestamp }];
        });
      } else if (mode === "image") {
        toast.info("Generating image...", { duration: 60000 });
        const res = await api.post("/image/generate", { prompt: userInput, session_id: currentSession?.id });
        const newGen = { ...res.data, type: "image", url: res.data.image_url || res.data.url };
        setGenerations(prev => [newGen, ...prev]);
        toast.success("Image generated!");
      } else if (mode === "video") {
        toast.info("Generating video in background... You can continue using other features", { duration: 10000 });
        // Run video generation in background (non-blocking)
        api.post("/video/generate", { prompt: userInput, duration: 5, style: videoStyle, session_id: currentSession?.id }, { timeout: 600000 })
          .then(res => {
            const newGen = { ...res.data, type: "video", url: res.data.video_url || res.data.url };
            setGenerations(prev => [newGen, ...prev]);
            toast.success("Video generated!");
          })
          .catch(() => toast.error("Video generation failed"));
        setLoading(false);
        return; // Don't wait
      } else if (mode === "audio") {
        toast.info("Generating audio in background...", { duration: 10000 });
        // Run audio generation in background (non-blocking)
        api.post("/audio/generate", { prompt: userInput, duration: 10, type: "music" })
          .then(res => {
            const newGen = { ...res.data, type: "audio", url: res.data.audio_url || res.data.url };
            setGenerations(prev => [newGen, ...prev]);
            toast.success("Audio generated!");
          })
          .catch(() => toast.error("Audio generation failed"));
        setLoading(false);
        return; // Don't wait
      } else if (mode === "file") {
        toast.info("Generating file...");
        const res = await api.post("/file/generate", { prompt: userInput, file_type: fileType });
        const newGen = { ...res.data, type: "file", url: res.data.file_url || res.data.url };
        setGenerations(prev => [newGen, ...prev]);
        toast.success("File generated!");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (text) => {
    try {
      toast.info("Generating speech...");
      const res = await api.post("/tts", { text, voice: "en" }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(res.data);
      new Audio(audioUrl).play();
    } catch (error) {
      toast.error("TTS failed");
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          toast.info("Transcribing...");
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          try {
            const res = await api.post("/stt", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    <>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
      <ProModal open={showPro} onClose={() => setShowPro(false)} />
      
      <div className="h-screen flex bg-[#050505] overflow-hidden">
        <Toaster position="top-center" theme="dark" />
        
        <Sidebar 
          mode={mode} setMode={setMode} sessions={sessions} currentSession={currentSession}
          setCurrentSession={setCurrentSession} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen}
          createSession={createSession} deleteSession={deleteSession} navigate={navigate}
          user={user} showAuth={() => setShowAuth(true)} showPro={() => setShowPro(true)} 
          showProfile={() => setShowProfile(true)} logout={logout}
        />

        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 glass">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 hover:bg-white/5 rounded-lg" onClick={() => setSidebarOpen(true)} data-testid="menu-btn">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${mode === "chat" ? "bg-purple-400" : mode === "image" ? "bg-cyan-400" : mode === "video" ? "bg-orange-400" : mode === "audio" ? "bg-green-400" : "bg-pink-400"} animate-pulse`} />
                <span className="font-secondary text-sm font-semibold uppercase">{MODES[mode].label} Mode</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {mode === "video" && (
                <Select value={videoStyle} onValueChange={setVideoStyle}>
                  <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {mode === "file" && (
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="data">JSON/CSV</SelectItem>
                    <SelectItem value="config">Config</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {/* New Chat button at top right */}
              {mode === "chat" && (
                <Button size="sm" onClick={createSession} variant="outline" className="h-8 text-xs">
                  <Plus className="w-4 h-4 mr-1" /> New Chat
                </Button>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {mode === "chat" ? (
              <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-4 md:p-6 pb-8">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="font-secondary text-2xl font-bold mb-2">Welcome to GAAIUS</h2>
                      <p className="text-muted-foreground max-w-md">Your unified AI assistant. Chat, images, videos, audio, and files.</p>
                    </div>
                  ) : (
                    messages.map(msg => <ChatMessage key={msg.id} message={msg} onSpeak={handleSpeak} />)
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="flex-1">
                <div className="max-w-6xl mx-auto p-4 md:p-6 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generations.filter(g => g.type === mode || (mode === "file" && g.type === "file")).map(gen => (
                      <GenerationResult key={gen.id} data={gen} type={gen.type} />
                    ))}
                    {generations.filter(g => g.type === mode).length === 0 && (
                      <div className="col-span-full text-center py-20">
                        <div className={`w-20 h-20 rounded-2xl ${ModeConfig.bgColor} flex items-center justify-center mb-6 mx-auto`}>
                          <ModeConfig.icon className={`w-10 h-10 ${ModeConfig.color}`} />
                        </div>
                        <h2 className="font-secondary text-xl font-bold mb-2">No {mode}s yet</h2>
                        <p className="text-muted-foreground">Enter a prompt to generate</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* Ad Banner - Only for non-pro users, positioned inline not overlapping */}
            {user && !user.is_pro && <AdBanner onUpgrade={() => setShowPro(true)} />}

            {/* Input - Fixed at bottom with proper spacing */}
            <div className="p-4 border-t border-white/10 glass">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className={`rounded-2xl p-2 flex items-center gap-2 ${ModeConfig.borderColor} border bg-black/40`}>
                  <button type="button" onClick={toggleRecording} className={`p-3 rounded-xl transition-all ${isRecording ? "bg-red-500/20 text-red-400" : "hover:bg-white/5 text-muted-foreground"}`} data-testid="voice-btn">
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === "chat" ? "Message GAAIUS..." : mode === "image" ? "Describe the image..." : mode === "video" ? "Describe the video..." : mode === "audio" ? "Describe music/sound..." : "Describe the file to generate..."}
                    className="flex-1 bg-transparent border-none outline-none text-base py-2 px-2" disabled={loading} data-testid="chat-input" />
                  <Button type="submit" disabled={loading || !input.trim()} className={`rounded-xl px-4 ${ModeConfig.bgColor}`} data-testid="send-btn">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

// Sidebar Component
const Sidebar = ({ mode, setMode, sessions, currentSession, setCurrentSession, setSidebarOpen, sidebarOpen, createSession, deleteSession, navigate, user, showAuth, showPro, showProfile, logout }) => {
  return (
    <aside className={`fixed md:relative z-50 h-full w-72 glass border-r border-white/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`} data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-secondary text-xl font-bold">GAAIUS</h1>
              <p className="font-mono text-xs text-muted-foreground uppercase">AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4 border-b border-white/10">
        <p className="font-mono text-xs text-muted-foreground uppercase mb-3">Mode</p>
        <div className="grid grid-cols-5 gap-1">
          {Object.entries(MODES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button key={key} onClick={() => setMode(key)} className={`p-2 rounded-lg transition-all ${mode === key ? `${config.bgColor} ${config.borderColor} border` : "hover:bg-white/5"}`} data-testid={`mode-${key}`}>
                <Icon className={`w-4 h-4 mx-auto ${mode === key ? config.color : "text-muted-foreground"}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-white/10">
        <div className="space-y-1">
          <button onClick={() => navigate("/projects")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left">
            <FolderOpen className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Projects</span>
          </button>
          <button onClick={() => navigate("/build")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left">
            <Hammer className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Build</span>
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground uppercase">Chats</p>
          <Button size="sm" variant="ghost" onClick={createSession} className="h-6 w-6 p-0" data-testid="new-chat-btn">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-4">
          {sessions.map(session => (
            <div key={session.id} className={`group flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all ${currentSession?.id === session.id ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5"}`}
              onClick={() => { setCurrentSession(session); setSidebarOpen(false); }} data-testid={`session-${session.id}`}>
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{session.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded flex-shrink-0" data-testid={`delete-session-${session.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        {user ? (
          <div className="glass-light rounded-xl p-3">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80"
              onClick={showProfile}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                {user.is_pro && <span className="text-xs text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3" /> Pro</span>}
              </div>
            </div>
            {!user.is_pro && (
              <Button size="sm" onClick={showPro} className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs">
                <Crown className="w-3 h-3 mr-1" /> Go Pro - $1
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={showAuth} className="w-full" variant="outline">
            <User className="w-4 h-4 mr-2" /> Sign In
          </Button>
        )}
      </div>
    </aside>
  );
};

// App with Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
