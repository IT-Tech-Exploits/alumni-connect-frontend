import type { Department } from "../api/userApi";
import { graduationYearRange } from "../lib/gradYears";

/**
 * Academic departments offered by Exploits University.
 * Programmes follow the student ID scheme:
 *   PROGRAMME/ENTRY_YEAR/CAMPUS/MODE/SEQUENCE  e.g. BIT/23/BT/NE/004
 */

export interface Campus {
  code: string;
  name: string;
}

export const CAMPUSES: Campus[] = [
  { code: "BT", name: "Blantyre Campus" },
  { code: "LL", name: "Lilongwe Campus" },
  { code: "MZ", name: "Mzuzu Campus" },
];

export interface StudyMode {
  code: string;
  name: string;
}

export const STUDY_MODES: StudyMode[] = [
  { code: "NE", name: "Normal Entry" },
  { code: "ME", name: "Mature Entry" },
];

export interface Programme {
  code: string;
  name: string;
  duration: number;
}

interface DepartmentSeed {
  id: string;
  name: string;
  code: string;
  description: string;
  programmes: Programme[];
}

const departmentSeeds: DepartmentSeed[] = [
  {
    id: "dep-computer-science",
    name: "Computer Science",
    code: "CS",
    description:
      "Advanced computing fundamentals — algorithms, artificial intelligence, cyber security and system architecture.",
    programmes: [
      { code: "BCS", name: "BSc Computer Science", duration: 4 },
      { code: "BCY", name: "BSc Cyber Security", duration: 4 },
    ],
  },
  {
    id: "dep-information-technology",
    name: "Information Technology",
    code: "IT",
    description:
      "Applied IT skills — networking, database administration, cloud infrastructure and enterprise systems.",
    programmes: [
      { code: "BIT", name: "Bachelor of Information Technology", duration: 4 },
      { code: "BNE", name: "BSc Network Engineering", duration: 4 },
      { code: "BCL", name: "BSc Cloud Computing", duration: 4 },
    ],
  },
  {
    id: "dep-software-engineering",
    name: "Software Engineering",
    code: "SE",
    description:
      "Engineering-grade software development — full-stack design, mobile computing, DevOps and quality assurance.",
    programmes: [
      { code: "BSE", name: "BSc Software Engineering", duration: 4 },
      { code: "BMO", name: "BSc Mobile Computing", duration: 4 },
    ],
  },
  {
    id: "dep-business-management",
    name: "Business Management",
    code: "BM",
    description:
      "Modern management practice — entrepreneurship, marketing, operations and organisational leadership.",
    programmes: [
      { code: "BBA", name: "Bachelor of Business Administration", duration: 4 },
      { code: "BMR", name: "BCom Marketing Management", duration: 4 },
    ],
  },
  {
    id: "dep-accounting-finance",
    name: "Accounting & Finance",
    code: "AF",
    description:
      "Financial stewardship — financial accounting, auditing, taxation and corporate finance.",
    programmes: [
      { code: "BAC", name: "BSc Accounting", duration: 4 },
      { code: "BFC", name: "BSc Finance", duration: 4 },
    ],
  },
];

export const DEPARTMENTS: Department[] = departmentSeeds.map((d) => ({
  _id: d.id,
  name: d.name,
  code: d.code,
  description: d.description,
  programs: d.programmes.map((p) => p.name),
  programCategories: {
    BSc: d.programmes
      .filter((p) => p.code.startsWith("BSc") || p.code.startsWith("BC"))
      .map((p) => p.name),
    BCom: d.programmes
      .filter((p) => p.code.startsWith("BCom") || p.code.startsWith("BMR"))
      .map((p) => p.name),
  },
  isActive: true,
  createdAt: new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000 * (6 + departmentSeeds.indexOf(d)),
  ).toISOString(),
  updatedAt: new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString(),
}));

export function getProgrammesForDepartment(departmentId: string): Programme[] {
  return (
    departmentSeeds.find(
      (d) => d.id === departmentId || d.name === departmentId,
    )?.programmes ?? []
  );
}

export function getProgrammeByCode(code: string): Programme | undefined {
  const all = departmentSeeds.flatMap((d) => d.programmes);
  return all.find((p) => p.code === code);
}

export function getDepartmentByProgrammeCode(
  code: string,
): Department | undefined {
  return DEPARTMENTS.find((d) =>
    d.programs?.some(
      (name) => name.toLowerCase() === (getProgrammeByCode(code)?.name ?? "").toLowerCase(),
    ),
  );
}

export function getDepartmentByName(name?: string): Department | undefined {
  if (!name) return undefined;
  return DEPARTMENTS.find(
    (d) => d.name.toLowerCase() === name.trim().toLowerCase(),
  );
}

export function parseStudentId(id: string) {
  const match = /^([A-Z]{2,4})\/(\d{2})\/([A-Z]{2})\/([A-Z]{2})\/(\d{3})$/.exec(
    id.trim().toUpperCase(),
  );
  if (!match) return null;
  const [, programme, entryYear, campus, mode, sequence] = match;
  return {
    programmeCode: programme,
    programmeName: getProgrammeByCode(programme)?.name ?? programme,
    entryYear: 2000 + Number(entryYear),
    campusCode: campus,
    campusName: CAMPUSES.find((c) => c.code === campus)?.name ?? campus,
    modeCode: mode,
    modeName: STUDY_MODES.find((m) => m.code === mode)?.name ?? mode,
    sequence,
  };
}

export function getDepartmentStatsDataset() {
  return DEPARTMENTS.map((d) => ({
    _id: d.name,
    count: 42 + (d.programs?.length ?? 0) * 37 + (departmentSeeds.findIndex((s) => s.id === d._id) % 3) * 19,
  }));
}

export const ENTRY_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
export const GRADUATION_YEARS = graduationYearRange();