import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Users } from "lucide-react";
import {
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";
import {
  getFeedApi,
  createPostApi,
  toggleLikePostApi,
  addCommentApi,
  editPostApi,
  deletePostApi,
} from "../api/postApi";
import { getFollowingIdsApi } from "../api/followApi";
import { POST_CATEGORIES, type Post, type PostCategory } from "../types";
import { timeAgo } from "../lib/timeAgo";
import {
  Badge,
  EmptyState,
  InitialsAvatar,
  Spinner,
} from "../components/shared";
import { Select } from "../components/shared/Select";

const CATEGORY_VARIANTS: Record<PostCategory, "brand" | "success" | "warning" | "danger" | "secondary" | "default"> = {
  Achievement: "success",
  "Career Update": "brand",
  News: "warning",
  General: "secondary",
  Event: "danger",
  Job: "default",
};

const CATEGORY_EMOJI: Record<PostCategory, string> = {
  Achievement: "🏆",
  "Career Update": "🚀",
  News: "📰",
  General: "💬",
  Event: "📅",
  Job: "💼",
};

const FeedPage = () => {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | PostCategory>("All");
  const [followingOnly, setFollowingOnly] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );

  // Composer state
  const [draft, setDraft] = useState("");
  const [draftCategory, setDraftCategory] = useState<PostCategory>("General");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // Editing + comment drafts
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentingId, setCommentingId] = useState<string | null>(null);

  const loadFeed = () => {
    setLoading(true);
    getFeedApi()
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load feed"))
      .finally(() => setLoading(false));
    getFollowingIdsApi()
      .then((ids) => setFollowingIds(new Set(ids)))
      .catch(() => setFollowingIds(new Set()));
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const myId = user?._id ?? "";
  const visiblePosts = useMemo(() => {
    if (filter !== "All") {
      return posts.filter((p) => p.category === filter);
    }
    if (followingOnly) {
      return posts.filter(
        (p) => followingIds.has(p.author._id) || p.author._id === myId,
      );
    }
    return posts;
  }, [posts, filter, followingOnly, followingIds, myId]);

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePost = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    setError("");
    try {
      const post = await createPostApi({
        category: draftCategory,
        text: draft.trim(),
      });
      setPosts((prev) => [post, ...prev]);
      setDraft("");
      setDraftCategory("General");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish post");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (post: Post) => {
    const hasLiked = post.likes.includes(myId);
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? {
              ...p,
              likes: hasLiked
                ? p.likes.filter((l) => l !== myId)
                : [...p.likes, myId],
            }
          : p,
      ),
    );
    try {
      await toggleLikePostApi(post._id);
    } catch {
      loadFeed();
    }
  };

  const handleComment = async (post: Post) => {
    const text = commentDrafts[post._id]?.trim();
    if (text.length < 1) return;
    const optimistic: Post = {
      ...post,
      comments: [
        ...post.comments,
        {
          _id: `opt-${Date.now()}`,
          userId: myId,
          authorName: user?.name ?? "You",
          authorRole: user?.role ?? "alumni",
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    setPosts((prev) => prev.map((p) => (p._id === post._id ? optimistic : p)));
    setCommentDrafts((prev) => ({ ...prev, [post._id]: "" }));
    setCommentingId(post._id);
    try {
      const updated = await addCommentApi(post._id, text);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add comment");
      loadFeed();
    } finally {
      setCommentingId(null);
    }
  };

  const startEdit = (post: Post) => {
    setEditingId(post._id);
    setEditText(post.text);
  };

  const saveEdit = async (postId: string) => {
    if (!editText.trim()) return;
    try {
      const updated = await editPostApi(postId, editText.trim());
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
      setEditingId(null);
      setEditText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save edit");
    }
  };

  const handleDelete = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try {
      await deletePostApi(postId);
    } catch {
      setError("Could not delete post");
      loadFeed();
    }
  };

  return (
    <PageContainer title="Community Feed">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Composer */}
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <InitialsAvatar name={user?.name ?? "You"} src={user?.profilePhoto} />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Share an update, achievement or opportunity with students and alumni…"
              className="min-h-[3rem] w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {draft && (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Select
                  value={draftCategory}
                  onChange={(v) => setDraftCategory(v as PostCategory)}
                  options={POST_CATEGORIES.map((c) => ({
                    value: c,
                    label: `${CATEGORY_EMOJI[c]}  ${c}`,
                  }))}
                  className="w-44"
                />
                <span className="ml-auto text-xs text-muted-foreground sm:ml-0">
                  {draft.length}/1000
                </span>
              </div>
              <button
                type="button"
                onClick={handlePost}
                disabled={!draft.trim() || posting}
                className="inline-flex items-center gap-2 self-end rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-50"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </button>
            </div>
          )}
        </section>

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            key="following"
            type="button"
            onClick={() => setFollowingOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              followingOnly
                ? "bg-brand-red text-white"
                : "border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {followingOnly ? "Showing people you follow" : "Following"}
          </button>
          {(["All", ...POST_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c as "All" | PostCategory)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === c
                  ? "bg-brand-primary text-white"
                  : "border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {c === "All" ? "All" : `${CATEGORY_EMOJI[c]} ${c}`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : visiblePosts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title={filter === "All" ? "No posts yet" : `No ${filter.toLowerCase()} posts`}
            description="Be the first to share something with the community."
            compact
          />
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => (
              <article
                key={post._id}
                className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <InitialsAvatar
                    name={post.author.name}
                    src={post.author.profilePhoto}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {post.author.name}
                      </p>
                      <Badge
                        variant={
                          post.author.role === "alumni" ? "brand" : "success"
                        }
                      >
                        {post.author.role === "alumni" ? "Alumni" : "Student"}
                      </Badge>
                      <Badge variant={CATEGORY_VARIANTS[post.category]}>
                        {CATEGORY_EMOJI[post.category]} {post.category}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {post.author.position ? `${post.author.position} · ` : ""}
                      {post.author.graduationYear
                        ? `Class of ${post.author.graduationYear} · `
                        : "Current student · "}
                      {timeAgo(post.createdAt)}
                    </p>
                  </div>

                  {/* Own-post actions */}
                  {post.author._id === myId && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(post)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-brand-primary"
                        aria-label="Edit post"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post._id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-brand-red"
                        aria-label="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Body */}
                {editingId === post._id ? (
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
                          setEditingId(null);
                          setEditText("");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(post._id)}
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

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => handleLike(post)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      post.likes.includes(myId)
                        ? "bg-brand-red/10 text-brand-red"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        post.likes.includes(myId) ? "fill-brand-red text-brand-red" : ""
                      }`}
                    />
                    {post.likes.length > 0 && post.likes.length}
                    {post.likes.includes(myId)
                      ? "Liked"
                      : post.likes.length > 0
                        ? "Likes"
                        : "Like"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleComments(post._id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      expandedComments.has(post._id)
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.comments.length} Comments
                  </button>
                </div>

                {/* Comments */}
                {expandedComments.has(post._id) && (
                  <div className="mt-3 space-y-3 rounded-lg bg-muted/30 p-3">
                    {post.comments.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground">
                        No comments yet — start the conversation.
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex items-start gap-2.5">
                        <InitialsAvatar
                          name={comment.authorName}
                          className="h-7 w-7 text-xs"
                        />
                        <div className="min-w-0 rounded-lg bg-card px-3 py-2 shadow-sm">
                          <p className="text-xs font-semibold text-foreground">
                            {comment.authorName}
                            <span className="ml-1.5 inline-flex items-center">
                              <Badge
                                variant={
                                  comment.authorRole === "alumni"
                                    ? "brand"
                                    : "success"
                                }
                                className="px-1.5 py-0 text-[9px]"
                              >
                                {comment.authorRole}
                              </Badge>
                            </span>
                          </p>
                          <p className="mt-0.5 text-sm text-foreground/90">
                            {comment.text}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {timeAgo(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add comment */}
                    <div className="flex items-center gap-2">
                      <InitialsAvatar
                        name={user?.name ?? "You"}
                        src={user?.profilePhoto}
                        className="h-7 w-7 text-xs"
                      />
                      <input
                        value={commentDrafts[post._id] ?? ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleComment(post);
                        }}
                        placeholder="Write a comment…"
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => handleComment(post)}
                        disabled={commentingId === post._id}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-50"
                        aria-label="Send comment"
                      >
                        {commentingId === post._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Have something to share?{" "}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1 font-medium text-brand-primary hover:underline"
          >
            Scroll up <ArrowUp className="h-3.5 w-3.5" />
          </button>{" "}
          and post it.
        </p>
      </div>
    </PageContainer>
  );
};

export default FeedPage;