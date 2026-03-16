import mongoose, { Schema, models, model } from "mongoose";

const DatabaseSchema = new Schema(
  {
    projectId:        { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name:             { type: String, required: true },
    icon:             { type: String, default: "📄" },
    viewType: {
      type: String,
      enum: [
        "timeline","table","board","gallery",
        "todo","text","heading","bullatedlist",
        "numberlist","pagelink",
        "presentation","video","whiteboard","socialmedia",
      ],
      default: "table",
    },
    templateName:     { type: String,             default: "blank" },
    canvasData:       { type: Schema.Types.Mixed,  default: null }, // Whiteboard
    presentationData: { type: Schema.Types.Mixed,  default: null }, // Presentation
    videoData:        { type: Schema.Types.Mixed,  default: null }, // Video
    socialMediaData:  { type: Schema.Types.Mixed,  default: null }, // Social Media ✅
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Database;
}

export default models.Database || model("Database", DatabaseSchema);