/**
 * Deterministic demo seed for the Exploits Alumni Connect database.
 *
 *   npm run seed            # upsert the demo population (idempotent)
 *   npm run seed -- --reset # wipe the collections first, then seed
 *
 * The demo logins match src/lib/demoCode.ts + AGENTS.md so the frontend's
 * mock-mode credentials keep working against a real database:
 *   admin@exploits.ac.zw   / admin123
 *   alumni1@exploits.ac.zw / alumni123
 *   student1@exploits.ac.zw/ student123
 */
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";

import { connectToDatabase, disconnectDatabase, resolveUri } from "../db/connect.js";
import {
  CAMPUSES,
  STUDY_MODE_NAMES,
  currentYear,
  departmentForProgramme,
  graduationMaxYear,
  programmeNameFor,
} from "../db/ref.js";
import { User } from "../models/user.js";
import {
  ConnectionModel,
  FollowModel,
  GroupMemberModel,
  GroupModel,
  NotificationModel,
  PostModel,
} from "../models/social.js";
import { ConversationModel, EventModel, JobModel, MessageModel } from "../models/career.js";
import {
  AlumniRosterModel,
  CampusModel,
  CvRosterModel,
  DepartmentModel,
  MentorshipModel,
  RosterImportBatchModel,
  StudyModeModel,
  departmentDocuments,
  rosterIdFor,
} from "../models/extras.js";
import { RecommendationModel, SkillEndorsementModel } from "../models/recommendation.js";

const RESET = process.argv.includes("--reset");
const PASSWORD_COST = 10;

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const daysAhead = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
const year = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Demo people
// ---------------------------------------------------------------------------

interface PersonSeed {
  key: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "alumni" | "student";
  program: string;
  graduationYear: string;
  campusCode: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  interests?: string[];
  experiences?: Array<{
    title: string;
    company: string;
    startDate: string;
    current?: boolean;
    location?: string;
    description?: string;
  }>;
  achievements?: Array<{ title: string; date?: string; organization?: string }>;
  approved?: boolean;
  createdAt: string;
}

const ALUMNI: PersonSeed[] = [
  {
    key: "alumni1",
    name: "Tinashe Dlamini",
    email: "alumni1@exploits.ac.zw",
    password: "alumni123",
    role: "alumni",
    program: "BIT",
    graduationYear: "2019",
    campusCode: "BT",
    phone: "+265 772 111 222",
    company: "Old Mutual",
    position: "Software Engineer",
    location: "Blantyre, Malawi",
    headline: "Software Engineer at Old Mutual · BIT '19",
    bio: "Software engineer at Old Mutual, mentoring students across campus tech events.",
    skills: ["JavaScript", "React", "Node.js"],
    interests: ["Mentorship", "Software", "Career Growth"],
    experiences: [
      {
        title: "Software Engineer",
        company: "Old Mutual",
        startDate: "2021-03",
        current: true,
        location: "Blantyre, Malawi",
        description: "Customer-facing insurance platforms, plus a weekly mentoring slot for final-year students.",
      },
    ],
    achievements: [
      { title: "Dean's List", date: "2019-06", organization: "Exploits University" },
      { title: "Hackathon Winner", date: "2018-11" },
    ],
    createdAt: daysAgo(760),
  },
  {
    key: "alumni2",
    name: "Rudo Banda",
    email: "alumni2@exploits.ac.zw",
    password: "alumni123",
    role: "alumni",
    program: "BCS",
    graduationYear: "2020",
    campusCode: "LL",
    company: "Econet Wireless",
    position: "Data Scientist",
    location: "Lilongwe, Malawi",
    headline: "Data Scientist · ML pipelines in production",
    skills: ["Python", "Data Analysis", "SQL"],
    interests: ["AI/ML", "Mentorship"],
    experiences: [
      {
        title: "Data Scientist",
        company: "Econet Wireless",
        startDate: "2020-09",
        current: true,
        location: "Lilongwe, Malawi",
      },
    ],
    createdAt: daysAgo(700),
  },
  {
    key: "alumni3",
    name: "Farai Ndlovu",
    email: "alumni3@exploits.ac.zw",
    password: "alumni123",
    role: "alumni",
    program: "BSE",
    graduationYear: "2021",
    campusCode: "MZ",
    company: "Delta Corporation",
    position: "Full-Stack Developer",
    location: "Blantyre, Malawi",
    skills: ["TypeScript", "React", "AWS"],
    interests: ["Cloud", "Entrepreneurship"],
    createdAt: daysAgo(640),
  },
  {
    key: "alumni4",
    name: "Nyaradzo Dube",
    email: "alumni4@exploits.ac.zw",
    password: "alumni123",
    role: "alumni",
    program: "BAC",
    graduationYear: "2018",
    campusCode: "BT",
    company: "Deloitte",
    position: "Senior Auditor",
    location: "Blantyre, Malawi",
    skills: ["SQL", "Communication", "Project Management"],
    interests: ["Mentorship", "Finance"],
    createdAt: daysAgo(880),
  },
  {
    key: "alumni5",
    name: "Simba Chirwa",
    email: "alumni5@exploits.ac.zw",
    password: "alumni123",
    role: "alumni",
    program: "BCL",
    graduationYear: "2023",
    campusCode: "LL",
    company: "Liquid Intelligent Technologies",
    position: "Cloud Architect",
    location: "Lilongwe, Malawi",
    skills: ["AWS", "DevOps", "Python"],
    interests: ["Cloud", "Mentorship"],
    createdAt: daysAgo(420),
  },
  {
    key: "alumni6",
    name: "Chipo Maseko",
    email: "alumni6@exploits.ac.zw",
    password: "alumni123",
    role: "alumni",
    program: "BMR",
    graduationYear: "2021",
    campusCode: "MZ",
    company: "Zimpapers",
    position: "Social Media Lead",
    location: "Mzuzu, Malawi",
    skills: ["Communication", "Public Speaking", "Leadership"],
    interests: ["Community Service"],
    createdAt: daysAgo(600),
  },
];

const STUDENTS: PersonSeed[] = [
  {
    key: "student1",
    name: "Tapiwa Moyo",
    email: "student1@exploits.ac.zw",
    password: "student123",
    role: "student",
    program: "BIT",
    graduationYear: String(Math.min(year + 2, graduationMaxYear())),
    campusCode: "BT",
    phone: "+265 991 222 333",
    location: "Blantyre, Malawi",
    headline: "BIT student · interested in cloud engineering",
    bio: "Third-year Information Technology student building small cloud projects.",
    skills: ["JavaScript", "AWS", "Communication"],
    interests: ["Mentorship", "Cloud", "Career Growth"],
    createdAt: daysAgo(300),
  },
  {
    key: "student2",
    name: "Rudo Chikafu",
    email: "student2@exploits.ac.zw",
    password: "student123",
    role: "student",
    program: "BCS",
    graduationYear: String(Math.min(year + 1, graduationMaxYear())),
    campusCode: "LL",
    location: "Lilongwe, Malawi",
    skills: ["Python", "SQL"],
    interests: ["AI/ML", "Networking"],
    createdAt: daysAgo(280),
  },
  {
    key: "student3",
    name: "Farai Sibanda",
    email: "student3@exploits.ac.zw",
    password: "student123",
    role: "student",
    program: "BSE",
    graduationYear: String(Math.min(year + 3, graduationMaxYear())),
    campusCode: "MZ",
    location: "Mzuzu, Malawi",
    skills: ["TypeScript", "React"],
    interests: ["Software", "Entrepreneurship"],
    createdAt: daysAgo(240),
  },
  {
    key: "student4",
    name: "Nyaradzo Chirwa",
    email: "student4@exploits.ac.zw",
    password: "student123",
    role: "student",
    program: "BSE",
    graduationYear: String(Math.min(year + 2, graduationMaxYear())),
    campusCode: "BT",
    location: "Blantyre, Malawi",
    skills: ["Leadership", "Communication"],
    interests: ["Mentorship", "Community Service"],
    createdAt: daysAgo(200),
  },
  {
    key: "student5",
    name: "Simba Banda",
    email: "student5@exploits.ac.zw",
    password: "student123",
    role: "student",
    program: "BBA",
    graduationYear: String(Math.min(year + 1, graduationMaxYear())),
    campusCode: "LL",
    location: "Lilongwe, Malawi",
    skills: ["Project Management", "Communication"],
    interests: ["Entrepreneurship", "Networking"],
    createdAt: daysAgo(180),
  },
  {
    key: "student6",
    name: "Tanaka Nyathi",
    email: "student6@exploits.ac.zw",
    password: "student123",
    role: "student",
    program: "BCY",
    graduationYear: String(Math.min(year + 4, graduationMaxYear())),
    campusCode: "MZ",
    location: "Mzuzu, Malawi",
    skills: ["Python", "Communication"],
    interests: ["AI/ML", "Mentorship"],
    createdAt: daysAgo(120),
  },
];

const ADMIN: PersonSeed = {
  key: "admin",
  name: "Exploits Admin",
  email: "admin@exploits.ac.zw",
  password: "admin123",
  role: "admin",
  program: "BIT",
  graduationYear: "2015",
  campusCode: "BT",
  location: "Blantyre, Malawi",
  headline: "Alumni Connect administrator",
  skills: ["Leadership", "Project Management"],
  createdAt: daysAgo(1200),
};

/** Registration number in the PROGRAMME/YY/CAMPUS/MODE/SEQ scheme. */
function registrationNumberFor(p: PersonSeed, index: number): string {
  const yy = p.graduationYear.slice(2);
  const seq = String((index + 1) * 7).padStart(3, "0");
  return `${p.program}/${yy}/${p.campusCode}/NE/${seq}`;
}

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

/** Minimal shape every model in this package satisfies, for bulk operations. */
type SeedModel = {
  deleteMany: (filter: object) => Promise<unknown>;
  createIndexes: () => Promise<unknown>;
};

const ALL_MODELS: SeedModel[] = [
  User,
  ConnectionModel,
  FollowModel,
  PostModel,
  GroupModel,
  GroupMemberModel,
  NotificationModel,
  JobModel,
  EventModel,
  ConversationModel,
  MessageModel,
  MentorshipModel,
  CvRosterModel,
  AlumniRosterModel,
  RosterImportBatchModel,
  RecommendationModel,
  SkillEndorsementModel,
  DepartmentModel,
  CampusModel,
  StudyModeModel,
];

async function wipe(): Promise<void> {
  await Promise.all(ALL_MODELS.map((m) => m.deleteMany({})));
  console.log(`[seed] cleared ${ALL_MODELS.length} collections`);
}

async function seedReference(): Promise<void> {
  const departments = await DepartmentModel.bulkWrite(
    departmentDocuments().map(({ _id, ...rest }) => ({
      updateOne: { filter: { _id }, update: { $set: rest }, upsert: true },
    })),
  );
  const campuses = await CampusModel.bulkWrite(
    CAMPUSES.map(({ code, name, city }) => ({
      updateOne: { filter: { _id: code }, update: { $set: { code, name, city } }, upsert: true },
    })),
  );
  const modes = await StudyModeModel.bulkWrite(
    Object.entries(STUDY_MODE_NAMES).map(([code, name]) => ({
      updateOne: {
        filter: { _id: code },
        update: { $set: { _id: code, code, name } },
        upsert: true,
      },
    })),
  );
  console.log(
    `[seed] reference data: ${departments.upsertedCount + departments.modifiedCount} departments, ` +
      `${campuses.upsertedCount + campuses.modifiedCount} campuses, ` +
      `${modes.upsertedCount + modes.modifiedCount} study modes`,
  );
}

async function seedUsers(): Promise<Map<string, Types.ObjectId>> {
  const all = [ADMIN, ...ALUMNI, ...STUDENTS];
  const ids = new Map<string, Types.ObjectId>();

  for (const [index, p] of all.entries()) {
    const passwordHash = await bcrypt.hash(p.password, PASSWORD_COST);
    const isAdmin = p.role === "admin";
    const isAlumni = p.role === "alumni";
    const doc = await User.findOneAndUpdate(
      { email: p.email },
      {
        $set: {
          name: p.name,
          passwordHash,
          role: p.role,
          phone: p.phone,
          registrationNumber: isAdmin ? undefined : registrationNumberFor(p, index),
          department: isAdmin ? undefined : departmentForProgramme(p.program),
          program: p.program,
          programmeName: programmeNameFor(p.program),
          studyModeCode: isAdmin ? undefined : "NE",
          campusCode: p.campusCode,
          graduationYear: p.graduationYear,
          location: p.location,
          headline: p.headline,
          bio: p.bio,
          company: p.company,
          position: p.position,
          skills: p.skills,
          interests: p.interests ?? [],
          experiences:
            p.experiences?.map((e) => ({
              title: e.title,
              company: e.company,
              startDate: e.startDate,
              current: e.current,
              location: e.location,
              description: e.description,
            })) ?? [],
          achievements:
            p.achievements?.map((a) => ({
              title: a.title,
              date: a.date,
              organization: a.organization,
            })) ?? [],
          education: isAlumni
            ? [
                {
                  institution: "Exploits University",
                  programme: programmeNameFor(p.program),
                  programmeCode: p.program,
                  department: departmentForProgramme(p.program),
                  campus: CAMPUSES.find((c) => c.code === p.campusCode)?.name,
                  graduationYear: p.graduationYear,
                },
              ]
            : [],
          isApproved: p.approved ?? (p.role !== "student"),
          pendingApproval: !isAdmin && p.role === "alumni" && p.approved === false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    ids.set(p.key, doc._id as Types.ObjectId);
  }

  console.log(`[seed] users: ${all.length} (1 admin, ${ALUMNI.length} alumni, ${STUDENTS.length} students)`);
  return ids;
}

async function seedRoster(ids: Map<string, Types.ObjectId>): Promise<void> {
  const entries: Array<{
    _id: string;
    registrationNumber: string;
    fullName: string;
    department?: string;
    program?: string;
    graduationYear?: string;
    email?: string;
    status: "claimed" | "unclaimed";
    claimedBy?: Types.ObjectId | null;
    claimedAt?: Date | null;
  }> = [];
  const all = [ADMIN, ...ALUMNI, ...STUDENTS];
  for (const [index, p] of all.entries()) {
    if (p.role === "admin") continue;
    const registrationNumber = registrationNumberFor(p, index);
    entries.push({
      _id: rosterIdFor(registrationNumber),
      registrationNumber,
      fullName: p.name,
      department: departmentForProgramme(p.program),
      program: programmeNameFor(p.program),
      graduationYear: p.graduationYear,
      email: p.email,
      status: "claimed",
      claimedBy: ids.get(p.key) ?? null,
      claimedAt: new Date(p.createdAt),
    });
  }

  // Alumni known to the university but not yet registered on the platform.
  for (const extra of UNCLAIMED) {
    entries.push({
      _id: rosterIdFor(extra.registrationNumber),
      registrationNumber: extra.registrationNumber,
      fullName: extra.fullName,
      department: departmentForProgramme(extra.program),
      program: programmeNameFor(extra.program),
      graduationYear: extra.graduationYear,
      status: "unclaimed",
      claimedBy: null,
      claimedAt: null,
    });
  }

  await AlumniRosterModel.bulkWrite(
    entries.map(({ _id, ...rest }) => ({
      updateOne: { filter: { _id }, update: { $set: rest }, upsert: true },
    })),
  );
  await RosterImportBatchModel.create({
    fileName: "alumni-roster-demo.csv",
    uploadedByEmail: ADMIN.email,
    dryRun: false,
    totalRows: entries.length,
    validRows: entries.length,
    errorRows: 0,
    created: entries.length,
    updated: 0,
    skippedClaimed: 0,
  });
  console.log(
    `[seed] roster: ${entries.length} entries (${entries.filter((e) => e.status === "unclaimed").length} unclaimed) + 1 import batch`,
  );
}

const UNCLAIMED: Array<{
  registrationNumber: string;
  fullName: string;
  program: string;
  graduationYear: string;
}> = [
  { registrationNumber: "BSE/16/LL/NE/001", fullName: "Chikondi Banda", program: "BSE", graduationYear: "2020" },
  { registrationNumber: "BAC/14/BT/NE/014", fullName: "Thoko Phiri", program: "BAC", graduationYear: "2018" },
  { registrationNumber: "BIT/18/BT/NE/009", fullName: "Limbani Gondwe", program: "BIT", graduationYear: "2022" },
];

async function seedSocial(ids: Map<string, Types.ObjectId>): Promise<void> {
  const alumni1 = ids.get("alumni1")!;
  const alumni2 = ids.get("alumni2")!;
  const alumni3 = ids.get("alumni3")!;
  const student1 = ids.get("student1")!;
  const student2 = ids.get("student2")!;
  const student3 = ids.get("student3")!;
  const student4 = ids.get("student4")!;
  const admin = ids.get("admin")!;

  const snapshot = (userId: Types.ObjectId, key: string) => {
    const p = [ADMIN, ...ALUMNI, ...STUDENTS].find((x) => x.key === key)!;
    return {
      _id: String(userId),
      name: p.name,
      role: p.role,
      position: p.position,
      department: p.role === "admin" ? "" : departmentForProgramme(p.program),
      graduationYear: p.graduationYear,
    };
  };

  await ConnectionModel.deleteMany({});
  await ConnectionModel.insertMany([
    {
      requesterId: student1,
      targetId: alumni1,
      status: "accepted",
      targetSnapshot: snapshot(alumni1, "alumni1"),
    },
    {
      requesterId: student2,
      targetId: alumni2,
      status: "pending",
      targetSnapshot: snapshot(alumni2, "alumni2"),
    },
    {
      requesterId: student1,
      targetId: admin,
      status: "accepted",
      targetSnapshot: snapshot(admin, "admin"),
    },
  ]);

  await FollowModel.deleteMany({});
  await FollowModel.insertMany([
    { followerId: student1, followingId: alumni1 },
    { followerId: student2, followingId: alumni2 },
  ]);

  await PostModel.deleteMany({});
  await PostModel.insertMany([
    {
      author: alumni1,
      authorSnapshot: snapshot(alumni1, "alumni1"),
      category: "Achievement" as const,
      text: "Promoted to Senior Software Engineer at Old Mutual. Grateful to the mentors and classmates from Exploits who helped me get here — happy to give guidance to anyone preparing for interviews.",
      likes: [student1],
      comments: [
        {
          userId: student1,
          authorName: STUDENTS[0].name,
          authorRole: "student",
          text: "Congratulations! Could you share the study plan you used for the interviews?",
        },
      ],
    },
    {
      author: alumni2,
      authorSnapshot: snapshot(alumni2, "alumni2"),
      category: "Career Update" as const,
      text: "Sharing a cloud-study roadmap I wish I had as a student: fundamentals -> hands-on labs -> certifications -> real projects. Ping me and I'll send the template.",
      likes: [student1, student2],
      comments: [],
    },
    {
      author: student1,
      authorSnapshot: snapshot(student1, "student1"),
      category: "General" as const,
      text: `Anyone keen on a weekend system-design study group? ${ALUMNI[0].name} offered to review our diagrams.`,
      likes: [alumni1],
      comments: [],
    },
  ]);

  await GroupModel.deleteMany({});
  const [bitGroup, blantyreGroup] = await GroupModel.insertMany([
    {
      name: "BIT & Software Engineering",
      emoji: "\u{1F465}",
      category: "Programme" as const,
      program: "BIT / BSE",
      description:
        "For current students and alumni of computing programmes to share code, career tips and job leads.",
      createdBy: alumni1,
    },
    {
      name: "Blantyre Campus Community",
      emoji: "\u{1F3E1}",
      category: "Campus" as const,
      campus: "BT",
      description: "Everything happening at Blantyre Campus — events, study groups and city catch-ups.",
      createdBy: alumni3,
    },
  ]);
  await GroupMemberModel.deleteMany({});
  await GroupMemberModel.insertMany([
    { groupId: bitGroup._id, userId: alumni1 },
    { groupId: bitGroup._id, userId: student1 },
    { groupId: bitGroup._id, userId: student3 },
    { groupId: blantyreGroup._id, userId: student1 },
    { groupId: blantyreGroup._id, userId: student4 },
  ]);
  console.log("[seed] social: 3 connections, 2 follows, 3 posts, 2 groups + 5 memberships");

  await NotificationModel.deleteMany({});
  await NotificationModel.insertMany([
    {
      userId: student1,
      actorId: alumni1,
      type: "mentorship_accepted" as const,
      title: "Mentorship accepted",
      message: `${ALUMNI[0].name} accepted your mentorship request.`,
      data: { alumniId: String(alumni1), alumniName: ALUMNI[0].name },
      read: false,
      actionUrl: "/find-mentor",
    },
    {
      userId: alumni1,
      actorId: student1,
      type: "mentorship_request" as const,
      title: "Mentorship request",
      message: `${STUDENTS[0].name} requested you as a mentor in Information Technology.`,
      data: { studentId: String(student1), studentName: STUDENTS[0].name },
      read: false,
      actionUrl: "/alumni/students",
    },
    {
      userId: student1,
      type: "event_reminder" as const,
      title: "Event reminder",
      message: "Alumni Connect Career Expo starts in 3 days at Blantyre Campus.",
      read: true,
      readAt: daysAgo(1),
      actionUrl: "/events",
    },
    {
      userId: student1,
      type: "system" as const,
      title: "Profile 80% complete",
      message: "Add a cover photo and one achievement to finish your profile.",
      read: false,
    },
  ]);

  await MentorshipModel.deleteMany({});
  await MentorshipModel.insertMany([
    {
      menteeId: student1,
      mentorId: alumni1,
      menteeName: STUDENTS[0].name,
      mentorName: ALUMNI[0].name,
      mentorRole: "alumni",
      status: "accepted" as const,
      goal: "Interview prep" as const,
      message: "I would like help preparing for software engineering interviews.",
    },
    {
      menteeId: student2,
      mentorId: alumni2,
      menteeName: STUDENTS[1].name,
      mentorName: ALUMNI[1].name,
      mentorRole: "alumni",
      status: "pending" as const,
      goal: "Career guidance" as const,
    },
  ]);

  await RecommendationModel.deleteMany({});
  await RecommendationModel.insertMany([
    {
      recommendeeId: student1,
      recommenderId: alumni1,
      from: { _id: String(alumni1), name: ALUMNI[0].name, role: "alumni", position: ALUMNI[0].position },
      relation: "mentor" as const,
      text: "Tapiwa is one of the standout students I have mentored — curious, hard-working and quick to apply feedback.",
    },
    {
      recommendeeId: alumni1,
      recommenderId: alumni2,
      from: { _id: String(alumni2), name: ALUMNI[1].name, role: "alumni", position: ALUMNI[1].position },
      relation: "colleague" as const,
      text: "Tinashe consistently delivers clean, well-tested code and makes the people around him better.",
    },
  ]);

  await SkillEndorsementModel.deleteMany({});
  await SkillEndorsementModel.insertMany([
    { targetUserId: alumni1, endorserId: student1, skill: "JavaScript" },
    { targetUserId: alumni1, endorserId: student2, skill: "JavaScript" },
    { targetUserId: alumni1, endorserId: student1, skill: "React" },
    { targetUserId: alumni1, endorserId: admin, skill: "Mentoring" },
  ]);

  await CvRosterModel.deleteMany({});
  await CvRosterModel.insertMany(
    ALUMNI.map((p, i) => ({
      userId: ids.get(p.key)!,
      name: p.name,
      email: p.email,
      position: p.position,
      role: p.role,
      department: departmentForProgramme(p.program),
      program: p.program,
      campus: p.campusCode,
      graduationYear: p.graduationYear,
      approved: i < 4,
      approvedAt: i < 4 ? daysAgo(30 * (i + 1)) : undefined,
    })),
  );
}

async function seedCareer(ids: Map<string, Types.ObjectId>): Promise<void> {
  const alumni1 = ids.get("alumni1")!;
  const alumni5 = ids.get("alumni5")!;
  const student1 = ids.get("student1")!;

  await JobModel.deleteMany({});
  await JobModel.insertMany([
    {
      title: "Junior Software Engineer",
      company: "Old Mutual",
      location: "Blantyre, Malawi",
      description:
        "Join a growing engineering squad working on customer-facing insurance products. We value clean code, curiosity and mentorship.",
      requirements: ["JavaScript", "Node.js", "SQL"],
      salary: "MK 45,000 - 60,000",
      deadline: daysAhead(45),
      contactEmail: "careers@oldmutual.example",
      type: "full-time" as const,
      postedBy: { _id: String(alumni1), name: ALUMNI[0].name },
      status: "approved" as const,
      applicants: [String(student1)],
    },
    {
      title: "Cloud Engineering Intern",
      company: "Liquid Intelligent Technologies",
      location: "Lilongwe, Malawi",
      description:
        "Six-month internship on our cloud platform team. Startup pace with a mentor attached to every new hire.",
      requirements: ["AWS", "Terraform", "Linux"],
      type: "internship" as const,
      postedBy: { _id: String(alumni5), name: ALUMNI[4].name },
      status: "pending" as const,
      applicants: [],
    },
  ]);

  await EventModel.deleteMany({});
  await EventModel.insertMany([
    {
      title: "Alumni Connect Career Expo",
      description:
        "Student teams pitch early-stage ventures to a panel of alumni investors. Prizes and follow-on mentorship on offer.",
      eventDate: daysAhead(3),
      location: "Blantyre Campus",
      organizer: { _id: String(alumni1), name: ALUMNI[0].name },
      participants: [String(student1)],
    },
    {
      title: "Mentorship Pairs Breakfast",
      description: "Introducing this semester's mentorship pairs over a relaxed breakfast.",
      eventDate: daysAhead(21),
      location: "Lilongwe Campus",
      organizer: { _id: String(ids.get("alumni2")!), name: ALUMNI[1].name },
      participants: [],
    },
  ]);

  await ConversationModel.deleteMany({});
  await MessageModel.deleteMany({});
  const [conversation] = await ConversationModel.insertMany([
    {
      participants: [String(student1), String(alumni1)].sort(),
      lastMessage: "Are you attending the mentorship kickoff?",
      lastTimestamp: daysAgo(0.2),
      unreadCount: { [String(student1)]: 1 },
    },
  ]);
  await MessageModel.insertMany([
    {
      conversationId: conversation._id,
      senderId: String(alumni1),
      receiverId: String(student1),
      message: "Yes — see you at the Blantyre Campus breakfast.",
      read: true,
    },
    {
      conversationId: conversation._id,
      senderId: String(student1),
      receiverId: String(alumni1),
      message: "Are you attending the mentorship kickoff?",
      read: false,
    },
  ]);
  console.log("[seed] career: 2 jobs, 2 events, 1 conversation, 2 messages");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const uri = resolveUri();
  const isLocal = uri.startsWith("mongodb://127.0.0.1") || uri.startsWith("mongodb://localhost");
  console.log(`[seed] target: ${isLocal ? uri.replace(/\/\/.*@/, "//") : "<remote cluster>"}`);

  await connectToDatabase();
  console.log(`[seed] connected (server year ${currentYear()})`);

  if (RESET) await wipe();

  await Promise.all(ALL_MODELS.map((m) => m.createIndexes()));
  console.log("[seed] indexes ensured");

  await seedReference();
  const ids = await seedUsers();
  await seedRoster(ids);
  await seedSocial(ids);
  await seedCareer(ids);

  const [users, posts, jobs, events, roster, notifications] = await Promise.all([
    User.countDocuments(),
    PostModel.countDocuments(),
    JobModel.countDocuments(),
    EventModel.countDocuments(),
    AlumniRosterModel.countDocuments(),
    NotificationModel.countDocuments(),
  ]);
  console.log(
    `[seed] done — ${users} users, ${posts} posts, ${jobs} jobs, ${events} events, ` +
      `${roster} roster entries, ${notifications} notifications`,
  );
  console.log("[seed] logins: admin@exploits.ac.zw/admin123, alumni1@exploits.ac.zw/alumni123, student1@exploits.ac.zw/student123");
}

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("[seed] failed:", err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
