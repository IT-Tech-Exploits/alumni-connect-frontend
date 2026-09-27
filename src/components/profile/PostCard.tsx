import { useState } from "react";
import {
  Bookmark,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Share2,
  Trash2,
  X,
  Flag,
} from "lucide-react";
import type { Post, PostComment } from "../../types";
import {
  toggleLikePostApi,
  addCommentApi,
  editPostApi,
  deletePostApi,
} from "../../api/postApi";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../lib/timeAgo";
import { Badge, InitialsAvatar } from "../shared";

const CATEGORY_VARIANTS = {
  Achievement: "success",
  "Career Update": "brand",
  News: "warning",
  General: "secondary",
  Event: "danger",
  Job: "default",
} as const;

interface PostCardProps {
  post: Post;
  editable?: boolean;
  onPosted?: (post: Post) => void;
  onError?: (message: string) => void;
}

export function PostCard({ post, editable = false, onPosted, onError }: PostCardProps) {
  const { user } = useAuth();
  const myId = user?._id ?? "";

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const liked = post.likes.includes(myId);
  const isAuthor = post.author._id === myId;
  const canEdit = editable && isAuthor;

  const toastError = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const toggleLike = async () => {
    try {
      const updated = await toggleLikePostApi(post._id);
      onPosted?.(updated);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Could not like post");
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const updated = await addCommentApi(post._id, text);
      setCommentText("");
      onPosted?.(updated);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Could not add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    try {
      const updated = await editPostApi(post._id, editText.trim());
      setEditing(false);
      onPosted?.(updated);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Could not save edit");
    }
  };

  const remove = async () => {
    try {
      await deletePostApi(post._id);
      onPosted?.(post);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Could not delete post");
    } finally {
      setMenuOpen(false);
    }
  };

  const copyLink = () => {
    try {
      void navigator.clipboard?.writeText(
        `${window.location.origin}/feed`,
      );
      setMenuOpen(false);
    } catch {
      /* ignore */
    }
  };

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <InitialsAvatar name={post.author.name} src={post.author.profilePhoto} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-bold text-foreground">{post.author.name}</p>
            <Badge variant={post.author.role === "alumni" ? "brand" : "success"}>
              {post.author.role === "alumni" ? "Alumni" : "Student"}
            </Badge>
            <Badge variant={CATEGORY_VARIANTS[post.category]}>
              {post.category}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {post.author.position ? `${post.author.position} · ` : ""}
            {post.author.graduationYear
              ? `Class of ${post.author.graduationYear} · `
              : ""}
            {timeAgo(post.createdAt)}
          </p>
        </div>

        {/* More menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Post options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border bg-popover py-1 shadow-xl">
                {canEdit && (
                  <>
                    <MenuItem
                      icon={<Pencil className="h-4 w-4" />}
                      label="Edit"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={<Trash2 className="h-4 w-4" />}
                      label="Delete"
                      danger
                      onClick={() => void remove()}
                    />
                  </>
                )}
                <MenuItem
                  icon={saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  label={saved ? "Saved" : "Save"}
                  onClick={() => {
                    setSaved(true);
                    setMenuOpen(false);
                  }}
                />
                {!canEdit && (
                  <MenuItem
                    icon={<Flag className="h-4 w-4" />}
                    label="Report"
                    onClick={() => setMenuOpen(false)}
                  />
                )}
                <MenuItem
                  icon={<Share2 className="h-4 w-4" />}
                  label="Share link"
                  onClick={copyLink}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditText(post.text);
              }}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveEdit()}
              className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primaryLight"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {post.text}
        </p>
      )}

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post"
          className="mt-3 w-full rounded-lg border object-cover"
        />
      )}
      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1 border-t pt-2.5">
        <ActionButton
          active={liked}
          activeClass="text-brand-red"
          className={liked ? "bg-brand-red/10" : ""}
          icon={
            <Heart
              className={`h-4 w-4 ${liked ? "fill-brand-red text-brand-red" : ""}`}
            />
          }
          label={`Like${post.likes.length > 0 ? ` · ${post.likes.length}` : ""}`}
          onClick={() => void toggleLike()}
        />
        <ActionButton
          active={commentsOpen}
          activeClass="text-brand-primary"
          className={commentsOpen ? "bg-brand-primary/10" : ""}
          icon={<MessageCircle className="h-4 w-4" />}
          label={`Comment${post.comments.length > 0 ? ` · ${post.comments.length}` : ""}`}
          onClick={() => setCommentsOpen((o) => !o)}
        />
        <ActionButton
          icon={<Share2 className="h-4 w-4" />}
          label="Share"
          onClick={copyLink}
        />
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="mt-3 space-y-3 rounded-lg bg-muted/30 p-3">
          {post.comments.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              No comments yet.
            </p>
          )}
          {post.comments.map((comment) => (
            <CommentRow key={comment._id} comment={comment} />
          ))}
          <div className="flex items-center gap-2">
            <InitialsAvatar name={user?.name ?? "You"} src={user?.profilePhoto} className="h-7 w-7 text-xs" />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitComment();
              }}
              placeholder="Write a comment…"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={submitting || !commentText.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-50"
              aria-label="Send comment"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function CommentRow({ comment }: { comment: PostComment }) {
  return (
    <div className="flex items-start gap-2.5">
      <InitialsAvatar name={comment.authorName} className="h-7 w-7 text-xs" />
      <div className="min-w-0 rounded-lg bg-card px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold text-foreground">
          {comment.authorName}
          <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
            {comment.authorRole === "alumni" ? "Alumni" : "Student"} · {timeAgo(comment.createdAt)}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-foreground/90">{comment.text}</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
  activeClass = "text-brand-primary",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent ${
        active ? activeClass : "text-muted-foreground"
      } ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
        danger ? "text-brand-red" : "text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}