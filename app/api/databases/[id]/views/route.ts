import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/app/models/Database";

// PATCH /api/databases/:id/views — save updated views array
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const { views } = await req.json();
  const db = await Database.findByIdAndUpdate(
    params.id,
    { $set: { views } },
    { new: true }
  );
  if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(db);
}