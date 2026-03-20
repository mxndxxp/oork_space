// components/FilterPanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Plus, Search, Type, Users, Calendar, Hash,
  Link, DollarSign, BarChart2, CheckSquare, List, Tag,
  ChevronRight, Trash2,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────── */
export interface FilterRule {
  id:        string;
  fieldId:   string;
  fieldName: string;
  fieldType: string;
  op:        string;          // "eq" | "ne" | "contains" | "not_contains" | "gt" | "lt" | "is_empty" | "is_not_empty"
  value:     string;
}

export interface FilterPanelProps {
  properties:    { id: string; name: string; type: string }[];
  filters:       FilterRule[];
  isDark:        boolean;
  onClose:       () => void;
  onChange:      (filters: FilterRule[]) => void;
}

/* ── Icon map ─────────────────────────────────────────────────── */
function PropIcon({ type, size = 14 }: { type: string; size?: number }) {
  const cls = `shrink-0 opacity-70`;
  if (type === "title"        || type === "text")   return <Type        size={size} className={cls} />;
  if (type === "person"       || type === "assignee") return <Users      size={size} className={cls} />;
  if (type === "date"         || type === "start_date" || type === "end_date") return <Calendar size={size} className={cls} />;
  if (type === "number"       || type === "budget"  || type === "start_value" || type === "end_value") return <Hash size={size} className={cls} />;
  if (type === "url"          || type === "attach_file") return <Link   size={size} className={cls} />;
  if (type === "currency")    return <DollarSign  size={size} className={cls} />;
  if (type === "progress")    return <BarChart2   size={size} className={cls} />;
  if (type === "checkbox")    return <CheckSquare size={size} className={cls} />;
  if (type === "select")      return <List        size={size} className={cls} />;
  if (type === "multi_select" || type === "tags") return <Tag  size={size} className={cls} />;
  return <Type size={size} className={cls} />;
}

/* ── Ops per type ─────────────────────────────────────────────── */
function opsForType(type: string): string[] {
  if (type === "checkbox") return ["is_empty", "is_not_empty", "eq"];
  if (type === "number" || type === "budget" || type === "progress")
    return ["eq", "ne", "gt", "lt", "is_empty", "is_not_empty"];
  if (type === "date" || type === "start_date" || type === "end_date")
    return ["eq", "gt", "lt", "is_empty", "is_not_empty"];
  return ["contains", "not_contains", "eq", "ne", "is_empty", "is_not_empty"];
}

const OP_LABELS: Record<string, string> = {
  eq:             "is",
  ne:             "is not",
  contains:       "contains",
  not_contains:   "does not contain",
  gt:             "is after / greater than",
  lt:             "is before / less than",
  is_empty:       "is empty",
  is_not_empty:   "is not empty",
};

/* ════════════════════════════════════════════════════════════════ */
export default function FilterPanel({ properties, filters, isDark, onClose, onChange }: FilterPanelProps) {
  const [search,    setSearch]    = useState("");
  const [showProp,  setShowProp]  = useState(filters.length === 0); // show picker if no filters yet
  const [editingId, setEditingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filteredProps = useMemo(
    () => properties.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [properties, search]
  );

  /* ── Add a new filter rule ── */
  const addFilter = (prop: { id: string; name: string; type: string }) => {
    const ops  = opsForType(prop.type);
    const rule: FilterRule = {
      id:        `f-${Date.now()}`,
      fieldId:   prop.id,
      fieldName: prop.name,
      fieldType: prop.type,
      op:        ops[0],
      value:     "",
    };
    const next = [...filters, rule];
    onChange(next);
    setShowProp(false);
    setEditingId(rule.id);
    setSearch("");
  };

  /* ── Remove a filter rule ── */
  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
    if (editingId === id) setEditingId(null);
  };

  /* ── Update a filter rule field ── */
  const updateFilter = (id: string, patch: Partial<FilterRule>) => {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  /* ── Shared classes ── */
  const panel = `rounded-2xl border shadow-2xl overflow-hidden ${
    isDark ? "bg-[#1a1b1f] border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
  }`;
  const inputCls = `w-full text-sm rounded-xl border px-3 py-2 outline-none transition-colors ${
    isDark
      ? "bg-[#111216] border-gray-700 text-gray-200 placeholder:text-gray-600 focus:border-blue-500"
      : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
  }`;
  const selectCls = `text-xs rounded-lg border px-2 py-1 outline-none ${
    isDark
      ? "bg-[#111216] border-gray-700 text-gray-300"
      : "bg-gray-50 border-gray-200 text-gray-700"
  }`;
  const rowHover = isDark ? "hover:bg-gray-800/60" : "hover:bg-gray-50";
  const divider  = `border-t ${isDark ? "border-gray-800" : "border-gray-100"}`;

  return (
    <div className={`${panel} w-80`}>

      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
        <span className="text-sm font-semibold">Filter</span>
        <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
          <X size={14} />
        </button>
      </div>

      {/* ── Active filter rules ── */}
      {filters.length > 0 && (
        <div className="px-3 py-2 space-y-2">
          {filters.map((f) => (
            <div key={f.id} className={`rounded-xl border p-2.5 space-y-2 ${isDark ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-gray-50"}`}>
              {/* Property name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <PropIcon type={f.fieldType} size={12} />
                  <span>{f.fieldName}</span>
                </div>
                <button onClick={() => removeFilter(f.id)} className={`p-0.5 rounded transition-colors ${isDark ? "text-gray-600 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}>
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Op selector */}
              <select
                value={f.op}
                onChange={(e) => updateFilter(f.id, { op: e.target.value })}
                className={selectCls}
              >
                {opsForType(f.fieldType).map((op) => (
                  <option key={op} value={op}>{OP_LABELS[op]}</option>
                ))}
              </select>

              {/* Value input (hidden for is_empty / is_not_empty) */}
              {f.op !== "is_empty" && f.op !== "is_not_empty" && (
                <input
                  className={inputCls}
                  placeholder="Value…"
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Property picker ── */}
      {showProp ? (
        <div>
          {/* Search */}
          <div className="px-3 pt-2.5 pb-1">
            <div className="relative">
              <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by…"
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          {/* Property list */}
          <div className="max-h-64 overflow-y-auto pb-1">
            {filteredProps.map((prop) => (
              <button
                key={prop.id}
                onClick={() => addFilter(prop)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${rowHover}`}
              >
                <PropIcon type={prop.type} size={14} />
                <span>{prop.name}</span>
              </button>
            ))}
            {filteredProps.length === 0 && (
              <p className={`px-4 py-4 text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>No properties match {search}</p>
            )}
          </div>

          {/* Add advanced filter */}
          <div className={divider}>
            <button className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${rowHover} ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <Plus size={12} />
              Add advanced filter
            </button>
          </div>
        </div>
      ) : (
        /* ── "Add filter" button when rules already exist ── */
        <div className={divider}>
          <button
            onClick={() => { setShowProp(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${rowHover} ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            <Plus size={12} />
            Add filter rule
          </button>
        </div>
      )}
    </div>
  );
}