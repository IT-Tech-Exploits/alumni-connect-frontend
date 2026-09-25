/**
 * Serialisation helpers that make the stored documents match the JSON contract
 * the frontend consumes (src/types/*): `_id`s are strings, timestamps are ISO
 * strings. Without this a `res.json(user)` would ship ObjectId instances and
 * Date objects, which the TypeScript types in the UI do not describe.
 */
import mongoose, { type Schema } from "mongoose";

/**
 * Recursively rewrites ObjectId -> hex string and Date -> ISO string, in place.
 * Walks plain objects, mongoose arrays and nested sub-documents; nothing is
 * copied, so it is safe to call on a `toJSON` payload.
 */
export function jsonIdify(container: unknown): void {
  if (container === null || typeof container !== "object") return;

  if (Array.isArray(container)) {
    for (let i = 0; i < container.length; i += 1) {
      const entry = container[i];
      if (entry instanceof mongoose.Types.ObjectId) container[i] = entry.toString();
      else if (entry instanceof Date) container[i] = entry.toISOString();
      else jsonIdify(entry);
    }
    return;
  }

  const record = container as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const entry = record[key];
    if (entry instanceof mongoose.Types.ObjectId) record[key] = entry.toString();
    else if (entry instanceof Date) record[key] = entry.toISOString();
    else jsonIdify(entry);
  }
}

/**
 * Installs the shared transform on a schema. Call it after the schema and its
 * indexes are defined.
 */
export function useJsonContract<T>(schema: Schema<T>): void {
  schema.set("toJSON", {
    virtuals: false,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      jsonIdify(ret);
    },
  });
}
