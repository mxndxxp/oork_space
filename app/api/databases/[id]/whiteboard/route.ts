import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();
    await Database.findByIdAndUpdate(params.id, {
      $set: { canvasData: body.canvas, updatedAt: new Date() },
    }, { upsert: true, new: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] whiteboard POST error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const db = await Database.findById(params.id).select("canvasData");
    return NextResponse.json({ canvas: db?.canvasData ?? null });
  } catch (err: any) {
    console.error("[API] whiteboard GET error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}