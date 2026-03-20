// components/DatabaseTabs.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, GripVertical } from "lucide-react";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import DatabaseViewRenderer from "./DatabaseViewrenderer";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import ViewPickerCard from "./ViewpickerCard";
import DatabaseViewTabs, { type DbView } from "./DatabaseViewtabs";
import type { Database } from "@/app/store/WorkspaceStore";

/* ── Default views factory ── */
function getDefaultViews(viewType: string): DbView[] {
  if (["todo","board","table","timeline"].includes(viewType)) {
    return [
      { id:"all",       label:"All Tasks", icon:"star",   type:"all",       isDefault:true,  filters:[] },
      { id:"by-status", label:"By Status", icon:"circle", type:"by-status", groupBy:"status",filters:[] },
      { id:"my-tasks",  label:"My Tasks",  icon:"user",   type:"my-tasks",  filters:[{ field:"assignee",op:"eq",value:"me" }] },
    ];
  }
  if (["documentation","text","pagelink"].includes(viewType)) {
    return [
      { id:"all",  label:"All Pages", icon:"star", type:"all",      isDefault:true, filters:[] },
      { id:"mine", label:"My Pages",  icon:"user", type:"my-tasks", filters:[] },
    ];
  }
  return [
    { id:"all", label:"All Items", icon:"star", type:"all", isDefault:true, filters:[] },
  ];
}

/* ══════════════════════════════════════════════════════════════
   DraggableDatabaseSection
   Each section is an independent scroll container so that
   "sticky top-0" on DatabaseViewTabs sticks WITHIN this section,
   not relative to the page.
══════════════════════════════════════════════════════════════ */
type SectionProps = {
  db:           Database;
  projectId:    string;
  isDark:       boolean;
  isViewOnly:   boolean;
  isActive:     boolean;
  onAddBelow:   (dbId: string) => void;
  onDragStart:  (dbId: string) => void;
  onDropOn:     (targetDbId: string) => void;
  isDragging:   boolean;
  dragEnabled:  boolean;
  onToggleDrag: () => void;
};

function DraggableDatabaseSection({
  db, projectId,
  isDark, isViewOnly, isActive,
  onAddBelow, onDragStart, onDropOn,
  isDragging, dragEnabled, onToggleDrag,
}: SectionProps) {

  const rawViews: DbView[] = useMemo(
    () =>
      db.views && db.views.length > 0
        ? (db.views as DbView[])
        : getDefaultViews(db.viewType || "table"),
    [db.views, db.viewType]
  );

  const [views,        setViews]        = useState<DbView[]>(rawViews);
  const [activeViewId, setActiveViewId] = useState<string>(
    rawViews.find((v) => v.isDefault)?.id ?? rawViews[0]?.id ?? "all"
  );

  useEffect(() => { setViews(rawViews); }, [rawViews]);

  return (
    /*
      ┌──────────────────────────────────────────────────────────┐
      │  KEY CHANGE: each section has a fixed max-height and     │
      │  overflow-y-auto so it becomes its own scroll container. │
      │  This lets "sticky top-0" in DatabaseViewTabs stick to  │
      │  the top of THIS section, not the page.                  │
      └──────────────────────────────────────────────────────────┘
    */
    <section
      draggable={dragEnabled}
      onDragStart={dragEnabled ? () => onDragStart(db._id) : undefined}
      onDragOver={dragEnabled  ? (e) => e.preventDefault() : undefined}
      onDrop={dragEnabled      ? () => onDropOn(db._id) : undefined}
      id={`db-section-${db._id}`}
      className={`relative rounded-xl transition-all overflow-hidden border max-h-[700px] flex flex-col ${
        isDragging && dragEnabled
          ? "opacity-60 ring-2 ring-teal-500/60"
          : isActive
          ? isDark
            ? "ring-2 ring-blue-500/60 border-blue-800"
            : "ring-2 ring-blue-500/50 border-blue-200"
          : isDark
          ? "border-gray-700/60"
          : "border-gray-200"
      }`}
    >
      {/* ── Top drag-handle strip (not sticky — always at top since section is flex-col) ── */}
      <div className={`group flex items-center shrink-0 text-sm px-3 py-1 border-b ${
        isDark
          ? "text-gray-300 bg-[#16171c] border-gray-700/60"
          : "text-gray-700 bg-gray-50 border-gray-200"
      }`}>
        <span
          className={`p-1 rounded transition-colors ${
            dragEnabled
              ? isDark
                ? "cursor-grab text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                : "cursor-grab text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              : isDark
              ? "cursor-not-allowed text-gray-700"
              : "cursor-not-allowed text-gray-300"
          }`}
          title={dragEnabled ? "Drag to reorder" : "Enable drag mode to reorder"}
        >
          <GripVertical size={14} />
        </span>

        {!isViewOnly && (
          <button
            type="button"
            onClick={() => onAddBelow(db._id)}
            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ml-1 ${
              isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Add dataset below"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/*
        ── Scrollable inner area ──
        DatabaseViewTabs has "sticky top-0" which sticks to the
        top of this overflow-y-auto div, not the page.
      */}
      <div className="flex-1 overflow-y-auto">
        {/* ── View tabs toolbar (sticky within this scroll area) ── */}
        <DatabaseViewTabs
          dbId={db._id}
          dbName={db.name}
          dbIcon={db.icon || "📄"}
          viewType={db.viewType || "table"}
          projectId={projectId}
          views={views}
          activeViewId={activeViewId}
          isDark={isDark}
          dragEnabled={dragEnabled}
          onToggleDrag={onToggleDrag}
          onViewChange={setActiveViewId}
          onViewsChange={setViews}
        />

        {/* ── Content ── */}
        <div className={isDark ? "bg-transparent" : "bg-white"}>
          <DatabaseViewRenderer
            db={db}
            isViewOnly={isViewOnly}
            activeViewId={activeViewId}
            activeView={views.find((v) => v.id === activeViewId)}
          />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   DatabaseTabs — main export
══════════════════════════════════════════════════════════════ */
export default function DatabaseTabs({
  projectId,
  isViewOnly = false,
}: {
  projectId:   string;
  isViewOnly?: boolean;
}) {
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [showCreateDbModal,     setShowCreateDbModal]     = useState(false);
  const [insertAfterDatabaseId, setInsertAfterDatabaseId] = useState<string | null>(null);
  const [orderedIds,            setOrderedIds]            = useState<string[]>([]);
  const [draggingId,            setDraggingId]            = useState<string | null>(null);
  const [dragEnabled,           setDragEnabled]           = useState(false);

  const { databasesByProject, activeDatabaseId, setActiveDatabase } = useWorkspaceStore();
  const dbs          = useMemo(() => databasesByProject[projectId] || [], [databasesByProject, projectId]);
  const selectedDbId = searchParams.get("db");

  useEffect(() => {
    if (dbs.length === 0) return;
    const activeExists = dbs.some((db) => db._id === activeDatabaseId);
    if (!activeDatabaseId || !activeExists) setActiveDatabase(dbs[0]._id);
  }, [dbs, activeDatabaseId, setActiveDatabase]);

  useEffect(() => {
    if (!selectedDbId) return;
    const exists = dbs.some((db) => db._id === selectedDbId);
    if (!exists) return;
    setActiveDatabase(selectedDbId);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`db-section-${selectedDbId}`)
        ?.scrollIntoView({ behavior:"smooth", block:"start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDbId, dbs, setActiveDatabase]);

  const orderedDbs = useMemo(() => {
    if (orderedIds.length === 0) return dbs;
    const map     = new Map(dbs.map((db) => [db._id, db] as const));
    const sorted  = orderedIds.map((id) => map.get(id)).filter(Boolean) as Database[];
    const missing = dbs.filter((db) => !orderedIds.includes(db._id));
    return [...sorted, ...missing];
  }, [dbs, orderedIds]);

  const handleToggleDrag = () => {
    setDragEnabled((v) => !v);
    setDraggingId(null);
  };

  /* ── Empty state ── */
  if (dbs.length === 0) {
    return (
      <Card className={`shadow-sm ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <CardContent className="p-6 sm:p-8 md:p-10 text-center">
          <div className="text-4xl sm:text-5xl mb-3 opacity-40">📊</div>
          <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {isViewOnly
              ? "This project has no databases yet."
              : "No databases yet. Click New Database to get started."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const openCreateAfter = (dbId: string) => {
    setInsertAfterDatabaseId(dbId);
    setShowCreateDbModal(true);
  };

  const handleDropOn = (targetDbId: string) => {
    if (!draggingId || draggingId === targetDbId) { setDraggingId(null); return; }
    const currentIds  = orderedDbs.map((db) => db._id);
    const sourceIndex = currentIds.indexOf(draggingId);
    const targetIndex = currentIds.indexOf(targetDbId);
    if (sourceIndex === -1 || targetIndex === -1) { setDraggingId(null); return; }
    const next = [...currentIds];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setOrderedIds(next);
    setDraggingId(null);
  };

  return (
    <div className="space-y-6">
      {orderedDbs.map((db) => (
        <DraggableDatabaseSection
          key={db._id}
          db={db}
          projectId={projectId}
          isDark={isDark}
          isViewOnly={isViewOnly}
          isActive={activeDatabaseId === db._id}
          onAddBelow={openCreateAfter}
          onDragStart={setDraggingId}
          onDropOn={handleDropOn}
          isDragging={draggingId === db._id}
          dragEnabled={dragEnabled}
          onToggleDrag={handleToggleDrag}
        />
      ))}

      {showCreateDbModal && !isViewOnly && (
        <ViewPickerCard
          projectId={projectId}
          insertAfterDatabaseId={insertAfterDatabaseId}
          isDark={isDark}
          onDone={() => { setShowCreateDbModal(false); setInsertAfterDatabaseId(null); }}
        />
      )}
    </div>
  );
}