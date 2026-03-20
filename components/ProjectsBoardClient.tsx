// FILE PATH: components/ProjectsBoardClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Trash2, X, Plus, GripVertical,
  Star, BarChart2, Filter, ArrowUpDown,
  Zap, Search, Maximize2, SlidersHorizontal,
  ChevronDown, Loader2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════════ */
type Status   = "Not started" | "In progress" | "Done";
type Priority = "Low" | "Medium" | "High";
type ViewMode = "by-status" | "all" | "gantt";

interface Project {
  _id:         string;
  name:        string;
  emoji:       string;
  status:      Status;
  priority:    Priority;
  progress:    number;
  description: string;
}

/* ══════════════════════════════════════════════════════════════
   Column config (matches screenshot colours exactly)
══════════════════════════════════════════════════════════════ */
const COLUMNS: {
  id:     Status;
  label:  string;
  dot:    string;
  colBg:  { dark: string; light: string };
  cardBg: { dark: string; light: string };
  addBtn: { dark: string; light: string };
}[] = [
  {
    id: "Not started", label: "Not started", dot: "bg-gray-400",
    colBg:  { dark: "bg-[#13151b]",       light: "bg-gray-100/60"   },
    cardBg: { dark: "bg-[#1c1f28] border border-white/[0.07] hover:border-white/[0.14]",
              light: "bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow" },
    addBtn: { dark: "border-white/10 text-gray-600 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/5",
              light: "border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50" },
  },
  {
    id: "In progress", label: "In progress", dot: "bg-blue-500",
    colBg:  { dark: "bg-[#0e1520]",       light: "bg-blue-50/40"    },
    cardBg: { dark: "bg-[#121d2e] border border-blue-900/40 hover:border-blue-700/50",
              light: "bg-white border border-blue-100 hover:border-blue-200 shadow-sm hover:shadow" },
    addBtn: { dark: "border-blue-900/40 text-blue-900 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/5",
              light: "border-blue-100 text-blue-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50" },
  },
  {
    id: "Done", label: "Done", dot: "bg-emerald-500",
    colBg:  { dark: "bg-[#0c1a12]",       light: "bg-emerald-50/40" },
    cardBg: { dark: "bg-[#101f15] border border-emerald-900/40 hover:border-emerald-700/50",
              light: "bg-white border border-emerald-100 hover:border-emerald-200 shadow-sm hover:shadow" },
    addBtn: { dark: "border-emerald-900/40 text-emerald-900 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5",
              light: "border-emerald-100 text-emerald-300 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50" },
  },
];

/* ── Priority badge styles ── */
const PRI_DARK: Record<Priority, string> = {
  Low:    "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60",
  Medium: "bg-amber-950/70   text-amber-400   border border-amber-800/60",
  High:   "bg-red-950/70     text-red-400     border border-red-800/60",
};
const PRI_LIGHT: Record<Priority, string> = {
  Low:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Medium: "bg-amber-100   text-amber-700   border border-amber-200",
  High:   "bg-red-100     text-red-700     border border-red-200",
};

/* ── Bar colour per column ── */
const BAR_COLOR: Record<Status, string> = {
  "Not started": "from-teal-600 to-emerald-500",
  "In progress": "from-blue-500 to-teal-500",
  "Done":        "from-emerald-500 to-teal-400",
};

/* ── Demo data (shows immediately, replaced by real data) ── */
const DEMO: Project[] = [
  { _id:"d1", name:"Quarterly sales planning",  emoji:"📋", status:"Not started", priority:"Medium", progress:0,  description:"" },
  { _id:"d2", name:"Public launch of iOS app",   emoji:"📱", status:"In progress", priority:"High",   progress:75, description:"" },
  { _id:"d3", name:"Revamp new hire onboarding", emoji:"👥", status:"Done",        priority:"Low",    progress:90, description:"" },
];

/* ══════════════════════════════════════════════════════════════
   Confirm Delete Modal
══════════════════════════════════════════════════════════════ */
function ConfirmDeleteModal({
  open, name, isDark, onConfirm, onCancel,
}: { open:boolean; name:string; isDark:boolean; onConfirm:()=>void; onCancel:()=>void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}/>
      <div className={`relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6 border ${
        isDark ? "bg-[#1a1b1f] border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-800"
      }`}>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 size={22} className="text-red-500"/>
        </div>
        <h3 className="text-center font-semibold text-base mb-1">Delete project?</h3>
        <p className={`text-center text-sm mb-6 ${isDark?"text-gray-400":"text-gray-500"}`}>
          <span className="font-medium">"{name}"</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${isDark?"bg-white/8 hover:bg-white/12 text-gray-300":"bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   New Project Modal
══════════════════════════════════════════════════════════════ */
function NewProjectModal({
  open, isDark, defaultStatus, onClose, onCreate,
}: {
  open: boolean; isDark: boolean; defaultStatus: Status;
  onClose: () => void;
  onCreate: (data: Pick<Project,"name"|"emoji"|"status"|"priority"|"progress"|"description">) => Promise<void>;
}) {
  const [name,     setName]     = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [status,   setStatus]   = useState<Status>(defaultStatus);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (open) { setName(""); setPriority("Medium"); setStatus(defaultStatus); }
  }, [open, defaultStatus]);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onCreate({ name:name.trim(), emoji:"📁", status, priority, progress:0, description:"" });
    setSaving(false);
    onClose();
  };

  const fieldLabel = `text-[11px] font-bold uppercase tracking-widest mb-2 block ${isDark?"text-gray-500":"text-gray-400"}`;
  const inp = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${
    isDark ? "bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/60"
           : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
  }`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6 border ${
        isDark ? "bg-[#1a1b1f] border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-800"
      }`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">New Project</h3>
          <button onClick={onClose}
            className={`p-1.5 rounded-lg ${isDark?"hover:bg-white/10":"hover:bg-gray-100"}`}>
            <X size={15}/>
          </button>
        </div>

        <div className="space-y-4">
          <input value={name} onChange={(e)=>setName(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==="Enter")submit(); if(e.key==="Escape")onClose(); }}
            placeholder="Project name…" autoFocus className={inp}/>

          {/* Status */}
          <div>
            <label className={fieldLabel}>Status</label>
            <div className="flex gap-2">
              {COLUMNS.map((col) => (
                <button key={col.id} onClick={()=>setStatus(col.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    status===col.id
                      ? isDark ? "border-blue-500/60 bg-blue-500/15 text-blue-400" : "border-blue-400 bg-blue-50 text-blue-600"
                      : isDark ? "border-white/8 text-gray-500 hover:border-white/15" : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}>
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className={fieldLabel}>Priority</label>
            <div className="flex gap-2">
              {(["Low","Medium","High"] as Priority[]).map((p) => (
                <button key={p} onClick={()=>setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    priority===p
                      ? isDark ? PRI_DARK[p] : PRI_LIGHT[p]
                      : isDark ? "border-white/8 text-gray-500 hover:border-white/15" : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={submit} disabled={!name.trim()||saving}
          className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
          Create Project
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ProjectsBoardClient  ← main exported component
══════════════════════════════════════════════════════════════ */
export default function ProjectsBoardClient() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();

  const [activeView, setActiveView]   = useState<ViewMode>("by-status");
  const [projects,   setProjects]     = useState<Project[]>(DEMO);
  const [loading,    setLoading]      = useState(true);
  const [showSearch, setShowSearch]   = useState(false);
  const [searchText, setSearchText]   = useState("");
  const [dragOver,   setDragOver]     = useState<Status|null>(null);
  const draggingId                    = useRef<string|null>(null);

  const [confirmDel, setConfirmDel]   = useState<{open:boolean;name:string;action:(()=>Promise<void>)|null}>({
    open:false, name:"", action:null,
  });
  const [newModal, setNewModal]       = useState<{open:boolean;defaultStatus:Status}>({
    open:false, defaultStatus:"Not started",
  });

  /* ── Fetch & normalise ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch("/api/projects");
        const raw: any[] = await res.json();
        if (cancelled) return;

        const data: Project[] = raw.map((p) => ({
          _id:         String(p._id),
          name:        p.name        || "Untitled",
          emoji:       p.emoji       || "📁",
          /* ← CRITICAL: fall back to "Not started" for old projects */
          status:      (["Not started","In progress","Done"].includes(p.status) ? p.status : "Not started") as Status,
          priority:    (["Low","Medium","High"].includes(p.priority) ? p.priority : "Medium") as Priority,
          progress:    typeof p.progress === "number" ? Math.max(0, Math.min(100, p.progress)) : 0,
          description: p.description || "",
        }));

        setProjects(data.length > 0 ? data : DEMO);
      } catch {
        /* keep DEMO on network error */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Filtered + grouped ── */
  const filtered = useMemo(() => {
    if (!searchText.trim()) return projects;
    const q = searchText.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, searchText]);

  const grouped = useMemo(() => {
    const m: Record<Status, Project[]> = { "Not started":[], "In progress":[], "Done":[] };
    filtered.forEach((p) => m[p.status].push(p));
    return m;
  }, [filtered]);

  /* ── CRUD ── */
  const createProject = useCallback(async (
    data: Pick<Project,"name"|"emoji"|"status"|"priority"|"progress"|"description">
  ) => {
    try {
      const res  = await fetch("/api/projects", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(data),
      });
      const proj = await res.json();
      const normalised: Project = {
        _id:proj._id, name:proj.name||data.name, emoji:proj.emoji||"📁",
        status:(proj.status||data.status) as Status,
        priority:(proj.priority||data.priority) as Priority,
        progress: proj.progress ?? 0, description:"",
      };
      setProjects((prev) => {
        const real = prev.filter((p) => !p._id.startsWith("d"));
        return [normalised, ...real];
      });
    } catch {
      /* offline fallback */
      const id = `local-${Date.now()}`;
      setProjects((prev) => {
        const real = prev.filter((p) => !p._id.startsWith("d"));
        return [{ _id:id, ...data }, ...real];
      });
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== id));
    try {
      /* try both URL patterns to cover your existing routes */
      await fetch(`/api/projects/${id}`, { method:"DELETE" });
    } catch {
      await fetch(`/api/projects?id=${id}`, { method:"DELETE" }).catch(()=>{});
    }
  }, []);

  const patchProject = useCallback(async (id: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => p._id === id ? { ...p, ...patch } : p));
    if (!id.startsWith("d") && !id.startsWith("local-")) {
      try {
        await fetch(`/api/projects/${id}`, {
          method:"PATCH", headers:{"Content-Type":"application/json"},
          body: JSON.stringify(patch),
        });
      } catch {}
    }
  }, []);

  /* ── Drag & drop ── */
  const handleDrop = useCallback((targetStatus: Status) => {
    const id = draggingId.current;
    draggingId.current = null;
    setDragOver(null);
    if (!id) return;
    const proj = projects.find((p) => p._id === id);
    if (!proj || proj.status === targetStatus) return;
    patchProject(id, { status: targetStatus });
  }, [projects, patchProject]);

  /* ── Shared classes ── */
  const toolBtn = `flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
    isDark ? "text-gray-500 hover:bg-white/8 hover:text-gray-200" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
  }`;

  /* ══════════════════════════════════════════════════════════
     Project Card
  ══════════════════════════════════════════════════════════ */
  function ProjectCard({ project, col }: { project:Project; col:typeof COLUMNS[0] }) {
    const [editProg, setEditProg] = useState(false);
    const pStyle = isDark ? PRI_DARK[project.priority] : PRI_LIGHT[project.priority];
    const bg     = isDark ? col.cardBg.dark : col.cardBg.light;
    const bar    = BAR_COLOR[project.status];

    return (
      <div
        draggable
        onDragStart={() => { draggingId.current = project._id; }}
        onDragEnd={() => { draggingId.current = null; setDragOver(null); }}
        className={`group relative rounded-2xl p-4 transition-all cursor-grab active:cursor-grabbing select-none ${bg}`}
      >
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDel({ open:true, name:project.name, action:()=>deleteProject(project._id) });
          }}
          className={`absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-lg z-10 ${
            isDark ? "text-gray-600 hover:text-red-400 hover:bg-red-400/10"
                   : "text-gray-300 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <Trash2 size={12}/>
        </button>

        {/* Grip */}
        <GripVertical size={11}
          className={`absolute top-2.5 left-2 opacity-0 group-hover:opacity-25 transition-opacity ${isDark?"text-gray-400":"text-gray-500"}`}/>

        {/* Title — click navigates */}
        <button
          onClick={() => router.push(`/projects/${project._id}`)}
          className="flex items-start gap-2.5 w-full text-left mb-3 pr-6"
        >
          <span className="text-base leading-none mt-0.5 shrink-0">{project.emoji}</span>
          <span className={`text-sm font-semibold leading-snug ${isDark?"text-gray-100":"text-gray-900"}`}>
            {project.name}
          </span>
        </button>

        {/* Progress % label */}
        <p className={`text-[11px] font-medium mb-1.5 tabular-nums ${isDark?"text-gray-500":"text-gray-400"}`}>
          {project.progress}%
        </p>

        {/* Progress bar — click to edit inline */}
        <div className="mb-3">
          {editProg ? (
            <input
              type="range" min={0} max={100} step={5}
              value={project.progress}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => patchProject(project._id, { progress: Number(e.target.value) })}
              onBlur={() => setEditProg(false)}
              className="w-full h-2 accent-teal-500 cursor-pointer"
            />
          ) : (
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden cursor-pointer ${isDark?"bg-white/8":"bg-gray-100"}`}
              onClick={(e) => { e.stopPropagation(); setEditProg(true); }}
              title="Click to adjust progress"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-500`}
                style={{
                  width: project.progress > 0
                    ? `${project.progress}%`
                    : "0%",
                }}
              />
            </div>
          )}
        </div>

        {/* Priority badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${pStyle}`}>
          {project.priority}
        </span>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     Kanban Column
  ══════════════════════════════════════════════════════════ */
  function KanbanColumn({ col }: { col: typeof COLUMNS[0] }) {
    const colProjects = grouped[col.id] ?? [];
    const isOver      = dragOver === col.id;
    const bg          = isDark ? col.colBg.dark : col.colBg.light;
    const addBtn      = isDark ? col.addBtn.dark : col.addBtn.light;

    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
        }}
        onDrop={(e) => { e.preventDefault(); handleDrop(col.id); }}
        className={`flex-1 min-w-[280px] max-w-[420px] flex flex-col rounded-2xl transition-all ${bg} ${
          isOver ? "ring-2 ring-blue-500/40" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`}/>
          <span className={`text-sm font-bold ${isDark?"text-gray-200":"text-gray-800"}`}>
            {col.label}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isDark ? "bg-white/8 text-gray-500" : "bg-gray-200/80 text-gray-500"
          }`}>
            {colProjects.length}
          </span>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-3 space-y-2.5 pb-1 min-h-[100px]">
          {colProjects.map((p) => (
            <ProjectCard key={p._id} project={p} col={col}/>
          ))}
          {isOver && (
            <div className={`h-14 rounded-2xl border-2 border-dashed ${
              isDark ? "border-blue-500/30 bg-blue-500/5" : "border-blue-300 bg-blue-50"
            }`}/>
          )}
        </div>

        {/* Add new */}
        <div className="px-3 pb-3 pt-2">
          <button
            onClick={() => setNewModal({ open:true, defaultStatus:col.id })}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed transition-all ${addBtn}`}
          >
            <Plus size={13}/>
            New project
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════ */
  const tabCls = (id: ViewMode) =>
    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
      activeView === id
        ? "bg-blue-600 text-white shadow-md"
        : isDark
        ? "text-gray-400 hover:bg-white/8 hover:text-gray-200 border border-white/8"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
    }`;

  return (
    <div className={`min-h-screen ${isDark?"bg-[#0d0e12]":"bg-gray-50"}`}>

      <ConfirmDeleteModal
        open={confirmDel.open} name={confirmDel.name} isDark={isDark}
        onConfirm={async () => { if(confirmDel.action) await confirmDel.action(); setConfirmDel({open:false,name:"",action:null}); }}
        onCancel={() => setConfirmDel({open:false,name:"",action:null})}
      />

      <NewProjectModal
        open={newModal.open} isDark={isDark} defaultStatus={newModal.defaultStatus}
        onClose={() => setNewModal({open:false,defaultStatus:"Not started"})}
        onCreate={createProject}
      />

      <div className="w-full px-4 sm:px-6 md:px-8 pt-6 pb-10">

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md shadow-blue-500/25">
            <span className="text-white font-bold text-xs">⊙</span>
          </div>
          <h1 className={`text-xl font-bold tracking-tight ${isDark?"text-white":"text-gray-900"}`}>
            Projects
          </h1>
        </div>

        {/* Tab bar + toolbar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            {([
              { id:"by-status" as const, label:"By Status",    icon:"⊙" },
              { id:"all"       as const, label:"All Projects",  icon:"★" },
              { id:"gantt"     as const, label:"Gantt",         icon:"≡" },
            ]).map((tab) => (
              <button key={tab.id} onClick={()=>setActiveView(tab.id)} className={tabCls(tab.id)}>
                <span className="text-[11px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {showSearch ? (
              <div className="flex items-center gap-1.5">
                <input autoFocus value={searchText} onChange={(e)=>setSearchText(e.target.value)}
                  placeholder="Search…"
                  className={`text-xs px-3 py-1.5 rounded-xl border outline-none w-40 ${
                    isDark ? "bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                           : "bg-white border-gray-200 text-gray-900"
                  }`}/>
                <button onClick={()=>{ setShowSearch(false); setSearchText(""); }} className={toolBtn}>
                  <X size={13}/>
                </button>
              </div>
            ) : (
              <>
                <button className={toolBtn} title="Filter"><Filter size={14}/></button>
                <button className={toolBtn} title="Sort"><ArrowUpDown size={14}/></button>
                <button className={toolBtn} title="Automations"><Zap size={14}/></button>
                <button onClick={()=>setShowSearch(true)} className={toolBtn} title="Search"><Search size={14}/></button>
                <button className={toolBtn} title="Fullscreen"><Maximize2 size={14}/></button>
                <button className={toolBtn} title="Settings"><SlidersHorizontal size={14}/></button>
              </>
            )}
            <div className="flex items-center ml-2">
              <button onClick={()=>setNewModal({open:true,defaultStatus:"Not started"})}
                className="pl-4 pr-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-l-full transition-colors">
                New
              </button>
              <button className="pr-2 pl-1.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-r-full border-l border-blue-500/40 transition-colors">
                <ChevronDown size={12}/>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className={`animate-spin ${isDark?"text-gray-600":"text-gray-400"}`}/>
          </div>
        ) : activeView === "by-status" ? (
          <>
            {/* ── Kanban ── */}
            <div className="flex gap-4 overflow-x-auto pb-4 items-start">
              {COLUMNS.map((col) => <KanbanColumn key={col.id} col={col}/>)}
            </div>

            {/* Legend */}
            <div className={`flex items-center gap-3 mt-5 pt-4 border-t flex-wrap ${isDark?"border-white/5":"border-gray-100"}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark?"text-gray-700":"text-gray-400"}`}>Priority</span>
              {(["Low","Medium","High"] as Priority[]).map((p) => (
                <span key={p} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isDark?PRI_DARK[p]:PRI_LIGHT[p]}`}>{p}</span>
              ))}
              <span className={`ml-auto text-[10px] hidden sm:block ${isDark?"text-gray-700":"text-gray-400"}`}>
                Drag cards to change status · Click progress bar to edit
              </span>
            </div>
          </>
        ) : activeView === "all" ? (
          /* ── All projects grid ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const col = COLUMNS.find((c) => c.id === p.status) ?? COLUMNS[0];
              return <ProjectCard key={p._id} project={p} col={col}/>;
            })}
            {filtered.length === 0 && (
              <div className={`col-span-full text-center py-20 ${isDark?"text-gray-700":"text-gray-400"}`}>
                <div className="text-5xl mb-3 opacity-30">📋</div>
                <p className="text-sm">No projects found.</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Gantt placeholder ── */
          <div className={`flex flex-col items-center justify-center py-28 rounded-2xl border ${isDark?"border-white/6 text-gray-600":"border-gray-200 text-gray-400"}`}>
            <BarChart2 size={44} className="mb-4 opacity-25"/>
            <p className="text-sm font-semibold">Gantt view coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}