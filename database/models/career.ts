import mongoose, { type Model, type Types as MongooseTypes } from "mongoose";
import { JOB_TYPES, JOB_STATUSES, type JobStatus, type JobType } from "../db/ref.js";
import { useJsonContract } from "../db/json.js";

// ---------------------------------------------------------------------------
// Job posting (mirror src/types/job.ts Job + jobApi contract)
// ---------------------------------------------------------------------------

export interface AlumniJob {
  _id: MongooseTypes.ObjectId;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string[];
  salary?: string;
  deadline?: string;
  contactEmail?: string;
  type?: JobType;
  postedBy: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  status: JobStatus;
  /** User ids that applied â€” read by the job detail + admin moderation views. */
  applicants?: string[];
  createdAt?: string;
}

const jobSchema = new mongoose.Schema<AlumniJob>(
  {
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    location: String,
    description: { type: String, required: true },
    requirements: [String],
    salary: String,
    deadline: String,
    contactEmail: String,
    type: { type: String, enum: JOB_TYPES, index: true },
    postedBy: {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      profilePhoto: String,
    },
    status: { type: String, enum: JOB_STATUSES, default: "pending", index: true },
    applicants: [{ type: String, index: true }],
  },
  { timestamps: true },
);
// Jobs board: approved first, newest first.
jobSchema.index({ status: 1, createdAt: -1 });
useJsonContract(jobSchema);

export const JobModel: Model<AlumniJob> =
  mongoose.models.AlumniJob ?? mongoose.model<AlumniJob>("AlumniJob", jobSchema);

// ---------------------------------------------------------------------------
// Event (mirror src/types/event.ts Event + eventApi contract)
// ---------------------------------------------------------------------------

export interface AlumniEvent {
  _id: MongooseTypes.ObjectId;
  title: string;
  description: string;
  eventDate: string;
  location?: string;
  organizer: {
    _id: string;
    name: string;
  };
  participants?: string[];
  imageUrl?: string;
  createdAt?: string;
}

const eventSchema = new mongoose.Schema<AlumniEvent>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    eventDate: { type: String, required: true, index: true },
    location: String,
    organizer: {
      _id: { type: String, required: true },
      name: { type: String, required: true },
    },
    participants: [{ type: String, index: true }],
    imageUrl: String,
  },
  { timestamps: true },
);
// Events page sorts by date; reminders poll the next N events.
eventSchema.index({ eventDate: -1 });
useJsonContract(eventSchema);

export const EventModel: Model<AlumniEvent> =
  mongoose.models.AlumniEvent ?? mongoose.model<AlumniEvent>("AlumniEvent", eventSchema);

// ---------------------------------------------------------------------------
// Conversation + Message (mirror src/types/message.ts Conversation/Message)
// ---------------------------------------------------------------------------

export interface AlumniConversation {
  _id: MongooseTypes.ObjectId;
  /** [aId, bId] sorted ascending, so one pair maps to exactly one document. */
  participants: string[];
  lastMessage: string;
  lastTimestamp: string;
  /** userId -> unread messages for that participant. */
  unreadCount: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

const conversationSchema = new mongoose.Schema<AlumniConversation>(
  {
    participants: { type: [String], required: true },
    lastMessage: { type: String, default: "" },
    lastTimestamp: { type: String, default: () => new Date().toISOString() },
    unreadCount: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);
// One conversation per unordered participant pair.
conversationSchema.index({ participants: 1 }, { unique: true });
useJsonContract(conversationSchema);

export const ConversationModel: Model<AlumniConversation> =
  mongoose.models.AlumniConversation ?? mongoose.model<AlumniConversation>("AlumniConversation", conversationSchema);

export interface AlumniMessage {
  _id: MongooseTypes.ObjectId;
  conversationId?: MongooseTypes.ObjectId;
  senderId: string;
  receiverId: string;
  message: string;
  read?: boolean;
  createdAt?: string;
}

const messageSchema = new mongoose.Schema<AlumniMessage>(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniConversation", index: true },
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
// Thread view, oldest first.
messageSchema.index({ conversationId: 1, createdAt: 1 });
// Unread badge per inbox.
messageSchema.index({ receiverId: 1, read: 1, createdAt: -1 });
useJsonContract(messageSchema);

export const MessageModel: Model<AlumniMessage> =
  mongoose.models.AlumniMessage ?? mongoose.model<AlumniMessage>("AlumniMessage", messageSchema);
