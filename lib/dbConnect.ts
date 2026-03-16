import mongoose from "mongoose";

  // Read the MongoDB connection string from environment variables so it works across
  // local and deployed environments. Do NOT throw synchronously here — that would
  // produce HTML error pages before route handlers can catch errors. Instead
  // validate inside the async function so callers can handle the rejected promise.
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cached = (global as any).mongoose;
  if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached = (global as any).mongoose = { conn: null, promise: null };
  }

export default async function dbConnect() {
  if (!MONGO_URI) {
    const err = new Error("Missing MONGO_URI (set MONGO_URI or DATABASE_URL in .env.local)");
    console.error("[dbConnect]", err.message);
    // Throw inside async function so callers receive a rejected promise and can
    // return JSON errors rather than Next rendering an HTML error page.
    throw err;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI)
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err) => {
        // Reset cached.promise so future calls can retry the connection
        cached.promise = null;
        console.error("[dbConnect] mongoose.connect error:", err);
        throw err;
      });
  }

  return cached.promise;
}
