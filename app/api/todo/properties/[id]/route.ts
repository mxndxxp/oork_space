// app/api/todo/properties/[id]/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TodoProperty from "@/lib/models/TodoProperty";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const body    = await req.json();
  const { id }  = await params;

  const updated = await TodoProperty.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await TodoProperty.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}