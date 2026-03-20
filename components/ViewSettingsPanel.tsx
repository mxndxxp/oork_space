// components/ViewSettingsPanel.tsx
"use client";

import { useState } from "react";
import {
  X, Layout, Eye, Filter, ArrowUpDown,
  Group as GroupIcon, Palette, Link as LinkIcon,
  Database, Settings, Zap, MoreHorizontal,
  ChevronRight, Check,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────── */
export interface ViewSettings {
  layout:             string;
  hiddenProperties:   string[];   // property IDs that are hidden
  groupBy:            string;     // property ID
  conditionalColors:  any[];
}

export interface ViewSettingsPanelProps {
  dbId:          string;
  dbName:        string;
  viewType:      string;
  projectId:     string;
  properties:    { id: string; name: string; type: string }[];
  settings:      ViewSettings;
  filterCount:   number;
  sortCount:     number;
  isDark:        boolean;
  onClose:       () => void;
  onChange:      (settings: ViewSettings) => void;
  onOpenFilter:  () => void;
  onOpenSort:    () => void;
}

/* ── Layout options per viewType ── */
const LAYOUTS: Record<string, { id: string; label: string; icon: string }[]> = {
  table:    [{ id:"table",    label:"Table",    icon:"☰"  }, { id:"gallery", label:"Gallery",  icon:"🖼" }],
  board:    [{ id:"board",    label:"Board",    icon:"🧩" }, { id:"table",   label:"Table",    icon:"☰"  }],
  timeline: [{ id:"timeline", label:"Timeline", icon:"🗓" }, { id:"table",   label:"Table",    icon:"☰"  }],
  todo:     [{ id:"todo",     label:"To-do",    icon:"✅" }, { id:"table",   label:"Table",    icon:"☰"  }],
  gallery:  [{ id:"gallery",  label:"Gallery",  icon:"🖼" }, { id:"table",   label:"Table",    icon:"☰"  }],
};

/* ── Group-by options ── */
const GROUP_OPTIONS = [
  "None", "Status", "Assignee", "Priority", "Due date",
];

/* ════════════════════════════════════════════════════════════════ */
export default function ViewSettingsPanel({
  dbId, dbName, viewType, projectId, properties,
  settings, filterCount, sortCount, isDark,
  onClose, onChange, onOpenFilter, onOpenSort,
}: ViewSettingsPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  /* ── Shared classes ── */
  const panelCls = `rounded-2xl border shadow-2xl overflow-hidden w-72 ${
    isDark ? "bg-[#1a1b1f] border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
  }`;
  const rowCls = `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
    isDark ? "hover:bg-gray-800/60" : "hover:bg-gray-50"
  }`;
  const iconCls = `shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`;
  const labelCls= isDark ? "text-gray-300" : "text-gray-700";
  const valueCls= `ml-auto text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`;
  const divider = `border-t ${isDark ? "border-gray-800" : "border-gray-100"}`;

  /* ── Copy link to view ── */
  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/projects/${projectId}?db=${dbId}`);
    }
  };

  /* ── Toggle property visibility ── */
  const toggleProp = (propId: string) => {
    const hidden = settings.hiddenProperties;
    const next   = hidden.includes(propId)
      ? hidden.filter((id) => id !== propId)
      : [...hidden, propId];
    onChange({ ...settings, hiddenProperties: next });
  };

  const visibleCount  = properties.length - settings.hiddenProperties.length;
  const layouts       = LAYOUTS[viewType] ?? LAYOUTS["table"];
  const currentLayout = layouts.find((l) => l.id === (settings.layout || viewType)) ?? layouts[0];

  return (
    <div className={panelCls}>

      {/* ── Header ── */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
        {/* View name icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
          {currentLayout.icon}
        </div>
        <span className="flex-1 text-sm font-semibold truncate">{dbName}</span>
        <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
          <X size={14} />
        </button>
      </div>

      {/* ══ View settings section ══════════════════════════════ */}
      <div className="py-1">

        {/* Layout */}
        <div>
          <button
            className={rowCls}
            onClick={() => setOpenSection(openSection === "layout" ? null : "layout")}
          >
            <Layout      size={15} className={iconCls} />
            <span className={labelCls}>Layout</span>
            <span className={valueCls}>{currentLayout.label}</span>
            <ChevronRight size={13} className={`ml-1 transition-transform ${openSection === "layout" ? "rotate-90" : ""} ${isDark ? "text-gray-600" : "text-gray-400"}`} />
          </button>

          {openSection === "layout" && (
            <div className={`px-4 pb-2 space-y-1`}>
              {layouts.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { onChange({ ...settings, layout: l.id }); setOpenSection(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    (settings.layout || viewType) === l.id
                      ? isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"
                      : isDark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                  {(settings.layout || viewType) === l.id && <Check size={13} className="ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property visibility */}
        <div>
          <button
            className={rowCls}
            onClick={() => setOpenSection(openSection === "props" ? null : "props")}
          >
            <Eye size={15} className={iconCls} />
            <span className={labelCls}>Property visibility</span>
            <span className={valueCls}>{visibleCount}</span>
            <ChevronRight size={13} className={`ml-1 transition-transform ${openSection === "props" ? "rotate-90" : ""} ${isDark ? "text-gray-600" : "text-gray-400"}`} />
          </button>

          {openSection === "props" && (
            <div className="px-4 pb-2 space-y-0.5 max-h-48 overflow-y-auto">
              {properties.map((prop) => {
                const hidden = settings.hiddenProperties.includes(prop.id);
                return (
                  <label
                    key={prop.id}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors text-sm ${
                      isDark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={() => toggleProp(prop.id)}
                      className="accent-blue-500 w-3.5 h-3.5"
                    />
                    <span className="truncate">{prop.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter */}
        <button className={rowCls} onClick={() => { onClose(); onOpenFilter(); }}>
          <Filter size={15} className={iconCls} />
          <span className={labelCls}>Filter</span>
          {filterCount > 0 && <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>{filterCount}</span>}
          <ChevronRight size={13} className={`${filterCount > 0 ? "ml-1" : "ml-auto"} ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>

        {/* Sort */}
        <button className={rowCls} onClick={() => { onClose(); onOpenSort(); }}>
          <ArrowUpDown size={15} className={iconCls} />
          <span className={labelCls}>Sort</span>
          {sortCount > 0 && <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>{sortCount}</span>}
          <ChevronRight size={13} className={`${sortCount > 0 ? "ml-1" : "ml-auto"} ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>

        {/* Group */}
        <div>
          <button
            className={rowCls}
            onClick={() => setOpenSection(openSection === "group" ? null : "group")}
          >
            <MoreHorizontal size={15} className={iconCls} />
            <span className={labelCls}>Group</span>
            <span className={valueCls}>{settings.groupBy || "None"}</span>
            <ChevronRight size={13} className={`ml-1 transition-transform ${openSection === "group" ? "rotate-90" : ""} ${isDark ? "text-gray-600" : "text-gray-400"}`} />
          </button>

          {openSection === "group" && (
            <div className="px-4 pb-2 space-y-0.5">
              {GROUP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange({ ...settings, groupBy: opt === "None" ? "" : opt }); setOpenSection(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    (settings.groupBy || "None") === opt
                      ? isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"
                      : isDark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{opt}</span>
                  {(settings.groupBy || "None") === opt && <Check size={13} className="ml-auto" />}
                </button>
              ))}
              {/* Also allow grouping by any property */}
              {properties.filter(p => p.type === "select" && !GROUP_OPTIONS.includes(p.name)).map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => { onChange({ ...settings, groupBy: prop.name }); setOpenSection(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    settings.groupBy === prop.name
                      ? isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"
                      : isDark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{prop.name}</span>
                  {settings.groupBy === prop.name && <Check size={13} className="ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conditional color */}
        <button className={rowCls} onClick={() => setOpenSection(openSection === "color" ? null : "color")}>
          <Palette size={15} className={iconCls} />
          <span className={labelCls}>Conditional color</span>
          <ChevronRight size={13} className={`ml-auto ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>

        {openSection === "color" && (
          <div className={`px-4 pb-2 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            <p className="px-3 py-2">Conditional coloring coming soon.</p>
          </div>
        )}

        {/* Copy link to view */}
        <button className={rowCls} onClick={copyLink}>
          <LinkIcon size={15} className={iconCls} />
          <span className={labelCls}>Copy link to view</span>
        </button>
      </div>

      {/* ══ Data source settings section ═══════════════════════ */}
      <div className={`${divider} py-1`}>
        <div className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          Data source settings
        </div>

        <button className={rowCls}>
          <Database size={15} className={iconCls} />
          <span className={labelCls}>Source</span>
          <span className={`ml-auto text-xs font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>Projects</span>
          <ChevronRight size={13} className={`ml-1 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>

        <button className={rowCls}>
          <Settings size={15} className={iconCls} />
          <span className={labelCls}>Edit properties</span>
          <ChevronRight size={13} className={`ml-auto ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>

        <button className={rowCls}>
          <Zap size={15} className={iconCls} />
          <span className={labelCls}>Automations</span>
          <ChevronRight size={13} className={`ml-auto ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>

        <button className={rowCls}>
          <MoreHorizontal size={15} className={iconCls} />
          <span className={labelCls}>More settings</span>
          <ChevronRight size={13} className={`ml-auto ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </button>
      </div>
    </div>
  );
}