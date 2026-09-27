import { useCallback, useMemo, useRef, useState } from "react";
import { AtSign } from "lucide-react";
import {
  getAlumniDirectoryApi,
  getStudentsDirectoryApi,
} from "../../api/directoryApi";
import type { DirectoryUser } from "../../types";
import { InitialsAvatar } from "../shared";

export interface MentionCandidate {
  _id: string;
  name: string;
  role: string;
  program?: string;
  graduationYear?: string;
}

const toCandidate = (u: DirectoryUser): MentionCandidate => ({
  _id: u._id,
  name: u.name,
  role: u.role,
  program: u.program,
  graduationYear: u.graduationYear,
});

interface TagUserInputProps {
  value: string;
  onChange: (next: string) => void;
  onMentions?: (ids: string[]) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * LinkedIn-style mention composer. Typing "@" opens a member picker; selecting
 * a member embeds "@Name" inline, which the Tagged section later surfaces.
 */
export function TagUserInput({
  value,
  onChange,
  onMentions,
  placeholder,
  rows = 3,
}: TagUserInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const loadedRef = useRef(false);

  /** Member list comes from the directory endpoints, fetched on first "@". */
  const loadCandidates = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    Promise.all([getAlumniDirectoryApi(), getStudentsDirectoryApi()])
      .then(([alumni, students]) => {
        setCandidates([
          ...alumni.alumni.map(toCandidate),
          ...students.students.map(toCandidate),
        ]);
      })
      .catch(() => {
        loadedRef.current = false;
      });
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter(
      (c) => !q || c.name.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query, candidates]);

  const handleChange = (next: string) => {
    onChange(next);
    // Detect whether we are mid-@ mention.
    const at = next.lastIndexOf("@");
    if (at !== -1) {
      const token = next.slice(at + 1);
      if (token.length <= 40 && !/\n/.test(token) && /^[\p{L}\p{N}_ ]*$/u.test(token)) {
        loadCandidates();
        setOpen(true);
        setQuery(token.trim());
        return;
      }
    }
    setOpen(false);
    setQuery("");
  };

  const select = (candidate: MentionCandidate) => {
    if (!value.includes("@")) return;
    const at = value.lastIndexOf("@");
    const before = value.slice(0, at);
    const after = value.slice(at + query.length + 1);
    const next = `${before}@${candidate.name} ${after}`.replace(/\s+$/, " ");
    onChange(next);
    onMentions?.([candidate._id]);
    setOpen(false);
    setQuery("");
    boxRef.current?.focus();
  };

  const mentionIsActive = open && suggestions.length > 0;

  return (
    <div className="relative w-full">
      <textarea
        ref={boxRef}
        value={value}
        rows={rows}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? "Share something with the community… (type @ to mention someone)"}
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-brand-primary/40"
      />
      {mentionIsActive && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border bg-popover py-1 shadow-xl">
          <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <AtSign className="h-3.5 w-3.5" /> Mention a member
          </p>
          {suggestions.map((c) => (
            <button
              key={c._id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                select(c);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            >
              <InitialsAvatar
                name={c.name}
                className="h-7 w-7 text-xs"
              />
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {c.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {c.role === "alumni" ? "Alumni" : "Student"} · {c.program ?? "Exploits University"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}