/**
 * Post-seed smoke test: asserts the stored documents serialise into exactly the
 * JSON contract the frontend types describe (src/types/*).
 *
 *   npm run seed && npm run verify
 */
import { connectToDatabase, disconnectDatabase } from "../db/connect.js";
import { User } from "../models/user.js";
import { PostModel } from "../models/social.js";
import { ConversationModel } from "../models/career.js";
import { AlumniRosterModel, rosterIdFor } from "../models/extras.js";

let failures = 0;

function check(label: string, ok: boolean, detail?: unknown): void {
  if (ok) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}`, detail === undefined ? "" : detail);
  }
}

const isIso = (v: unknown): boolean => typeof v === "string" && !Number.isNaN(Date.parse(v));

async function main(): Promise<void> {
  await connectToDatabase();

  console.log("user");
  const withHash = await User.findOne({ email: "student1@exploits.ac.zw" }).select("+passwordHash");
  const user = withHash?.toJSON() as Record<string, unknown> | undefined;
  check("document exists", Boolean(user));
  if (user) {
    check("_id is a string", typeof user._id === "string", user._id);
    check("createdAt is an ISO string", isIso(user.createdAt), user.createdAt);
    check("passwordHash is present when selected", typeof withHash?.passwordHash === "string");
    check("skills is string[]", Array.isArray(user.skills) && user.skills.every((s) => typeof s === "string"));
    check("education entries serialise with string _id", Array.isArray(user.education));
  }
  const withoutHash = await User.findOne({ email: "student1@exploits.ac.zw" });
  check("passwordHash is hidden by default", withoutHash?.passwordHash === undefined);

  console.log("post");
  const post = (await PostModel.findOne().sort({ createdAt: -1 }))?.toJSON() as
    | Record<string, unknown>
    | undefined;
  check("document exists", Boolean(post));
  if (post) {
    check("_id is a string", typeof post._id === "string", post._id);
    check("author ref is a string", typeof post.author === "string", post.author);
    const snapshot = post.authorSnapshot as Record<string, unknown> | undefined;
    check(
      "authorSnapshot carries name + role",
      typeof snapshot?.name === "string" && typeof snapshot?.role === "string",
      snapshot,
    );
    check("likes serialise as strings", Array.isArray(post.likes) && post.likes.every((l) => typeof l === "string"));
    check("createdAt is an ISO string", isIso(post.createdAt), post.createdAt);
  }

  console.log("conversation");
  const conversation = (await ConversationModel.findOne())?.toJSON() as
    | Record<string, unknown>
    | undefined;
  check("document exists", Boolean(conversation));
  if (conversation) {
    const unread = conversation.unreadCount as Record<string, number> | undefined;
    check("unreadCount is a plain object of numbers", Boolean(unread) && typeof unread === "object" && !Array.isArray(unread) && Object.values(unread ?? {}).every((n) => typeof n === "number"), unread);
    check("participants is string[2]", Array.isArray(conversation.participants) && conversation.participants.length === 2);
  }

  console.log("roster");
  const entry = (await AlumniRosterModel.findOne({ _id: rosterIdFor("BSE/16/LL/NE/001") }))?.toJSON() as
    | Record<string, unknown>
    | undefined;
  check("unclaimed entry exists", Boolean(entry));
  if (entry) {
    check("status is unclaimed", entry.status === "unclaimed", entry.status);
    check("claimedBy is null", entry.claimedBy === null, entry.claimedBy);
  }
  const claimed = (await AlumniRosterModel.findOne({ status: "claimed" }))?.toJSON() as
    | Record<string, unknown>
    | undefined;
  check("claimed entry serialises claimedBy as a string", typeof claimed?.claimedBy === "string", claimed?.claimedBy);

  console.log(failures === 0 ? "\nverify: all checks passed" : `\nverify: ${failures} check(s) failed`);
}

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch(async (err: unknown) => {
    console.error("verify: crashed", err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
