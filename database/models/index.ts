/**
 * Barrel for every Mongoose model in the package, so consumers can either
 * `import { User } from "alumni-connect-database/models/index.js"` or reach
 * the individual files via `.../models/user.js`.
 */
export { User } from "./user.js";
export type {
  AlumniUser,
  AchievementSubDoc,
  EducationSubDoc,
  ExperienceSubDoc,
} from "./user.js";

export { ConnectionModel, FollowModel, GroupMemberModel, GroupModel, NotificationModel, PostModel } from "./social.js";
export type {
  AlumniConnection,
  AlumniFollow,
  AlumniGroup,
  AlumniNotification,
  AlumniPost,
  GroupMember,
  PostCommentRow,
} from "./social.js";

export {
  ConversationModel,
  EventModel,
  JobModel,
  MessageModel,
} from "./career.js";
export type {
  AlumniConversation,
  AlumniEvent,
  AlumniJob,
  AlumniMessage,
} from "./career.js";

export {
  AlumniRosterModel,
  CampusModel,
  CvRosterModel,
  DepartmentModel,
  MentorshipModel,
  RosterImportBatchModel,
  StudyModeModel,
  departmentDocuments,
  rosterIdFor,
} from "./extras.js";
export type {
  AlumniRosterEntry,
  CampusDoc,
  CvRosterRow,
  DepartmentDoc,
  MentorshipRequest,
  RosterImportBatch,
  StudyModeDoc,
} from "./extras.js";

export { RecommendationModel, SkillEndorsementModel } from "./recommendation.js";
export type { RecommendationDoc, SkillEndorsementDoc } from "./recommendation.js";
