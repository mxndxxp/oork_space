// lib/models/Project.ts  (or app/models/Project.ts — match your existing import path)
import mongoose, { Schema, models, model } from "mongoose";

const ProjectSchema = new Schema(
  {
    name:     { type: String, required: true },
    emoji:    { type: String, default: "📁" },

    /* ── New fields for Kanban board ── */
    status: {
      type:    String,
      enum:    ["Not started", "In progress", "Done"],
      default: "Not started",
    },
    priority: {
      type:    String,
      enum:    ["Low", "Medium", "High"],
      default: "Medium",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },

    /* optional extras */
    description: { type: String, default: "" },
    dueDate:     { type: Date,   default: null },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Project;
}

export default models.Project || model("Project", ProjectSchema);