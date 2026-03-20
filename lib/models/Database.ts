// app/models/Database.ts  (or lib/models/Database.ts — match your existing import path)

import mongoose, { Schema, models, model } from "mongoose";

const ViewSchema = new Schema(
  {
    id:        { type: String, required: true },
    label:     { type: String, required: true },
    icon:      { type: String, default: "star" },
    type:      { type: String, enum: ["all","by-status","my-tasks","custom"], default: "all" },
    groupBy:   { type: String, default: null },
    sortBy:    { type: String, default: null },
    sortDir:   { type: String, enum: ["asc","desc"], default: "asc" },
    filters:   { type: Schema.Types.Mixed, default: [] },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const SettingsSchema = new Schema(
  {
    layout:            { type: String, default: null },
    hiddenProperties:  { type: [String], default: [] },
    groupBy:           { type: String, default: "" },
    filters:           { type: Schema.Types.Mixed, default: [] },
    sorts:             { type: Schema.Types.Mixed, default: [] },
    conditionalColors: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

const DatabaseSchema = new Schema(
  {
    projectId:        { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name:             { type: String, required: true },
    icon:             { type: String, default: "📄" },
    viewType: {
      type: String,
      enum: [
        "timeline","table","board","gallery",
        "todo","text","documentation","pagelink",
        "presentation","video","whiteboard","socialmedia","chart",
      ],
      default: "table",
    },
    templateName:     { type: String, default: "blank" },
    order:            { type: Number, default: 0 },
    views:            { type: [ViewSchema],   default: [] },
    settings:         { type: SettingsSchema, default: () => ({}) },
    canvasData:       { type: Schema.Types.Mixed, default: null },
    presentationData: { type: Schema.Types.Mixed, default: null },
    videoData:        { type: Schema.Types.Mixed, default: null },
    socialMediaData:  { type: Schema.Types.Mixed, default: null },
    documentData:     { type: Schema.Types.Mixed, default: null },
    chartData:        { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Database;
}

export default models.Database || model("Database", DatabaseSchema);

export function getDefaultViews(viewType: string) {
  if (["todo","board","table","timeline"].includes(viewType)) {
    return [
      { id:"all",       label:"All Tasks", icon:"star",   type:"all",       isDefault:true,  filters:[] },
      { id:"by-status", label:"By Status", icon:"circle", type:"by-status", groupBy:"status",filters:[] },
      { id:"my-tasks",  label:"My Tasks",  icon:"user",   type:"my-tasks",  filters:[{field:"assignee",op:"eq",value:"me"}] },
    ];
  }
  if (["documentation","text","pagelink"].includes(viewType)) {
    return [
      { id:"all",  label:"All Pages", icon:"star", type:"all",      isDefault:true, filters:[] },
      { id:"mine", label:"My Pages",  icon:"user", type:"my-tasks", filters:[] },
    ];
  }
  return [
    { id:"all", label:"All Items", icon:"star", type:"all", isDefault:true, filters:[] },
  ];
}