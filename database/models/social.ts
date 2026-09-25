import mongoose, { type Model, type Types } from "mongoose";
import {
  CONNECTION_STATUSES,
  GROUP_CATEGORIES,
  NOTIFICATION_TYPES,
  POST_CATEGORIES,
  departmentForProgramme,
  programmeNameFor,
  type NotificationType,
} from "../db/ref.js";
import { useJsonContract } from "../db/json.js";

// ---------------------------------------------------------------------------
// Connection (mirror src/types/connection.ts + src/api/connectionApi.ts)
// ---------------------------------------------------------------------------

export interface AlumniConnection {
  _id: Types.ObjectId;
  requesterId: Types.ObjectId;
  targetId: Types.ObjectId;
  status: (typeof CONNECTION_STATUSES)[number];
  /**
   * Peer snapshot so the student / alumni connection tables render without a
   * join. The API projects it as `alumni` (student view) or `student`
   * (alumni view) to match src/types/connection.ts.
   */
  targetSnapshot?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    profilePhoto?: string;
    headline?: string;
    location?: string;
    department?: string;
    program?: string;
    company?: string;
    position?: string;
    graduationYear?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const connectionSchema = new mongoose.Schema<AlumniConnection>(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    status: { type: String, enum: CONNECTION_STATUSES, required: true, default: "pending", index: true },
    targetSnapshot: new mongoose.Schema(
      {
        _id: String,
        name: String,
        email: String,
        role: String,
        profilePhoto: String,
        headline: String,
        location: String,
        department: String,
        program: String,
        company: String,
        position: String,
        graduationYear: String,
      },
      { _id: false },
    ),
  },
  { timestamps: true },
);
connectionSchema.index({ requesterId: 1, targetId: 1 }, { unique: true });
// Accepted-connections list, newest first.
connectionSchema.index({ targetId: 1, status: 1, updatedAt: -1 });
useJsonContract(connectionSchema);

export const ConnectionModel: Model<AlumniConnection> =
  mongoose.models.AlumniConnection ?? mongoose.model<AlumniConnection>("AlumniConnection", connectionSchema);

// ---------------------------------------------------------------------------
// Follow (mirror src/api/followApi.ts contract)
// ---------------------------------------------------------------------------

export interface AlumniFollow {
  _id: Types.ObjectId;
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt?: string;
}

const followSchema = new mongoose.Schema<AlumniFollow>(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
  },
  { timestamps: true },
);
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
useJsonContract(followSchema);

export const FollowModel: Model<AlumniFollow> =
  mongoose.models.AlumniFollow ?? mongoose.model<AlumniFollow>("AlumniFollow", followSchema);

// ---------------------------------------------------------------------------
// Post + comments (mirror src/types/post.ts Post/PostComment + postApi contract)
// ---------------------------------------------------------------------------

export interface PostCommentRow {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  authorPhoto?: string;
  authorRole: string;
  text: string;
  createdAt?: string;
}

const commentSchema = new mongoose.Schema<PostCommentRow>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", index: true },
    authorName: { type: String, required: true },
    authorPhoto: String,
    authorRole: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);
useJsonContract(commentSchema);

export interface AlumniPost {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  /**
   * Author snapshot cached at write time. The API projects this as `author`
   * so the payload matches `Post.author` in src/types/post.ts.
   */
  authorSnapshot: {
    _id: string;
    name: string;
    profilePhoto?: string;
    role: string;
    department?: string;
    position?: string;
    graduationYear?: string;
  };
  category: (typeof POST_CATEGORIES)[number];
  text: string;
  imageUrl?: string;
  likes: Types.ObjectId[];
  comments: PostCommentRow[];
  groupId?: Types.ObjectId;
  createdAt?: string;
  updatedAt?: string;
}

const postSchema = new mongoose.Schema<AlumniPost>(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    authorSnapshot: new mongoose.Schema(
      {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        profilePhoto: String,
        role: { type: String, required: true },
        department: String,
        position: String,
        graduationYear: String,
      },
      { _id: false },
    ),
    category: { type: String, enum: POST_CATEGORIES, required: true, index: true },
    text: { type: String, required: true },
    imageUrl: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser" }],
    comments: [commentSchema],
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniGroup", index: true },
  },
  { timestamps: true },
);
// Community feed: newest first, optionally scoped to a group.
postSchema.index({ createdAt: -1 });
postSchema.index({ groupId: 1, createdAt: -1 });
useJsonContract(postSchema);

export const PostModel: Model<AlumniPost> =
  mongoose.models.AlumniPost ?? mongoose.model<AlumniPost>("AlumniPost", postSchema);

// Re-export helpers so consumers can ignore how models are stored.
export { departmentForProgramme, programmeNameFor };

// ---------------------------------------------------------------------------
// Group + membership (mirror src/data/mockGroups.ts Group + groupsApi contract)
// ---------------------------------------------------------------------------

export interface AlumniGroup {
  _id: Types.ObjectId;
  name: string;
  emoji: string;
  category: (typeof GROUP_CATEGORIES)[number];
  description: string;
  campus?: string;
  /** Programme label as the UI shows it, e.g. "BIT / BSE". */
  program?: string;
  graduationYear?: string;
  createdBy: Types.ObjectId;
  createdAt?: string;
  updatedAt?: string;
}

const groupSchema = new mongoose.Schema<AlumniGroup>(
  {
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: "ðŸ‘¥" },
    category: { type: String, enum: GROUP_CATEGORIES, required: true, index: true },
    description: String,
    campus: String,
    program: String,
    graduationYear: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true },
  },
  { timestamps: true },
);
useJsonContract(groupSchema);

export const GroupModel: Model<AlumniGroup> =
  mongoose.models.AlumniGroup ?? mongoose.model<AlumniGroup>("AlumniGroup", groupSchema);

export interface GroupMember {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  joinedAt?: Date;
}

const groupMemberSchema = new mongoose.Schema<GroupMember>(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniGroup", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
  },
  { timestamps: true },
);
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
useJsonContract(groupMemberSchema);

export const GroupMemberModel: Model<GroupMember> =
  mongoose.models.GroupMember ?? mongoose.model<GroupMember>("GroupMember", groupMemberSchema);

// ---------------------------------------------------------------------------
// Notification (mirror src/types/notification.ts Notification contract)
// ---------------------------------------------------------------------------

export { NOTIFICATION_TYPES, type NotificationType };

export interface AlumniNotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  actorId?: Types.ObjectId;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  actionUrl?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const notificationSchema = new mongoose.Schema<AlumniNotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    readAt: String,
    actionUrl: String,
    imageUrl: String,
  },
  { timestamps: true },
);
// Composite index for the unread-badge query and the notifications list.
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
useJsonContract(notificationSchema);

export const NotificationModel: Model<AlumniNotification> =
  mongoose.models.AlumniNotification ?? mongoose.model<AlumniNotification>("AlumniNotification", notificationSchema);
