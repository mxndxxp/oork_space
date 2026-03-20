import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import Database from "@/lib/models/Database";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const db = await Database.findById(id).lean();
    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Try common row model patterns
    const candidates = ["Row", "TableRow", "Task", "Record", "Item", "Entry"];
    for (const name of candidates) {
      try {
        const Model = mongoose.model(name);
        const rows = await Model.find({ databaseId: id })
          .sort({ sortOrder: 1, createdAt: 1 })
          .limit(500)
          .lean();

        if (rows.length > 0) {
          const skip = new Set(["_id", "__v", "databaseId", "createdAt", "updatedAt", "sortOrder"]);
          const colSet = new Set<string>();
          rows.forEach(r => Object.keys(r).forEach(k => { if (!skip.has(k)) colSet.add(k); }));
          const columns = Array.from(colSet);
          const data = rows.map(r => columns.map(c => (r as any)[c] ?? ""));
          return NextResponse.json({ columns, rows: data, source: name });
        }
      } catch { /* model doesn't exist, try next */ }
    }

    // Return database's own chartData columns as fallback if available
    return NextResponse.json({ columns: [], rows: [], source: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}