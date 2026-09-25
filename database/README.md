# alumni-connect-database

Self-contained Mongoose data layer for the Exploits Alumni Connect platform.
Every model mirrors the frontend contract (`src/types/*`, `src/api/*`) 1:1, so
`res.json(document)` produces exactly the JSON the UI types describe.

## Layout

```
db/connect.ts   Mongoose connection factory (MONGODB_URI / MONGO_URI)
db/ref.ts       Shared enums + reference data (programmes, departments, campuses…)
db/json.ts      toJSON transform: ObjectId -> string, Date -> ISO string
models/         Mongoose schemas, one file per domain
seed/index.ts   Deterministic demo seed (idempotent, --reset to wipe)
scripts/verify.ts  Post-seed contract smoke test
```

## Models

| File | Collections |
| --- | --- |
| `models/user.ts` | `AlumniUser` (+ embedded education / experiences / achievements) |
| `models/social.ts` | `AlumniConnection`, `AlumniFollow`, `AlumniPost`, `AlumniGroup`, `GroupMember`, `AlumniNotification` |
| `models/career.ts` | `AlumniJob`, `AlumniEvent`, `AlumniConversation`, `AlumniMessage` |
| `models/extras.ts` | `MentorshipRequest`, `CvRosterRow`, `AlumniRosterEntry`, `RosterImportBatch`, `DepartmentDoc`, `CampusDoc`, `StudyModeDoc` |
| `models/recommendation.ts` | `RecommendationDoc`, `SkillEndorsementDoc` |

## Usage

```ts
import { connectToDatabase } from "alumni-connect-database";
import { User } from "alumni-connect-database/models/user.js";

await connectToDatabase();

// passwordHash is `select: false` — opt in explicitly for auth flows.
const user = await User.findOne({ email }).select("+passwordHash");
res.json(user); // _id: "665…", createdAt: "2026-01-15T09:00:00.000Z"
```

Set `MONGODB_URI` (or `MONGO_URI`); it defaults to
`mongodb://127.0.0.1:27017/alumni_connect`.

## Scripts

```bash
npm install
npm run typecheck        # tsc -b, strict
npm run lint             # eslint
npm run seed             # upsert the demo population
npm run seed -- --reset  # wipe every collection first
npm run verify           # assert the serialised contract (run after seeding)
```

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@exploits.ac.zw` | `admin123` |
| Alumni | `alumni1@exploits.ac.zw` | `alumni123` |
| Student | `student1@exploits.ac.zw` | `student123` |

The seed also creates 5 more alumni (`alumni2..6`), 5 more students
(`student2..6`), 15 roster entries (3 unclaimed, so the admin "release claim"
and "re-check pending" paths have data), 3 posts, 2 groups, 2 jobs, 2 events,
4 notifications, 2 mentorship requests, 2 recommendations and a message thread.

## Contract notes

- **`program` vs `programmeName`** — `AlumniUser.program` stores the programme
  *code* (`"BIT"`, what `User.program` holds in the UI) and `programmeName`
  stores the display name (`"Bachelor of Information Technology"`).
- **Snapshots** — connections, posts, jobs, events, recommendations and
  endorsements cache the peer fields they render so list screens need no joins.
  The controller is responsible for projecting `authorSnapshot` -> `author`,
  `targetSnapshot` -> `alumni` / `student`, and `unreadCount[me]` -> `unreadCount`.
- **Reference data** is duplicated from `src/data/departments.ts` on purpose
  (no cross-package imports). Keep the two in sync when programmes or campuses
  change.
