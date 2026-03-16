import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const db = await Database.findById(id).select("presentationData");
    // Return an empty array if no presentation data exists so the frontend can use starter slides
    return NextResponse.json({ slides: db?.presentationData ?? [] });
  } catch (err: any) {
    console.error("[API] presentation GET error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await req.json();
    // Upsert so the database doc is created if it doesn't exist
    await Database.findByIdAndUpdate(
      id,
      { $set: { presentationData: body.slides, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] presentation POST error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
