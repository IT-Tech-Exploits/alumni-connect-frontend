export interface Group {
  _id: string;
  name: string;
  emoji: string;
  category: "Programme" | "Campus" | "Year" | "Interest";
  description: string;
  memberCount: number;
  campus?: string;
  program?: string;
}
