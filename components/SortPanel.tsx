// components/SortPanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Search, ArrowUpDown, Trash2,
  Type, Users, Calendar, Hash, Link,
  DollarSign, BarChart2, CheckSquare, List, Tag,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────── */
export interface SortRule {
  id:        string;
  fieldId:   string;
  fieldName: string;
  fieldType: string;
  dir:       "asc" | "desc";
}

export interface SortPanelProps {
  properties: { id: string; name: string; type: string }[];
  sorts:      SortRule[];
  isDark:     boolean;
  onClose:    () => void;
  onChange:   (sorts: SortRule[]) => void;
}

/* ── Property icon ────────────────────────────────────────────── */
function PropIcon({ type, size = 14 }: { type: string; size?: number }) {
  const cls = "shrink-0 opacity-70";
  if (type === "title" || type === "text")   return <Type        size={size} className={cls} />;
  if (type === "person" || type === "assignee") return <Users    size={size} className={cls} />;
  if (type === "date" || type === "start_date" || type === "end_date") return <Calendar size={size} className={cls} />;
  if (type === "number" || type === "budget" || type === "start_value" || type === "end_value") return <Hash size={size} className={cls} />;
  if (type === "url" || type === "attach_file") return <Link     size={size} className={cls} />;
  if (type === "currency") return <DollarSign  size={size} className={cls} />;
  if (type === "progress") return <BarChart2   size={size} className={cls} />;
  if (type === "checkbox") return <CheckSquare size={size} className={cls} />;
  if (type === "select")   return <List        size={size} className={cls} />;
  if (type === "multi_select" || type === "tags") return <Tag    size={size} className={cls} />;
  return <Type size={size} className={cls} />;
}

/* ════════════════════════════════════════════════════════════════ */
export default function SortPanel({ properties, sorts, isDark, onClose, onChange }: SortPanelProps) {
  const [search,   setSearch]   = useState("");
  const [showProp, setShowProp] = useState(sorts.length === 0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filteredProps = useMemo(
    () => properties.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      !sorts.some((s) => s.fieldId === p.id)   // hide already-sorted fields
    ),
    [properties, search, sorts]
  );

  /* ── Add sort rule ── */
  const addSort = (prop: { id: string; name: string; type: string }) => {
    const rule: SortRule = {
      id:        `s-${Date.now()}`,
      fieldId:   prop.id,
      fieldName: prop.name,
      fieldType: prop.type,
      dir:       "asc",
    };
    onChange([...sorts, rule]);
    setShowProp(false);
    setSearch("");
  };

  /* ── Remove sort rule ── */
  const removeSort = (id: string) => onChange(sorts.filter((s) => s.id !== id));

  /* ── Toggle direction ── */
  const toggleDir = (id: string) =>
    onChange(sorts.map((s) => s.id === id ? { ...s, dir: s.dir === "asc" ? "desc" : "asc" } : s));

  /* ── Shared ── */
  const panel = `rounded-2xl border shadow-2xl overflow-hidden ${
    isDark ? "bg-[#1a1b1f] border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
  }`;
  const inputCls = `w-full text-sm rounded-xl border px-3 py-2 pl-8 outline-none transition-colors ${
    isDark
      ? "bg-[#111216] border-gray-700 text-gray-200 placeholder:text-gray-600 focus:border-blue-500"
      : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
  }`;
  const rowHover = isDark ? "hover:bg-gray-800/60" : "hover:bg-gray-50";
  const divider  = `border-t ${isDark ? "border-gray-800" : "border-gray-100"}`;

  return (
    <div className={`${panel} w-80`}>

      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ArrowUpDown size={14} />
          Sort
        </div>
        <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
          <X size={14} />
        </button>
      </div>

      {/* ── Active sort rules ── */}
      {sorts.length > 0 && (
        <div className="px-3 py-2 space-y-1.5">
          {sorts.map((s, idx) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isDark ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-gray-50"
              }`}
            >
              {/* Index */}
              <span className={`text-[10px] font-bold w-4 text-center shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {idx + 1}
              </span>

              {/* Icon + name */}
              <PropIcon type={s.fieldType} size={13} />
              <span className="text-xs font-medium flex-1 truncate">{s.fieldName}</span>

              {/* Direction toggle */}
              <button
                onClick={() => toggleDir(s.id)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                  isDark
                    ? "border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                    : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {s.dir === "asc" ? "A → Z" : "Z → A"}
              </button>

              {/* Remove */}
              <button onClick={() => removeSort(s.id)} className={`p-0.5 rounded transition-colors ${isDark ? "text-gray-600 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Property picker / search ── */}
      {showProp ? (
        <div>
          <div className="px-3 pt-2.5 pb-1">
            <div className="relative">
              <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sort by…"
                className={inputCls}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto pb-2">
            {filteredProps.map((prop) => (
              <button
                key={prop.id}
                onClick={() => addSort(prop)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${rowHover}`}
              >
                <PropIcon type={prop.type} size={14} />
                <span>{prop.name}</span>
              </button>
            ))}
            {filteredProps.length === 0 && (
              <p className={`px-4 py-4 text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                {search ? `No properties match "${search}"` : "All properties are already sorted"}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* "Add sort" link when rules exist */
        <div className={divider}>
          <button
            onClick={() => { setShowProp(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${rowHover} ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            <ArrowUpDown size={12} />
            Add sort rule
          </button>
        </div>
      )}
    </div>
  );
}