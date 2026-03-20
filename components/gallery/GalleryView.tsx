// components/gallery/GalleryView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { DbView } from "@/components/DatabaseViewTabs";
import AddPropertyModal  from "./AddPropertyModal";
import GalleryItemModal  from "./GalleryItemModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SpinnerFullscreen } from "../ui/spinner";
import { Plus } from "lucide-react";

/* ── Types ── */
type Property = { _id:string; databaseId:string; name:string; type:string; options?:any[]; };
type Item     = { _id:string; databaseId:string; title?:string; assignee?:string; status?:string; values:Record<string,unknown>; };

/* ── Status config ── */
const STATUS_COLS = [
  { id:"Not started", dot:"#6b7280", bg_d:"#13151b", bg_l:"#f3f4f6", card_d:"#1c1f28", card_l:"#ffffff" },
  { id:"In progress", dot:"#3b82f6", bg_d:"#0e1520", bg_l:"#eff6ff", card_d:"#121d2e", card_l:"#ffffff" },
  { id:"Done",        dot:"#10b981", bg_d:"#0c1a12", bg_l:"#ecfdf5", card_d:"#101f15", card_l:"#ffffff" },
  { id:"Blocked",     dot:"#ef4444", bg_d:"#1a0e0e", bg_l:"#fef2f2", card_d:"#220f0f", card_l:"#ffffff" },
];

const PRI_CLS: Record<string,{d:string;l:string}> = {
  High:   { d:"bg-red-950/60     text-red-400     border border-red-800/50",     l:"bg-red-100     text-red-700     border border-red-200"     },
  Medium: { d:"bg-amber-950/60   text-amber-400   border border-amber-800/50",   l:"bg-amber-100   text-amber-700   border border-amber-200"   },
  Low:    { d:"bg-emerald-950/60 text-emerald-400 border border-emerald-800/50", l:"bg-emerald-100 text-emerald-700 border border-emerald-200" },
};

const BAR_GRAD: Record<string,string> = {
  "Not started": "linear-gradient(to right,#0d9488,#10b981)",
  "In progress": "linear-gradient(to right,#3b82f6,#0d9488)",
  "Done":        "linear-gradient(to right,#10b981,#14b8a6)",
  "Blocked":     "linear-gradient(to right,#ef4444,#f97316)",
};

/* ══════════════════════════════════════════════════════════════
   BY STATUS — progress card kanban for Gallery view
══════════════════════════════════════════════════════════════ */
function ByStatusKanban({ items, properties, isDark, onItemClick }: {
  items: Item[]; properties: Property[]; isDark: boolean; onItemClick: (item:Item)=>void;
}) {
  const statusProp   = properties.find((p)=>p.name==="Status");
  const priorityProp = properties.find((p)=>p.name==="Priority"||p.name==="priority");
  const progressProp = properties.find((p)=>p.name.toLowerCase()==="progress"||p.type==="number");

  const grouped = useMemo(() => {
    const map: Record<string,Item[]> = {};
    STATUS_COLS.forEach((c)=>{ map[c.id]=[]; });
    items.forEach((it)=>{
      const s = statusProp ? String(it.values?.[statusProp._id]||it.status||"Not started") : (it.status||"Not started");
      if(!map[s]) map[s]=[];
      map[s].push(it);
    });
    return map;
  }, [items, statusProp]);

  function ProgressCard({ item, col }: { item:Item; col:typeof STATUS_COLS[0] }) {
    const [editProg, setEditProg] = useState(false);
    const title    = item.title || "Untitled";
    const priority = priorityProp ? String(item.values?.[priorityProp._id]||"Medium") : "Medium";
    const rawProg  = progressProp ? Number(item.values?.[progressProp._id]||0) :
                     col.id==="Done" ? 100 : 0;
    const [progress, setProgress] = useState(Math.min(100,Math.max(0,rawProg)));
    const priCls   = isDark ? (PRI_CLS[priority]?.d||PRI_CLS.Medium.d) : (PRI_CLS[priority]?.l||PRI_CLS.Medium.l);
    const cardBg   = isDark ? col.card_d : col.card_l;
    const barGrad  = BAR_GRAD[col.id]||BAR_GRAD["Not started"];

    return (
      <div
        onClick={()=>onItemClick(item)}
        style={{
          background:cardBg,
          border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}`,
          borderRadius:14, padding:"14px", cursor:"pointer",
          transition:"border-color 0.15s",
        }}
        onMouseEnter={(e)=>(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.16)":"rgba(0,0,0,0.13)"}
        onMouseLeave={(e)=>(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}
      >
        <p style={{ fontSize:13, fontWeight:600, color:isDark?"#f1f5f9":"#111827", lineHeight:1.4, marginBottom:12 }}>
          {title}
        </p>
        <p style={{ fontSize:11, color:isDark?"#6b7280":"#9ca3af", marginBottom:5, fontVariantNumeric:"tabular-nums" }}>
          {progress}%
        </p>
        {editProg ? (
          <input type="range" min={0} max={100} step={5} value={progress} autoFocus
            onClick={(e)=>e.stopPropagation()}
            onChange={(e)=>setProgress(Number(e.target.value))}
            onBlur={()=>setEditProg(false)}
            style={{ width:"100%", marginBottom:10, accentColor:"#0d9488", cursor:"pointer", display:"block" }}/>
        ) : (
          <div onClick={(e)=>{e.stopPropagation();setEditProg(true);}} title="Click to adjust"
            style={{ width:"100%", height:6, borderRadius:999, marginBottom:10,
              background:isDark?"rgba(255,255,255,0.08)":"#e5e7eb", overflow:"hidden", cursor:"pointer" }}>
            <div style={{ height:"100%", borderRadius:999, background:barGrad,
              width:`${progress}%`, minWidth:progress>0?6:0, transition:"width 0.4s" }}/>
          </div>
        )}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${priCls}`}>
          {priority}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", gap:14, overflowX:"auto", alignItems:"flex-start", padding:"12px 4px 4px" }}>
      {STATUS_COLS.map((col)=>{
        const colItems = grouped[col.id]??[];
        const colBg    = isDark?col.bg_d:col.bg_l;
        return (
          <div key={col.id} style={{
            flex:1, minWidth:230, maxWidth:320, background:colBg, borderRadius:18,
            display:"flex", flexDirection:"column",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"13px 14px 10px" }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:col.dot, flexShrink:0 }}/>
              <span style={{ fontSize:13, fontWeight:700, color:isDark?"#e2e8f0":"#1f2937" }}>{col.id}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:999,
                background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)", color:isDark?"#6b7280":"#9ca3af" }}>
                {colItems.length}
              </span>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"0 10px", minHeight:60 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:9, paddingBottom:8 }}>
                {colItems.map((it)=><ProgressCard key={it._id} item={it} col={col}/>)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   GalleryView — main export
══════════════════════════════════════════════════════════════ */
export default function GalleryView({
  databaseId, activeViewId, activeView,
}: { databaseId:string; activeViewId?:string; activeView?:DbView; }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [properties,    setProperties]    = useState<Property[]>([]);
  const [items,         setItems]         = useState<Item[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showAddProp,   setShowAddProp]   = useState(false);
  const [selectedItem,  setSelectedItem]  = useState<Item|null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const fetchAll = useCallback(async () => {
    const [pRes, iRes] = await Promise.all([
      fetch(`/api/properties?databaseId=${databaseId}`),
      fetch(`/api/items?databaseId=${databaseId}`),
    ]);
    setProperties(await pRes.json());
    setItems(await iRes.json());
  }, [databaseId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [pRes, iRes] = await Promise.all([
        fetch(`/api/properties?databaseId=${databaseId}`),
        fetch(`/api/items?databaseId=${databaseId}`),
      ]);
      if (mounted) {
        setProperties(await pRes.json());
        setItems(await iRes.json());
        setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [databaseId]);

  const assigneeProp = useMemo(()=>properties.find((p)=>p.type==="person"), [properties]);

  /* ── filter for my-tasks ── */
  const filteredItems = useMemo(() => {
    if (!activeView || activeView.type === "all") return items;
    if (activeView.type === "my-tasks") {
      return items.filter((it)=>{
        const a = assigneeProp ? it.values?.[assigneeProp._id] : it.assignee;
        return a==="me"||a==="You";
      });
    }
    return items;
  }, [items, activeView, assigneeProp]);

  const createItem = async () => {
    const res     = await fetch("/api/items", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ databaseId, values:{} }),
    });
    const created = await res.json();
    setItems((prev)=>[created,...prev]);
  };

  const renderValue = (prop: Property, value: unknown): string => {
    if (!value) return "";
    if (prop.type === "multi_select" && Array.isArray(value)) return value.join(", ");
    if (prop.type === "date") {
      try { return new Date(value as string).toLocaleDateString(); } catch { return String(value); }
    }
    return String(value);
  };

  if (loading) return <SpinnerFullscreen text="Loading gallery…"/>;

  /* ── BY STATUS → progress kanban ── */
  if (activeView?.type === "by-status") {
    return (
      <div className={`overflow-hidden ${isDark?"bg-black border-white":"bg-gray-100 border-gray-200"}`}>
        <div className="p-4">
          <ByStatusKanban
            items={items} properties={properties} isDark={isDark}
            onItemClick={(it)=>{ setSelectedItem(it); setShowItemModal(true); }}
          />
        </div>
        {showItemModal && selectedItem && (
          <GalleryItemModal isOpen={showItemModal}
            onClose={()=>{ setShowItemModal(false); setSelectedItem(null); }}
            item={selectedItem} databaseId={databaseId}
            properties={properties} onSaved={fetchAll}/>
        )}
      </div>
    );
  }

  /* ── MY TASKS + ALL ITEMS → card grid ── */
  return (
    <Card className={`overflow-hidden ${isDark?"bg-black border-white":"bg-gray-100 border-gray-200"}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Gallery</CardTitle>
          {activeView && activeView.type !== "all" && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark?"bg-gray-800 text-gray-400":"bg-gray-100 text-gray-500"}`}>
              {activeView.label}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={()=>setShowAddProp(true)}>+ Property</Button>
          <Button size="sm" onClick={createItem}><Plus className="mr-2 h-4 w-4"/>New</Button>
        </div>
      </CardHeader>
      <Separator/>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length === 0 && (
            <div className="col-span-full py-14 text-center text-muted-foreground">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-lg font-medium">
                {activeView?.type==="my-tasks" ? "No items assigned to you." : "No items yet"}
              </div>
            </div>
          )}
          {filteredItems.map((it) => {
            const title       = it.title || "Untitled";
            const filledProps = properties
              .filter((p)=>{ const v=it.values?.[p._id]; return renderValue(p,v).trim()!==""; })
              .slice(0,4);
            return (
              <Card key={it._id}
                onClick={()=>{ setSelectedItem(it); setShowItemModal(true); }}
                className={`cursor-pointer transition border ${
                  isDark?"bg-transparent border-white hover:bg-gray-800":"bg-rose-50 border-gray-200 hover:bg-rose-100"
                }`}>
                <CardContent className="p-4 space-y-3">
                  <div className="text-base font-semibold line-clamp-2">{title}</div>
                  <div className="space-y-2 text-sm">
                    {filledProps.map((p)=>{
                      const v=it.values?.[p._id]; const text=renderValue(p,v);
                      return (
                        <div key={p._id} className="flex items-start gap-2">
                          <Badge variant="secondary" className="shrink-0">{p.name}</Badge>
                          <div className="font-medium line-clamp-2 text-muted-foreground">{text}</div>
                        </div>
                      );
                    })}
                    {filledProps.length===0&&(
                      <div className="text-xs italic text-muted-foreground">Click to add details</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>

      {showAddProp && (
        <AddPropertyModal isOpen={showAddProp} onClose={()=>setShowAddProp(false)}
          databaseId={databaseId} onSaved={fetchAll}/>
      )}
      {showItemModal && selectedItem && (
        <GalleryItemModal isOpen={showItemModal}
          onClose={()=>{ setShowItemModal(false); setSelectedItem(null); }}
          item={selectedItem} databaseId={databaseId}
          properties={properties} onSaved={fetchAll}/>
      )}
    </Card>
  );
}