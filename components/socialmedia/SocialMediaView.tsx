"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type ElementType = "text" | "emoji" | "shape" | "image";
type ShapeType = "rectangle" | "circle" | "triangle" | "star" | "arrow" | "line";
type TextAlign = "left" | "center" | "right";

interface CanvasElement {
  id: string; type: ElementType; content: string;
  x: number; y: number; width: number; height: number; rotation: number;
  fontSize?: number; fontFamily?: string; color?: string;
  bold?: boolean; italic?: boolean; underline?: boolean;
  letterSpacing?: number; lineHeight?: number; textAlign?: TextAlign;
  textShadow?: boolean; textStroke?: boolean; textStrokeColor?: string;
  shapeType?: ShapeType; fill?: string; stroke?: string; strokeWidth?: number;
  opacity: number; flipH?: boolean; flipV?: boolean; locked?: boolean;
  zIndex: number; borderRadius?: number;
}

interface Background {
  type: "color" | "gradient" | "image" | "pattern";
  value: string; opacity: number;
}

const PLATFORMS = [
  { id:1,  name:"Instagram Post",    size:"1080×1080", ratio:"1:1",    w:380, h:380, bg:"from-purple-500 to-pink-500",   icon:"📸", platform:"instagram" },
  { id:2,  name:"Instagram Story",   size:"1080×1920", ratio:"9:16",   w:214, h:380, bg:"from-pink-500 to-orange-400",   icon:"📱", platform:"instagram" },
  { id:3,  name:"Facebook Post",     size:"1200×630",  ratio:"1.91:1", w:380, h:200, bg:"from-blue-600 to-blue-400",     icon:"👍", platform:"facebook"  },
  { id:4,  name:"Twitter/X Post",    size:"1600×900",  ratio:"16:9",   w:380, h:214, bg:"from-sky-500 to-cyan-400",      icon:"🐦", platform:"twitter"   },
  { id:5,  name:"LinkedIn Post",     size:"1200×627",  ratio:"1.91:1", w:380, h:199, bg:"from-blue-700 to-blue-500",     icon:"💼", platform:"linkedin"  },
  { id:6,  name:"YouTube Thumbnail", size:"1280×720",  ratio:"16:9",   w:380, h:214, bg:"from-red-600 to-red-400",       icon:"▶️", platform:"youtube"   },
  { id:7,  name:"Pinterest Pin",     size:"1000×1500", ratio:"2:3",    w:253, h:380, bg:"from-red-500 to-rose-400",      icon:"📌", platform:"pinterest" },
  { id:8,  name:"TikTok Cover",      size:"1080×1920", ratio:"9:16",   w:214, h:380, bg:"from-gray-900 to-gray-700",     icon:"🎵", platform:"tiktok"    },
  { id:9,  name:"WhatsApp Status",   size:"1080×1920", ratio:"9:16",   w:214, h:380, bg:"from-green-500 to-emerald-400", icon:"💬", platform:"whatsapp"  },
  { id:10, name:"Snapchat Story",    size:"1080×1920", ratio:"9:16",   w:214, h:380, bg:"from-yellow-400 to-yellow-300", icon:"👻", platform:"snapchat"  },
];

const FONTS   = ["Arial","Georgia","Impact","Courier New","Trebuchet MS","Verdana","Palatino","Garamond","Helvetica","Comic Sans MS"];
const FSIZES  = [8,10,12,14,16,18,20,24,28,32,36,40,48,56,64,72,96,120];
const COLORS  = ["#ffffff","#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#f8fafc","#1e293b","#fbbf24","#34d399","#a78bfa","#fb7185"];
const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)","linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)","linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)","linear-gradient(135deg,#a1c4fd,#c2e9fb)",
  "linear-gradient(135deg,#d4fc79,#96e6a1)","linear-gradient(135deg,#30cfd0,#330867)",
  "linear-gradient(135deg,#f77062,#fe5196)","linear-gradient(135deg,#fddb92,#d1fdff)",
];
const STICKERS = ["🔥","✨","💯","🎉","❤️","🚀","⭐","💪","🌟","🎯","😍","🙌","💎","👑","🌈","🦋","🌸","🎨","🎭","🏆","⚡","🌊","🎸","🦄","🍀","💫","🔮","🎀","🎗️","🤩"];
const PATTERNS = [
  "repeating-linear-gradient(45deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 50%) center/20px 20px",
  "repeating-linear-gradient(0deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 20px),repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 20px)",
  "radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px) center/24px 24px",
  "repeating-linear-gradient(-45deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 2px,transparent 0,transparent 8px)",
];

let _z = 10;
const nextZ = () => ++_z;

function makeEl(type: ElementType, p: Partial<CanvasElement> = {}): CanvasElement {
  return { id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, type, content:"", x:60, y:60, width:200, height:60, rotation:0, opacity:100, zIndex:nextZ(), ...p };
}

export default function SocialMediaView({ databaseId }: { databaseId: string }) {
  const [platform, setPlatform]     = useState(PLATFORMS[0]);
  const [elements, setElements]     = useState<CanvasElement[]>([
    makeEl("text", { content:"Your Headline", x:40, y:80, width:300, height:70, fontSize:36, fontFamily:"Impact", color:"#ffffff", bold:true, textAlign:"center", textShadow:true, zIndex:1 }),
    makeEl("text", { content:"Add your subtitle here", x:55, y:160, width:270, height:44, fontSize:16, fontFamily:"Arial", color:"rgba(255,255,255,0.85)", textAlign:"center", zIndex:2 }),
  ]);
  const [bg, setBg]                 = useState<Background>({ type:"gradient", value:GRADIENTS[0], opacity:100 });
  const [bgSolidColor, setBgSolidColor] = useState("#6366f1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"canvas"|"text"|"shapes"|"stickers"|"bg"|"layers">("canvas");
  const [zoom, setZoom]             = useState(100);
  const [undoStack, setUndoStack]   = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack]   = useState<CanvasElement[][]>([]);
  const [showExport, setShowExport] = useState(false);

  // ✅ Save / Load state
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [savedAt, setSavedAt]       = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragging  = useRef<{ id:string; ox:number; oy:number; ex:number; ey:number }|null>(null);
  const resizing  = useRef<{ id:string; ox:number; oy:number; ew:number; eh:number }|null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const sel    = elements.find(e => e.id === selectedId);
  const sorted = [...elements].sort((a,b) => a.zIndex - b.zIndex);

  // ✅ Load from DB on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/databases/${databaseId}/socialmedia`);
        const json = await res.json();
        if (json.data) {
          const { platform: p, bg: b, bgSolidColor: bc, elements: els } = json.data;
          if (p)   setPlatform(PLATFORMS.find(pl => pl.id === p.id) || PLATFORMS[0]);
          if (b)   setBg(b);
          if (bc)  setBgSolidColor(bc);
          if (els && els.length) setElements(els);
        }
      } catch (e) {
        console.error("Failed to load social media design:", e);
      } finally {
        setLoadedOnce(true);
      }
    };
    load();
  }, [databaseId]);

  // ✅ Auto-save debounced 2s — only after load completes
  useEffect(() => {
    if (!loadedOnce) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/databases/${databaseId}/socialmedia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { platform, bg, bgSolidColor, elements } }),
        });
        setSavedAt(new Date().toLocaleTimeString());
      } catch (e) { console.error("Save failed:", e); }
      finally { setSaving(false); }
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [elements, bg, bgSolidColor, platform, loadedOnce, databaseId]);

  // ── Outside click closes export menu ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return;
      if ((e.ctrlKey||e.metaKey) && e.key==="z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="y") { e.preventDefault(); redo(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="d") { e.preventDefault(); duplicate(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="s") { e.preventDefault(); forceSave(); }
      if ((e.key==="Delete"||e.key==="Backspace") && selectedId) { e.preventDefault(); deleteEl(selectedId); }
      if (e.key==="Escape") setSelectedId(null);
      if (selectedId) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key==="ArrowUp")    { e.preventDefault(); updateEl(selectedId,{y:(sel?.y||0)-step}); }
        if (e.key==="ArrowDown")  { e.preventDefault(); updateEl(selectedId,{y:(sel?.y||0)+step}); }
        if (e.key==="ArrowLeft")  { e.preventDefault(); updateEl(selectedId,{x:(sel?.x||0)-step}); }
        if (e.key==="ArrowRight") { e.preventDefault(); updateEl(selectedId,{x:(sel?.x||0)+step}); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedId, sel, elements, undoStack, redoStack]);

  const forceSave = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    try {
      await fetch(`/api/databases/${databaseId}/socialmedia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { platform, bg, bgSolidColor, elements } }),
      });
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ── Undo / Redo ──
  const commit = useCallback((prev: CanvasElement[]) => {
    setUndoStack(s => [...s.slice(-29), prev]);
    setRedoStack([]);
  }, []);

  const undo = () => {
    if (!undoStack.length) return;
    setRedoStack(s => [...s, elements]);
    setElements(undoStack[undoStack.length-1]);
    setUndoStack(s => s.slice(0,-1));
  };

  const redo = () => {
    if (!redoStack.length) return;
    setUndoStack(s => [...s, elements]);
    setElements(redoStack[redoStack.length-1]);
    setRedoStack(s => s.slice(0,-1));
  };

  const updateEl = (id: string, updates: Partial<CanvasElement>) =>
    setElements(prev => prev.map(e => e.id===id ? {...e,...updates} : e));

  const updateElCommit = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => { commit(prev); return prev.map(e => e.id===id ? {...e,...updates} : e); });
  };

  const addEl = (el: CanvasElement) => {
    setElements(prev => { commit(prev); return [...prev,el]; });
    setSelectedId(el.id);
  };

  const deleteEl = (id: string) => {
    setElements(prev => { commit(prev); return prev.filter(e => e.id!==id); });
    setSelectedId(null);
  };

  const duplicate = () => {
    if (!sel) return;
    addEl({...sel, id:`${Date.now()}`, x:sel.x+16, y:sel.y+16, zIndex:nextZ()});
  };

  // ── Drag ──
  const onElDown = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).dataset.resize) return;
    const el = elements.find(el => el.id===id);
    if (!el||el.locked) return;
    e.stopPropagation();
    setSelectedId(id);
    dragging.current = {id, ox:e.clientX, oy:e.clientY, ex:el.x, ey:el.y};
  };

  const onResizeDown = (e: React.MouseEvent, id: string) => {
    const el = elements.find(el => el.id===id);
    if (!el) return;
    e.stopPropagation();
    resizing.current = {id, ox:e.clientX, oy:e.clientY, ew:el.width, eh:el.height};
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const scale = zoom/100;
    if (dragging.current) {
      const {id,ox,oy,ex,ey} = dragging.current;
      updateEl(id, {x:ex+(e.clientX-ox)/scale, y:ey+(e.clientY-oy)/scale});
    }
    if (resizing.current) {
      const {id,ox,oy,ew,eh} = resizing.current;
      updateEl(id, {width:Math.max(30,ew+(e.clientX-ox)/scale), height:Math.max(20,eh+(e.clientY-oy)/scale)});
    }
  }, [zoom]);

  const onMouseUp = () => {
    if (dragging.current||resizing.current) { commit(elements); dragging.current=null; resizing.current=null; }
  };

  // ── Add helpers ──
  const addText = (preset?: Partial<CanvasElement>) =>
    addEl(makeEl("text",{content:"New Text",x:50,y:50,width:220,height:56,fontSize:24,fontFamily:"Arial",color:"#ffffff",textAlign:"center",...preset}));

  const addShape = (shapeType: ShapeType) =>
    addEl(makeEl("shape",{x:80,y:80,width:120,height:80,shapeType,fill:"#3b82f6",stroke:"transparent",strokeWidth:0}));

  const addSticker = (s: string) =>
    addEl(makeEl("emoji",{content:s,x:70,y:70,width:64,height:64,fontSize:52}));

  const addImageFile = (file: File) => {
    const url = URL.createObjectURL(file);
    addEl(makeEl("image",{content:url,x:40,y:40,width:200,height:150}));
  };

  const addBgFile = (file: File) => setBg({type:"image",value:URL.createObjectURL(file),opacity:100});

  // ── Shape SVG ──
  const renderShape = (el: CanvasElement) => {
    const w=el.width,h=el.height,sw=el.strokeWidth||0;
    const fill=el.fill||"#3b82f6",stroke=el.stroke||"transparent";
    return (
      <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
        {el.shapeType==="rectangle"&&<rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} fill={fill} stroke={stroke} strokeWidth={sw} rx={4}/>}
        {el.shapeType==="circle"   &&<ellipse cx={w/2} cy={h/2} rx={(w-sw)/2} ry={(h-sw)/2} fill={fill} stroke={stroke} strokeWidth={sw}/>}
        {el.shapeType==="triangle" &&<polygon points={`${w/2},${sw} ${w-sw},${h-sw} ${sw},${h-sw}`} fill={fill} stroke={stroke} strokeWidth={sw}/>}
        {el.shapeType==="line"     &&<line x1={sw} y1={h/2} x2={w-sw} y2={h/2} stroke={fill} strokeWidth={Math.max(sw,3)}/>}
        {el.shapeType==="arrow"    &&<><line x1={sw} y1={h/2} x2={w-18} y2={h/2} stroke={fill} strokeWidth={Math.max(sw,3)}/><polygon points={`${w},${h/2} ${w-18},${h/2-9} ${w-18},${h/2+9}`} fill={fill}/></>}
        {el.shapeType==="star"     &&<polygon points={`${w/2},${sw} ${w*0.62},${h*0.38} ${w-sw},${h*0.38} ${w*0.72},${h*0.62} ${w*0.82},${h-sw} ${w/2},${h*0.76} ${w*0.18},${h-sw} ${w*0.28},${h*0.62} ${sw},${h*0.38} ${w*0.38},${h*0.38}`} fill={fill} stroke={stroke} strokeWidth={sw}/>}
      </svg>
    );
  };

  const bgCss = (): React.CSSProperties => {
    if (bg.type==="color")    return {backgroundColor:bg.value};
    if (bg.type==="gradient") return {background:bg.value};
    if (bg.type==="image")    return {backgroundImage:`url(${bg.value})`,backgroundSize:"cover",backgroundPosition:"center"};
    if (bg.type==="pattern")  return {background:bg.value,backgroundColor:bgSolidColor};
    return {};
  };

  const exportPNG = async () => {
    setShowExport(false);
    try {
      const mod = await (import("html2canvas") as any).catch(()=>null);
      if (mod?.default && canvasRef.current) {
        const c = await mod.default(canvasRef.current,{useCORS:true,scale:3});
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `${platform.platform}-${Date.now()}.png`;
        a.click();
      } else alert("Run: npm install html2canvas");
    } catch { alert("Export requires html2canvas package."); }
  };

  const exportJSON = () => {
    setShowExport(false);
    const blob = new Blob([JSON.stringify({platform,bg,bgSolidColor,elements},null,2)],{type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `design-${Date.now()}.json`; a.click();
  };

  const PBtn = ({id,label,icon}:{id:typeof activePanel;label:string;icon:string}) => (
    <button onClick={()=>setActivePanel(id)}
      className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg text-[8px] font-semibold transition ${activePanel===id?"bg-violet-600 text-white":"text-gray-400 hover:bg-white/10 hover:text-white"}`}>
      <span className="text-sm leading-none">{icon}</span>{label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0d] text-white overflow-hidden rounded-xl">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111115] border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold">📱 Social Media Editor</span>
          <span className="text-[9px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">{platform.name}</span>
          {saving && <span className="text-[9px] text-amber-400 animate-pulse">● Saving…</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-400">✓ {savedAt}</span>}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!undoStack.length} title="Undo (Ctrl+Z)"
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 disabled:opacity-25 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          </button>
          <button onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Y)"
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 disabled:opacity-25 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
          </button>
          <div className="w-px h-4 bg-white/10 mx-1"/>
          <button onClick={()=>setZoom(z=>Math.max(25,z-10))} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 font-bold text-sm">−</button>
          <span className="text-[9px] text-gray-500 w-9 text-center">{zoom}%</span>
          <button onClick={()=>setZoom(z=>Math.min(200,z+10))} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 font-bold text-sm">+</button>
          <button onClick={()=>setZoom(100)} className="text-[9px] text-gray-600 hover:text-gray-300 px-1 transition">Fit</button>
          <div className="w-px h-4 bg-white/10 mx-1"/>
          <button onClick={forceSave} title="Save (Ctrl+S)"
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-emerald-400 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
          <div className="relative" ref={exportRef}>
            <button onClick={()=>setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg transition">
              Export
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-[100] bg-[#1a1a22] border border-white/10 rounded-xl shadow-2xl p-1 w-44">
                <button onClick={exportPNG} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-gray-300 hover:bg-white/10 hover:text-white transition text-left">🖼️ Export PNG (3×)</button>
                <button onClick={exportJSON} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-gray-300 hover:bg-white/10 hover:text-white transition text-left">📦 Save as JSON</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="w-52 bg-[#111115] border-r border-white/[0.06] flex flex-col shrink-0">
          <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-white/[0.06]">
            <PBtn id="canvas"   label="Canvas"  icon="🎨"/>
            <PBtn id="text"     label="Text"    icon="T"/>
            <PBtn id="shapes"   label="Shapes"  icon="◻"/>
            <PBtn id="stickers" label="Sticker" icon="😀"/>
            <PBtn id="bg"       label="BG"      icon="🖼"/>
            <PBtn id="layers"   label="Layers"  icon="≡"/>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2.5">

            {/* CANVAS / PLATFORM */}
            {activePanel === "canvas" && (
              <div className="space-y-1.5">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1">Select Platform</p>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={()=>setPlatform(p)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition border ${platform.id===p.id?"bg-violet-600/20 border-violet-500/40 text-white":"border-transparent hover:bg-white/5 text-gray-400 hover:text-white"}`}>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.bg} flex items-center justify-center text-sm shrink-0`}>{p.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold truncate">{p.name}</p>
                      <p className="text-[9px] text-gray-600">{p.size}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TEXT */}
            {activePanel === "text" && (
              <div className="space-y-2">
                <button onClick={()=>addText()} className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition">+ Add Text Box</button>
                <div className="space-y-1">
                  {[{label:"Big Heading",fs:42,bold:true,content:"Big Heading"},{label:"Subheading",fs:26,bold:true,content:"Subheading"},{label:"Body Text",fs:16,bold:false,content:"Body text"},{label:"Caption",fs:11,bold:false,content:"Caption"}].map(t=>(
                    <button key={t.label} onClick={()=>addText({content:t.content,fontSize:t.fs,bold:t.bold})}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition">
                      <span className="text-white" style={{fontSize:Math.min(t.fs*0.5,16),fontWeight:t.bold?"bold":"normal"}}>{t.label}</span>
                    </button>
                  ))}
                </div>
                {sel?.type==="text" && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Format</p>
                    <select value={sel.fontFamily||"Arial"} onChange={e=>updateElCommit(sel.id,{fontFamily:e.target.value})}
                      className="w-full h-7 text-[10px] bg-[#1c1c22] border border-white/10 text-white rounded px-2 focus:outline-none">
                      {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={sel.fontSize||24} onChange={e=>updateElCommit(sel.id,{fontSize:Number(e.target.value)})}
                      className="w-full h-7 text-[10px] bg-[#1c1c22] border border-white/10 text-white rounded px-2 focus:outline-none">
                      {FSIZES.map(s=><option key={s} value={s}>{s}px</option>)}
                    </select>
                    <div className="flex gap-1">
                      {[["B","bold",{bold:!sel.bold}],["I","italic",{italic:!sel.italic}],["U","underline",{underline:!sel.underline}]].map(([l,k,u])=>(
                        <button key={k as string} onClick={()=>updateElCommit(sel.id,u as any)}
                          className={`flex-1 h-6 rounded text-xs font-bold transition ${sel[k as keyof CanvasElement]?"bg-violet-600 text-white":"bg-white/10 text-gray-400 hover:text-white"}`}>
                          {l as string}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {(["left","center","right"] as TextAlign[]).map(a=>(
                        <button key={a} onClick={()=>updateElCommit(sel.id,{textAlign:a})}
                          className={`flex-1 h-6 rounded text-[10px] transition ${sel.textAlign===a?"bg-violet-600 text-white":"bg-white/10 text-gray-400 hover:text-white"}`}>
                          {a==="left"?"⬅":a==="center"?"≡":"➡"}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-8 gap-1">
                      {COLORS.map(c=>(
                        <button key={c} onClick={()=>updateElCommit(sel.id,{color:c})}
                          className={`w-5 h-5 rounded border-2 transition hover:scale-110 ${sel.color===c?"border-white":"border-transparent"}`}
                          style={{backgroundColor:c,boxShadow:c==="#ffffff"?"inset 0 0 0 1px rgba(0,0,0,0.4)":undefined}}/>
                      ))}
                    </div>
                    <input type="color" value={sel.color||"#ffffff"} onChange={e=>updateEl(sel.id,{color:e.target.value})} onBlur={()=>commit(elements)}
                      className="w-full h-7 rounded border border-white/10 cursor-pointer bg-transparent"/>
                    {[{label:"Spacing",key:"letterSpacing",min:-2,max:20,step:0.5,def:0,unit:"px"},{label:"Line H",key:"lineHeight",min:0.8,max:3,step:0.1,def:1.4,unit:""}].map(({label,key,min,max,step,def,unit})=>(
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 w-14 shrink-0">{label}</span>
                        <input type="range" min={min} max={max} step={step} value={(sel as any)[key]??def}
                          onChange={e=>updateEl(sel.id,{[key]:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                          className="flex-1 h-1 accent-violet-500"/>
                        <span className="text-[9px] text-gray-400 w-8 text-right">{((sel as any)[key]??def)}{unit}</span>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <button onClick={()=>updateElCommit(sel.id,{textShadow:!sel.textShadow})}
                        className={`flex-1 py-1 rounded text-[9px] transition ${sel.textShadow?"bg-violet-600 text-white":"bg-white/10 text-gray-400 hover:text-white"}`}>Shadow</button>
                      <button onClick={()=>updateElCommit(sel.id,{textStroke:!sel.textStroke})}
                        className={`flex-1 py-1 rounded text-[9px] transition ${sel.textStroke?"bg-violet-600 text-white":"bg-white/10 text-gray-400 hover:text-white"}`}>Outline</button>
                    </div>
                    {sel.textStroke && <input type="color" value={sel.textStrokeColor||"#000000"} onChange={e=>updateElCommit(sel.id,{textStrokeColor:e.target.value})} className="w-full h-7 rounded border border-white/10 cursor-pointer bg-transparent"/>}
                  </div>
                )}
              </div>
            )}

            {/* SHAPES */}
            {activePanel === "shapes" && (
              <div className="space-y-2">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1">Shapes</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([["rectangle","◻"],["circle","○"],["triangle","△"],["star","★"],["line","—"],["arrow","→"]] as const).map(([s,icon])=>(
                    <button key={s} onClick={()=>addShape(s as ShapeType)}
                      className="aspect-square flex items-center justify-center text-2xl bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-violet-500/40 transition">{icon}</button>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1 mb-2">Upload Image</p>
                  <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-violet-500/50 text-xs text-gray-400 hover:text-white transition cursor-pointer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    From Desktop
                    <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)addImageFile(f);e.target.value="";}}/>
                  </label>
                </div>
                {sel?.type==="shape" && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Shape Fill</p>
                    <div className="grid grid-cols-5 gap-1">
                      {COLORS.slice(0,10).map(c=>(
                        <button key={c} onClick={()=>updateElCommit(sel.id,{fill:c})}
                          className={`w-7 h-7 rounded-lg border-2 transition hover:scale-110 ${sel.fill===c?"border-white":"border-transparent"}`}
                          style={{backgroundColor:c}}/>
                      ))}
                    </div>
                    <input type="color" value={sel.fill||"#3b82f6"} onChange={e=>updateEl(sel.id,{fill:e.target.value})} onBlur={()=>commit(elements)}
                      className="w-full h-7 rounded border border-white/10 cursor-pointer bg-transparent"/>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 w-10">Stroke</span>
                      <input type="number" min={0} max={20} value={sel.strokeWidth||0} onChange={e=>updateElCommit(sel.id,{strokeWidth:Number(e.target.value)})}
                        className="w-10 h-6 text-[9px] bg-[#1c1c22] border border-white/10 text-white rounded px-1 focus:outline-none"/>
                      <input type="color" value={sel.stroke||"#ffffff"} onChange={e=>updateElCommit(sel.id,{stroke:e.target.value})}
                        className="flex-1 h-6 rounded border border-white/10 cursor-pointer bg-transparent"/>
                    </div>
                  </div>
                )}
                {sel?.type==="image" && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Image</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 w-14 shrink-0">Radius</span>
                      <input type="range" min={0} max={200} value={sel.borderRadius||0}
                        onChange={e=>updateEl(sel.id,{borderRadius:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                        className="flex-1 h-1 accent-violet-500"/>
                      <span className="text-[9px] text-gray-400 w-6">{sel.borderRadius||0}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STICKERS */}
            {activePanel === "stickers" && (
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1 mb-2">Click to add</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STICKERS.map(s=>(
                    <button key={s} onClick={()=>addSticker(s)}
                      className="h-10 flex items-center justify-center text-xl bg-white/5 hover:bg-white/10 rounded-xl transition hover:scale-110">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* BACKGROUND */}
            {activePanel === "bg" && (
              <div className="space-y-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1">Solid Color</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {["#6366f1","#ec4899","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#0f172a","#1e293b","#ffffff","#000000"].map(c=>(
                    <button key={c} onClick={()=>{setBgSolidColor(c);setBg({type:"color",value:c,opacity:100});}}
                      className={`h-8 rounded-lg border-2 transition hover:scale-105 ${bg.type==="color"&&bg.value===c?"border-white":"border-transparent"}`}
                      style={{backgroundColor:c,boxShadow:c==="#ffffff"?"inset 0 0 0 1px rgba(0,0,0,0.2)":undefined}}/>
                  ))}
                </div>
                <input type="color" value={bgSolidColor} onChange={e=>{setBgSolidColor(e.target.value);setBg({type:"color",value:e.target.value,opacity:100});}}
                  className="w-full h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"/>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1 mt-1">Gradients</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRADIENTS.map((g,i)=>(
                    <button key={i} onClick={()=>setBg({type:"gradient",value:g,opacity:100})}
                      className={`h-12 rounded-xl border-2 transition hover:scale-105 ${bg.type==="gradient"&&bg.value===g?"border-white border-violet-400":"border-transparent"}`}
                      style={{background:g}}/>
                  ))}
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1 mt-1">Patterns</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PATTERNS.map((p,i)=>(
                    <button key={i} onClick={()=>setBg({type:"pattern",value:p,opacity:100})}
                      className={`h-10 rounded-xl border-2 transition ${bg.type==="pattern"&&bg.value===p?"border-violet-400":"border-white/10 hover:border-white/30"}`}
                      style={{background:p,backgroundColor:"#3b82f6"}}/>
                  ))}
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1 mt-1">Upload BG Image</p>
                <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-violet-500/50 text-xs text-gray-400 hover:text-white transition cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload from Desktop
                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)addBgFile(f);e.target.value="";}}/>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-16 shrink-0">BG Opacity</span>
                  <input type="range" min={10} max={100} value={bg.opacity} onChange={e=>setBg(b=>({...b,opacity:Number(e.target.value)}))} className="flex-1 h-1 accent-violet-500"/>
                  <span className="text-[9px] text-gray-400 w-6">{bg.opacity}%</span>
                </div>
              </div>
            )}

            {/* LAYERS */}
            {activePanel === "layers" && (
              <div className="space-y-1">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest px-1 mb-2">Layers (top→bottom)</p>
                {[...sorted].reverse().map(el=>(
                  <div key={el.id} onClick={()=>setSelectedId(el.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition group border ${selectedId===el.id?"bg-violet-600/20 border-violet-500/30 text-white":"border-transparent hover:bg-white/5 text-gray-400"}`}>
                    <span className="text-sm shrink-0 w-5 text-center">
                      {el.type==="text"?"T":el.type==="emoji"?el.content:el.type==="shape"?"◻":"🖼"}
                    </span>
                    <span className="text-[9px] truncate flex-1">
                      {el.type==="text"?el.content.slice(0,18):el.type==="emoji"?el.content:`${el.shapeType||el.type}`}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={e=>{e.stopPropagation();updateElCommit(el.id,{locked:!el.locked});}} className="text-[9px] text-gray-500 hover:text-white">{el.locked?"🔒":"🔓"}</button>
                      <button onClick={e=>{e.stopPropagation();deleteEl(el.id);}} className="text-[9px] text-red-400 hover:text-red-300">✕</button>
                    </div>
                  </div>
                ))}
                {!elements.length && <p className="text-[9px] text-gray-600 text-center py-6">No elements yet</p>}
              </div>
            )}
          </div>
        </div>

        {/* ══ CANVAS AREA ══ */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#0a0a0d]">
          <div ref={canvasRef} className="relative shadow-2xl select-none overflow-hidden"
            style={{ width:platform.w, height:platform.h, transform:`scale(${zoom/100})`, transformOrigin:"center", opacity:bg.opacity/100, ...bgCss() }}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onClick={e=>{if(e.target===canvasRef.current) setSelectedId(null);}}>

            <div className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest pointer-events-none z-50"
              style={{color:"rgba(255,255,255,0.2)"}}>{platform.platform}</div>

            {sorted.map(el => {
              const isSelected = selectedId===el.id;
              const isEditing  = editingId===el.id;
              return (
                <div key={el.id} style={{
                  position:"absolute", left:el.x, top:el.y, width:el.width, minHeight:el.height,
                  opacity:el.opacity/100, zIndex:el.zIndex,
                  transform:`rotate(${el.rotation}deg) scaleX(${el.flipH?-1:1}) scaleY(${el.flipV?-1:1})`,
                  cursor:el.locked?"not-allowed":"move",
                }}
                  onMouseDown={e=>{if(!el.locked)onElDown(e,el.id);}}
                  onDoubleClick={()=>{if(el.type==="text")setEditingId(el.id);}}
                  className={isSelected&&!el.locked?"outline outline-1 outline-violet-400 outline-offset-1":""}>

                  {el.type==="text" && (isEditing ? (
                    <textarea autoFocus value={el.content}
                      onChange={e=>updateEl(el.id,{content:e.target.value})}
                      onBlur={()=>{setEditingId(null);commit(elements);}}
                      style={{width:"100%",minHeight:el.height,fontSize:el.fontSize,fontFamily:el.fontFamily,color:el.color,fontWeight:el.bold?"bold":"normal",fontStyle:el.italic?"italic":"normal",textDecoration:el.underline?"underline":"none",textAlign:el.textAlign||"left",letterSpacing:el.letterSpacing?`${el.letterSpacing}px`:undefined,lineHeight:el.lineHeight||1.4,background:"transparent",border:"none",outline:"none",resize:"none",textShadow:el.textShadow?"2px 2px 8px rgba(0,0,0,0.8)":"none",WebkitTextStroke:el.textStroke?`1px ${el.textStrokeColor||"#000"}`:"none"}}/>
                  ) : (
                    <div style={{fontSize:el.fontSize,fontFamily:el.fontFamily,color:el.color,fontWeight:el.bold?"bold":"normal",fontStyle:el.italic?"italic":"normal",textDecoration:el.underline?"underline":"none",textAlign:el.textAlign||"left",letterSpacing:el.letterSpacing?`${el.letterSpacing}px`:undefined,lineHeight:el.lineHeight||1.4,whiteSpace:"pre-wrap",textShadow:el.textShadow?"2px 2px 8px rgba(0,0,0,0.8)":"none",WebkitTextStroke:el.textStroke?`1px ${el.textStrokeColor||"#000"}`:"none",padding:"2px"}}>{el.content}</div>
                  ))}

                  {el.type==="emoji" && <div style={{fontSize:el.fontSize||48,lineHeight:1,userSelect:"none"}}>{el.content}</div>}
                  {el.type==="shape" && renderShape(el)}
                  {el.type==="image" && <img src={el.content} alt="" draggable={false} style={{width:el.width,height:el.height,objectFit:"cover",display:"block",borderRadius:el.borderRadius||0}}/>}

                  {isSelected && !el.locked && (
                    <div data-resize="se" onMouseDown={e=>onResizeDown(e,el.id)}
                      className="absolute bottom-0 right-0 w-3 h-3 bg-violet-500 border-2 border-white rounded-sm cursor-se-resize z-50"/>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="w-48 bg-[#111115] border-l border-white/[0.06] overflow-y-auto shrink-0 p-3 space-y-4">
          {sel ? (
            <>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Position & Size</p>
                <div className="grid grid-cols-2 gap-1">
                  {([["X","x",sel.x],["Y","y",sel.y],["W","width",sel.width],["H","height",sel.height]] as const).map(([label,key,val])=>(
                    <div key={label} className="flex items-center gap-1">
                      <span className="text-[9px] text-gray-500 w-4">{label}</span>
                      <input type="number" value={Math.round(val as number)} onChange={e=>updateEl(sel.id,{[key]:Number(e.target.value)})} onBlur={()=>commit(elements)}
                        className="flex-1 h-6 text-[9px] bg-[#1c1c22] border border-white/10 text-white rounded px-1 focus:outline-none focus:border-violet-500 w-0"/>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Transform</p>
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[9px] text-gray-500 w-10 shrink-0">Rotate</span>
                  <input type="range" min={-180} max={180} value={sel.rotation||0}
                    onChange={e=>updateEl(sel.id,{rotation:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                    className="flex-1 h-1 accent-violet-500"/>
                  <span className="text-[9px] text-gray-400 w-8 text-right">{sel.rotation||0}°</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>updateElCommit(sel.id,{flipH:!sel.flipH})} className={`flex-1 py-1 text-[8px] rounded transition ${sel.flipH?"bg-violet-600 text-white":"bg-white/10 text-gray-400 hover:text-white"}`}>↔ FlipH</button>
                  <button onClick={()=>updateElCommit(sel.id,{flipV:!sel.flipV})} className={`flex-1 py-1 text-[8px] rounded transition ${sel.flipV?"bg-violet-600 text-white":"bg-white/10 text-gray-400 hover:text-white"}`}>↕ FlipV</button>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Appearance</p>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500 w-10 shrink-0">Opacity</span>
                  <input type="range" min={0} max={100} value={sel.opacity}
                    onChange={e=>updateEl(sel.id,{opacity:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                    className="flex-1 h-1 accent-violet-500"/>
                  <span className="text-[9px] text-gray-400 w-6">{sel.opacity}%</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Arrange</p>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <button onClick={()=>updateElCommit(sel.id,{zIndex:sel.zIndex+1})} className="py-1 rounded text-[8px] bg-white/10 text-gray-400 hover:text-white transition">▲ Forward</button>
                  <button onClick={()=>updateElCommit(sel.id,{zIndex:Math.max(0,sel.zIndex-1)})} className="py-1 rounded text-[8px] bg-white/10 text-gray-400 hover:text-white transition">▼ Back</button>
                </div>
                <button onClick={()=>updateElCommit(sel.id,{locked:!sel.locked})}
                  className={`w-full py-1 rounded text-[8px] transition ${sel.locked?"bg-amber-600/30 text-amber-300":"bg-white/10 text-gray-400 hover:text-white"}`}>
                  {sel.locked?"🔒 Locked":"🔓 Lock"}
                </button>
              </div>
              <div className="flex gap-1 pt-1 border-t border-white/[0.06]">
                <button onClick={duplicate} className="flex-1 py-1.5 rounded-lg text-[8px] bg-white/10 text-gray-400 hover:text-white transition">Duplicate</button>
                <button onClick={()=>deleteEl(sel.id)} className="flex-1 py-1.5 rounded-lg text-[8px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition">Delete</button>
              </div>
            </>
          ) : (
            <div className="text-center pt-8 space-y-2">
              <p className="text-2xl">👆</p>
              <p className="text-[9px] text-gray-600">Click an element to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#111115] border-t border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 text-[9px] text-gray-600">
          <span>{platform.name} · {platform.size}</span>
          <span>{elements.length} elements</span>
          {selectedId && <span className="text-violet-400">1 selected — Del · Arrows · Ctrl+D</span>}
        </div>
        <span className="text-[9px] text-gray-700">Double-click text to edit · Drag to move · ⌘Z undo</span>
      </div>
    </div>
  );
}