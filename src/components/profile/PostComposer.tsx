import { useState } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createPostApi } from "../../api/postApi";
import { POST_CATEGORIES, type PostCategory } from "../../types";
import { InitialsAvatar } from "../shared";
import { TagUserInput } from "./TagUserInput";

const CATEGORY_EMOJI: Record<PostCategory, string> = {
  Achievement: "🏆",
  "Career Update": "🚀",
  News: "📰",
  General: "💬",
  Event: "📅",
  Job: "💼",
};

interface PostComposerProps {
  onPosted?: () => void;
  onError?: (message: string) => void;
}

export function PostComposer({ onPosted, onError }: PostComposerProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<PostCategory>("General");
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!text.trim() || text.trim().length < 2) return;
    setPosting(true);
    try {
      await createPostApi({ category, text: text.trim() });
      setText("");
      setCategory("General");
      onPosted?.();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not publish post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={user?.name ?? "You"} src={user?.profilePhoto} />
        <TagUserInput
          value={text}
          onChange={setText}
          placeholder="Start a post… type @ to tag a member"
          rows={2}
        />
      </div>

      {text.trim() && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {POST_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  category === c
                    ? "bg-brand-primary text-white"
                    : "bg-accent text-muted-foreground hover:bg-accent/70"
                }`}
              >
                {CATEGORY_EMOJI[c]} {c}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
              <span className="text-xs">Images arrive with real uploads</span>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={posting || text.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-50"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </button>
          </div>
        </div>
      )}
    </section>
  );
}