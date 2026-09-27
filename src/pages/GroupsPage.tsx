import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Users, X } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import type { Post } from "../types";
import {
  getGroupMemberNamesApi,
  getGroupPostsApi,
  getGroupsApi,
  isInGroupApi,
  toggleJoinGroupApi,
} from "../api/groupsApi";
import type { Group } from "../types";
import { Spinner } from "../components/shared";
import { timeAgo } from "../lib/timeAgo";

type GroupView = "discover" | "my";

interface GroupDetail extends Group {
  posts: Post[];
  members: string[];
}

const GROUPS = {
  discover: "Discover",
  my: "My Groups",
} as const;

const GroupsPage = () => {
  const [view, setView] = useState<GroupView>("discover");
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getGroupsApi();
      setGroups(list);
      const ids = await Promise.all(list.map((g) => isInGroupApi(g._id)));
      setJoinedIds(new Set(list.filter((_, i) => ids[i]).map((g) => g._id)));
    } catch {
      setError("Could not load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = async (id: string) => {
    setBusyId(id);
    try {
      const res = await toggleJoinGroupApi(id);
      setJoinedIds((prev) => {
        const next = new Set(prev);
        if (res.joined) next.add(id);
        else next.delete(id);
        return next;
      });
      setGroups((prev) =>
        prev.map((g) =>
          g._id === id ? { ...g, memberCount: res.memberCount } : g,
        ),
      );
    } catch { /* silent */ }
    setBusyId(null);
  };

  const openDetail = async (group: Group) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const [posts, members] = await Promise.all([
        getGroupPostsApi(group._id),
        getGroupMemberNamesApi(group._id),
      ]);
      setDetail({ ...group, posts, members });
    } catch {
      setDetail({ ...group, posts: [], members: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const visible = view === "my"
    ? groups.filter((g) => joinedIds.has(g._id))
    : groups;

  return (
    <PageContainer title="Groups">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Groups &amp; Clubs</h2>
          <p className="text-sm text-muted-foreground">
            Join communities by programme, campus, cohort or interest.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-card p-0.5">
          {(Object.keys(GROUPS) as GroupView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === v
                  ? "bg-brand-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {GROUPS[v]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
          <Users className="h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {view === "my"
              ? "You haven't joined any groups yet."
              : "No groups found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((g) => {
            const joined = joinedIds.has(g._id);
            return (
              <div
                key={g._id}
                className="flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-2xl">
                    {g.emoji}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggle(g._id)}
                    disabled={busyId === g._id}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60 ${
                      joined
                        ? "border border-border text-foreground hover:bg-accent"
                        : "bg-brand-primary text-white hover:bg-brand-primaryLight"
                    }`}
                  >
                    {busyId === g._id ? "..." : joined ? "Joined" : "Join"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void openDetail(g)}
                  className="mt-3 text-left"
                >
                  <p className="text-sm font-bold text-foreground hover:text-brand-primary">
                    {g.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {g.category}
                    {g.campus ? ` · ${g.campus} Campus · ` : g.program ? ` · ${g.program}` : " · "}
                    {g.memberCount.toLocaleString()} members
                  </p>
                </button>
                <p className="mt-2 line-clamp-2 flex-1 text-xs text-muted-foreground">
                  {g.description}
                </p>
                {joined && (
                  <button
                    type="button"
                    onClick={() => void openDetail(g)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> View discussions
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {detail.emoji} {detail.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {detail.category} · {detail.memberCount.toLocaleString()} members
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{detail.description}</p>

            {detail.members.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent members
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detail.members.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Discussions
              </p>
              {detailLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : detail.posts.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No discussions yet — be the first to post.
                </p>
              ) : (
                <div className="mt-2 space-y-3">
                  {detail.posts
                    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
                    .map((post) => (
                      <div key={post._id} className="rounded-xl border p-4">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground">
                            {post.author.name}
                          </p>
                          <span className="rounded-full bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-primary">
                            {post.author.role}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            · {timeAgo(post.createdAt)}
                          </span>
                        </div>
                        {post.category !== "General" && (
                          <span className="mt-1 inline-block rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-bold text-brand-red">
                            {post.category}
                          </span>
                        )}
                        <p className="mt-2 text-sm text-foreground">{post.text}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && !detail && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      )}
    </PageContainer>
  );
};

export default GroupsPage;