// app/api/databases/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";
import { getDefaultViews } from "@/lib/models/Database";

type OrderedDbRef = {
  _id:   string;
  order: number;
};

async function getOrderedDatabases(projectId: string): Promise<OrderedDbRef[]> {
  const docs = await Database.find({ projectId })
    .sort({ order: 1, createdAt: 1 })
    .select("_id order createdAt")
    .lean<{ _id: unknown; order?: number }[]>();

  const hasMissingOrder = docs.some((doc) => typeof doc.order !== "number");
  if (hasMissingOrder) {
    const bulkOps = docs.map((doc, index) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { order: index } },
      },
    }));
    if (bulkOps.length > 0) await Database.bulkWrite(bulkOps);
    return docs.map((doc, index) => ({ _id: String(doc._id), order: index }));
  }

  return docs.map((doc) => ({ _id: String(doc._id), order: Number(doc.order) }));
}

/* ── GET /api/databases?projectId=xxx ── */
export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json([]);

  await getOrderedDatabases(projectId);
  const dbs = await Database.find({ projectId }).sort({ order: 1, createdAt: 1 });
  return NextResponse.json(dbs);
}

/* ── POST /api/databases ── */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    /* ── Validate ── */
    if (!body.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    if (!body.name)       return NextResponse.json({ error: "name is required" },      { status: 400 });
    if (!body.viewType)   return NextResponse.json({ error: "viewType is required" },  { status: 400 });

    /* ── Ordering ── */
    const orderedDbs = await getOrderedDatabases(body.projectId);
    let nextOrder = orderedDbs.length;

    if (body.insertAfterDatabaseId) {
      const insertAfterIndex = orderedDbs.findIndex(
        (db) => db._id === String(body.insertAfterDatabaseId)
      );
      if (insertAfterIndex !== -1) {
        nextOrder = insertAfterIndex + 1;
        await Database.updateMany(
          { projectId: body.projectId, order: { $gte: nextOrder } },
          { $inc: { order: 1 } }
        );
      }
    }

    /* ── Default views + empty settings ── */
    const views = body.views?.length > 0
      ? body.views
      : getDefaultViews(body.viewType || "table");

    const db = await Database.create({
      projectId:    body.projectId,
      name:         body.name,
      icon:         body.icon        || "📄",
      viewType:     body.viewType,
      templateName: body.templateName || "blank",
      order:        nextOrder,
      views,
      settings: {               // ✅ initialise empty settings so PATCH works immediately
        layout:            body.viewType,
        hiddenProperties:  [],
        groupBy:           "",
        filters:           [],
        sorts:             [],
        conditionalColors: [],
      },
    });

    return NextResponse.json(db);
  } catch (err) {
    console.error("POST /api/databases error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}