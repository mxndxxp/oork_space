import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const { id } = await params;
    const deletedDatabase = await Database.findByIdAndDelete(id);

    if (!deletedDatabase) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}