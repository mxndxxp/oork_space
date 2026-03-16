import jwt from "jsonwebtoken";

// Validate JWT_SECRET at runtime and provide clear error messages.
const JWT_SECRET = process.env.JWT_SECRET || null;

function ensureSecret() {
  if (!JWT_SECRET) {
    const err = new Error("Missing JWT_SECRET environment variable. Set JWT_SECRET in .env.local or your environment.");
    console.error("[jwt]", err.message);
    throw err;
  }
}

export function signToken(payload: object) {
  ensureSecret();
  try {
    return jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: "7d",
    });
  } catch (err: any) {
    console.error("[jwt] signToken error:", err);
    throw err;
  }
}

export function verifyToken(token: string) {
  ensureSecret();
  try {
    return jwt.verify(token, JWT_SECRET as string);
  } catch (err: any) {
    console.error("[jwt] verifyToken error:", err);
    throw err;
  }
}