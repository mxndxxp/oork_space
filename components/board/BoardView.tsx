// components/board/BoardView.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Plus, MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import type { DbView } from "@/components/DatabaseViewtabs";
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── Types ── */
interface Tag  { label: string; color: string; }
interface Task {
  id:        UniqueIdentifier;
  title:     string;
  tags:      Tag[];
  date:      string;
  avatars:   string[];
  assignee?: string;
  status?:   string;
  priority?: "Low" | "Medium" | "High";
  progress?: number;   // 0-100
}
interface Column { id: UniqueIdentifier; title: string; color: string; tasks: Task[]; }

/* ── Static demo data ── */
const INITIAL_COLUMNS: Column[] = [
  {
    id: "todo", title: "To Do", color: "indigo",
    tasks: [
      { id:1, title:"Logo Idea's visualizations from brainstorming session.", tags:[{label:"Important",color:"pink"},{label:"Visualization",color:"yellow"}], date:"Jan 20 - 25", avatars:["bg-purple-500","bg-blue-500","bg-green-500"], assignee:"me",   status:"To Do",        priority:"High",   progress:0  },
      { id:2, title:"Generate proposed colours for initiating proposal.",     tags:[{label:"Important",color:"pink"},{label:"Conceptualization",color:"cyan"}], date:"Feb 21 - 25", avatars:["bg-blue-500","bg-purple-500"], assignee:"Alice", status:"To Do",        priority:"Medium", progress:20 },
      { id:3, title:"Make a budget proposal ASAP",                            tags:[{label:"Finance",color:"gray"},{label:"Budget",color:"lime"}], date:"Mar 01 - 25", avatars:["bg-green-500","bg-blue-500"], assignee:"me",   status:"To Do",        priority:"Low",    progress:0  },
    ],
  },
  {
    id: "working", title: "Working in progress", color: "amber",
    tasks: [
      { id:5, title:"Define brand tone and messaging guidelines",         tags:[{label:"High",color:"red"},{label:"UI design",color:"yellow"}], date:"Mar 20 - 25", avatars:["bg-blue-500","bg-purple-500"], assignee:"me",   status:"Working in progress", priority:"High",   progress:60 },
      { id:6, title:"Outline a marketing plan for the Super Bowl launch", tags:[{label:"Medium",color:"orange"},{label:"Off track",color:"red"}], date:"Jan 16 - 25", avatars:["bg-green-500","bg-blue-500"], assignee:"Bob", status:"Working in progress", priority:"Medium", progress:35 },
    ],
  },
  {
    id: "inprogress", title: "In Progress", color: "blue",
    tasks: [
      { id:8, title:"Draft a press release for the brand relaunch",    tags:[{label:"Low",color:"cyan"},{label:"Visualization",color:"yellow"}], date:"Mar 25 - 25", avatars:["bg-purple-500","bg-blue-500"], assignee:"me",   status:"In Progress", priority:"Medium", progress:75 },
      { id:9, title:"Coordinate with vendors for production materials", tags:[{label:"High",color:"red"},{label:"Visualization",color:"yellow"}],  date:"Mar 25 - 25", avatars:["bg-green-500","bg-blue-500"], assignee:"Alice", status:"In Progress", priority:"High",   progress:50 },
    ],
  },
  {
    id: "done", title: "Done", color: "emerald",
    tasks: [
      { id:10, title:"Logo Idea's visualizations from brainstorming session.", tags:[{label:"Important",color:"pink"},{label:"Visualization",color:"yellow"}], date:"Jan 20 - 25", avatars:["bg-purple-500","bg-blue-500","bg-green-500"], assignee:"me",   status:"Done", priority:"Low",  progress:100 },
      { id:11, title:"Define brand tone and messaging guidelines",             tags:[{label:"High",color:"red"},{label:"UI design",color:"yellow"}],           date:"Mar 20 - 25", avatars:["bg-blue-500","bg-purple-500"], assignee:"Bob", status:"Done", priority:"High", progress:100 },
    ],
  },
];

/* ── Status config for By Status view ── */
const STATUS_COLS: { id: string; label: string; dot: string; bg: { dark:string; light:string }; card: { dark:string; light:string } }[] = [
  {
    id:"To Do", label:"To Do", dot:"#6b7280",
    bg:   { dark:"#13151b", light:"#f3f4f6" },
    card: { dark:"#1c1f28", light:"#ffffff"  },
  },
  {
    id:"Working in progress", label:"Working in progress", dot:"#f59e0b",
    bg:   { dark:"#171208", light:"#fffbeb" },
    card: { dark:"#221a08", light:"#ffffff"  },
  },
  {
    id:"In Progress", label:"In Progress", dot:"#3b82f6",
    bg:   { dark:"#0e1520", light:"#eff6ff" },
    card: { dark:"#121d2e", light:"#ffffff"  },
  },
  {
    id:"Done", label:"Done", dot:"#10b981",
    bg:   { dark:"#0c1a12", light:"#ecfdf5" },
    card: { dark:"#101f15", light:"#ffffff"  },
  },
];

/* ── Priority badge colours ── */
const PRI: Record<string, { dark:string; light:string }> = {
  Low:    { dark:"bg-emerald-950/60 text-emerald-400 border border-emerald-800/50", light:"bg-emerald-100 text-emerald-700 border border-emerald-200" },
  Medium: { dark:"bg-amber-950/60   text-amber-400   border border-amber-800/50",   light:"bg-amber-100   text-amber-700   border border-amber-200"   },
  High:   { dark:"bg-red-950/60     text-red-400     border border-red-800/50",     light:"bg-red-100     text-red-700     border border-red-200"     },
};

/* ── Tag colours ── */
function getTagCls(color: string, isDark: boolean) {
  const map: Record<string, string> = {
    pink:   isDark ? "bg-pink-500/20 text-pink-300"   : "bg-pink-100 text-pink-700",
    yellow: isDark ? "bg-yellow-500/20 text-yellow-300": "bg-yellow-100 text-yellow-700",
    cyan:   isDark ? "bg-cyan-500/20 text-cyan-300"   : "bg-cyan-100 text-cyan-700",
    gray:   isDark ? "bg-gray-500/20 text-gray-300"   : "bg-gray-100 text-gray-700",
    lime:   isDark ? "bg-lime-500/20 text-lime-300"   : "bg-lime-100 text-lime-700",
    red:    isDark ? "bg-red-500/20 text-red-300"     : "bg-red-100 text-red-700",
    orange: isDark ? "bg-orange-500/20 text-orange-300": "bg-orange-100 text-orange-700",
  };
  return map[color] ?? (isDark ? "bg-gray-500/20 text-gray-300" : "bg-gray-100 text-gray-700");
}

/* ── Utility ── */
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [el] = next.splice(from, 1);
  next.splice(to, 0, el);
  return next;
}
function findCol(cols: Column[], id: UniqueIdentifier) {
  return cols.find((c) => c.id === id) ?? cols.find((c) => c.tasks.some((t) => t.id === id));
}

/* ══════════════════════════════════════════════════════════════
   BY STATUS VIEW — Kanban with progress bars
   (matches the screenshot with progress % + bar + priority badge)
══════════════════════════════════════════════════════════════ */
function ByStatusKanban({ isDark, tasks }: { isDark: boolean; tasks: Task[] }) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  /* group tasks by status */
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUS_COLS.forEach((c) => { map[c.id] = []; });
    localTasks.forEach((t) => {
      const s = t.status || "To Do";
      if (!map[s]) map[s] = [];
      map[s].push(t);
    });
    return map;
  }, [localTasks]);

  const moveTask = (taskId: UniqueIdentifier, toStatus: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: toStatus } : t)
    );
  };

  const setProgress = (taskId: UniqueIdentifier, progress: number) => {
    setLocalTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, progress } : t)
    );
  };

  /* ── Status card ── */
  function StatusCard({ task, statusCol }: { task: Task; statusCol: typeof STATUS_COLS[0] }) {
    const [dragging,    setDragging]    = useState(false);
    const [editingProg, setEditingProg] = useState(false);
    const progress = task.progress ?? 0;
    const priority = task.priority || "Medium";
    const priCls   = isDark ? PRI[priority]?.dark : PRI[priority]?.light;

    /* bar gradient per status */
    const barGrad =
      statusCol.id === "Done"               ? "from-emerald-500 to-teal-400" :
      statusCol.id === "In Progress"        ? "from-blue-500 to-teal-500"    :
      statusCol.id === "Working in progress"? "from-amber-500 to-orange-400" :
                                              "from-teal-600 to-emerald-500";

    const cardBg   = isDark ? statusCol.card.dark : statusCol.card.light;
    const cardBord = isDark
      ? `1px solid rgba(255,255,255,${dragging ? "0.15" : "0.07"})`
      : `1px solid rgba(0,0,0,${dragging ? "0.12" : "0.06"})`;

    return (
      <div
        draggable
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        style={{
          background: cardBg,
          border: cardBord,
          borderRadius: 14,
          padding: "14px 14px 12px",
          cursor: "grab",
          opacity: dragging ? 0.5 : 1,
          transition: "border-color 0.15s, opacity 0.15s",
          position: "relative",
        }}
      >
        {/* Title */}
        <p style={{ fontSize:13, fontWeight:600, color: isDark?"#f1f5f9":"#111827",
          lineHeight:1.45, marginBottom:12 }}>
          {task.title}
        </p>

        {/* Progress % */}
        <p style={{ fontSize:11, color: isDark?"#6b7280":"#9ca3af",
          marginBottom:6, fontVariantNumeric:"tabular-nums" }}>
          {progress}%
        </p>

        {/* Progress bar — click to edit */}
        {editingProg ? (
          <input
            type="range" min={0} max={100} step={5} value={progress}
            autoFocus
            onChange={(e) => setProgress(task.id, Number(e.target.value))}
            onBlur={() => setEditingProg(false)}
            onClick={(e) => e.stopPropagation()}
            style={{ width:"100%", marginBottom:10, accentColor:"#0d9488", cursor:"pointer", display:"block" }}
          />
        ) : (
          <div
            onClick={(e) => { e.stopPropagation(); setEditingProg(true); }}
            title="Click to adjust progress"
            style={{
              width:"100%", height:6, borderRadius:999, marginBottom:10,
              background: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
              overflow:"hidden", cursor:"pointer",
            }}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barGrad} transition-all duration-500`}
              style={{ width:`${progress}%`, minWidth: progress > 0 ? 6 : 0 }}
            />
          </div>
        )}

        {/* Priority badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${priCls}`}>
          {priority}
        </span>
      </div>
    );
  }

  /* ── Status column ── */
  function StatusColumn({ col }: { col: typeof STATUS_COLS[0] }) {
    const colTasks  = grouped[col.id] ?? [];
    const [over, setOver] = useState(false);
    const bgCol = isDark ? col.bg.dark : col.bg.light;

    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
        onDrop={(e) => {
          e.preventDefault(); setOver(false);
          /* find which task was being dragged — check data-taskid on dragged el */
          const id = Number((e.dataTransfer as any)._taskId ?? 0);
          /* fallback: we track via closure in each card's dragStart */
        }}
        style={{
          flex:1, minWidth:240, maxWidth:340,
          background: bgCol,
          borderRadius:18, display:"flex", flexDirection:"column",
          outline: over ? "2px solid rgba(59,130,246,0.4)" : "2px solid transparent",
          transition:"outline 0.15s",
        }}
      >
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 16px 10px" }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:col.dot, flexShrink:0 }}/>
          <span style={{ fontSize:14, fontWeight:700, color: isDark?"#e2e8f0":"#1f2937" }}>
            {col.label}
          </span>
          <span style={{
            fontSize:12, fontWeight:700,
            padding:"1px 8px", borderRadius:999,
            background: isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",
            color: isDark?"#6b7280":"#9ca3af",
          }}>
            {colTasks.length}
          </span>
        </div>

        {/* Cards */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 12px", minHeight:80 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:10, paddingBottom:8 }}>
            {colTasks.map((t) => (
              <StatusCard key={t.id} task={t} statusCol={col}/>
            ))}
            {over && (
              <div style={{
                height:52, borderRadius:12,
                border:"2px dashed rgba(59,130,246,0.3)",
                background:"rgba(59,130,246,0.04)",
              }}/>
            )}
          </div>
        </div>

        {/* Add button */}
        <div style={{ padding:"6px 12px 12px" }}>
          <button style={{
            width:"100%", display:"flex", alignItems:"center", gap:8,
            padding:"9px 14px", borderRadius:12, fontSize:12, fontWeight:700,
            border:`1.5px dashed ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)"}`,
            background:"none", cursor:"pointer",
            color: isDark?"#374151":"#d1d5db",
            transition:"all 0.15s",
          }}
          onMouseEnter={(e)=>{
            (e.currentTarget as HTMLElement).style.color = col.dot;
            (e.currentTarget as HTMLElement).style.borderColor = col.dot;
          }}
          onMouseLeave={(e)=>{
            (e.currentTarget as HTMLElement).style.color = isDark?"#374151":"#d1d5db";
            (e.currentTarget as HTMLElement).style.borderColor = isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)";
          }}
          >
            <Plus size={13}/>
            Add task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", gap:14, overflowX:"auto", alignItems:"flex-start", paddingBottom:12 }}>
      {STATUS_COLS.map((col) => (
        <StatusColumn key={col.id} col={col}/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALL TASKS — draggable Kanban (original)
══════════════════════════════════════════════════════════════ */
function KanbanTask({ task, isDark, getTagColor }: { task:Task; isDark:boolean; getTagColor:(c:string)=>string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform:CSS.Transform.toString(transform), transition, zIndex:isDragging?10:"auto", opacity:isDragging?0.5:1 }}
      {...attributes} {...listeners}
      className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-grab ${
        isDark ? "bg-[#1F2125] border-gray-800 hover:border-gray-700" : "bg-white border-rose-100 hover:border-rose-200"
      }`}
    >
      <h3 className={`font-medium text-sm mb-3 leading-snug ${isDark?"text-gray-200":"text-gray-800"}`}>{task.title}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {task.tags.map((tag,i) => (
          <span key={i} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getTagColor(tag.color)}`}>{tag.label}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className={`flex items-center gap-1.5 text-[10px] ${isDark?"text-gray-500":"text-gray-500"}`}>
          <CalendarIcon size={12}/><span>{task.date}</span>
        </div>
        <div className="flex -space-x-1.5">
          {task.avatars.map((cls,i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 ${cls} ${isDark?"border-[#1F2125]":"border-white"}`}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, isDark, getTagColor }: { column:Column; isDark:boolean; getTagColor:(c:string)=>string }) {
  const { setNodeRef, isOver } = useSortable({ id:column.id, data:{ type:"Column" } });
  const taskIds = useMemo(() => column.tasks.map((t)=>t.id), [column.tasks]);
  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isDark?"text-gray-200":"text-gray-900"}`}>{column.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark?"bg-gray-800 text-gray-400":"bg-gray-200 text-gray-600"}`}>{column.tasks.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 ${isDark?"text-gray-400":"text-gray-500"}`}><Plus size={16}/></button>
          <button className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 ${isDark?"text-gray-400":"text-gray-500"}`}><MoreHorizontal size={16}/></button>
        </div>
      </div>
      <div className={`space-y-3 p-1 rounded-xl ${isOver?(isDark?"bg-gray-800/50":"bg-rose-50"):""}`}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanTask key={task.id} task={task} isDark={isDark} getTagColor={getTagColor}/>
          ))}
        </SortableContext>
        <button className={`w-full py-2 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs transition-colors ${
          isDark?"border-gray-800 text-gray-500 hover:bg-gray-800/50 hover:text-gray-300":"border-rose-200 text-gray-500 hover:bg-rose-50 hover:text-gray-700"
        }`}>
          <Plus size={14}/><span>Add New</span>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MY TASKS — filtered flat list
══════════════════════════════════════════════════════════════ */
function MyTasksList({ tasks, isDark }: { tasks: Task[]; isDark: boolean }) {
  const mine = tasks.filter((t) => t.assignee === "me");
  if (mine.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-sm ${isDark?"text-gray-600":"text-gray-400"}`}>
        <span className="text-4xl mb-3 opacity-40">🎯</span>
        <p>No tasks assigned to you.</p>
      </div>
    );
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {mine.map((t) => {
        const priority = t.priority || "Medium";
        const priCls   = isDark ? PRI[priority]?.dark : PRI[priority]?.light;
        const progress = t.progress ?? 0;
        return (
          <div key={t.id} style={{
            background: isDark?"#1c1f28":"#ffffff",
            border: `1px solid ${isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"}`,
            borderRadius:14, padding:"14px",
          }}>
            <p style={{ fontSize:13, fontWeight:600, color:isDark?"#f1f5f9":"#111827", marginBottom:10 }}>{t.title}</p>
            <p style={{ fontSize:11, color:isDark?"#6b7280":"#9ca3af", marginBottom:6 }}>{progress}%</p>
            <div style={{
              width:"100%", height:6, borderRadius:999, marginBottom:10,
              background: isDark?"rgba(255,255,255,0.08)":"#e5e7eb", overflow:"hidden",
            }}>
              <div style={{
                height:"100%", borderRadius:999, width:`${progress}%`,
                background:"linear-gradient(to right,#0d9488,#10b981)",
                transition:"width 0.4s",
              }}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${priCls}`}>
                {priority}
              </span>
              <span style={{ fontSize:11, color:isDark?"#6b7280":"#9ca3af" }}>{t.date}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BoardView — main export
══════════════════════════════════════════════════════════════ */
export default function BoardView({
  databaseId,
  activeViewId,
  activeView,
}: {
  databaseId?: string;
  activeViewId?: string;
  activeView?: DbView;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* flat task list for all-tasks / my-tasks */
  const allTasks = useMemo(() => columns.flatMap((c) => c.tasks), [columns]);

  /* ── determine which view to render ── */
  const viewType = activeView?.type || "all";

  const getTagColor = (color: string) => getTagCls(color, isDark);

  /* ── drag handler for All Tasks kanban ── */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeCol = findCol(columns, active.id);
    const overCol   = findCol(columns, over.id);
    if (!activeCol || !overCol) return;
    const isSame    = activeCol.id === overCol.id;
    const activeIdx = activeCol.tasks.findIndex((t) => t.id === active.id);
    let   overIdx   = overCol.tasks.findIndex((t) => t.id === over.id);
    if (overIdx === -1) overIdx = overCol.tasks.length;

    if (isSame && activeIdx !== overIdx) {
      setColumns((prev) => prev.map((col) =>
        col.id === activeCol.id ? { ...col, tasks: arrayMove(activeCol.tasks, activeIdx, overIdx) } : col
      ));
    } else if (!isSame) {
      const task = activeCol.tasks[activeIdx];
      setColumns((prev) => prev.map((col) => {
        if (col.id === activeCol.id) return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
        if (col.id === overCol.id) {
          const next = [...col.tasks];
          next.splice(overIdx, 0, task);
          return { ...col, tasks: next };
        }
        return col;
      }));
    }
  };

  const colIds = useMemo(() => columns.map((c) => c.id), [columns]);

  /* ══════ RENDER based on active view ══════ */

  /* ── By Status → Kanban with progress cards ── */
  if (viewType === "by-status") {
    return (
      <div className="p-4">
        <ByStatusKanban isDark={isDark} tasks={allTasks}/>
      </div>
    );
  }

  /* ── My Tasks → filtered list ── */
  if (viewType === "my-tasks") {
    return (
      <div className="p-4">
        <MyTasksList tasks={allTasks} isDark={isDark}/>
      </div>
    );
  }

  /* ── All Tasks → original draggable kanban ── */
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-w-max">
          <SortableContext items={colIds} strategy={verticalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn key={column.id} column={column} isDark={isDark} getTagColor={getTagColor}/>
            ))}
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}