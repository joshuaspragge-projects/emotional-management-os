import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, Eye, ThermometerSnowflake, Zap, Brain, 
  BatteryCharging, Activity, Volume2, Hammer, X, 
  Users, Shield, Play, Pause, Heart,
  Smartphone, MapPin, Music, Coffee, LifeBuoy, Timer, Move, 
  Mic, MessageSquare, Copy, Siren, Footprints, Flame,
  Vibrate, RotateCw, ArrowLeft, Ghost, Skull, Check, Shuffle, MicOff, Aperture,
  AlertTriangle, RefreshCw, Send, Loader2, VolumeX, Phone, ExternalLink, Navigation, Globe,
  Banknote, Home, Baby, Pill, Menu, Hand, EyeOff, Stethoscope, Grid, Star, Layout, ArrowRight
} from 'lucide-react';

// --- API CONFIGURATION ---
const apiKey = ""; // Injected at runtime

// --- STYLES ---
const globalStyles = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .glass-panel { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
  .animate-float { animation: float 6s ease-in-out infinite; }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
`;

const triggerHaptic = (pattern = [10]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
};

// --- DATABASE (CALGARY FOCUSED) ---
const resourceDB = [
  { id: "food_dashmesh", name: "Dashmesh Culture Centre", category: "food", effort: 1, tags: ["Free Hot Meal", "No Questions", "Walk-in"], desc: "Free hot vegetarian meals. Open to everyone. Just walk in.", contact: "135 Martindale Blvd NE", status: "7am-9pm Daily" },
  { id: "food_fridge", name: "Community Fridge (Crescent)", category: "food", effort: 1, tags: ["Pantry", "Anonymous", "24/7"], desc: "Outdoor pantry/fridge. Take what you need. No staff.", contact: "204 2 Ave NE", status: "24/7" },
  { id: "shelter_di", name: "Calgary Drop-In", category: "shelter", effort: 2, tags: ["Emergency Sleep", "Meals", "Medical"], desc: "Main shelter. Walk-in intake. Meals provided.", contact: "403-263-2080", status: "24/7 Intake" },
  { id: "crisis_doap", name: "DOAP Team", category: "crisis", effort: 1, tags: ["Transport", "Safe Ride"], desc: "Non-police transport for intoxicated individuals.", contact: "403-998-7388", status: "24/7" },
  { id: "shelter_alpha", name: "Alpha House", category: "shelter", effort: 2, tags: ["Wet Shelter", "Detox"], desc: "Safe sleep for intoxicated individuals. Medical detox.", contact: "403-234-7388", status: "24/7" },
  { id: "food_bank", name: "Calgary Food Bank", category: "food", effort: 3, tags: ["Hamper", "Grocery"], desc: "7-day emergency hampers. Must call to book.", contact: "403-253-2055", status: "Mon-Fri" },
  { id: "income_ab", name: "Alberta Works", category: "money", effort: 4, tags: ["Emergency Funds", "Eviction"], desc: "Financial aid for eviction/utilities.", contact: "1-877-644-9992", status: "Mon-Fri" },
  { id: "crisis_211", name: "211 Alberta", category: "crisis", effort: 1, tags: ["Navigation", "Multi-lang"], desc: "24/7 help finding any service.", contact: "211", status: "24/7" },
  { id: "shelter_inn", name: "Inn from the Cold", category: "family", effort: 3, tags: ["Family", "Kids"], desc: "Emergency family shelter.", contact: "403-263-8384", status: "Call First" },
];

// --- DEFINITIONS: AI PERSONAS ---
const PERSONAS = {
  medic: { id: 'medic', title: "Field Medic", role: "Outreach Support", icon: <Stethoscope className="text-emerald-400" />, opener: "Describe the person you are helping. Behavior? Symptoms?", system: "You are an expert street outreach worker. Provide rapid assessment of behavioral/medical risks." },
  cynic: { id: 'cynic', title: "Reality Check", role: "Cynical Counselor", icon: <Heart className="text-rose-400" />, opener: "Tell me about the disaster.", system: "You are a cynical relationship counselor." },
  negotiator: { id: 'negotiator', title: "Exit Strategy", role: "Hostage Negotiator", icon: <Footprints className="text-orange-400" />, opener: "How do we get out?", system: "Act as a hostage negotiator." },
  navigator: { id: 'navigator', title: "Resource Guide", role: "Service Navigator", icon: <MapPin className="text-blue-400" />, opener: "What do you need right now? (Food, Shelter, etc)", system: "You are a social worker. Use the provided database to recommend resources based on user effort capacity." }
};

// --- API HELPERS ---
const callGemini = async (prompt, systemInstruction, history = []) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...history, { role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      }
    );
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Connection failed.";
  } catch (e) { return "Offline mode. Please check connection."; }
};

// --- COMPONENT: ONBOARDING (CONTEXT ENGINE) ---
const Onboarding = ({ onComplete }) => {
  const scenarios = [
    {
      id: 'panic',
      icon: <AlertTriangle size={32} className="text-rose-500" />,
      label: "The \"Oh S***\" Moment",
      desc: "Panic attack, rage, or total system failure.",
      config: { isHelper: false, tab: 'tools', tool: 'breath', persona: 'cynic' }
    },
    {
      id: 'helper',
      icon: <Users size={32} className="text-emerald-400" />,
      label: "I'm a Helper",
      desc: "Peer support, volunteer, or helping a friend.",
      config: { isHelper: true, tab: 'network', tool: null, persona: 'medic' }
    },
    {
      id: 'needs',
      icon: <Coffee size={32} className="text-amber-400" />,
      label: "Housed but Hungry",
      desc: "Need resources (Food, Money) with low friction.",
      config: { isHelper: false, tab: 'network', tool: null, persona: 'navigator', filter: 'food' }
    },
    {
      id: 'detox',
      icon: <Pill size={32} className="text-blue-400" />,
      label: "Entering Detox",
      desc: "Preparation, cravings, or withdrawal.",
      config: { isHelper: false, tab: 'ai', tool: null, persona: 'cynic', filter: 'detox' }
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-6 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col justify-center space-y-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 leading-none">NEURAL<br/><span className="text-slate-500">O.S.</span></h1>
          <p className="text-slate-400 text-lg mt-4">Operating System for the Dysregulated.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {scenarios.map((s) => (
            <button 
              key={s.id}
              onClick={() => { triggerHaptic([20]); onComplete(s.config); }}
              className={`bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-5 hover:bg-slate-800 hover:border-slate-700 transition-all group text-left ${s.id === 'panic' ? 'border-rose-900/50 bg-rose-950/10' : ''}`}
            >
              <div className={`p-3 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform ${s.id === 'panic' ? 'bg-rose-950 border-rose-900' : 'bg-slate-950'}`}>
                {s.icon}
              </div>
              <div>
                <div className={`font-bold text-lg ${s.id === 'panic' ? 'text-rose-200' : 'text-slate-200'}`}>{s.label}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
              <ArrowRight className="ml-auto text-slate-700 group-hover:text-slate-400" />
            </button>
          ))}
        </div>
      </div>
      <div className="text-center text-slate-600 text-xs">
        <button onClick={() => onComplete({ isHelper: false, tab: 'sanctuary' })} className="underline hover:text-slate-400">Skip to Dashboard</button>
      </div>
    </div>
  );
};

// --- FULL SCREEN TOOLS ---
const SilentCard = ({ onClose }) => {
  const [cardType, setCardType] = useState('general'); 
  const cards = {
    general: { title: "I AM LISTENING", body: "I need a moment to process. Please do not touch me. I am not a threat.", color: "bg-slate-900" },
    panic: { title: "PANIC ATTACK", body: "I am having a medical emergency. I cannot speak. Please give me space. Do not call police.", color: "bg-rose-900" },
    autism: { title: "OVERSTIMULATED", body: "I am autistic. Lights and sounds are hurting me. I need a quiet place.", color: "bg-indigo-900" },
    help: { title: "I NEED HELP", body: "Please call my emergency contact located in 'Safety' tab. I am not safe right now.", color: "bg-amber-900" }
  };
  return (
    <div className={`fixed inset-0 z-[90] ${cards[cardType].color} flex flex-col p-6 transition-colors duration-500`}>
      <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-black/20 rounded-full text-white/70 hover:text-white"><X /></button>
      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 animate-in zoom-in duration-300">
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">{cards[cardType].title}</h1>
        <p className="text-xl md:text-3xl text-white/90 font-medium leading-relaxed max-w-lg">{cards[cardType].body}</p>
      </div>
      <div className="flex gap-2 justify-center pb-12 flex-wrap">
        {Object.keys(cards).map(k => (
          <button key={k} onClick={() => setCardType(k)} className={`px-5 py-3 rounded-full text-xs font-bold uppercase transition-all ${cardType === k ? 'bg-white text-black scale-105' : 'bg-black/30 text-white hover:bg-black/50'}`}>{k}</button>
        ))}
      </div>
    </div>
  );
};

const BreathPacer = ({ onClose, isHelper }) => {
  const [phase, setPhase] = useState('inhale'); 
  const [text, setText] = useState('Prepare...');
  useEffect(() => {
    let mounted = true;
    const cycle = async () => {
      if (!mounted) return;
      setPhase('inhale'); setText(isHelper ? "Tell them: 'Breathe in...'" : 'Double Inhale (Nose)'); triggerHaptic([100]); await new Promise(r => setTimeout(r, 4000));
      if (!mounted) return;
      setPhase('exhale'); setText(isHelper ? "Tell them: 'Slow exhale...'" : 'Long Exhale (Mouth)'); triggerHaptic([50, 50, 50]); await new Promise(r => setTimeout(r, 6000));
      if (mounted) cycle();
    };
    cycle();
    return () => { mounted = false; };
  }, [isHelper]);
  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-slate-900 rounded-full text-slate-400"><X size={32}/></button>
      <div className={`w-72 h-72 rounded-full border-4 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'border-cyan-400 bg-cyan-900/20 scale-110 shadow-[0_0_60px_rgba(34,211,238,0.4)]' : 'border-slate-700 bg-slate-900/50 scale-90 duration-[6000ms]'}`}>
        <Wind size={80} className={`transition-colors duration-[2000ms] ${phase === 'inhale' ? 'text-cyan-200' : 'text-slate-700'}`} />
      </div>
      <h2 className="mt-12 text-2xl font-bold text-slate-200 tracking-widest uppercase animate-pulse text-center px-4">{text}</h2>
      {isHelper && <p className="mt-4 text-blue-400 text-sm font-medium bg-blue-900/20 px-4 py-2 rounded-full">Helper Mode Active</p>}
    </div>
  );
};

// --- SECTIONS ---

const Dashboard = ({ onActivateTool, isHelper }) => {
  const triage = [
    { id: 'panic', label: isHelper ? "They are Panicking" : "System Overheat", sub: "Panic / Racing", icon: <ThermometerSnowflake size={28} />, color: "bg-indigo-600", textColor: "text-indigo-100", action: () => onActivateTool('breath') },
    { id: 'rage', label: isHelper ? "They are Aggressive" : "Nuclear Meltdown", sub: "Rage / Adrenaline", icon: <Zap size={28} />, color: "bg-rose-600", textColor: "text-rose-100", action: null }, 
    { id: 'silent', label: "Silent Card", sub: "Non-Verbal Tool", icon: <EyeOff size={28} />, color: "bg-slate-600", textColor: "text-slate-100", action: () => onActivateTool('silent') },
    { id: 'hunt', label: isHelper ? "Ground Them" : "Reality Check", sub: "Dissociation", icon: <Aperture size={28} />, color: "bg-amber-600", textColor: "text-amber-100", action: null },
  ];

  return (
    <div className="p-4 space-y-6 pb-32">
      {isHelper && (
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
          <Stethoscope className="shrink-0 text-blue-400" />
          <div>
            <h3 className="font-bold text-blue-200 text-sm">Helper Mode Active</h3>
            <p className="text-xs text-blue-300/70 mt-1">You are the anchor. Keep your voice low and slow. Use these tools to guide them.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {triage.map((item) => (
          <button 
            key={item.id} 
            onClick={() => { triggerHaptic([15]); item.action && item.action(); }} 
            className={`relative overflow-hidden p-4 rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-all active:scale-95 flex items-center gap-5 h-24 group w-full`}
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${item.color}`} />
            <div className={`h-14 w-14 shrink-0 rounded-2xl ${item.color} bg-opacity-20 ${item.textColor} flex items-center justify-center`}>{item.icon}</div>
            <div className="text-left">
              <div className="font-bold text-lg leading-none text-slate-200 mb-1.5">{item.label}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium">{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const NetworkSection = ({ isHelper, initialFilter = 'all' }) => {
  const [filter, setFilter] = useState(initialFilter);
  const [maxEffort, setMaxEffort] = useState(2); 

  useEffect(() => { setFilter(initialFilter) }, [initialFilter]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'food', label: 'Food' },
    { id: 'shelter', label: 'Shelter' },
    { id: 'crisis', label: 'Crisis' },
  ];

  const filtered = resourceDB.filter(r => {
    const catMatch = filter === 'all' || r.category === filter;
    const effortMatch = r.effort <= maxEffort;
    return catMatch && effortMatch;
  });

  return (
    <div className="pb-32 h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-slate-500 tracking-widest">{isHelper ? 'Client Capacity' : 'My Capacity'}</span>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button onClick={() => setMaxEffort(2)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${maxEffort === 2 ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Low</button>
          <button onClick={() => setMaxEffort(4)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${maxEffort === 4 ? 'bg-slate-800 text-slate-300' : 'text-slate-500'}`}>All</button>
        </div>
      </div>
      <div className="px-4 pb-2 overflow-x-auto scrollbar-hide flex gap-2 shrink-0">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${filter === cat.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{cat.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 space-y-3 no-scrollbar">
        {filtered.length === 0 && <div className="text-center text-slate-500 py-10 text-xs">No matching low-barrier resources. Switch capacity to "All".</div>}
        {filtered.map(r => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-start mb-2">
              <div><h3 className="font-bold text-slate-200">{r.name}</h3><div className="text-[10px] text-blue-400 font-mono uppercase mt-0.5">{r.status}</div></div>
              <div className="flex gap-2">
                 {r.contact.includes('-') ? <a href={`tel:${r.contact}`} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400"><Phone size={16}/></a> : <a href={`https://maps.google.com/?q=${encodeURIComponent(r.contact)}`} target="_blank" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400"><Navigation size={16}/></a>}
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AIChat = ({ persona, onClose, isHelper }) => {
  const [messages, setMessages] = useState([{ role: 'model', text: persona.opener }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const context = `
    USER CONTEXT: ${isHelper ? 'Helper supporting someone else' : 'User in distress'}.
    RESOURCE DATABASE: ${JSON.stringify(resourceDB.map(r => `${r.name} (${r.category}): ${r.desc}`))}.
    PERSONA INSTRUCTIONS: ${persona.system}
  `;

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);
    const history = messages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] })).slice(-6);
    const res = await callGemini(newMsg.text, context, history);
    setMessages(prev => [...prev, { role: 'model', text: res }]);
    setLoading(false);
  };

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col h-[100dvh]">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90 backdrop-blur">
        <button onClick={onClose} className="p-2 text-slate-400"><ArrowLeft /></button>
        <div><div className="font-bold text-slate-200">{persona.title}</div><div className="text-[10px] text-purple-400 uppercase">{isHelper ? "Coach Mode" : persona.role}</div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-purple-900/20 text-purple-100 border border-purple-500/20'}`}>{m.text}</div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin text-purple-500 mx-4" size={20} />}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 bg-slate-900 border-t border-slate-800">
         <div className="flex gap-2">
           <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder={isHelper ? "Describe situation..." : "Type here..."} onKeyDown={e => e.key === 'Enter' && handleSend()} />
           <button onClick={handleSend} className="bg-purple-600 p-3 rounded-xl text-white"><Send size={20}/></button>
         </div>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---
const NeuralOS = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [tab, setTab] = useState('sanctuary');
  const [activeTool, setActiveTool] = useState(null);
  const [activePersona, setActivePersona] = useState(null);
  const [isHelper, setIsHelper] = useState(false);
  const [initialFilter, setInitialFilter] = useState('all');

  const handleOnboardingComplete = (config) => {
    setIsHelper(config.isHelper);
    setTab(config.tab);
    if (config.tool) setActiveTool(config.tool);
    if (config.persona) setActivePersona(PERSONAS[config.persona]);
    if (config.filter) setInitialFilter(config.filter);
    setShowOnboarding(false);
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div className="fixed inset-0 bg-slate-950 text-slate-200 font-sans h-[100dvh] flex flex-col overflow-hidden">
        
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

        {/* TOP BAR */}
        <header className="h-16 shrink-0 glass-panel flex items-center justify-between px-5 z-30">
          <div className="flex items-center gap-2.5" onClick={() => { setIsHelper(!isHelper); triggerHaptic([10]); }}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${isHelper ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
              {isHelper ? <Users size={18} /> : <Brain size={18} />}
            </div>
            <div className="flex flex-col">
               <span className="font-bold tracking-widest text-sm text-slate-100">NEURAL O.S.</span>
               <span className={`text-[8px] font-mono uppercase tracking-widest ${isHelper ? 'text-blue-400' : 'text-slate-500'}`}>{isHelper ? 'HELPER MODE' : 'SELF REGULATION'}</span>
            </div>
          </div>
          <button onClick={() => setActiveTool('breath')} className="bg-rose-500/10 border border-rose-500/50 text-rose-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse active:bg-rose-600 active:text-white transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]">SOS</button>
        </header>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
          {tab === 'sanctuary' && <Dashboard onActivateTool={setActiveTool} isHelper={isHelper} />}
          {tab === 'tools' && <Dashboard onActivateTool={setActiveTool} isHelper={isHelper} />}
          
          {tab === 'ai' && !activePersona && (
             <div className="p-4 space-y-4 pb-32">
                <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest ml-1">Select Copilot</h2>
                {Object.values(PERSONAS).map((p, i) => (
                  <button key={i} onClick={() => setActivePersona(p)} className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl active:scale-95 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-950 rounded-xl text-slate-300 group-hover:text-purple-400 transition-colors">{p.icon}</div>
                      <div><div className="font-bold text-slate-200 text-lg">{p.title}</div><div className="text-xs text-purple-400/70 font-mono uppercase tracking-wider">{p.role}</div></div>
                    </div>
                  </button>
                ))}
             </div>
          )}
          
          {tab === 'ai' && activePersona && <AIChat persona={activePersona} onClose={() => setActivePersona(null)} isHelper={isHelper} />}
          {tab === 'network' && <NetworkSection isHelper={isHelper} initialFilter={initialFilter} />}
        </main>

        {/* NAV */}
        <nav className="h-20 shrink-0 bg-slate-950 border-t border-slate-800 flex items-center justify-around pb-2 z-40 safe-area-pb">
          {[
            { id: 'sanctuary', icon: <Home size={20} />, label: 'Home' },
            { id: 'tools', icon: <Grid size={20} />, label: 'Tools' },
            { id: 'ai', icon: <Mic size={20} />, label: 'Copilot' },
            { id: 'network', icon: <Globe size={20} />, label: 'Network' }
          ].map(item => (
             <button key={item.id} onClick={() => { triggerHaptic([10]); setTab(item.id); }} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl w-16 transition-colors ${tab === item.id ? 'text-cyan-400' : 'text-slate-600'}`}>
               <div className={`p-1 rounded-lg transition-all ${tab === item.id ? 'bg-cyan-950 scale-110' : ''}`}>{item.icon}</div>
               <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
             </button>
          ))}
        </nav>

        {/* OVERLAYS */}
        {activeTool === 'breath' && <BreathPacer onClose={() => setActiveTool(null)} isHelper={isHelper} />}
        {activeTool === 'silent' && <SilentCard onClose={() => setActiveTool(null)} />}

      </div>
    </>
  );
};

export default NeuralOS;
