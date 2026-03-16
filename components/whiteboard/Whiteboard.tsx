'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type Tool = "pen" | "select" | "eraser" | "rectangle" | "circle" | "triangle" | "line" | "arrow" | "text" | "sticky" | "highlighter" | "spray";

interface CanvasSnapshot { json: any; timestamp: number; }

export function Whiteboard({
  roomId, initialData, onChange, databaseId,
}: {
  roomId?: string; initialData?: any; onChange?: (data: any) => void; databaseId?: string;
}) {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const fabricRef       = useRef<any>(null);
  const fabricLibRef    = useRef<any>(null);
  const drawingShapeRef = useRef<any>(null);
  const startPointRef   = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef    = useRef(false);
  const suppressUndoRef = useRef(false); // ✅ prevents dup on shape draw
  const saveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady, setIsReady]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [activeTool, setActiveTool]       = useState<Tool>("pen");
  const [activeColor, setActiveColor]     = useState("#1e1e1e");
  const [fillColor, setFillColor]         = useState("transparent");
  const [boardColor, setBoardColor]       = useState("#ffffff");
  const [brushSize, setBrushSize]         = useState(3);
  const [fontSize, setFontSize]           = useState(18);
  const [fontFamily, setFontFamily]       = useState("sans-serif");
  const [opacity, setOpacity]             = useState(100);
  const [isBold, setIsBold]               = useState(false);
  const [isItalic, setIsItalic]           = useState(false);
  const [isUnderline, setIsUnderline]     = useState(false);
  const [undoStack, setUndoStack]         = useState<CanvasSnapshot[]>([]);
  const [redoStack, setRedoStack]         = useState<CanvasSnapshot[]>([]);
  const [savedAt, setSavedAt]             = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [zoom, setZoom]                   = useState(100);
  const [showColorPicker, setShowColorPicker] = useState<"stroke" | "fill" | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // ✅ Load / Save state
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [roomIdState] = useState<string>(
    () => roomId ?? `whiteboard-${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) setShowColorPicker(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ✅ Apply board color
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setBackgroundColor(boardColor, () => canvas.renderAll());
  }, [boardColor]);

  // ✅ Save to DB
  const saveToDatabase = useCallback(async (json: any) => {
    if (!databaseId) { onChange?.(json); return; }
    setSaving(true);
    try {
      await fetch(`/api/databases/${databaseId}/whiteboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas: json }),
      });
      setSavedAt(new Date().toLocaleTimeString());
      onChange?.(json);
    } catch (err) { console.error("Save failed:", err); }
    finally { setSaving(false); }
  }, [databaseId, onChange]);

  // ✅ Push undo
  const pushUndo = useCallback(() => {
    if (suppressUndoRef.current) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = canvas.toJSON();
    setUndoStack(prev => [...prev.slice(-29), { json, timestamp: Date.now() }]);
    setRedoStack([]);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveToDatabase(json), 2000);
  }, [saveToDatabase]);

  // ✅ Init Fabric + Load from DB
  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;

    import("fabric").then((mod) => {
      if (disposed) return;
      const fabric = mod.fabric ?? mod;
      fabricLibRef.current = fabric;

      const parent = canvasRef.current?.parentElement;
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        backgroundColor: "#ffffff",
        width: parent?.offsetWidth || 900,
        height: parent?.offsetHeight || 560,
        preserveObjectStacking: true,
        renderOnAddRemove: false,
      });

      canvas.freeDrawingBrush.color = "#1e1e1e";
      canvas.freeDrawingBrush.width = 3;
      fabricRef.current = canvas;
      setIsReady(true);

      canvas.on("object:added",    () => { if (!suppressUndoRef.current) pushUndo(); });
      canvas.on("object:modified", () => { if (!suppressUndoRef.current) pushUndo(); });
      canvas.on("object:removed",  () => { if (!suppressUndoRef.current) pushUndo(); });

      const handleResize = () => {
        const p = canvasRef.current?.parentElement;
        if (!p) return;
        canvas.setWidth(p.offsetWidth);
        canvas.setHeight(p.offsetHeight);
        canvas.renderAll();
      };
      window.addEventListener("resize", handleResize);

      // ✅ Load saved canvas from DB or use initialData
      const loadCanvas = async () => {
        try {
          if (databaseId) {
            const res  = await fetch(`/api/databases/${databaseId}/whiteboard`);
            const data = await res.json();
            if (data.canvas) {
              suppressUndoRef.current = true;
              canvas.loadFromJSON(data.canvas, () => {
                canvas.renderAll();
                suppressUndoRef.current = false;
              });
            } else if (initialData) {
              suppressUndoRef.current = true;
              canvas.loadFromJSON(initialData, () => {
                canvas.renderAll();
                suppressUndoRef.current = false;
              });
            }
          } else if (initialData) {
            suppressUndoRef.current = true;
            canvas.loadFromJSON(initialData, () => {
              canvas.renderAll();
              suppressUndoRef.current = false;
            });
          }
        } catch (e) { console.error("Load failed:", e); }
        finally { setLoadedOnce(true); }
      };

      setTimeout(loadCanvas, 300);

      return () => {
        window.removeEventListener("resize", handleResize);
        canvas.dispose();
      };
    }).catch(() => setError("Failed to load whiteboard"));

    return () => {
      disposed = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      fabricRef.current?.dispose();
    };
  }, []);

  // ── Tool sync ──
  useEffect(() => {
    const canvas = fabricRef.current;
    const fabric = fabricLibRef.current;
    if (!canvas || !fabric) return;

    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");

    if (activeTool === "pen") {
      canvas.isDrawingMode = true; canvas.selection = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = activeColor; brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "highlighter") {
      canvas.isDrawingMode = true; canvas.selection = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = activeColor + "55"; brush.width = brushSize * 6;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "spray") {
      canvas.isDrawingMode = true; canvas.selection = true;
      const brush = new (fabric.SprayBrush || fabric.PencilBrush)(canvas);
      brush.color = activeColor; brush.width = brushSize * 3;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = true; canvas.selection = false;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = boardColor; brush.width = brushSize * 5;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "select") {
      canvas.isDrawingMode = false; canvas.selection = true;
    } else {
      canvas.isDrawingMode = false; canvas.selection = false; canvas.defaultCursor = "crosshair";

      const handleMouseDown = (opt: any) => {
        suppressUndoRef.current = true;
        const pointer = canvas.getPointer(opt.e);
        startPointRef.current = { x: pointer.x, y: pointer.y };
        isDrawingRef.current = true;
        const fill = fillColor === "transparent" ? "rgba(0,0,0,0)" : fillColor;
        let shape: any = null;

        if (activeTool === "rectangle") shape = new fabric.Rect({ left:pointer.x, top:pointer.y, width:1, height:1, fill, stroke:activeColor, strokeWidth:brushSize, opacity:opacity/100, selectable:false, evented:false });
        else if (activeTool === "circle") shape = new fabric.Ellipse({ left:pointer.x, top:pointer.y, rx:1, ry:1, fill, stroke:activeColor, strokeWidth:brushSize, opacity:opacity/100, selectable:false, evented:false });
        else if (activeTool === "triangle") shape = new fabric.Triangle({ left:pointer.x, top:pointer.y, width:1, height:1, fill, stroke:activeColor, strokeWidth:brushSize, opacity:opacity/100, selectable:false, evented:false });
        else if (activeTool === "line" || activeTool === "arrow") shape = new fabric.Line([pointer.x,pointer.y,pointer.x,pointer.y], { stroke:activeColor, strokeWidth:brushSize, opacity:opacity/100, selectable:false, evented:false });

        if (shape) { canvas.add(shape); canvas.renderAll(); drawingShapeRef.current = shape; }
      };

      const handleMouseMove = (opt: any) => {
        if (!isDrawingRef.current || !startPointRef.current || !drawingShapeRef.current) return;
        const pointer = canvas.getPointer(opt.e);
        const sp = startPointRef.current;
        const shape = drawingShapeRef.current;

        if (activeTool === "rectangle" || activeTool === "triangle") shape.set({ left:Math.min(pointer.x,sp.x), top:Math.min(pointer.y,sp.y), width:Math.abs(pointer.x-sp.x)||1, height:Math.abs(pointer.y-sp.y)||1 });
        else if (activeTool === "circle") shape.set({ left:Math.min(pointer.x,sp.x), top:Math.min(pointer.y,sp.y), rx:Math.abs(pointer.x-sp.x)/2||1, ry:Math.abs(pointer.y-sp.y)/2||1 });
        else if (activeTool === "line" || activeTool === "arrow") shape.set({ x2:pointer.x, y2:pointer.y });
        shape.setCoords();
        canvas.requestRenderAll();
      };

      const handleMouseUp = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false; startPointRef.current = null;
        const shape = drawingShapeRef.current;
        if (shape) {
          shape.set({ selectable:true, evented:true, hasControls:true, hasBorders:true });
          shape.setCoords(); drawingShapeRef.current = null; canvas.renderAll();
          suppressUndoRef.current = false; pushUndo();
        } else { suppressUndoRef.current = false; }
      };

      canvas.on("mouse:down", handleMouseDown);
      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:up", handleMouseUp);

      return () => {
        canvas.off("mouse:down", handleMouseDown);
        canvas.off("mouse:move", handleMouseMove);
        canvas.off("mouse:up", handleMouseUp);
        canvas.selection = true; canvas.defaultCursor = "default";
      };
    }
  }, [activeTool, activeColor, fillColor, boardColor, brushSize, opacity, pushUndo]);

  const addText = async (sticky = false) => {
    const fabric = fabricLibRef.current;
    if (!fabric || !fabricRef.current) return;
    if (sticky) {
      const rect = new fabric.Rect({ left:80, top:80, width:160, height:120, fill:"#fef08a", stroke:"#ca8a04", strokeWidth:1, rx:4, ry:4 });
      const text = new fabric.IText("Sticky note", { left:160, top:140, fill:"#713f12", fontSize:14, fontFamily:"sans-serif", originX:"center", originY:"center" });
      fabricRef.current.add(new fabric.Group([rect,text],{left:80,top:80}));
    } else {
      const text = new fabric.IText("Type here...", { left:100, top:100, fill:activeColor, fontSize, fontFamily, fontWeight:isBold?"bold":"normal", fontStyle:isItalic?"italic":"normal", underline:isUnderline, opacity:opacity/100 });
      fabricRef.current.add(text);
      fabricRef.current.setActiveObject(text);
      text.enterEditing();
    }
    setActiveTool("select"); pushUndo();
  };

  const updateSelectedText = (props: Record<string,any>) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && (obj.type==="i-text"||obj.type==="textbox")) { obj.set(props); canvas.renderAll(); pushUndo(); }
  };

  const handleUndo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || undoStack.length===0) return;
    const current = canvas.toJSON();
    const prev = undoStack[undoStack.length-1];
    setRedoStack(r=>[...r,{json:current,timestamp:Date.now()}]);
    setUndoStack(u=>u.slice(0,-1));
    suppressUndoRef.current = true;
    canvas.loadFromJSON(prev.json, ()=>{ canvas.renderAll(); suppressUndoRef.current=false; });
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || redoStack.length===0) return;
    const current = canvas.toJSON();
    const next = redoStack[redoStack.length-1];
    setUndoStack(u=>[...u,{json:current,timestamp:Date.now()}]);
    setRedoStack(r=>r.slice(0,-1));
    suppressUndoRef.current = true;
    canvas.loadFromJSON(next.json, ()=>{ canvas.renderAll(); suppressUndoRef.current=false; });
  }, [redoStack]);

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj:any)=>canvas.remove(obj));
    canvas.discardActiveObject(); canvas.renderAll(); pushUndo();
  };

  const selectAll = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    const sel = new (fabricLibRef.current.ActiveSelection)(canvas.getObjects(),{canvas});
    canvas.setActiveObject(sel); canvas.requestRenderAll(); setActiveTool("select");
  };

  const handleZoom = (delta: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const z = Math.min(Math.max(zoom+delta,25),300);
    setZoom(z); canvas.setZoom(z/100); canvas.renderAll();
  };

  const handleClear = () => {
    if (!confirm("Clear the entire canvas?")) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    suppressUndoRef.current = true;
    canvas.clear();
    canvas.setBackgroundColor(boardColor, ()=>{ canvas.renderAll(); suppressUndoRef.current=false; pushUndo(); });
  };

  const handleExportPNG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL({format:"png",multiplier:2});
    const a = document.createElement("a"); a.href=url; a.download=`whiteboard-${Date.now()}.png`; a.click();
  };

  const handleExportSVG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg],{type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`whiteboard-${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleManualSave = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    saveToDatabase(canvas.toJSON());
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag==="INPUT"||tag==="TEXTAREA") return;
      if ((e.ctrlKey||e.metaKey)&&e.key==="z") { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="y") { e.preventDefault(); handleRedo(); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="a") { e.preventDefault(); selectAll(); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="s") { e.preventDefault(); handleManualSave(); }
      if ((e.key==="Delete"||e.key==="Backspace") && fabricRef.current?.getActiveObject()) { e.preventDefault(); deleteSelected(); }
      if (!e.ctrlKey&&!e.metaKey) {
        if (e.key==="v") setActiveTool("select");
        if (e.key==="p") setActiveTool("pen");
        if (e.key==="e") setActiveTool("eraser");
        if (e.key==="r") setActiveTool("rectangle");
        if (e.key==="c") setActiveTool("circle");
        if (e.key==="t") addText();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoStack, redoStack, activeTool]);

  const COLORS = ["#000000","#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#6b7280","#1e40af","#065f46","#7c2d12","#1e1b4b","#134e4a"];
  const FONTS  = ["sans-serif","serif","monospace","Georgia","Verdana","Arial","Trebuchet MS","Impact"];

  const ToolBtn = ({tool,icon,title,shortcut,onClick}:{tool?:Tool;icon:React.ReactNode;title:string;shortcut?:string;onClick?:()=>void}) => (
    <button onClick={onClick??( ()=>tool&&setActiveTool(tool))} title={`${title}${shortcut?` (${shortcut})`:""}`}
      className={`relative w-7 h-7 flex items-center justify-center rounded-md transition-all text-xs font-medium ${tool&&activeTool===tool?"bg-blue-600 text-white shadow-sm shadow-blue-400/40":"text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>
      {icon}
    </button>
  );

  if (error) return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl">⚠️</span>
        <p className="text-xs text-red-500">{error}</p>
        <button onClick={()=>setError(null)} className="px-3 py-1 bg-red-500 text-white text-xs rounded-md">Dismiss</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white" style={{fontFamily:"system-ui, sans-serif"}}>

      {/* ROW 1 — File & Edit */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200 shrink-0 flex-wrap">
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <ToolBtn title="Save" shortcut="Ctrl+S" onClick={handleManualSave}
            icon={saving ? <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"/>
              : savedAt ? <span className="text-[9px] text-green-600">✓</span>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}
          />
          <ToolBtn title="Export PNG" onClick={handleExportPNG}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
          />
          <ToolBtn title="Export SVG" onClick={handleExportSVG} icon={<span className="text-[8px] font-bold">SVG</span>}/>
        </div>
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolBtn title="Undo" shortcut="Ctrl+Z" onClick={handleUndo}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>}/>
          <ToolBtn title="Redo" shortcut="Ctrl+Y" onClick={handleRedo}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>}/>
          <ToolBtn title="Select All" shortcut="Ctrl+A" onClick={selectAll}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/></svg>}/>
          <ToolBtn title="Delete selected" shortcut="Del" onClick={deleteSelected}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}/>
          <ToolBtn title="Clear canvas" onClick={handleClear}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6 11l4 4"/></svg>}/>
        </div>
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <button onClick={()=>handleZoom(-10)} className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 text-sm font-bold">−</button>
          <span className="text-[10px] text-gray-500 w-8 text-center">{zoom}%</span>
          <button onClick={()=>handleZoom(10)} className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 text-sm font-bold">+</button>
          <button onClick={()=>{setZoom(100);fabricRef.current?.setZoom(1);fabricRef.current?.renderAll();}} className="text-[9px] text-gray-400 hover:text-gray-600 px-1">Reset</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isReady?"bg-emerald-400":"bg-amber-400"}`}/>
          {saving && <span className="text-[9px] text-amber-500 animate-pulse">● Saving…</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-500">✓ {savedAt}</span>}
        </div>
      </div>

      {/* ROW 2 — Tools */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-white border-b border-gray-200 shrink-0 flex-wrap">
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <ToolBtn tool="select" title="Select" shortcut="V" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z"/></svg>}/>
          <ToolBtn tool="pen" title="Pen" shortcut="P" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>}/>
          <ToolBtn tool="highlighter" title="Highlighter" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>}/>
          <ToolBtn tool="eraser" title="Eraser" shortcut="E" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6 11l4 4"/></svg>}/>
        </div>
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolBtn tool="rectangle" title="Rectangle" shortcut="R" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>}/>
          <ToolBtn tool="circle" title="Ellipse" shortcut="C" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="7"/></svg>}/>
          <ToolBtn tool="triangle" title="Triangle" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L2 21h20z"/></svg>}/>
          <ToolBtn tool="line" title="Line" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="3"/></svg>}/>
          <ToolBtn tool="arrow" title="Arrow" icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="3"/><polyline points="11 3 21 3 21 13"/></svg>}/>
        </div>
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolBtn tool="text" title="Text" shortcut="T" onClick={()=>addText(false)} icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>}/>
          <ToolBtn tool="sticky" title="Sticky Note" onClick={()=>addText(true)} icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><polyline points="15 3 15 9 21 9"/></svg>}/>
        </div>
        {/* Colors */}
        <div className="flex items-center gap-1.5 px-2 border-r border-gray-200 relative" ref={colorPickerRef}>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-400">Stroke</span>
            <button onClick={()=>setShowColorPicker(showColorPicker==="stroke"?null:"stroke")}
              className="w-6 h-6 rounded border-2 border-gray-300 shadow-sm hover:border-gray-400 transition" style={{backgroundColor:activeColor}}/>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-400">Fill</span>
            <button onClick={()=>setShowColorPicker(showColorPicker==="fill"?null:"fill")}
              className="w-6 h-6 rounded border-2 border-gray-300 shadow-sm hover:border-gray-400 transition relative"
              style={{backgroundColor:fillColor==="transparent"?"white":fillColor}}>
              {fillColor==="transparent" && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[1px] bg-red-500 rotate-45"/></div>}
            </button>
          </div>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-52">
              <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">{showColorPicker==="stroke"?"Stroke":"Fill"} Color</p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>{if(showColorPicker==="stroke"){setActiveColor(c);if(activeTool==="eraser")setActiveTool("pen");}else setFillColor(c);setShowColorPicker(null);}}
                    className="w-7 h-7 rounded-lg border-2 transition hover:scale-110"
                    style={{backgroundColor:c,borderColor:(showColorPicker==="stroke"?activeColor:fillColor)===c?"#3b82f6":"#e5e7eb",boxShadow:c==="#ffffff"?"inset 0 0 0 1px #e5e7eb":undefined}}/>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={showColorPicker==="stroke"?activeColor:(fillColor==="transparent"?"#ffffff":fillColor)}
                  onChange={e=>showColorPicker==="stroke"?setActiveColor(e.target.value):setFillColor(e.target.value)}
                  className="w-7 h-7 rounded border border-gray-200 cursor-pointer"/>
                <span className="text-[10px] text-gray-400">Custom</span>
                {showColorPicker==="fill" && <button onClick={()=>{setFillColor("transparent");setShowColorPicker(null);}} className="ml-auto text-[9px] text-red-400 hover:text-red-600">None</button>}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <span className="text-[9px] text-gray-400">Size</span>
          <input type="range" min={1} max={30} value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))} className="w-16 h-1 accent-blue-500 cursor-pointer"/>
          <span className="text-[9px] text-gray-500 w-4">{brushSize}</span>
        </div>
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <span className="text-[9px] text-gray-400">Opacity</span>
          <input type="range" min={10} max={100} value={opacity} onChange={e=>setOpacity(Number(e.target.value))} className="w-14 h-1 accent-blue-500 cursor-pointer"/>
          <span className="text-[9px] text-gray-500 w-6">{opacity}%</span>
        </div>
      </div>

      {/* ROW 3 — Text */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b border-gray-200 shrink-0 flex-wrap">
        <span className="text-[9px] text-gray-400 mr-1">Text:</span>
        <select value={fontFamily} onChange={e=>{setFontFamily(e.target.value);updateSelectedText({fontFamily:e.target.value});}}
          className="h-6 text-[10px] border border-gray-200 rounded px-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
          {FONTS.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
        </select>
        <input type="number" min={8} max={144} value={fontSize} onChange={e=>{setFontSize(Number(e.target.value));updateSelectedText({fontSize:Number(e.target.value)});}}
          className="h-6 w-12 text-[10px] border border-gray-200 rounded px-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400"/>
        <div className="w-px h-4 bg-gray-200 mx-0.5"/>
        <button onClick={()=>{setIsBold(!isBold);updateSelectedText({fontWeight:!isBold?"bold":"normal"});}} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition ${isBold?"bg-blue-100 text-blue-700":"text-gray-500 hover:bg-gray-100"}`}>B</button>
        <button onClick={()=>{setIsItalic(!isItalic);updateSelectedText({fontStyle:!isItalic?"italic":"normal"});}} className={`w-6 h-6 flex items-center justify-center rounded text-xs italic font-medium transition ${isItalic?"bg-blue-100 text-blue-700":"text-gray-500 hover:bg-gray-100"}`}>I</button>
        <button onClick={()=>{setIsUnderline(!isUnderline);updateSelectedText({underline:!isUnderline});}} className={`w-6 h-6 flex items-center justify-center rounded text-xs underline font-medium transition ${isUnderline?"bg-blue-100 text-blue-700":"text-gray-500 hover:bg-gray-100"}`}>U</button>
        <div className="w-px h-4 bg-gray-200 mx-0.5"/>
        {(["left","center","right"] as const).map(align=>(
          <button key={align} onClick={()=>updateSelectedText({textAlign:align})} className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition" title={`Align ${align}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {align==="left"  && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>}
              {align==="center"&& <><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>}
              {align==="right" && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        ))}
        <div className="ml-auto">
          <span className="text-[9px] text-gray-300">V=Select P=Pen E=Eraser R=Rect C=Circle T=Text Del=Delete Ctrl+Z=Undo</span>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 overflow-hidden relative" style={{minHeight:0}}>
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-2 z-10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Loading canvas</span>
          </div>
        )}
        <canvas ref={canvasRef} className="block"/>
      </div>

      {/* STATUS BAR */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-3 text-[9px] text-gray-400">
          <span>Tool: <span className="font-medium text-gray-600">{activeTool}</span></span>
          <span>Size: {brushSize}px</span>
          <span>Opacity: {opacity}%</span>
          <span>Zoom: {zoom}%</span>
          <span>Undo: {undoStack.length}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-gray-400">
          {saving && <span className="text-amber-500 animate-pulse">● Saving…</span>}
          {!saving && savedAt && <span className="text-emerald-500">✓ Saved {savedAt}</span>}
          <span className="font-mono">{roomIdState.substring(0,8)}</span>
        </div>
      </div>
    </div>
  );
}