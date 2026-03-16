import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const db = await Database.findById(id).select("socialMediaData");
    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: db.socialMediaData ?? null });
  } catch (err: any) {
    console.error("[API] socialmedia GET error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await req.json();
    await Database.findByIdAndUpdate(
      id,
      { $set: { socialMediaData: body.data, updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[API] socialmedia POST error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}