// app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";

/* ── PATCH /api/projects/:id ── */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const body    = await req.json();
  const allowed = ["name", "emoji", "status", "priority", "progress", "description", "dueDate"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const project = await Project.findByIdAndUpdate(
    params.id,
    { $set: patch },
    { new: true }
  );

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

/* ── DELETE /api/projects/:id ── */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  await Project.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}

/* ── GET /api/projects/:id ── */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const project = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}