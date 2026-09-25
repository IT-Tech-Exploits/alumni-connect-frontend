import mongoose, { type Model, type Types as MongooseTypes } from "mongoose";
import { RECOMMENDATION_RELATIONS, type RecommendationRelation } from "../db/ref.js";
import { useJsonContract } from "../db/json.js";

// ---------------------------------------------------------------------------
// Recommendation (mirror src/api/recommendationApi.ts `Recommendation`)
// ---------------------------------------------------------------------------

export interface RecommendationDoc {
  _id: MongooseTypes.ObjectId;
  /** The profile the recommendation is written about. */
  recommendeeId: MongooseTypes.ObjectId;
  /** The author. Kept alongside the `from` snapshot so it can be indexed/joined. */
  recommenderId: MongooseTypes.ObjectId;
  /** Author snapshot â€” the UI renders `from.name` / `from.position ?? from.role`. */
  from: {
    _id: string;
    name: string;
    role: string;
    position?: string;
  };
  relation: RecommendationRelation;
  text: string;
  createdAt?: string;
  updatedAt?: string;
}

const recommendationSchema = new mongoose.Schema<RecommendationDoc>(
  {
    recommendeeId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    recommenderId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    from: {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      position: String,
    },
    relation: { type: String, enum: RECOMMENDATION_RELATIONS, required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);
// One recommendation per author, per profile, per relation; newest first.
recommendationSchema.index(
  { recommendeeId: 1, recommenderId: 1, relation: 1 },
  { unique: true },
);
recommendationSchema.index({ recommendeeId: 1, createdAt: -1 });
useJsonContract(recommendationSchema);

export const RecommendationModel: Model<RecommendationDoc> =
  mongoose.models.RecommendationDoc ?? mongoose.model<RecommendationDoc>("RecommendationDoc", recommendationSchema);

// ---------------------------------------------------------------------------
// Skill endorsement (mirror endorseSkillApi: a like on one of a user's skills)
// ---------------------------------------------------------------------------

export interface SkillEndorsementDoc {
  _id: MongooseTypes.ObjectId;
  targetUserId: MongooseTypes.ObjectId;
  endorserId: MongooseTypes.ObjectId;
  skill: string;
  createdAt?: string;
}

const skillEndorsementSchema = new mongoose.Schema<SkillEndorsementDoc>(
  {
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    endorserId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    skill: { type: String, required: true },
  },
  { timestamps: true },
);
// An endorser can endorse a given skill on a given profile only once.
skillEndorsementSchema.index({ targetUserId: 1, endorserId: 1, skill: 1 }, { unique: true });
// Count endorsements per skill for one profile.
skillEndorsementSchema.index({ targetUserId: 1, skill: 1 });
useJsonContract(skillEndorsementSchema);

export const SkillEndorsementModel: Model<SkillEndorsementDoc> =
  mongoose.models.SkillEndorsementDoc ??
  mongoose.model<SkillEndorsementDoc>("SkillEndorsementDoc", skillEndorsementSchema);
