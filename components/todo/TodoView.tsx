// components/todo/TodoView.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import TodoTaskModal from "./TodoTaskModal";
import type { DbView } from "@/components/DatabaseViewTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

/* ── Types ── */
type Property = { _id:string; databaseId:string; name:string; type:string; options?:string[]; };
type Task     = { _id:string; databaseId:string; title?:string; completed?:boolean; values:Record<string,unknown>; };

/* ── Status config ── */
const STATUS_COLS = [
  { id:"Not started",        dot:"#6b7280", bg_d:"#13151b", bg_l:"#f3f4f6", card_d:"#1c1f28", card_l:"#ffffff" },
  { id:"In progress",        dot:"#3b82f6", bg_d:"#0e1520", bg_l:"#eff6ff", card_d:"#121d2e", card_l:"#ffffff" },
  { id:"Done",               dot:"#10b981", bg_d:"#0c1a12", bg_l:"#ecfdf5", card_d:"#101f15", card_l:"#ffffff" },
  { id:"Blocked",            dot:"#ef4444", bg_d:"#1a0e0e", bg_l:"#fef2f2", card_d:"#220f0f", card_l:"#ffffff" },
];

const PRI_CLS: Record<string, { d:string; l:string }> = {
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
   BY STATUS — progress cards kanban (matches screenshot)
══════════════════════════════════════════════════════════════ */
function ByStatusKanban({ tasks, properties, isDark, onOpenTask }: {
  tasks: Task[]; properties: Property[]; isDark: boolean;
  onOpenTask: (id: string) => void;
}) {
  const statusProp   = properties.find((p) => p.name === "Status");
  const priorityProp = properties.find((p) => p.type === "select" && p.name !== "Status");

  /* group by status value */
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUS_COLS.forEach((c) => { map[c.id] = []; });
    tasks.forEach((t) => {
      const s = statusProp ? String(t.values?.[statusProp._id] || "Not started") : "Not started";
      if (!map[s]) map[s] = [];
      map[s].push(t);
    });
    return map;
  }, [tasks, statusProp]);

  /* progress: % of completed tasks in each status group — or read a progress value */
  const getProgress = (t: Task) => {
    const v = t.values;
    /* look for a numeric progress field */
    for (const key of Object.keys(v)) {
      const val = v[key];
      if (typeof val === "number" && val >= 0 && val <= 100) return val;
    }
    /* fallback: completed = 100 */
    return t.completed ? 100 : 0;
  };

  function ProgressCard({ task, col }: { task: Task; col: typeof STATUS_COLS[0] }) {
    const [editProg, setEditProg] = useState(false);
    const [progress, setProgress] = useState(getProgress(task));
    const title    = task.title || "Untitled";
    const priority = priorityProp ? String(task.values?.[priorityProp._id] || "Medium") : "Medium";
    const priCls   = isDark ? (PRI_CLS[priority]?.d || PRI_CLS.Medium.d) : (PRI_CLS[priority]?.l || PRI_CLS.Medium.l);
    const cardBg   = isDark ? col.card_d : col.card_l;
    const barGrad  = BAR_GRAD[col.id] || BAR_GRAD["Not started"];

    return (
      <div
        onClick={() => onOpenTask(task._id)}
        style={{
          background:cardBg,
          border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}`,
          borderRadius:14, padding:"14px", cursor:"pointer",
          transition:"border-color 0.15s",
        }}
        onMouseEnter={(e)=>(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.15)"}
        onMouseLeave={(e)=>(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}
      >
        {/* checkbox + title */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
          <input type="checkbox" checked={!!task.completed} readOnly
            onClick={(e)=>e.stopPropagation()}
            style={{ marginTop:2, accentColor:"#0d9488", width:14, height:14, flexShrink:0, cursor:"pointer" }}/>
          <p style={{
            fontSize:13, fontWeight:600, lineHeight:1.45,
            color: isDark?"#f1f5f9":"#111827",
            textDecoration: task.completed ? "line-through" : "none",
            opacity: task.completed ? 0.5 : 1,
          }}>
            {title}
          </p>
        </div>

        {/* progress % */}
        <p style={{ fontSize:11, color:isDark?"#6b7280":"#9ca3af", marginBottom:5, fontVariantNumeric:"tabular-nums" }}>
          {progress}%
        </p>

        {/* progress bar */}
        {editProg ? (
          <input type="range" min={0} max={100} step={5} value={progress} autoFocus
            onClick={(e)=>e.stopPropagation()}
            onChange={(e)=>setProgress(Number(e.target.value))}
            onBlur={()=>setEditProg(false)}
            style={{ width:"100%", marginBottom:10, accentColor:"#0d9488", cursor:"pointer", display:"block" }}/>
        ) : (
          <div
            onClick={(e)=>{e.stopPropagation();setEditProg(true);}}
            title="Click to adjust progress"
            style={{
              width:"100%", height:6, borderRadius:999, marginBottom:10,
              background:isDark?"rgba(255,255,255,0.08)":"#e5e7eb", overflow:"hidden", cursor:"pointer",
            }}
          >
            <div style={{
              height:"100%", borderRadius:999, background:barGrad,
              width:`${progress}%`, minWidth:progress>0?6:0, transition:"width 0.4s",
            }}/>
          </div>
        )}

        {/* priority badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${priCls}`}>
          {priority}
        </span>
      </div>
    );
  }

  const activeCols = STATUS_COLS.filter((c) => (grouped[c.id]?.length ?? 0) > 0 || true);

  return (
    <div style={{ display:"flex", gap:14, overflowX:"auto", alignItems:"flex-start", padding:"12px 4px 4px" }}>
      {activeCols.map((col) => {
        const colTasks = grouped[col.id] ?? [];
        const colBg    = isDark ? col.bg_d : col.bg_l;
        return (
          <div key={col.id} style={{
            flex:1, minWidth:230, maxWidth:320, background:colBg, borderRadius:18,
            display:"flex", flexDirection:"column",
          }}>
            {/* header */}
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"13px 14px 10px" }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:col.dot, flexShrink:0 }}/>
              <span style={{ fontSize:13, fontWeight:700, color:isDark?"#e2e8f0":"#1f2937" }}>{col.id}</span>
              <span style={{
                fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:999,
                background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",
                color:isDark?"#6b7280":"#9ca3af",
              }}>{colTasks.length}</span>
            </div>
            {/* cards */}
            <div style={{ flex:1, overflowY:"auto", padding:"0 10px", minHeight:60 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:9, paddingBottom:8 }}>
                {colTasks.map((t) => <ProgressCard key={t._id} task={t} col={col}/>)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TodoView — main export
══════════════════════════════════════════════════════════════ */
export default function TodoView({
  databaseId, activeViewId, activeView,
}: { databaseId:string; activeViewId?:string; activeView?:DbView; }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [loading,    setLoading]    = useState(true);
  const hasSeeded = useRef(false);

  const [open,           setOpen]           = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string|null>(null);

  /* ── Fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, tRes] = await Promise.all([
      fetch(`/api/todo/properties?databaseId=${databaseId}`),
      fetch(`/api/todo/tasks?databaseId=${databaseId}`),
    ]);
    setProperties(await pRes.json());
    setTasks(await tRes.json());
    setLoading(false);
  }, [databaseId]);

  useEffect(() => { hasSeeded.current = false; }, [databaseId]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const titleProp     = useMemo(() => properties.find((p)=>p.type==="title"),    [properties]);
  const completedProp = useMemo(() => properties.find((p)=>p.type==="checkbox"), [properties]);
  const dueDateProp   = useMemo(() => properties.find((p)=>p.type==="date"),     [properties]);
  const statusProp    = useMemo(() => properties.find((p)=>p.name==="Status"),   [properties]);
  const assigneeProp  = useMemo(() => properties.find((p)=>p.type==="person"),   [properties]);

  /* ── Seed defaults ── */
  useEffect(() => {
    const seed = async () => {
      if (!databaseId || hasSeeded.current || loading || properties.length > 0) {
        hasSeeded.current = true; return;
      }
      hasSeeded.current = true;
      const defaults = [
        { name:"Name",      type:"title" },
        { name:"Completed", type:"checkbox" },
        { name:"Due date",  type:"date" },
        { name:"Status",    type:"select", options:["Not started","In progress","Done","Blocked"] },
        { name:"Assignee",  type:"person" },
        { name:"Priority",  type:"select", options:["Low","Medium","High"] },
      ];
      await Promise.all(defaults.map((p) =>
        fetch("/api/todo/properties", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ databaseId, ...p }),
        })
      ));
      fetchAll();
    };
    seed();
  }, [databaseId, loading, properties.length, fetchAll]);

  /* ── Create task ── */
  const createTask = async () => {
    const values: Record<string,unknown> = {};
    if (titleProp)     values[titleProp._id]     = "";
    if (completedProp) values[completedProp._id] = false;
    const res     = await fetch("/api/todo/tasks", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ databaseId, title:"New task", values }),
    });
    const created = await res.json();
    setTasks((prev) => [created, ...prev]);
    setSelectedTaskId(created._id); setOpen(true);
  };

  const toggleCompleted = async (task: Task) => {
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => t._id===task._id ? {...t,completed:newCompleted} : t));
    await fetch(`/api/todo/tasks/${task._id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ completed: newCompleted }),
    });
  };

  /* ── Filtered tasks by view ── */
  const filteredTasks = useMemo(() => {
    if (!activeView || activeView.type === "all") return tasks;
    if (activeView.type === "my-tasks") {
      return tasks.filter((t) => {
        const a = assigneeProp ? t.values?.[assigneeProp._id] : null;
        return a === "me" || a === "You";
      });
    }
    return tasks; // by-status handled in ByStatusKanban
  }, [tasks, activeView, assigneeProp]);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  /* ── BY STATUS → progress kanban ── */
  if (activeView?.type === "by-status") {
    return (
      <div className="p-3">
        <ByStatusKanban
          tasks={tasks}
          properties={properties}
          isDark={isDark}
          onOpenTask={(id) => { setSelectedTaskId(id); setOpen(true); }}
        />
        <TodoTaskModal isOpen={open} onClose={()=>setOpen(false)}
          databaseId={databaseId} taskId={selectedTaskId}
          properties={properties} onUpdated={fetchAll}/>
      </div>
    );
  }

  /* ── MY TASKS → flat filtered list with progress ── */
  if (activeView?.type === "my-tasks") {
    return (
      <>
        <div className="p-4 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
              <span className="text-4xl mb-3 opacity-30">🎯</span>
              No tasks assigned to you.
            </div>
          ) : filteredTasks.map((task) => {
            const title    = task.title || "Untitled";
            const done     = task.completed || false;
            const progress = done ? 100 : 0;
            const priProp  = properties.find((p)=>p.name==="Priority");
            const priority = priProp ? String(task.values?.[priProp._id]||"Medium") : "Medium";
            const priCls   = isDark ? (PRI_CLS[priority]?.d||PRI_CLS.Medium.d) : (PRI_CLS[priority]?.l||PRI_CLS.Medium.l);
            return (
              <div key={task._id}
                style={{
                  background:isDark?"#1c1f28":"#ffffff",
                  border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}`,
                  borderRadius:14, padding:"14px", cursor:"pointer",
                }}
                onClick={()=>{ setSelectedTaskId(task._id); setOpen(true); }}
              >
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                  <input type="checkbox" checked={!!done}
                    onClick={(e)=>{ e.stopPropagation(); toggleCompleted(task); }}
                    readOnly style={{ marginTop:2, width:14, height:14, accentColor:"#0d9488", cursor:"pointer", flexShrink:0 }}/>
                  <p style={{ fontSize:13, fontWeight:600, color:isDark?"#f1f5f9":"#111827",
                    textDecoration:done?"line-through":"none", opacity:done?0.5:1, lineHeight:1.4 }}>
                    {title}
                  </p>
                </div>
                <p style={{ fontSize:11, color:isDark?"#6b7280":"#9ca3af", marginBottom:5 }}>{progress}%</p>
                <div style={{ width:"100%", height:6, borderRadius:999, marginBottom:10,
                  background:isDark?"rgba(255,255,255,0.08)":"#e5e7eb", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:999, width:`${progress}%`,
                    background:"linear-gradient(to right,#0d9488,#10b981)", transition:"width 0.4s" }}/>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${priCls}`}>
                  {priority}
                </span>
              </div>
            );
          })}
        </div>
        <TodoTaskModal isOpen={open} onClose={()=>setOpen(false)}
          databaseId={databaseId} taskId={selectedTaskId}
          properties={properties} onUpdated={fetchAll}/>
      </>
    );
  }

  /* ── ALL TASKS → original checkbox list ── */
  return (
    <>
      <Card className={`${isDark?"bg-black border-white":"bg-gray-100"} rounded-xl border overflow-hidden`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>To-do</CardTitle>
          <Button onClick={createTask} size="sm"><Plus className="mr-2 h-4 w-4"/>New</Button>
        </CardHeader>
        <Separator/>
        <CardContent className="p-0">
          <ScrollArea className="h-[360px]">
            <div className="p-4 space-y-2">
              {filteredTasks.map((task) => {
                const title   = task.title || "";
                const done    = task.completed || false;
                const dueDate = dueDateProp ? task.values?.[dueDateProp._id] : "";
                return (
                  <div key={task._id}
                    className={`flex items-center border gap-3 px-3 py-2 rounded-md ${
                      isDark?"bg-black border-white hover:bg-gray-600":"bg-rose-50 hover:bg-rose-100"
                    } hover:text-gray-800 dark:hover:text-gray-100`}>
                    <Checkbox checked={!!done} onCheckedChange={()=>toggleCompleted(task)}/>
                    <button onClick={()=>{ setSelectedTaskId(task._id); setOpen(true); }} className="flex-1 text-left">
                      <div className={["text-sm font-medium", done?"line-through text-muted-foreground":"", !title?"text-gray-400 italic":""].join(" ")}>
                        {title || "New task"}
                      </div>
                    </button>
                    {dueDateProp && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 min-w-[120px]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        {dueDate ? new Date(dueDate as string).toLocaleDateString() : "No date"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <TodoTaskModal isOpen={open} onClose={()=>setOpen(false)}
        databaseId={databaseId} taskId={selectedTaskId}
        properties={properties} onUpdated={fetchAll}/>
    </>
  );
}