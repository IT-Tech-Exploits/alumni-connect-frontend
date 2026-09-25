/**
 * Mongoose connection factory for the alumni-connect database package.
 *
 * Reads config from process.env (dotenv). Exact same defaults the deployed
 * backend + frontend use, so `npm run seed` works against a Mongo URI.
 */
import mongoose from "mongoose";
import { config as loadEnvFile } from "dotenv";

// Load .env once, on first import, so `resolveUri()` sees the real value.
loadEnvFile();

export interface ConnectOptions {
  /** Fallback URI when MONGODB_URI / MONGO_URI is unset (local default). */
  defaultUri?: string;
  timeoutMs?: number;
  serverSelectionTimeoutMS?: number;
}

const DEFAULT_URI = "mongodb://127.0.0.1:27017/alumni_connect";

export function resolveUri(uri?: string): string {
  return uri?.trim() || process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim() || DEFAULT_URI;
}

export function mongoUri(): string {
  return resolveUri();
}

/**
 * Establish (or reuse) the global Mongoose connection.
 * Tolerant: if no Mongo server is reachable it retries and finally surfaces a
 * useful error, so CI / offline runs fail loudly instead of hanging.
 */
export async function connectToDatabase(opts: ConnectOptions = {}): Promise<typeof mongoose> {
  const uri = resolveUri();
  mongoose.set("strictQuery", true);
  const serverSelectionTimeoutMS = opts.serverSelectionTimeoutMS ?? 4000;

  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState === 2) {
    // connecting already in progress — wait for it to settle
    await mongoose.connection.asPromise();
    return mongoose;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS });
  mongoose.connection.on("error", (err) => {
    console.error(`[alumni-connect-db] connection error: ${err.message ?? err}`);
  });
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export default connectToDatabase;
