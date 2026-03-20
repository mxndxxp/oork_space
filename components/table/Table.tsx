// components/view/Table.tsx
"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { DbView } from "@/components/DatabaseViewTabs";

/* ── Types ── */
interface Property { id:string; name:string; type:string; formula?:string; }
interface Row      { id:string; values:Record<string,any>; assignee?:string; status?:string; completed?:boolean; }
interface TableProps {
  properties:    Property[];
  rows:          Row[];
  activeViewId?: string;
  activeView?:   DbView;
}

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
   BY STATUS — progress card kanban for Table view
══════════════════════════════════════════════════════════════ */
function ByStatusKanban({ rows, properties, isDark }: {
  rows: Row[]; properties: Property[]; isDark: boolean;
}) {
  const statusPropId   = properties.find((p)=>p.name.toLowerCase()==="status")?.id;
  const priorityPropId = properties.find((p)=>p.name.toLowerCase()==="priority")?.id;
  const namePropId     = properties.find((p)=>p.type==="title")?.id;
  const progressPropId = properties.find((p)=>p.name.toLowerCase()==="progress"||p.type==="number")?.id;

  const grouped = useMemo(() => {
    const map: Record<string,Row[]> = {};
    STATUS_COLS.forEach((c) => { map[c.id] = []; });
    rows.forEach((r) => {
      const s = statusPropId ? String(r.values[statusPropId]||r.status||"Not started") : (r.status||"Not started");
      if (!map[s]) map[s] = [];
      map[s].push(r);
    });
    return map;
  }, [rows, statusPropId]);

  function ProgressCard({ row, col }: { row:Row; col:typeof STATUS_COLS[0] }) {
    const [editProg, setEditProg] = useState(false);
    const title    = namePropId ? String(row.values[namePropId]||row.id) : row.id;
    const priority = priorityPropId ? String(row.values[priorityPropId]||"Medium") : "Medium";
    const rawProg  = progressPropId ? Number(row.values[progressPropId]||0) :
                     col.id==="Done" ? 100 : row.completed ? 100 : 0;
    const [progress, setProgress] = useState(Math.min(100, Math.max(0, rawProg)));
    const priCls   = isDark ? (PRI_CLS[priority]?.d||PRI_CLS.Medium.d) : (PRI_CLS[priority]?.l||PRI_CLS.Medium.l);
    const cardBg   = isDark ? col.card_d : col.card_l;
    const barGrad  = BAR_GRAD[col.id]||BAR_GRAD["Not started"];

    return (
      <div style={{
        background:cardBg,
        border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}`,
        borderRadius:14, padding:"14px", cursor:"default",
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
            onChange={(e)=>setProgress(Number(e.target.value))}
            onBlur={()=>setEditProg(false)}
            onClick={(e)=>e.stopPropagation()}
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
      {STATUS_COLS.map((col) => {
        const colRows = grouped[col.id] ?? [];
        const colBg   = isDark ? col.bg_d : col.bg_l;
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
                {colRows.length}
              </span>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"0 10px", minHeight:60 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:9, paddingBottom:8 }}>
                {colRows.map((r) => <ProgressCard key={r.id} row={r} col={col}/>)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Table — main export
══════════════════════════════════════════════════════════════ */
export default function Table({ properties, rows, activeViewId, activeView }: TableProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const assigneePropId = properties.find((p)=>p.type==="person"||p.name.toLowerCase()==="assignee")?.id;
  const statusPropId   = properties.find((p)=>p.name.toLowerCase()==="status")?.id;

  /* ── filter rows ── */
  const filteredRows = useMemo(() => {
    if (!activeView || activeView.type === "all") return rows;
    if (activeView.type === "my-tasks") {
      return rows.filter((r) => {
        const a = assigneePropId ? r.values[assigneePropId] : r.assignee;
        return a === "me" || a === "You";
      });
    }
    return rows;
  }, [rows, activeView, assigneePropId]);

  /* ── By Status → progress kanban ── */
  if (activeView?.type === "by-status") {
    return (
      <div className="p-4">
        <ByStatusKanban rows={rows} properties={properties} isDark={isDark}/>
      </div>
    );
  }

  /* ── Standard table ── */
  const borderB = `border-b ${isDark?"border-gray-800":"border-gray-100"}`;
  const thCls   = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest ${isDark?"text-gray-400":"text-gray-500"}`;
  const tdCls   = `px-4 py-2.5 text-sm ${isDark?"text-gray-300":"text-gray-600"}`;

  /* status dot */
  const STATUS_DOT: Record<string,string> = {
    "Not started":"bg-gray-400","In progress":"bg-blue-500","Done":"bg-emerald-500","Blocked":"bg-red-500",
  };

  return (
    <div className={`w-full border rounded-2xl overflow-hidden ${isDark?"bg-[#18191d] border-gray-800":"bg-white border-gray-200"}`}>
      {/* header bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark?"border-gray-800 bg-[#16171c]":"border-gray-100 bg-gray-50"}`}>
        <div className={`font-semibold text-sm ${isDark?"text-gray-100":"text-gray-900"}`}>
          {activeView?.label ?? "All items"}
        </div>
        <div className={`text-xs ${isDark?"text-gray-600":"text-gray-400"}`}>
          {filteredRows.length} row{filteredRows.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-auto">
        {filteredRows.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 text-sm ${isDark?"text-gray-600":"text-gray-400"}`}>
            <span className="text-4xl mb-3 opacity-40">📋</span>
            <p>{activeView?.type === "my-tasks" ? "No rows assigned to you." : "No rows yet."}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={borderB}>
                <th className={`${thCls} w-20`}>#</th>
                {properties.map((p) => (
                  <th key={p.id} className={thCls}>
                    {p.name}
                    <span className={`ml-1.5 text-[10px] normal-case font-normal ${isDark?"text-gray-600":"text-gray-400"}`}>{p.type}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className={`${borderB} transition-colors ${isDark?"hover:bg-gray-800/40":"hover:bg-rose-50/50"}`}>
                  <td className={`${tdCls} font-mono text-xs ${isDark?"text-gray-600":"text-gray-400"}`}>
                    {row.id.slice(-6)}
                  </td>
                  {properties.map((prop) => {
                    const raw   = row.values[prop.id];
                    const value = raw ?? "-";

                    if (prop.name.toLowerCase() === "status" && typeof value === "string" && value !== "-") {
                      const dot = STATUS_DOT[value] ?? "bg-gray-400";
                      return (
                        <td key={prop.id} className={tdCls}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`}/>
                            {value}
                          </span>
                        </td>
                      );
                    }

                    if (prop.name.toLowerCase() === "progress" && typeof value === "number") {
                      return (
                        <td key={prop.id} className={tdCls}>
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark?"bg-white/8":"bg-gray-100"}`}>
                              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                                style={{ width:`${value}%` }}/>
                            </div>
                            <span className="text-xs w-8 shrink-0">{value}%</span>
                          </div>
                        </td>
                      );
                    }

                    if (prop.type === "formula") {
                      return <td key={prop.id} className={`${tdCls} italic ${isDark?"text-gray-500":"text-gray-400"}`}>ƒ {prop.formula}</td>;
                    }
                    if (typeof value === "boolean") {
                      return <td key={prop.id} className={tdCls}><span className={value?"text-emerald-500":isDark?"text-gray-600":"text-gray-400"}>{value?"✓ Yes":"—"}</span></td>;
                    }
                    if (Array.isArray(value)) {
                      return (
                        <td key={prop.id} className={tdCls}>
                          <div className="flex flex-wrap gap-1">
                            {(value as string[]).map((v,i) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDark?"bg-gray-700 text-gray-300":"bg-gray-100 text-gray-600"}`}>{v}</span>
                            ))}
                          </div>
                        </td>
                      );
                    }
                    return <td key={prop.id} className={tdCls}>{String(value)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}