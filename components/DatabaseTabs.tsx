"use client";

import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import DatabaseViewRenderer from "./DatabaseViewrenderer";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Database {
  _id: string;
  name: string;
  icon: string;
  [key: string]: unknown;
}

interface SortableDatabaseCardProps {
  db: Database;
  isDark: boolean;
  isViewOnly: boolean;
  isLast: boolean;
  isDragging: boolean;
}

// ─── Drop animation config ─────────────────────────────────────────────────

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: "0.4" },
    },
  }),
};

// ─── Sortable card ─────────────────────────────────────────────────────────

function SortableDatabaseCard({
  db,
  isDark,
  isViewOnly,
  isLast,
  isDragging,
}: SortableDatabaseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: db._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.35 : 1,
    zIndex: isSelfDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`
          shadow-md transition-all duration-200
          ${isDragging ? "" : "hover:shadow-lg"}
          ${isSelfDragging ? "ring-2 ring-blue-400/50 shadow-xl" : ""}
          ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}
        `}
      >
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Drag handle */}
            {!isViewOnly && (
              <button
                {...attributes}
                {...listeners}
                className={`
                  shrink-0 p-1 rounded cursor-grab active:cursor-grabbing
                  transition-colors duration-150 touch-none select-none
                  ${
                    isDark
                      ? "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                  }
                `}
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <GripVertical size={16} />
              </button>
            )}

            <span className="text-xl sm:text-2xl shrink-0">{db.icon}</span>
            <h3
              className={`text-base sm:text-lg md:text-xl font-semibold truncate ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {db.name}
            </h3>
          </div>
        </CardHeader>

        <CardContent className="pt-2 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <DatabaseViewRenderer db={db} isViewOnly={isViewOnly} />
        </CardContent>
      </Card>

      {!isLast && (
        <Separator
          className={`my-4 sm:my-6 md:my-8 ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          }`}
        />
      )}
    </div>
  );
}

// ─── Drag overlay card (ghost while dragging) ──────────────────────────────

function DragOverlayCard({
  db,
  isDark,
}: {
  db: Database;
  isDark: boolean;
}) {
  return (
    <Card
      className={`
        shadow-2xl ring-2 ring-blue-400/60 rotate-1 scale-[1.02]
        transition-transform duration-100
        ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"}
      `}
    >
      <CardHeader className="pb-3 px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 p-1 rounded ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <GripVertical size={16} />
          </div>
          <span className="text-2xl shrink-0">{db.icon}</span>
          <h3
            className={`text-lg font-semibold truncate ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {db.name}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-4 md:px-6 pb-4 md:pb-6">
        <div
          className={`h-16 rounded-lg ${
            isDark ? "bg-gray-700/50" : "bg-gray-100"
          } animate-pulse`}
        />
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function DatabaseTabs({
  projectId,
  isViewOnly = false,
}: {
  projectId: string;
  isViewOnly?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { databasesByProject } = useWorkspaceStore();
  const dbs: Database[] = databasesByProject[projectId] || [];

  // Local order state — initialises from store; persists for the session.
  // Wire `onReorder` up to your store/API to make it durable.
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    dbs.map((d) => d._id)
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Keep orderedIds in sync when the store adds/removes databases
  const mergedIds = [
    ...orderedIds.filter((id) => dbs.some((d) => d._id === id)),
    ...dbs.filter((d) => !orderedIds.includes(d._id)).map((d) => d._id),
  ];

  const orderedDbs = mergedIds
    .map((id) => dbs.find((d) => d._id === id))
    .filter(Boolean) as Database[];

  const activeDb = activeId ? dbs.find((d) => d._id === activeId) : null;

  // DnD sensors — pointer with small activation distance to avoid misclicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setOrderedIds((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const next = arrayMove(prev, oldIndex, newIndex);

      // 🔌 Optional: persist reorder to your store/API here
      // e.g. reorderDatabases(projectId, next);

      return next;
    });
  };

  const handleDragCancel = () => setActiveId(null);

  // ── Empty state ────────────────────────────────────────────────────────

  if (dbs.length === 0) {
    return (
      <Card
        className={`shadow-sm ${
          isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
        }`}
      >
        <CardContent className="p-6 sm:p-8 md:p-10 text-center">
          <div className="text-4xl sm:text-5xl mb-3 opacity-40">📊</div>
          <p
            className={`text-xs sm:text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {isViewOnly
              ? "This project has no databases yet."
              : "No databases yet. Click New Database to get started."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={mergedIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {orderedDbs.map((db, index) => (
            <SortableDatabaseCard
              key={db._id}
              db={db}
              isDark={isDark}
              isViewOnly={isViewOnly}
              isLast={index === orderedDbs.length - 1}
              isDragging={!!activeId}
            />
          ))}
        </div>
      </SortableContext>

      {/* Floating ghost card while dragging */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeDb ? (
          <DragOverlayCard db={activeDb} isDark={isDark} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}