import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  UserPlus,
} from "lucide-react";
import PageContainer from "../layout/PageContainer";
import { useAuth } from "../../context/AuthContext";
import { getJobsApi } from "../../api/jobApi";
import { getEventsApi } from "../../api/eventApi";
import { getProfileApi } from "../../api/userApi";
import { getFeedApi } from "../../api/postApi";
import { getAlumniConnectionsApi } from "../../api/connectionApi";
import { getProfileSuggestionsApi } from "../../api/profileApi";
import type { ProfileSuggestion } from "../../types/profile";
import type { Job, Event, Post, User } from "../../types";
import {
  StatCard,
  Progress,
  Badge,
  getStatusBadgeVariant,
  InitialsAvatar,
  EmptyState,
  CardSkeleton,
  ListCardSkeleton,
} from "../shared";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function profileCompletion(user: User | null): number {
  if (!user) return 0;
  const fields = [
    user.name,
    user.profilePhoto,
    user.bio,
    user.company,
    user.position,
    user.skills && user.skills.length > 0 ? "skills" : "",
    user.registrationNumber,
  ].filter((f) => typeof f === "string" && f.trim().length > 0);
  return Math.min(100, Math.round((fields.length / 7) * 100));
}

const AlumniDashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProfileApi(),
      getJobsApi(),
      getEventsApi(),
      getFeedApi(),
      getAlumniConnectionsApi(),
      getProfileSuggestionsApi(),
    ])
      .then(([p, j, e, postsData, conn, suggestions]) => {
        setProfile(p);
        setMyJobs(j.filter((job) => job.postedBy?._id === p?._id).slice(0, 3));
        setEvents(e.slice(0, 3));
        setPosts(postsData.slice(0, 3));
        setPendingRequests(conn.pending.length);
        setPeopleYouMayKnow((suggestions.peopleYouMayKnow ?? []).slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completion = useMemo(() => profileCompletion(profile ?? user), [profile, user]);
  const firstName = (profile?.name ?? user?.name ?? "Alumni").split(" ")[0];

  return (
    <PageContainer title="Alumni Dashboard" showLogo>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primaryDark via-brand-primary to-brand-primaryLight p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-red/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5" />
                Alumni Profile
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, {firstName}! 🎓
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/80">
                {profile?.position && profile?.company
                  ? `${profile.position} at ${profile.company}`
                  : "Complete your profile to make it easier for students to find you."}{" "}
                · Class of {profile?.graduationYear ?? "—"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow transition-colors hover:bg-white/90"
                >
                  <Briefcase className="h-4 w-4" /> Post a Job
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
                >
                  View Profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Completion ring */}
            <div className="flex shrink-0 items-center gap-4">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="9"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#e40d0a"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(completion / 100) * 264} 264`}
                  />
                </svg>
                <span className="absolute text-xl font-bold">{completion}%</span>
              </div>
              <div className="max-w-[8rem] -space-y-1">
                <p className="text-sm font-semibold">Profile strength</p>
                <p className="text-xs text-white/70">Complete your profile to get found</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Connections"
                value={pendingRequests >= 0 ? 12 + pendingRequests : 12}
                icon={Users}
                accent="brand"
                trend={18}
                hint="Growing network"
              />
              <StatCard
                label="Profile Views"
                value={42}
                icon={TrendingUp}
                accent="green"
                trend={12}
                hint="This month"
              />
              <StatCard
                label="Jobs Posted"
                value={myJobs.length}
                icon={Briefcase}
                accent="indigo"
                hint="Active listings"
              />
              <StatCard
                label="Pending Requests"
                value={pendingRequests}
                icon={UserPlus}
                accent="amber"
                hint="Students who want to connect"
              />
            </>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Feed preview */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Community Feed</h2>
              <Link
                to="/feed"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <ListCardSkeleton rows={3} />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No posts yet"
                description="Share an achievement, job update or piece of news with the community."
              />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article
                    key={post._id}
                    className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <InitialsAvatar name={post.author.name} src={post.author.profilePhoto} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {post.author.name}
                          </p>
                          <Badge variant="brand">{post.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {post.author.position} · {timeAgo(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                      {post.text.length > 230
                        ? `${post.text.slice(0, 230)}…`
                        : post.text}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        👍 {post.likes.length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        💬 {post.comments.length}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Profile card */}
            <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="h-16 bg-gradient-to-r from-brand-primary to-brand-primaryLight" />
              <div className="-mt-8 px-5 pb-5 text-center">
                <InitialsAvatar
                  name={profile?.name ?? user?.name ?? "Alumni Connect"}
                  src={profile?.profilePhoto ?? user?.profilePhoto}
                  className="h-16 w-16 rounded-full ring-4 ring-card"
                />
                <h3 className="mt-2 text-base font-bold text-foreground">
                  {profile?.name ?? user?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.position ?? "Alumni"}
                  {profile?.company ? ` · ${profile.company}` : ""}
                </p>
                <div className="mt-4 text-left">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Profile strength</span>
                    <span className="font-semibold text-brand-primary">{completion}%</span>
                  </div>
                  <Progress value={completion} barClassName="bg-brand-red" />
                </div>
                <Link
                  to="/profile"
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight"
                >
                  Improve Profile
                </Link>
              </div>
            </section>

            {/* Mentorship requests */}
            {pendingRequests > 0 && (
              <section className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <GraduationCap className="h-4 w-4 text-brand-primary" />
                  Mentorship Requests
                </h3>
                <Link
                  to="/students"
                  className="mt-3 inline-flex w-full items-center justify-between rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm transition-colors hover:bg-brand-primary/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-brand-primary" />
                    <span className="font-medium text-brand-primary">
                      {pendingRequests} new request{pendingRequests > 1 ? "s" : ""}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-brand-primary" />
                </Link>
              </section>
            )}

            {/* People you may know */}
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Users className="h-4 w-4 text-brand-primary" />
                People You May Know
              </h3>
              <div className="mt-3 space-y-3">
                {peopleYouMayKnow.map((person) => (
                  <div key={person._id} className="flex items-center gap-3">
                    <InitialsAvatar name={person.name} src={person.profilePhoto} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[person.position, person.company].filter(Boolean).join(" · ") ||
                          "Exploits University"}
                      </p>
                    </div>
                    <Link
                      to="/alumni"
                      className="shrink-0 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Upcoming events */}
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CalendarDays className="h-4 w-4 text-brand-red" />
                  Upcoming Events
                </h3>
                <Link to="/events" className="text-xs font-medium text-brand-primary hover:underline">
                  All
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                    ))
                  : events.length === 0
                    ? (
                      <p className="py-3 text-center text-sm text-muted-foreground">
                        No events scheduled yet.
                      </p>
                    )
                    : events.map((ev) => {
                        const date = new Date(ev.eventDate);
                        return (
                          <Link
                            key={ev._id}
                            to="/events"
                            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                          >
                            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                              <span className="text-sm font-bold leading-none">
                                {date.getDate()}
                              </span>
                              <span className="text-[10px] font-medium uppercase leading-none">
                                {date.toLocaleString("en-US", { month: "short" })}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {ev.title}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {ev.location}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
              </div>
            </section>
          </div>
        </div>

        {/* My job postings */}
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Building2 className="h-5 w-5 text-brand-primary" /> My Job Postings
            </h2>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
            >
              Manage listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <ListCardSkeleton rows={2} />
          ) : myJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No job postings yet"
              description="Share career opportunities with the student community."
              action={
                <Link
                  to="/jobs"
                  className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight"
                >
                  Post a Job
                </Link>
              }
              compact
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myJobs.map((job) => (
                <Link
                  key={job._id}
                  to="/jobs"
                  className="rounded-xl border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{job.title}</p>
                    <Badge variant={getStatusBadgeVariant(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {job.applicants?.length ?? 0} applicant
                    {(job.applicants?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
};

export default AlumniDashboardPage;