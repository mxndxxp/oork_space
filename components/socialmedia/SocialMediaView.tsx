"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────
type ElementType = "text" | "emoji" | "shape" | "image";
type ShapeType = "rectangle" | "circle" | "triangle" | "star" | "arrow" | "line" | "hexagon" | "diamond";
type TextAlign = "left" | "center" | "right";
type AnimType = "none" | "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce" | "pulse" | "shake";
type Tone = "casual" | "formal" | "viral" | "professional" | "funny";
type Panel = "text" | "elements" | "stickers" | "bg" | "ai" | "brand" | "layers" | "animate" | "schedule" | "assets";

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
  animation?: AnimType; animDuration?: number; animDelay?: number;
  blendMode?: string;
  dropShadow?: boolean; shadowColor?: string; shadowBlur?: number;
}
interface Background { type: "color"|"gradient"|"image"|"pattern"; value: string; opacity: number; }
interface BrandKit { name: string; colors: string[]; primaryFont: string; secondaryFont: string; logoUrl: string|null; }
interface SchedulePost { id: string; platformId: number; date: string; time: string; caption: string; hashtags: string; status: "draft"|"scheduled"; }
interface AssetItem { id: string; name: string; url: string; }
interface CollabComment { id: string; author: string; text: string; ts: string; }

// ── Constants ──────────────────────────────────────────────────────────
const PLATFORMS = [
  { id:1,  name:"Instagram Post",    size:"1080×1080", w:380, h:380, bg:"from-purple-500 to-pink-500",   icon:"📸", platform:"instagram" },
  { id:2,  name:"Instagram Story",   size:"1080×1920", w:214, h:380, bg:"from-pink-500 to-orange-400",   icon:"📱", platform:"instagram" },
  { id:3,  name:"Facebook Post",     size:"1200×630",  w:380, h:200, bg:"from-blue-600 to-blue-400",     icon:"👍", platform:"facebook"  },
  { id:4,  name:"Twitter/X Post",    size:"1600×900",  w:380, h:214, bg:"from-sky-500 to-cyan-400",      icon:"🐦", platform:"twitter"   },
  { id:5,  name:"LinkedIn Post",     size:"1200×627",  w:380, h:199, bg:"from-blue-700 to-blue-500",     icon:"💼", platform:"linkedin"  },
  { id:6,  name:"YouTube Thumbnail", size:"1280×720",  w:380, h:214, bg:"from-red-600 to-red-400",       icon:"▶️", platform:"youtube"   },
  { id:7,  name:"Pinterest Pin",     size:"1000×1500", w:253, h:380, bg:"from-red-500 to-rose-400",      icon:"📌", platform:"pinterest" },
  { id:8,  name:"TikTok Cover",      size:"1080×1920", w:214, h:380, bg:"from-gray-900 to-gray-700",     icon:"🎵", platform:"tiktok"    },
  { id:9,  name:"WhatsApp Status",   size:"1080×1920", w:214, h:380, bg:"from-green-500 to-emerald-400", icon:"💬", platform:"whatsapp"  },
  { id:10, name:"Snapchat Story",    size:"1080×1920", w:214, h:380, bg:"from-yellow-400 to-yellow-300", icon:"👻", platform:"snapchat"  },
];
const FONTS = ["Arial","Georgia","Impact","Courier New","Trebuchet MS","Verdana","Palatino","Garamond","Helvetica","Comic Sans MS","Times New Roman"];
const FONT_PAIRS = [
  { heading:"Impact",    body:"Arial",        label:"Bold & Clean" },
  { heading:"Georgia",   body:"Trebuchet MS", label:"Classic & Refined" },
  { heading:"Palatino",  body:"Garamond",     label:"Elegant Serif" },
  { heading:"Helvetica", body:"Courier New",  label:"Modern & Mono" },
];
const FSIZES = [8,10,12,14,16,18,20,24,28,32,36,40,48,56,64,72,96,120];
const COLORS = ["#ffffff","#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#f8fafc","#1e293b","#fbbf24","#34d399","#a78bfa","#fb7185","#818cf8","#2dd4bf","#f472b6","#facc15"];
const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)","linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)","linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)","linear-gradient(135deg,#a1c4fd,#c2e9fb)",
  "linear-gradient(135deg,#d4fc79,#96e6a1)","linear-gradient(135deg,#30cfd0,#330867)",
  "linear-gradient(135deg,#f77062,#fe5196)","linear-gradient(135deg,#fc466b,#3f5efb)",
  "linear-gradient(135deg,#11998e,#38ef7d)","linear-gradient(135deg,#c94b4b,#4b134f)",
  "linear-gradient(135deg,#f7971e,#ffd200)","linear-gradient(135deg,#0f2027,#2c5364)",
];
const STICKERS = ["🔥","✨","💯","🎉","❤️","🚀","⭐","💪","🌟","🎯","😍","🙌","💎","👑","🌈","🦋","🌸","🎨","🎭","🏆","⚡","🌊","🎸","🦄","🍀","💫","🔮","🎀","🎗️","🤩","💥","🌙","🎋","🍭","🦚","🌺","🎪","🦊","🐉","🌴"];
const PATTERNS = [
  "repeating-linear-gradient(45deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 1px,transparent 0,transparent 50%) center/20px 20px",
  "repeating-linear-gradient(0deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 20px),repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 20px)",
  "radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px) center/22px 22px",
  "repeating-linear-gradient(-45deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 2px,transparent 0,transparent 8px)",
  "radial-gradient(ellipse at 20% 50%,rgba(120,119,198,0.3) 0,transparent 55%),radial-gradient(ellipse at 80% 50%,rgba(255,119,198,0.3) 0,transparent 55%)",
];
const ANIM_TYPES: { id: AnimType; label: string; icon: string }[] = [
  { id:"none",      label:"None",       icon:"○" },
  { id:"fadeIn",    label:"Fade In",    icon:"◐" },
  { id:"slideUp",   label:"Slide Up",   icon:"↑" },
  { id:"slideLeft", label:"Slide Left", icon:"←" },
  { id:"zoomIn",    label:"Zoom In",    icon:"⊕" },
  { id:"bounce",    label:"Bounce",     icon:"↕" },
  { id:"pulse",     label:"Pulse",      icon:"◉" },
  { id:"shake",     label:"Shake",      icon:"≋" },
];
const BLEND_MODES = ["normal","multiply","screen","overlay","darken","lighten","color-dodge","soft-light","difference"];
const ANIM_CSS_MAP: Record<AnimType, string> = {
  none:      "",
  fadeIn:    "smFadeIn var(--dur,0.6s) ease forwards",
  slideUp:   "smSlideUp var(--dur,0.5s) ease forwards",
  slideLeft: "smSlideLeft var(--dur,0.5s) ease forwards",
  zoomIn:    "smZoomIn var(--dur,0.4s) ease forwards",
  bounce:    "smBounce var(--dur,1s) ease infinite",
  pulse:     "smPulse var(--dur,2s) ease infinite",
  shake:     "smShake var(--dur,0.5s) ease",
};
const TONES: Tone[] = ["casual","formal","viral","professional","funny"];
const MOCK_ANALYTICS = [
  { platform:"Instagram", reach:12400, likes:843, shares:127, comments:64, bestTime:"6PM–8PM" },
  { platform:"Twitter",   reach:8200,  likes:421, shares:312, comments:89, bestTime:"12PM–2PM" },
  { platform:"LinkedIn",  reach:5600,  likes:218, shares:94,  comments:41, bestTime:"8AM–10AM" },
  { platform:"Facebook",  reach:9100,  likes:612, shares:203, comments:77, bestTime:"3PM–5PM" },
];

let _z = 10;
const nextZ = () => ++_z;
function makeEl(type: ElementType, p: Partial<CanvasElement> = {}): CanvasElement {
  return { id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, type, content:"", x:60, y:60, width:200, height:60, rotation:0, opacity:100, zIndex:nextZ(), ...p };
}

// ── Component ──────────────────────────────────────────────────────────
export default function SocialMediaView({ databaseId }: { databaseId: string }) {

  // ── Core state ────────────────────────────────────────────────────────
  const [platform, setPlatform]   = useState(PLATFORMS[0]);
  const [elements, setElements]   = useState<CanvasElement[]>([
    makeEl("text",{ content:"Your Headline", x:40, y:80, width:300, height:70, fontSize:36, fontFamily:"Impact", color:"#ffffff", bold:true, textAlign:"center", textShadow:true, zIndex:1 }),
    makeEl("text",{ content:"Add your subtitle here", x:55, y:160, width:270, height:44, fontSize:16, fontFamily:"Arial", color:"rgba(255,255,255,0.85)", textAlign:"center", zIndex:2 }),
  ]);
  const [bg, setBg]               = useState<Background>({ type:"gradient", value:GRADIENTS[0], opacity:100 });
  const [bgSolidColor, setBgSolidColor] = useState("#6366f1");
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [editingId, setEditingId]   = useState<string|null>(null);
  const [activePanel, setActivePanel] = useState<Panel>("text");
  const [zoom, setZoom]             = useState(100);
  const [undoStack, setUndoStack]   = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack]   = useState<CanvasElement[][]>([]);
  const [showExport, setShowExport] = useState(false);
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [previewAnim, setPreviewAnim] = useState(false);

  // ── Snap guides ───────────────────────────────────────────────────────
  const [snapX, setSnapX] = useState<number|null>(null);
  const [snapY, setSnapY] = useState<number|null>(null);

  // ── Save state ────────────────────────────────────────────────────────
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [savedAt, setSavedAt]       = useState<string|null>(null);

  // ── AI state ──────────────────────────────────────────────────────────
  const [aiTopic, setAiTopic]       = useState("");
  const [aiTone, setAiTone]         = useState<Tone>("casual");
  const [aiCaption, setAiCaption]   = useState("");
  const [aiHashtags, setAiHashtags] = useState("");
  const [aiIdeas, setAiIdeas]       = useState<string[]>([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiImgPrompt, setAiImgPrompt] = useState("");
  const [aiImgLoading, setAiImgLoading] = useState(false);

  // ── Brand Kit ─────────────────────────────────────────────────────────
  const [brandKit, setBrandKit] = useState<BrandKit>({
    name:"My Brand", colors:["#6366f1","#ec4899","#ffffff","#000000"],
    primaryFont:"Impact", secondaryFont:"Arial", logoUrl:null,
  });
  const [showBrandSaved, setShowBrandSaved] = useState(false);

  // ── Schedule ──────────────────────────────────────────────────────────
  const [scheduleList, setScheduleList] = useState<SchedulePost[]>([]);
  const [schedForm, setSchedForm] = useState<Omit<SchedulePost,"id"|"status">>({
    platformId:1, date:"", time:"", caption:"", hashtags:"",
  });

  // ── Assets ────────────────────────────────────────────────────────────
  const [assets, setAssets] = useState<AssetItem[]>([]);

  // ── Collaboration ─────────────────────────────────────────────────────
  const [showCollab, setShowCollab] = useState(false);
  const [collabComments, setCollabComments] = useState<CollabComment[]>([
    { id:"1", author:"Alice", text:"Looking great! Can we try a bolder font?", ts:"2m ago" },
    { id:"2", author:"Bob",   text:"Approved ✅ — publish by Friday", ts:"5m ago" },
  ]);
  const [newCollabMsg, setNewCollabMsg] = useState("");

  // ── Magic Resize ──────────────────────────────────────────────────────
  const [showMagicResize, setShowMagicResize] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────
  const dragging   = useRef<{id:string;ox:number;oy:number;ex:number;ey:number}|null>(null);
  const resizing   = useRef<{id:string;ox:number;oy:number;ew:number;eh:number}|null>(null);
  const canvasRef  = useRef<HTMLDivElement>(null);
  const exportRef  = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const sel    = elements.find(e => e.id === selectedId);
  const sorted = [...elements].sort((a,b) => a.zIndex - b.zIndex);

  // ── Inject animation keyframes ────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes smFadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes smSlideUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes smSlideLeft{ from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
      @keyframes smZoomIn   { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
      @keyframes smBounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      @keyframes smPulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
      @keyframes smShake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/databases/${databaseId}/socialmedia`);
        const json = await res.json();
        if (json.data) {
          const { platform:p, bg:b, bgSolidColor:bc, elements:els, brandKit:bk, scheduleList:sl } = json.data;
          if (p)   setPlatform(PLATFORMS.find(pl => pl.id===p.id) || PLATFORMS[0]);
          if (b)   setBg(b);
          if (bc)  setBgSolidColor(bc);
          if (els?.length) setElements(els);
          if (bk)  setBrandKit(bk);
          if (sl)  setScheduleList(sl);
        }
      } catch (e) { console.error("Load failed:", e); }
      finally { setLoadedOnce(true); }
    };
    load();
  }, [databaseId]);

  // ── Auto-save ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedOnce) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/databases/${databaseId}/socialmedia`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ data:{ platform, bg, bgSolidColor, elements, brandKit, scheduleList } }),
        });
        setSavedAt(new Date().toLocaleTimeString());
      } catch {}
      finally { setSaving(false); }
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [elements, bg, bgSolidColor, platform, brandKit, scheduleList, loadedOnce, databaseId]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag==="TEXTAREA"||tag==="INPUT") return;
      const ctrl = e.ctrlKey||e.metaKey;
      if (ctrl&&e.key==="z") { e.preventDefault(); undo(); }
      if (ctrl&&e.key==="y") { e.preventDefault(); redo(); }
      if (ctrl&&e.key==="d") { e.preventDefault(); duplicate(); }
      if ((e.key==="Delete"||e.key==="Backspace")&&selectedId) { e.preventDefault(); deleteEl(selectedId); }
      if (e.key==="Escape") setSelectedId(null);
      if (selectedId&&sel) {
        const step = e.shiftKey?10:1;
        if (e.key==="ArrowUp")    { e.preventDefault(); updateEl(selectedId,{y:sel.y-step}); }
        if (e.key==="ArrowDown")  { e.preventDefault(); updateEl(selectedId,{y:sel.y+step}); }
        if (e.key==="ArrowLeft")  { e.preventDefault(); updateEl(selectedId,{x:sel.x-step}); }
        if (e.key==="ArrowRight") { e.preventDefault(); updateEl(selectedId,{x:sel.x+step}); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedId, sel, elements, undoStack, redoStack]);

  // ── Outside click: export & platform dropdown ─────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Undo / Redo ───────────────────────────────────────────────────────
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

  // ── Element CRUD ──────────────────────────────────────────────────────
  const updateEl = (id: string, updates: Partial<CanvasElement>) =>
    setElements(prev => prev.map(e => e.id===id ? {...e,...updates} : e));

  const updateElCommit = (id: string, updates: Partial<CanvasElement>) =>
    setElements(prev => { commit(prev); return prev.map(e => e.id===id ? {...e,...updates} : e); });

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

  // ── Drag & Resize ─────────────────────────────────────────────────────
  const SNAP_THRESHOLD = 6;
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
      let nx = ex+(e.clientX-ox)/scale;
      let ny = ey+(e.clientY-oy)/scale;
      const el = elements.find(el => el.id===id);
      const cx = platform.w/2;
      const cy = platform.h/2;
      // Snap to center X
      if (el && Math.abs((nx+el.width/2)-cx)<SNAP_THRESHOLD) { nx=cx-el.width/2; setSnapX(cx); } else setSnapX(null);
      // Snap to center Y
      if (el && Math.abs((ny+el.height/2)-cy)<SNAP_THRESHOLD) { ny=cy-el.height/2; setSnapY(cy); } else setSnapY(null);
      updateEl(id, {x:nx, y:ny});
    }
    if (resizing.current) {
      const {id,ox,oy,ew,eh} = resizing.current;
      updateEl(id, {width:Math.max(30,ew+(e.clientX-ox)/scale), height:Math.max(20,eh+(e.clientY-oy)/scale)});
    }
  }, [zoom, elements, platform]);

  const onMouseUp = () => {
    if (dragging.current||resizing.current) {
      commit(elements);
      dragging.current=null; resizing.current=null;
      setSnapX(null); setSnapY(null);
    }
  };

  // ── Add helpers ───────────────────────────────────────────────────────
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

  // ── Magic Resize ──────────────────────────────────────────────────────
  const magicResize = (targetPlatform: typeof PLATFORMS[0]) => {
    const scaleX = targetPlatform.w / platform.w;
    const scaleY = targetPlatform.h / platform.h;
    const scale  = Math.min(scaleX, scaleY);
    commit(elements);
    setElements(prev => prev.map(el => ({
      ...el,
      x:       Math.round(el.x * scaleX),
      y:       Math.round(el.y * scaleY),
      width:   Math.round(el.width * scale),
      height:  Math.round(el.height * scale),
      fontSize: el.fontSize ? Math.max(8, Math.round(el.fontSize * scale)) : el.fontSize,
    })));
    setPlatform(targetPlatform);
    setShowMagicResize(false);
  };

  // ── Brand Kit: apply ──────────────────────────────────────────────────
  const applyBrand = () => {
    commit(elements);
    setElements(prev => prev.map((el, i) =>
      el.type==="text" ? {
        ...el,
        fontFamily: i===0 ? brandKit.primaryFont : brandKit.secondaryFont,
        color: brandKit.colors[i % brandKit.colors.length] || el.color,
      } : el
    ));
    setShowBrandSaved(true);
    setTimeout(() => setShowBrandSaved(false), 2000);
  };

  // ── AI: generate content ──────────────────────────────────────────────
  const callAI = async (prompt: string): Promise<string> => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role:"user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.map((c: any) => c.type==="text" ? c.text : "").join("") || "";
  };

  const generateCaption = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const text = await callAI(
        `Write a single social media caption for ${platform.name} about: "${aiTopic}". Tone: ${aiTone}. Make it engaging and natural. Return ONLY the caption text, no quotes or preamble. Max 150 characters.`
      );
      setAiCaption(text.trim());
    } catch { setAiCaption("Failed to generate. Check your connection."); }
    finally { setAiLoading(false); }
  };

  const generateHashtags = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const text = await callAI(
        `Generate 10 relevant hashtags for a social media post about: "${aiTopic}" on ${platform.platform}. Return ONLY the hashtags separated by spaces, starting each with #. No other text.`
      );
      setAiHashtags(text.trim());
    } catch { setAiHashtags("#error generating hashtags"); }
    finally { setAiLoading(false); }
  };

  const generateIdeas = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const text = await callAI(
        `Give me 5 short post ideas for ${platform.name} in the niche: "${aiTopic}". Tone: ${aiTone}. Return ONLY a JSON array of 5 strings like ["idea1","idea2",...]. No markdown, no preamble.`
      );
      try {
        const clean = text.replace(/```json|```/g,"").trim();
        setAiIdeas(JSON.parse(clean));
      } catch { setAiIdeas(text.split("\n").filter(l=>l.trim()).slice(0,5)); }
    } catch { setAiIdeas(["Failed to generate ideas."]); }
    finally { setAiLoading(false); }
  };

  const generateAiImage = async () => {
    if (!aiImgPrompt.trim()) return;
    setAiImgLoading(true);
    // Simulate AI image generation (actual image gen API not available here)
    await new Promise(r => setTimeout(r, 1500));
    alert(`AI Image Generation: In production, connect to DALL-E 3 or Stable Diffusion API with prompt: "${aiImgPrompt}"`);
    setAiImgLoading(false);
  };

  // ── Asset library ─────────────────────────────────────────────────────
  const handleAssetUpload = (files: FileList|null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setAssets(prev => [...prev, { id: Date.now().toString()+Math.random(), name:file.name, url }]);
    });
  };

  // ── Schedule post ─────────────────────────────────────────────────────
  const addSchedulePost = () => {
    if (!schedForm.date||!schedForm.time) return;
    setScheduleList(prev => [...prev, { ...schedForm, id:Date.now().toString(), status:"scheduled" }]);
    setSchedForm({ platformId:1, date:"", time:"", caption:"", hashtags:"" });
  };

  // ── Export ────────────────────────────────────────────────────────────
  const exportPNG = async () => {
    setShowExport(false);
    try {
      const mod = await (import("html2canvas") as any).catch(()=>null);
      if (mod?.default && canvasRef.current) {
        const c = await mod.default(canvasRef.current,{useCORS:true,scale:3});
        const a = document.createElement("a");
        a.href=c.toDataURL("image/png");
        a.download=`${platform.platform}-${Date.now()}.png`; a.click();
      } else alert("Run: npm install html2canvas");
    } catch { alert("Export requires html2canvas package."); }
  };
  const exportJSON = () => {
    setShowExport(false);
    const blob = new Blob([JSON.stringify({platform,bg,bgSolidColor,elements},null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`design-${Date.now()}.json`; a.click();
  };

  // ── Shape SVG ─────────────────────────────────────────────────────────
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
        {el.shapeType==="hexagon"  &&<polygon points={`${w*0.25},${sw} ${w*0.75},${sw} ${w-sw},${h/2} ${w*0.75},${h-sw} ${w*0.25},${h-sw} ${sw},${h/2}`} fill={fill} stroke={stroke} strokeWidth={sw}/>}
        {el.shapeType==="diamond"  &&<polygon points={`${w/2},${sw} ${w-sw},${h/2} ${w/2},${h-sw} ${sw},${h/2}`} fill={fill} stroke={stroke} strokeWidth={sw}/>}
      </svg>
    );
  };

  const bgCss = (): React.CSSProperties => {
    if (bg.type==="color")    return {backgroundColor:bg.value};
    if (bg.type==="gradient") return {background:bg.value};
    if (bg.type==="image")    return {backgroundImage:`url(${bg.value})`,backgroundSize:"cover",backgroundPosition:"center"};
     if (bg.type==="pattern")  return {background:bgSolidColor + ' ' + bg.value};
    return {};
  };

  // ── Panel tab button ──────────────────────────────────────────────────
  const PBtn = ({ id, label, icon }: { id: Panel; label: string; icon: string }) => (
    <button onClick={()=>setActivePanel(id)} title={label}
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[8px] font-bold transition-all ${activePanel===id?"bg-violet-600 text-white shadow-lg shadow-violet-500/20":"text-gray-400 hover:bg-white/8 hover:text-gray-200"}`}>
      <span className="text-[13px] leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );

  // ── Section label ─────────────────────────────────────────────────────
  const SL = ({ label }: { label: string }) => (
    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.12em] px-0.5 mb-1">{label}</p>
  );

  // ── Tiny toggle ───────────────────────────────────────────────────────
  const Toggle = ({ on, label, onClick }: { on: boolean; label: string; onClick: ()=>void }) => (
    <label className="flex items-center justify-between cursor-pointer" onClick={onClick}>
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${on?"bg-violet-500":"bg-white/10"}`}>
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${on?"left-4":"left-0.5"}`}/>
      </div>
    </label>
  );

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-[#080810] text-white overflow-hidden rounded-xl">

      {/* ── Inject animation styles for preview ── */}
      {previewAnim && sel?.animation && sel.animation!=="none" && (
        <style>{`[data-el-id="${sel.id}"] { animation: ${ANIM_CSS_MAP[sel.animation]} !important; --dur:${sel.animDuration||0.6}s; }`}</style>
      )}

      {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f0f18] border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2">
          {/* Platform dropdown */}
          <div className="relative">
            <button onClick={()=>setShowPlatformDrop(!showPlatformDrop)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition text-[11px] font-semibold border border-white/8">
              <span>{platform.icon}</span>
              <span className="hidden sm:block max-w-[100px] truncate">{platform.name}</span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showPlatformDrop && (
              <div className="absolute left-0 top-full mt-1 z-[200] bg-[#15151f] border border-white/10 rounded-xl shadow-2xl p-1.5 w-56 max-h-72 overflow-y-auto">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={()=>{setPlatform(p);setShowPlatformDrop(false);}}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition text-[11px] ${platform.id===p.id?"bg-violet-600/20 text-white":"text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                    <span>{p.icon}</span>
                    <div><p className="font-semibold text-[10px]">{p.name}</p><p className="text-[9px] text-gray-600">{p.size}</p></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Magic Resize */}
          <button onClick={()=>setShowMagicResize(true)} title="Magic Resize"
            className="flex items-center gap-1 px-2 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-violet-400 text-[10px] font-bold rounded-lg transition">
            ✦ Resize
          </button>

          {/* Collab */}
          <button onClick={()=>setShowCollab(!showCollab)} title="Collaboration"
            className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg transition border ${showCollab?"bg-teal-500/20 border-teal-500/30 text-teal-400":"bg-white/5 border-white/8 text-gray-400 hover:text-white hover:bg-white/8"}`}>
            🤝 {collabComments.length}
          </button>

          {saving  && <span className="text-[9px] text-amber-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>Saving…</span>}
          {!saving&&savedAt&&<span className="text-[9px] text-emerald-400 flex items-center gap-1"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>{savedAt}</span>}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!undoStack.length} title="Undo"
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-white/8 disabled:opacity-25 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          </button>
          <button onClick={redo} disabled={!redoStack.length} title="Redo"
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-white/8 disabled:opacity-25 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
          </button>
          <div className="w-px h-4 bg-white/8 mx-0.5"/>
          <button onClick={()=>setZoom(z=>Math.max(25,z-10))} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-white/8 font-bold text-sm">−</button>
          <span className="text-[9px] text-gray-500 w-9 text-center font-mono">{zoom}%</span>
          <button onClick={()=>setZoom(z=>Math.min(200,z+10))} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-white/8 font-bold text-sm">+</button>
          <div className="w-px h-4 bg-white/8 mx-0.5"/>
          <div className="relative" ref={exportRef}>
            <button onClick={()=>setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg transition shadow-lg shadow-violet-500/20">
              ↓ Export
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-[100] bg-[#15151f] border border-white/10 rounded-xl shadow-2xl p-1 w-44">
                <button onClick={exportPNG}  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-gray-300 hover:bg-white/8 hover:text-white transition text-left">🖼️ PNG (3× resolution)</button>
                <button onClick={exportJSON} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-gray-300 hover:bg-white/8 hover:text-white transition text-left">📦 JSON design file</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
        <div className="w-[220px] bg-[#0f0f18] border-r border-white/[0.05] flex flex-col shrink-0 min-h-0">
          {/* Tab grid */}
          <div className="grid grid-cols-5 gap-0.5 p-1.5 border-b border-white/[0.05] shrink-0">
            <PBtn id="text"     label="Text"    icon="T"/>
            <PBtn id="elements" label="Items"   icon="◻"/>
            <PBtn id="stickers" label="Emoji"   icon="😀"/>
            <PBtn id="bg"       label="BG"      icon="🖼"/>
            <PBtn id="ai"       label="AI"      icon="✦"/>
            <PBtn id="brand"    label="Brand"   icon="🏷"/>
            <PBtn id="layers"   label="Layers"  icon="≡"/>
            <PBtn id="animate"  label="Animate" icon="🎬"/>
            <PBtn id="schedule" label="Sched"   icon="📅"/>
            <PBtn id="assets"   label="Assets"  icon="☁️"/>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 min-h-0">

            {/* ── TEXT PANEL ─────────────────────────────────────────── */}
            {activePanel==="text" && (
              <div className="space-y-2.5">
                <button onClick={()=>addText()}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-lg shadow-violet-500/20">
                  + Add Text
                </button>
                {/* Presets */}
                <div className="space-y-1">
                  {[{label:"Big Headline",fs:42,bold:true,content:"Big Headline"},{label:"Subheading",fs:26,bold:true,content:"Subheading"},{label:"Body Text",fs:16,bold:false,content:"Body text"},{label:"Caption",fs:11,bold:false,content:"Caption text"}].map(t=>(
                    <button key={t.label} onClick={()=>addText({content:t.content,fontSize:t.fs,bold:t.bold})}
                      className="w-full px-3 py-2 rounded-lg bg-white/4 hover:bg-white/8 text-left transition border border-white/4 hover:border-violet-500/20">
                      <span style={{fontSize:Math.min(t.fs*0.45,15),fontWeight:t.bold?"bold":"normal"}} className="text-gray-200">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Font pair suggestions */}
                <SL label="Font Pairs"/>
                <div className="space-y-1">
                  {FONT_PAIRS.map((fp,i) => (
                    <button key={i} onClick={()=>{
                      if (sel?.type==="text") updateElCommit(sel.id,{fontFamily:fp.heading});
                      else addText({fontFamily:fp.heading});
                    }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/4 hover:bg-white/8 text-left transition border border-white/4 hover:border-violet-500/20">
                      <p style={{fontFamily:fp.heading}} className="text-[11px] text-white font-bold">{fp.heading}</p>
                      <p style={{fontFamily:fp.body}} className="text-[9px] text-gray-500">{fp.body} · {fp.label}</p>
                    </button>
                  ))}
                </div>

                {/* Selected text element controls */}
                {sel?.type==="text" && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                    <SL label="Format Selected"/>
                    <select value={sel.fontFamily||"Arial"} onChange={e=>updateElCommit(sel.id,{fontFamily:e.target.value})}
                      className="w-full h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none focus:border-violet-500">
                      {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <select value={sel.fontSize||24} onChange={e=>updateElCommit(sel.id,{fontSize:Number(e.target.value)})}
                        className="flex-1 h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none focus:border-violet-500">
                        {FSIZES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={sel.textAlign||"left"} onChange={e=>updateElCommit(sel.id,{textAlign:e.target.value as TextAlign})}
                        className="w-20 h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none">
                        <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                      </select>
                    </div>
                    <div className="flex gap-1">
                      {([["B","bold","font-bold"],["I","italic","italic"],["U","underline","underline"]] as const).map(([l,k,cl])=>(
                        <button key={k} onClick={()=>updateElCommit(sel.id,{[k]:!(sel as any)[k]})}
                          className={`flex-1 h-6 rounded-md text-xs transition ${(sel as any)[k]?"bg-violet-600 text-white":"bg-white/8 text-gray-400 hover:text-white"}`}>
                          <span className={cl}>{l}</span>
                        </button>
                      ))}
                    </div>
                    <SL label="Color"/>
                    <div className="grid grid-cols-10 gap-0.5">
                      {COLORS.map(c=>(
                        <button key={c} onClick={()=>updateElCommit(sel.id,{color:c})}
                          className={`w-4.5 h-4.5 rounded border-2 transition hover:scale-110 ${sel.color===c?"border-white":"border-transparent"}`}
                          style={{backgroundColor:c,width:18,height:18,boxShadow:c==="#ffffff"?"inset 0 0 0 1px rgba(0,0,0,0.4)":undefined}}/>
                      ))}
                    </div>
                    <input type="color" value={sel.color||"#ffffff"} onChange={e=>updateEl(sel.id,{color:e.target.value})} onBlur={()=>commit(elements)}
                      className="w-full h-6 rounded-lg border border-white/8 cursor-pointer bg-transparent"/>
                    {/* Letter spacing / line height */}
                    {[{label:"Spacing",key:"letterSpacing",min:-2,max:20,step:0.5,def:0,unit:"px"},{label:"Line H",key:"lineHeight",min:0.8,max:3,step:0.1,def:1.4,unit:""}].map(({label,key,min,max,step,def,unit})=>(
                      <div key={key} className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-500 w-12 shrink-0">{label}</span>
                        <input type="range" min={min} max={max} step={step} value={(sel as any)[key]??def}
                          onChange={e=>updateEl(sel.id,{[key]:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                          className="flex-1 h-1 accent-violet-500"/>
                        <span className="text-[9px] text-gray-400 w-8 text-right">{((sel as any)[key]??def)}{unit}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-1">
                      <Toggle on={!!sel.textShadow} label="Shadow" onClick={()=>updateElCommit(sel.id,{textShadow:!sel.textShadow})}/>
                      <Toggle on={!!sel.textStroke} label="Outline" onClick={()=>updateElCommit(sel.id,{textStroke:!sel.textStroke})}/>
                    </div>
                    {sel.textStroke && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500">Outline Color</span>
                        <input type="color" value={sel.textStrokeColor||"#000000"} onChange={e=>updateElCommit(sel.id,{textStrokeColor:e.target.value})}
                          className="flex-1 h-6 rounded border border-white/8 cursor-pointer bg-transparent"/>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── ELEMENTS PANEL ─────────────────────────────────────── */}
            {activePanel==="elements" && (
              <div className="space-y-2.5">
                <SL label="Shapes"/>
                <div className="grid grid-cols-4 gap-1">
                  {([["rectangle","◻"],["circle","○"],["triangle","△"],["star","★"],["line","—"],["arrow","→"],["hexagon","⬡"],["diamond","◇"]] as const).map(([s,icon])=>(
                    <button key={s} onClick={()=>addShape(s as ShapeType)}
                      className="aspect-square flex items-center justify-center text-xl bg-white/4 hover:bg-white/8 rounded-xl border border-white/4 hover:border-violet-500/30 transition hover:scale-105">
                      {icon}
                    </button>
                  ))}
                </div>

                <SL label="Upload Image"/>
                <label className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-white/4 hover:bg-white/8 border-2 border-dashed border-white/10 hover:border-violet-500/50 text-xs text-gray-400 hover:text-white transition cursor-pointer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span className="text-[10px]">Click or drop image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)addImageFile(f);e.target.value="";}}/>
                </label>

                {/* Shape editor */}
                {sel?.type==="shape" && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                    <SL label="Shape Fill"/>
                    <div className="grid grid-cols-10 gap-0.5">
                      {COLORS.map(c=>(
                        <button key={c} onClick={()=>updateElCommit(sel.id,{fill:c})}
                          className={`rounded border-2 transition hover:scale-110 ${sel.fill===c?"border-white":"border-transparent"}`}
                          style={{backgroundColor:c,width:18,height:18}}/>
                      ))}
                    </div>
                    <input type="color" value={sel.fill||"#3b82f6"} onChange={e=>updateEl(sel.id,{fill:e.target.value})} onBlur={()=>commit(elements)}
                      className="w-full h-6 rounded border border-white/8 cursor-pointer bg-transparent"/>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 w-10">Stroke</span>
                      <input type="number" min={0} max={20} value={sel.strokeWidth||0} onChange={e=>updateElCommit(sel.id,{strokeWidth:Number(e.target.value)})}
                        className="w-12 h-6 text-[9px] bg-[#1a1a26] border border-white/8 text-white rounded px-1 focus:outline-none"/>
                      <input type="color" value={sel.stroke||"#ffffff"} onChange={e=>updateElCommit(sel.id,{stroke:e.target.value})}
                        className="flex-1 h-6 rounded border border-white/8 cursor-pointer bg-transparent"/>
                    </div>
                  </div>
                )}
                {sel?.type==="image" && (
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                    <SL label="Image"/>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 w-12">Radius</span>
                      <input type="range" min={0} max={200} value={sel.borderRadius||0}
                        onChange={e=>updateEl(sel.id,{borderRadius:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                        className="flex-1 h-1 accent-violet-500"/>
                      <span className="text-[9px] text-gray-400 w-6">{sel.borderRadius||0}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STICKERS PANEL ─────────────────────────────────────── */}
            {activePanel==="stickers" && (
              <div>
                <SL label="Click to add"/>
                <div className="grid grid-cols-5 gap-1">
                  {STICKERS.map(s=>(
                    <button key={s} onClick={()=>addSticker(s)}
                      className="h-10 flex items-center justify-center text-xl bg-white/4 hover:bg-white/8 rounded-xl transition hover:scale-125">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ── BG PANEL ───────────────────────────────────────────── */}
            {activePanel==="bg" && (
              <div className="space-y-2.5">
                <SL label="Solid Color"/>
                <div className="grid grid-cols-6 gap-1">
                  {["#6366f1","#ec4899","#ef4444","#f97316","#22c55e","#3b82f6","#8b5cf6","#0f172a","#1e293b","#ffffff","#000000","#fbbf24"].map(c=>(
                    <button key={c} onClick={()=>{setBgSolidColor(c);setBg({type:"color",value:c,opacity:100});}}
                      className={`h-8 rounded-lg border-2 transition hover:scale-105 ${bg.type==="color"&&bg.value===c?"border-white scale-105":"border-transparent"}`}
                      style={{backgroundColor:c,boxShadow:c==="#ffffff"?"inset 0 0 0 1px rgba(0,0,0,0.2)":undefined}}/>
                  ))}
                </div>
                <input type="color" value={bgSolidColor} onChange={e=>{setBgSolidColor(e.target.value);setBg({type:"color",value:e.target.value,opacity:100});}}
                  className="w-full h-7 rounded-lg border border-white/8 cursor-pointer bg-transparent"/>
                <SL label="Gradients"/>
                <div className="grid grid-cols-4 gap-1">
                  {GRADIENTS.map((g,i)=>(
                    <button key={i} onClick={()=>setBg({type:"gradient",value:g,opacity:100})}
                      className={`h-10 rounded-xl border-2 transition hover:scale-105 ${bg.type==="gradient"&&bg.value===g?"border-white":"border-transparent hover:border-white/30"}`}
                      style={{background:g}}/>
                  ))}
                </div>
                <SL label="Patterns"/>
                <div className="grid grid-cols-2 gap-1">
                  {PATTERNS.map((p,i)=>(
                    <button key={i} onClick={()=>setBg({type:"pattern",value:p,opacity:100})}
                      className={`h-10 rounded-xl border-2 transition ${bg.type==="pattern"&&bg.value===p?"border-violet-400":"border-white/8 hover:border-white/30"}`}
                      style={{background:p,backgroundColor:"#3b82f6"}}/>
                  ))}
                </div>
                <SL label="Upload BG"/>
                <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/4 hover:bg-white/8 border-dashed border-2 border-white/10 hover:border-violet-500/50 text-[10px] text-gray-400 hover:text-white transition cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)addBgFile(f);e.target.value="";}}/>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-16 shrink-0">Opacity</span>
                  <input type="range" min={10} max={100} value={bg.opacity} onChange={e=>setBg(b=>({...b,opacity:Number(e.target.value)}))}
                    className="flex-1 h-1 accent-violet-500"/>
                  <span className="text-[9px] text-gray-400 w-6">{bg.opacity}%</span>
                </div>
              </div>
            )}

            {/* ── AI PANEL ───────────────────────────────────────────── */}
            {activePanel==="ai" && (
              <div className="space-y-2.5">
                <div className="rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/20 p-2.5 space-y-2">
                  <p className="text-[10px] font-bold text-violet-300">✦ AI Content Generator</p>
                  <input value={aiTopic} onChange={e=>setAiTopic(e.target.value)} placeholder="Topic or niche…"
                    className="w-full text-[10px] bg-black/30 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500 placeholder:text-gray-600"/>
                  <SL label="Tone"/>
                  <div className="flex flex-wrap gap-1">
                    {TONES.map(t=>(
                      <button key={t} onClick={()=>setAiTone(t)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-semibold capitalize transition ${aiTone===t?"bg-violet-500 text-white":"bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={generateCaption} disabled={aiLoading||!aiTopic.trim()}
                      className="py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[9px] font-bold transition">
                      Caption
                    </button>
                    <button onClick={generateHashtags} disabled={aiLoading||!aiTopic.trim()}
                      className="py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-[9px] font-bold transition">
                      Hashtags
                    </button>
                    <button onClick={generateIdeas} disabled={aiLoading||!aiTopic.trim()}
                      className="py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-[9px] font-bold transition">
                      Ideas
                    </button>
                  </div>
                  {aiLoading && <div className="flex items-center gap-2 text-[9px] text-violet-400"><span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"/><span>Generating…</span></div>}
                </div>

                {aiCaption && (
                  <div className="rounded-xl bg-white/4 border border-white/8 p-2.5 space-y-1.5">
                    <p className="text-[9px] text-gray-500 font-bold">CAPTION</p>
                    <p className="text-[10px] text-gray-200 leading-relaxed">{aiCaption}</p>
                    <div className="flex gap-1">
                      <button onClick={()=>addText({content:aiCaption,fontSize:14,x:20,y:20,width:platform.w-40,height:80})}
                        className="flex-1 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-[9px] rounded-lg transition">Add to Canvas</button>
                      <button onClick={()=>navigator.clipboard.writeText(aiCaption)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] rounded-lg transition">Copy</button>
                    </div>
                  </div>
                )}
                {aiHashtags && (
                  <div className="rounded-xl bg-white/4 border border-white/8 p-2.5 space-y-1.5">
                    <p className="text-[9px] text-gray-500 font-bold">HASHTAGS</p>
                    <p className="text-[10px] text-violet-300 leading-relaxed break-words">{aiHashtags}</p>
                    <button onClick={()=>navigator.clipboard.writeText(aiHashtags)}
                      className="w-full py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] rounded-lg transition">Copy Hashtags</button>
                  </div>
                )}
                {aiIdeas.length>0 && (
                  <div className="rounded-xl bg-white/4 border border-white/8 p-2.5 space-y-1.5">
                    <p className="text-[9px] text-gray-500 font-bold">POST IDEAS</p>
                    {aiIdeas.map((idea,i)=>(
                      <button key={i} onClick={()=>addText({content:idea,fontSize:16,x:20,y:30+i*40,width:platform.w-40,height:40})}
                        className="w-full text-left text-[10px] text-gray-300 bg-white/3 hover:bg-violet-600/20 rounded-lg px-2 py-1.5 transition border border-transparent hover:border-violet-500/20">
                        {i+1}. {idea}
                      </button>
                    ))}
                  </div>
                )}

                {/* AI Image Generation */}
                <div className="rounded-xl bg-white/4 border border-white/8 p-2.5 space-y-2">
                  <p className="text-[10px] font-bold text-teal-300">🖼 AI Image Generator</p>
                  <input value={aiImgPrompt} onChange={e=>setAiImgPrompt(e.target.value)} placeholder="Describe the image…"
                    className="w-full text-[10px] bg-black/30 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500 placeholder:text-gray-600"/>
                  <button onClick={generateAiImage} disabled={aiImgLoading||!aiImgPrompt.trim()}
                    className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-[9px] font-bold transition">
                    {aiImgLoading ? "Generating…" : "Generate Image"}
                  </button>
                </div>

                {/* Analytics */}
                <div className="rounded-xl bg-white/4 border border-white/8 p-2.5 space-y-2">
                  <p className="text-[10px] font-bold text-amber-300">📊 Performance Insights</p>
                  {MOCK_ANALYTICS.map(a=>(
                    <div key={a.platform} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-300">{a.platform}</span>
                        <span className="text-[8px] text-amber-400">Best: {a.bestTime}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-0.5 text-center">
                        {[["Reach",a.reach.toLocaleString()],["Likes",a.likes],["Shares",a.shares],["Cmts",a.comments]].map(([l,v])=>(
                          <div key={l as string} className="bg-black/20 rounded p-1">
                            <p className="text-[10px] font-bold text-white">{v}</p>
                            <p className="text-[8px] text-gray-600">{l}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" style={{width:`${Math.min(100,a.reach/150)}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BRAND KIT PANEL ────────────────────────────────────── */}
            {activePanel==="brand" && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <input value={brandKit.name} onChange={e=>setBrandKit(b=>({...b,name:e.target.value}))}
                    className="flex-1 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500"
                    placeholder="Brand name"/>
                </div>

                <SL label="Brand Colors"/>
                <div className="flex flex-wrap gap-1">
                  {brandKit.colors.map((c,i)=>(
                    <div key={i} className="relative">
                      <div className="w-8 h-8 rounded-lg border-2 border-white/20 overflow-hidden">
                        <input type="color" value={c} onChange={e=>{const nc=[...brandKit.colors];nc[i]=e.target.value;setBrandKit(b=>({...b,colors:nc}));}}
                          className="w-full h-full cursor-pointer border-none p-0"/>
                      </div>
                    </div>
                  ))}
                  {brandKit.colors.length<8 && (
                    <button onClick={()=>setBrandKit(b=>({...b,colors:[...b.colors,"#6366f1"]}))}
                      className="w-8 h-8 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/40 transition text-lg">+</button>
                  )}
                </div>

                <SL label="Brand Fonts"/>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-14 shrink-0">Primary</span>
                    <select value={brandKit.primaryFont} onChange={e=>setBrandKit(b=>({...b,primaryFont:e.target.value}))}
                      className="flex-1 h-7 text-[9px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none">
                      {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-14 shrink-0">Secondary</span>
                    <select value={brandKit.secondaryFont} onChange={e=>setBrandKit(b=>({...b,secondaryFont:e.target.value}))}
                      className="flex-1 h-7 text-[9px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none">
                      {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <SL label="Brand Logo"/>
                {brandKit.logoUrl
                  ? <div className="relative"><img src={brandKit.logoUrl} className="w-full h-16 object-contain rounded-xl bg-white/5 border border-white/8"/>
                      <button onClick={()=>setBrandKit(b=>({...b,logoUrl:null}))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">✕</button>
                    </div>
                  : <label className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white/4 hover:bg-white/8 border-dashed border-2 border-white/10 text-[10px] text-gray-400 cursor-pointer transition">
                      Upload Logo<input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setBrandKit(b=>({...b,logoUrl:URL.createObjectURL(f)}));e.target.value="";}}/>
                    </label>
                }

                <button onClick={applyBrand}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold transition hover:opacity-90 shadow-lg">
                  ✦ Apply Brand to Canvas
                </button>
                {showBrandSaved && <p className="text-[10px] text-emerald-400 text-center">✓ Brand applied!</p>}

                {/* Logo on canvas */}
                {brandKit.logoUrl && (
                  <button onClick={()=>addEl(makeEl("image",{content:brandKit.logoUrl!,x:10,y:10,width:80,height:50,borderRadius:8}))}
                    className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] transition border border-white/8">
                    + Add Logo to Canvas
                  </button>
                )}
              </div>
            )}

            {/* ── LAYERS PANEL ───────────────────────────────────────── */}
            {activePanel==="layers" && (
              <div className="space-y-1">
                <SL label={`${elements.length} Elements`}/>
                {[...sorted].reverse().map(el=>(
                  <div key={el.id} onClick={()=>setSelectedId(el.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition group border ${selectedId===el.id?"bg-violet-600/20 border-violet-500/25 text-white":"border-transparent hover:bg-white/4 text-gray-400 hover:text-gray-200"}`}>
                    <span className="text-sm shrink-0 w-4 text-center leading-none">
                      {el.type==="text"?"T":el.type==="emoji"?el.content.slice(0,1):el.type==="shape"?"◻":"🖼"}
                    </span>
                    <span className="text-[9px] truncate flex-1">
                      {el.type==="text"?el.content.slice(0,16)||"(empty)":el.type==="emoji"?el.content:`${el.shapeType||el.type}`}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={e=>{e.stopPropagation();updateElCommit(el.id,{locked:!el.locked});}} className="text-[9px] text-gray-500 hover:text-white">{el.locked?"🔒":"🔓"}</button>
                      <button onClick={e=>{e.stopPropagation();updateElCommit(el.id,{opacity:el.opacity<=50?100:50});}} className="text-[9px] text-gray-500 hover:text-white">{el.opacity<=50?"◑":"●"}</button>
                      <button onClick={e=>{e.stopPropagation();deleteEl(el.id);}} className="text-[9px] text-red-400 hover:text-red-300">✕</button>
                    </div>
                  </div>
                ))}
                {!elements.length && <p className="text-[9px] text-gray-600 text-center py-6">No elements yet</p>}
                <button onClick={()=>setElements([])} className="w-full mt-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[9px] hover:bg-red-500/20 transition border border-red-500/10">Clear all</button>
              </div>
            )}

            {/* ── ANIMATE PANEL ──────────────────────────────────────── */}
            {activePanel==="animate" && (
              <div className="space-y-2.5">
                {sel ? (
                  <>
                    <SL label="Animation Type"/>
                    <div className="grid grid-cols-2 gap-1">
                      {ANIM_TYPES.map(at=>(
                        <button key={at.id} onClick={()=>updateElCommit(sel.id,{animation:at.id})}
                          className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-[9px] font-semibold transition border ${sel.animation===at.id?"bg-violet-600 border-violet-500 text-white":"bg-white/4 border-white/4 text-gray-400 hover:border-violet-500/30 hover:text-white"}`}>
                          <span className="text-base w-4">{at.icon}</span>
                          {at.label}
                        </button>
                      ))}
                    </div>
                    {sel.animation&&sel.animation!=="none" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500 w-14 shrink-0">Duration</span>
                          <input type="range" min={0.1} max={3} step={0.1} value={sel.animDuration||0.6}
                            onChange={e=>updateEl(sel.id,{animDuration:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                            className="flex-1 h-1 accent-violet-500"/>
                          <span className="text-[9px] text-gray-400 w-8">{(sel.animDuration||0.6).toFixed(1)}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500 w-14 shrink-0">Delay</span>
                          <input type="range" min={0} max={2} step={0.1} value={sel.animDelay||0}
                            onChange={e=>updateEl(sel.id,{animDelay:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                            className="flex-1 h-1 accent-violet-500"/>
                          <span className="text-[9px] text-gray-400 w-8">{(sel.animDelay||0).toFixed(1)}s</span>
                        </div>
                        <button
                          onClick={()=>{setPreviewAnim(false);setTimeout(()=>setPreviewAnim(true),50);setTimeout(()=>setPreviewAnim(false),(sel.animDuration||0.6)*1000+200);}}
                          className="w-full py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold transition">
                          ▶ Preview Animation
                        </button>
                      </div>
                    )}
                    <SL label="Blend Mode"/>
                    <select value={sel.blendMode||"normal"} onChange={e=>updateElCommit(sel.id,{blendMode:e.target.value})}
                      className="w-full h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none">
                      {BLEND_MODES.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                    <SL label="Drop Shadow"/>
                    <Toggle on={!!sel.dropShadow} label="Enable Shadow" onClick={()=>updateElCommit(sel.id,{dropShadow:!sel.dropShadow})}/>
                    {sel.dropShadow && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 w-14">Blur</span>
                        <input type="range" min={0} max={40} value={sel.shadowBlur||8} onChange={e=>updateEl(sel.id,{shadowBlur:Number(e.target.value)})} onMouseUp={()=>commit(elements)} className="flex-1 h-1 accent-violet-500"/>
                        <span className="text-[9px] text-gray-400 w-6">{sel.shadowBlur||8}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-gray-600 text-center py-6">Select an element to add animations</p>
                )}

                {/* Export animation hint */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 mt-2">
                  <p className="text-[9px] text-amber-300 font-bold">📹 Export as Video</p>
                  <p className="text-[9px] text-gray-500 mt-1">In production, integrate with canvas-recorder or FFMPEG to export animated posts as MP4/GIF.</p>
                </div>
              </div>
            )}

            {/* ── SCHEDULE PANEL ─────────────────────────────────────── */}
            {activePanel==="schedule" && (
              <div className="space-y-2.5">
                <SL label="New Scheduled Post"/>
                <div className="space-y-1.5 rounded-xl bg-white/3 border border-white/6 p-2.5">
                  <select value={schedForm.platformId} onChange={e=>setSchedForm(f=>({...f,platformId:Number(e.target.value)}))}
                    className="w-full h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none">
                    {PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="date" value={schedForm.date} onChange={e=>setSchedForm(f=>({...f,date:e.target.value}))}
                      className="h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none w-full"/>
                    <input type="time" value={schedForm.time} onChange={e=>setSchedForm(f=>({...f,time:e.target.value}))}
                      className="h-7 text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 focus:outline-none w-full"/>
                  </div>
                  <textarea value={schedForm.caption} onChange={e=>setSchedForm(f=>({...f,caption:e.target.value}))} rows={2} placeholder="Caption…"
                    className="w-full text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-violet-500 placeholder:text-gray-700"/>
                  <input value={schedForm.hashtags} onChange={e=>setSchedForm(f=>({...f,hashtags:e.target.value}))} placeholder="#hashtags…"
                    className="w-full text-[10px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 py-1.5 focus:outline-none placeholder:text-gray-700"/>
                  <button onClick={addSchedulePost} className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold transition">
                    + Schedule Post
                  </button>
                </div>

                <SL label={`Scheduled (${scheduleList.length})`}/>
                {scheduleList.length===0 && <p className="text-[9px] text-gray-600 text-center py-4">No posts scheduled</p>}
                {scheduleList.map(s=>{
                  const p = PLATFORMS.find(pl=>pl.id===s.platformId);
                  return (
                    <div key={s.id} className="rounded-xl bg-white/3 border border-white/6 p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-200">{p?.icon} {p?.name}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${s.status==="scheduled"?"bg-emerald-500/20 text-emerald-400":"bg-gray-500/20 text-gray-400"}`}>{s.status}</span>
                      </div>
                      <p className="text-[9px] text-violet-300">{s.date} at {s.time}</p>
                      {s.caption && <p className="text-[9px] text-gray-400 truncate">{s.caption}</p>}
                      <button onClick={()=>setScheduleList(prev=>prev.filter(x=>x.id!==s.id))} className="text-[8px] text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ASSETS PANEL ───────────────────────────────────────── */}
            {activePanel==="assets" && (
              <div className="space-y-2.5">
                <SL label="Asset Library"/>
                <label className="w-full flex flex-col items-center gap-2 py-5 rounded-xl bg-white/4 hover:bg-white/8 border-2 border-dashed border-white/10 hover:border-violet-500/50 cursor-pointer transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p className="text-[10px] text-gray-400">Upload to library</p>
                  <p className="text-[9px] text-gray-600">Images, logos, icons</p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e=>handleAssetUpload(e.target.files)}/>
                </label>

                {assets.length===0
                  ? <p className="text-[9px] text-gray-600 text-center py-4">No assets yet</p>
                  : <div className="grid grid-cols-3 gap-1">
                      {assets.map(a=>(
                        <div key={a.id} className="relative group">
                          <img src={a.url} alt={a.name} className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition" onClick={()=>addEl(makeEl("image",{content:a.url,x:30,y:30,width:160,height:120}))}/>
                          <button onClick={()=>setAssets(prev=>prev.filter(x=>x.id!==a.id))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[7px] text-white items-center justify-center hidden group-hover:flex">✕</button>
                        </div>
                      ))}
                    </div>
                }

                <SL label="Stock Icons"/>
                <div className="grid grid-cols-5 gap-1">
                  {["🎯","💡","📊","🔑","⚙️","🏆","💰","📱","🌍","🚀"].map(ico=>(
                    <button key={ico} onClick={()=>addSticker(ico)} className="h-9 flex items-center justify-center text-lg bg-white/4 hover:bg-white/8 rounded-lg transition">{ico}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ CANVAS AREA ════════════════════════════════════════════ */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 min-h-0 min-w-0"
          style={{ background:"radial-gradient(ellipse at center,#12121e 0%,#080810 70%)" }}>
          <div style={{ position:"relative" }}>
            <div ref={canvasRef}
              className="relative shadow-2xl select-none overflow-hidden"
              style={{ width:platform.w, height:platform.h, transform:`scale(${zoom/100})`, transformOrigin:"center", opacity:bg.opacity/100, ...bgCss() }}
              onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onClick={e=>{if(e.target===canvasRef.current)setSelectedId(null);}}>

              {/* Platform watermark */}
              <div className="absolute top-2 right-2 text-[7px] font-bold uppercase tracking-widest pointer-events-none z-50"
                style={{color:"rgba(255,255,255,0.18)"}}>{platform.platform}</div>

              {/* Snap guides */}
              {snapX!==null && <div className="absolute top-0 bottom-0 w-px bg-cyan-400/70 pointer-events-none z-[999]" style={{left:snapX}}/>}
              {snapY!==null && <div className="absolute left-0 right-0 h-px bg-cyan-400/70 pointer-events-none z-[999]" style={{top:snapY}}/>}
              {/* Center guides (always subtle) */}
              <div className="absolute top-0 bottom-0 w-px pointer-events-none z-10" style={{left:platform.w/2,background:"rgba(255,255,255,0.04)"}}/>
              <div className="absolute left-0 right-0 h-px pointer-events-none z-10" style={{top:platform.h/2,background:"rgba(255,255,255,0.04)"}}/>

              {sorted.map(el => {
                const isSelected = selectedId===el.id;
                const isEditing  = editingId===el.id;
                const animStyle: React.CSSProperties = (previewAnim&&isSelected&&el.animation&&el.animation!=="none")
                  ? { animation: ANIM_CSS_MAP[el.animation], ["--dur" as any]:`${el.animDuration||0.6}s` }
                  : {};
                const shadowStyle: React.CSSProperties = el.dropShadow
                  ? { filter:`drop-shadow(0 4px ${el.shadowBlur||8}px ${el.shadowColor||"rgba(0,0,0,0.6)"})` }
                  : {};
                return (
                  <div key={el.id} data-el-id={el.id} style={{
                    position:"absolute", left:el.x, top:el.y,
                    width:el.width, minHeight:el.height,
                    opacity:el.opacity/100, zIndex:el.zIndex,
                    transform:`rotate(${el.rotation}deg) scaleX(${el.flipH?-1:1}) scaleY(${el.flipV?-1:1})`,
                    cursor:el.locked?"not-allowed":"move",
                    mixBlendMode:(el.blendMode||"normal") as any,
                    ...animStyle, ...shadowStyle,
                  }}
                    onMouseDown={e=>{if(!el.locked)onElDown(e,el.id);}}
                    onDoubleClick={()=>{if(el.type==="text")setEditingId(el.id);}}
                    className={isSelected&&!el.locked?"ring-1 ring-violet-400 ring-offset-1 ring-offset-transparent":""}>

                    {el.type==="text" && (isEditing ? (
                      <textarea autoFocus value={el.content}
                        onChange={e=>updateEl(el.id,{content:e.target.value})}
                        onBlur={()=>{setEditingId(null);commit(elements);}}
                        style={{width:"100%",minHeight:el.height,fontSize:el.fontSize,fontFamily:el.fontFamily,color:el.color,fontWeight:el.bold?"bold":"normal",fontStyle:el.italic?"italic":"normal",textDecoration:el.underline?"underline":"none",textAlign:el.textAlign||"left",letterSpacing:el.letterSpacing?`${el.letterSpacing}px`:undefined,lineHeight:el.lineHeight||1.4,background:"transparent",border:"none",outline:"none",resize:"none",textShadow:el.textShadow?"2px 2px 10px rgba(0,0,0,0.9)":"none",WebkitTextStroke:el.textStroke?`1.5px ${el.textStrokeColor||"#000"}`:"none"}}/>
                    ) : (
                      <div style={{fontSize:el.fontSize,fontFamily:el.fontFamily,color:el.color,fontWeight:el.bold?"bold":"normal",fontStyle:el.italic?"italic":"normal",textDecoration:el.underline?"underline":"none",textAlign:el.textAlign||"left",letterSpacing:el.letterSpacing?`${el.letterSpacing}px`:undefined,lineHeight:el.lineHeight||1.4,whiteSpace:"pre-wrap",textShadow:el.textShadow?"2px 2px 10px rgba(0,0,0,0.9)":"none",WebkitTextStroke:el.textStroke?`1.5px ${el.textStrokeColor||"#000"}`:"none",padding:"2px"}}>{el.content}</div>
                    ))}
                    {el.type==="emoji" && <div style={{fontSize:el.fontSize||48,lineHeight:1,userSelect:"none"}}>{el.content}</div>}
                    {el.type==="shape" && renderShape(el)}
                    {el.type==="image" && <img src={el.content} alt="" draggable={false} style={{width:el.width,height:el.height,objectFit:"cover",display:"block",borderRadius:el.borderRadius||0}}/>}

                    {isSelected && !el.locked && (
                      <>
                        {/* Resize handle */}
                        <div data-resize="se" onMouseDown={e=>onResizeDown(e,el.id)}
                          className="absolute bottom-0 right-0 w-3 h-3 bg-violet-500 border-2 border-white rounded-sm cursor-se-resize z-50 shadow-lg"/>
                        {/* Rotate indicator */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-1 h-4 border-l border-dashed border-violet-400/60 pointer-events-none"/>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Canvas size label */}
            <div className="text-center mt-2 text-[9px] text-gray-700 font-mono">
              {platform.name} · {platform.size} · {elements.length} elements
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ════════════════════════════════════════════ */}
        <div className="w-[180px] bg-[#0f0f18] border-l border-white/[0.05] overflow-y-auto shrink-0 p-2.5 space-y-3 min-h-0">
          {sel ? (
            <>
              {/* Position & Size */}
              <div>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1.5">Position & Size</p>
                <div className="grid grid-cols-2 gap-1">
                  {([["X","x",sel.x],["Y","y",sel.y],["W","width",sel.width],["H","height",sel.height]] as const).map(([lbl,key,val])=>(
                    <div key={lbl} className="flex items-center gap-1">
                      <span className="text-[8px] text-gray-600 w-3">{lbl}</span>
                      <input type="number" value={Math.round(val)} onChange={e=>updateEl(sel.id,{[key]:Number(e.target.value)})} onBlur={()=>commit(elements)}
                        className="flex-1 h-6 text-[9px] bg-[#1a1a26] border border-white/8 text-white rounded-md px-1 focus:outline-none focus:border-violet-500 w-0"/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transform */}
              <div>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1.5">Transform</p>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[8px] text-gray-600 w-10 shrink-0">Rotate</span>
                  <input type="range" min={-180} max={180} value={sel.rotation||0}
                    onChange={e=>updateEl(sel.id,{rotation:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                    className="flex-1 h-1 accent-violet-500"/>
                  <span className="text-[8px] text-gray-400 w-8 text-right font-mono">{sel.rotation||0}°</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>updateElCommit(sel.id,{flipH:!sel.flipH})} className={`flex-1 py-1 text-[8px] rounded-md transition font-bold ${sel.flipH?"bg-violet-600 text-white":"bg-white/8 text-gray-400 hover:text-white"}`}>↔H</button>
                  <button onClick={()=>updateElCommit(sel.id,{flipV:!sel.flipV})} className={`flex-1 py-1 text-[8px] rounded-md transition font-bold ${sel.flipV?"bg-violet-600 text-white":"bg-white/8 text-gray-400 hover:text-white"}`}>↕V</button>
                </div>
              </div>

              {/* Opacity */}
              <div>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1.5">Opacity</p>
                <div className="flex items-center gap-1.5">
                  <input type="range" min={0} max={100} value={sel.opacity}
                    onChange={e=>updateEl(sel.id,{opacity:Number(e.target.value)})} onMouseUp={()=>commit(elements)}
                    className="flex-1 h-1 accent-violet-500"/>
                  <span className="text-[8px] text-gray-400 w-7 font-mono">{sel.opacity}%</span>
                </div>
              </div>

              {/* Arrange */}
              <div>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1.5">Arrange</p>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <button onClick={()=>updateElCommit(sel.id,{zIndex:sel.zIndex+1})} className="py-1 rounded-md text-[8px] bg-white/8 text-gray-400 hover:text-white transition">▲ Fwd</button>
                  <button onClick={()=>updateElCommit(sel.id,{zIndex:Math.max(0,sel.zIndex-1)})} className="py-1 rounded-md text-[8px] bg-white/8 text-gray-400 hover:text-white transition">▼ Back</button>
                  <button onClick={()=>updateElCommit(sel.id,{x:0,y:0})} className="py-1 rounded-md text-[8px] bg-white/8 text-gray-400 hover:text-white transition col-span-1">↖ TL</button>
                  <button onClick={()=>updateElCommit(sel.id,{x:(platform.w-sel.width)/2,y:(platform.h-sel.height)/2})} className="py-1 rounded-md text-[8px] bg-white/8 text-gray-400 hover:text-white transition">⊕ Ctr</button>
                </div>
                <button onClick={()=>updateElCommit(sel.id,{locked:!sel.locked})}
                  className={`w-full py-1 rounded-md text-[8px] transition ${sel.locked?"bg-amber-600/25 text-amber-300":"bg-white/8 text-gray-400 hover:text-white"}`}>
                  {sel.locked?"🔒 Locked":"🔓 Lock"}
                </button>
              </div>

              {/* Animation badge */}
              {sel.animation&&sel.animation!=="none" && (
                <div className="rounded-lg bg-violet-600/15 border border-violet-500/20 px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-violet-300">✦ {sel.animation}</span>
                  <button onClick={()=>updateElCommit(sel.id,{animation:"none"})} className="text-[9px] text-violet-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 pt-1 border-t border-white/[0.05]">
                <button onClick={duplicate} className="flex-1 py-1.5 rounded-lg text-[8px] font-bold bg-white/8 text-gray-300 hover:text-white hover:bg-white/12 transition">Dupe</button>
                <button onClick={()=>deleteEl(sel.id)} className="flex-1 py-1.5 rounded-lg text-[8px] font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition">Del</button>
              </div>
            </>
          ) : (
            <div className="text-center pt-10 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/15 flex items-center justify-center mx-auto text-2xl">👆</div>
              <p className="text-[9px] text-gray-600">Select an element to edit properties</p>
              <div className="space-y-1 text-[8px] text-gray-700">
                <p>Del — delete</p>
                <p>⌘D — duplicate</p>
                <p>⌘Z — undo</p>
                <p>Arrows — nudge</p>
                <p>Shift+Arrows — big nudge</p>
              </div>
            </div>
          )}
        </div>

        {/* ══ COLLABORATION PANEL ════════════════════════════════════ */}
        {showCollab && (
          <div className="w-[200px] bg-[#0f0f18] border-l border-white/[0.05] shrink-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between p-2.5 border-b border-white/[0.05] shrink-0">
              <p className="text-[10px] font-bold text-teal-300">🤝 Collaboration</p>
              <button onClick={()=>setShowCollab(false)} className="text-gray-500 hover:text-white text-[10px]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
              {/* Version control stub */}
              <div className="rounded-lg bg-white/3 border border-white/6 p-2 text-[9px] text-gray-400 space-y-1">
                <p className="text-[9px] font-bold text-gray-300">🕐 Version History</p>
                <p className="text-gray-500">v{undoStack.length+1} · {savedAt||"unsaved"}</p>
                <p className="text-gray-600">{undoStack.length} undo steps</p>
              </div>
              <SL label="Comments"/>
              {collabComments.map(c=>(
                <div key={c.id} className="rounded-lg bg-white/3 border border-white/6 p-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-violet-300">{c.author}</span>
                    <span className="text-[8px] text-gray-600">{c.ts}</span>
                  </div>
                  <p className="text-[9px] text-gray-300">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-white/[0.05] shrink-0 flex gap-1">
              <input value={newCollabMsg} onChange={e=>setNewCollabMsg(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&newCollabMsg.trim()){setCollabComments(prev=>[...prev,{id:Date.now().toString(),author:"You",text:newCollabMsg.trim(),ts:"just now"}]);setNewCollabMsg("");}}}
                placeholder="Add comment…"
                className="flex-1 text-[9px] bg-[#1a1a26] border border-white/8 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-teal-500 placeholder:text-gray-700"/>
              <button onClick={()=>{if(newCollabMsg.trim()){setCollabComments(prev=>[...prev,{id:Date.now().toString(),author:"You",text:newCollabMsg.trim(),ts:"just now"}]);setNewCollabMsg("");}}}
                className="px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded-lg text-[9px] font-bold text-white transition">↵</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ STATUS BAR ════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#0f0f18] border-t border-white/[0.05] shrink-0">
        <div className="flex items-center gap-3 text-[9px] text-gray-600">
          <span className="font-mono">{platform.name} · {platform.size}</span>
          <span>{elements.length} elements</span>
          {selectedId && sel && <span className="text-violet-400">{sel.type} @ {Math.round(sel.x)},{Math.round(sel.y)}</span>}
        </div>
        <span className="text-[9px] text-gray-700">Dbl-click to edit · Del to remove · ⌘Z undo · Shift+Arrow = 10px nudge</span>
      </div>

      {/* ══ MAGIC RESIZE MODAL ════════════════════════════════════════ */}
      {showMagicResize && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={()=>setShowMagicResize(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-[#15151f] border border-white/10 rounded-2xl shadow-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">✦ Magic Resize</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Convert from {platform.name} to another size</p>
              </div>
              <button onClick={()=>setShowMagicResize(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition">✕</button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {PLATFORMS.filter(p=>p.id!==platform.id).map(p=>(
                <button key={p.id} onClick={()=>magicResize(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 hover:bg-violet-600/20 border border-transparent hover:border-violet-500/25 transition text-left">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.bg} flex items-center justify-center text-sm shrink-0`}>{p.icon}</div>
                  <div>
                    <p className="text-[11px] font-semibold text-white">{p.name}</p>
                    <p className="text-[9px] text-gray-500">{p.size}</p>
                  </div>
                  <span className="ml-auto text-[9px] text-violet-400">Resize →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}