// components/DatabaseViewrenderer.tsx

import React from "react";
import TimelineView from "./TimelineView";
import TableView from "./view/TableView";
import GalleryView from "./gallery/GalleryView";
import BoardView from "./board/BoardView";
import TodoView from "./todo/TodoView";
import TextView from "./text/TextView";
import HeadingView from "./heading/HeadingView";
import NumberListView from "./numberlist/NumberListView";
import BulletedListView from "./bullete/BulletedView";
import { LinkProject } from "./link/LinkProject";
import PresentationView from "./presentation/PresentationView";
import VideoView from "./video/VideoView";
import WhiteboardView from "./whiteboard/WhiteboardView";
import SocialMediaView from "./socialmedia/SocialMediaView";
import DocumentationView from "./documentation/DocumentationView";
import ChartView from "./charts/ChartView";
import type { DbView } from "./DatabaseViewtabs";

/* ── Types ──────────────────────────────────────────────────────── */
interface Database {
  _id: string;
  viewType: string;
  projectId: string;
  templateName?: string;
  views?: DbView[];
}

interface DatabaseViewRendererProps {
  db: Database;
  isViewOnly?: boolean;
  /** ID of the currently active view tab */
  activeViewId?: string;
  /** Full view object for the active tab (filters, groupBy, etc.) */
  activeView?: DbView;
}

/* ── Helper: wrap a component that only needs databaseId ─────────── */
function withDb(
  Component: React.ComponentType<{ databaseId: string }>,
  databaseId: string
) {
  return <Component databaseId={databaseId} />;
}

/* ── Helper: views that support filtering / grouping ─────────────── */
function withViewProps(
  Component: React.ComponentType<{
    databaseId: string;
    activeViewId?: string;
    activeView?: DbView;
  }>,
  databaseId: string,
  activeViewId?: string,
  activeView?: DbView
) {
  return (
    <Component
      databaseId={databaseId}
      activeViewId={activeViewId}
      activeView={activeView}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   DatabaseViewRenderer
   Routes to the correct view component based on db.viewType.
   Passes activeViewId + activeView down to task/table/board views
   so they can apply the correct filters and grouping.
════════════════════════════════════════════════════════════════════ */
export default function DatabaseViewRenderer({
  db,
  isViewOnly = false,
  activeViewId,
  activeView,
}: DatabaseViewRendererProps) {
  const id = db._id;

  /* ── Task-oriented views: receive active view for filtering ── */
  if (db.viewType === "todo") {
    return withViewProps(TodoView as any, id, activeViewId, activeView);
  }

  if (db.viewType === "board") {
    return withViewProps(BoardView as any, id, activeViewId, activeView);
  }

  if (db.viewType === "timeline") {
    return withViewProps(TimelineView as any, id, activeViewId, activeView);
  }

  if (db.viewType === "table") {
    return (
      <TableView
        databaseId={id}
        isViewOnly={isViewOnly}
        activeViewId={activeViewId}
        activeView={activeView}
      />
    );
  }

  if (db.viewType === "gallery") {
    return withViewProps(GalleryView as any, id, activeViewId, activeView);
  }

  /* ── Document / rich-content views ── */
  if (db.viewType === "documentation") {
    return (
      <DocumentationView
        databaseId={id}
        templateName={db.templateName}
        activeViewId={activeViewId}
        activeView={activeView}
      />
    );
  }

  if (db.viewType === "text")       return withDb(TextView,       id);
  if (db.viewType === "heading")    return withDb(HeadingView,    id);
  if (db.viewType === "numberlist") return withDb(NumberListView, id);
  if (db.viewType === "bullatedlist") return withDb(BulletedListView, id);

  if (db.viewType === "pagelink") return <LinkProject taskId="task1" />;

  /* ── Rich media views ── */
  if (db.viewType === "presentation") return withDb(PresentationView, id);
  if (db.viewType === "video")        return withDb(VideoView,        id);
  if (db.viewType === "whiteboard")   return withDb(WhiteboardView,   id);
  if (db.viewType === "socialmedia")  return withDb(SocialMediaView,  id);

  if (db.viewType === "chart") {
    return (
      <ChartView
        databaseId={id}
        projectId={db.projectId}
        templateName={db.templateName}
      />
    );
  }

  return <div className="p-6 border rounded-2xl">📊 View coming soon</div>;
}