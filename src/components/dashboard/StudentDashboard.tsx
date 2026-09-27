import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  GraduationCap,
  Handshake,
  MapPin,
  MessageCircle,
  Rocket,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import PageContainer from "../layout/PageContainer";
import { useAuth } from "../../context/AuthContext";
import { getJobsApi } from "../../api/jobApi";
import { getEventsApi } from "../../api/eventApi";
import { getStudentConnectionsApi } from "../../api/connectionApi";
import { getFeedApi } from "../../api/postApi";
import type { Job, Event, StudentConnectionRow, Post } from "../../types";
import { timeAgo } from "../../lib/timeAgo";
import {
  StatCard,
  Badge,
  EmptyState,
  CardSkeleton,
  InitialsAvatar,
} from "../shared";

const JOB_TYPE_STYLES: Record<string, "brand" | "success" | "warning" | "secondary"> = {
  "full-time": "brand",
  internship: "success",
  remote: "warning",
  "part-time": "secondary",
};

function daysRemaining(deadline: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000),
  );
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [connections, setConnections] = useState<StudentConnectionRow[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getJobsApi(),
      getEventsApi(),
      getStudentConnectionsApi(),
      getFeedApi(),
    ])
      .then(([j, e, c, f]) => {
        setJobs(j);
        setEvents(e);
        setConnections(c);
        setFeedPosts(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const approved = jobs.filter((j) => j.status === "approved");
    const applied = approved.filter((a) =>
      (a.applicants ?? []).includes(user?._id ?? ""),
    );
    return {
      total: approved.length,
      applied: applied.length,
      remaining: approved.length - applied.length,
    };
  }, [jobs, user]);

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const upcomingEvents = events
    .filter((e) => new Date(e.eventDate) >= new Date())
    .sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate))
    .slice(0, 3);
  const myMentors = useMemo(
    () => connections.filter((c) => c.status === "accepted").slice(0, 4),
    [connections],
  );

  return (
    <PageContainer title="Student Dashboard" showLogo>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-primaryLight p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-red/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
                <Rocket className="h-3.5 w-3.5" /> Your career starts here
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/80">
                Discover internships, mentors and events curated for your
                programme · Class of {user?.graduationYear ?? "—"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow transition-colors hover:bg-white/90"
                >
                  <Briefcase className="h-4 w-4" /> Browse Opportunities
                </Link>
                <Link
                  to="/alumni"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
                >
                  <Handshake className="h-4 w-4" /> Find a Mentor
                </Link>
              </div>
            </div>
            <div className="hidden flex-col gap-2 lg:flex">
              <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  Career tip of the day
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/90">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  Update your skills list — mentors search by skill on the
                  alumni directory.
                </p>
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
                label="Jobs Available"
                value={stats.total}
                icon={Briefcase}
                accent="brand"
                hint="Vetted by the alumni office"
              />
              <StatCard
                label="Applications Sent"
                value={stats.applied}
                icon={ClipboardList}
                accent="green"
                hint="Good luck!"
              />
              <StatCard
                label="Still To Apply"
                value={stats.remaining}
                icon={Compass}
                accent="indigo"
                hint="Don't miss deadlines"
              />
              <StatCard
                label="Mentor Connections"
                value={myMentors.length}
                icon={Users}
                accent="red"
                hint="Growing your network"
              />
            </>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Latest opportunities */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Latest Opportunities
              </h2>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
              >
                View all jobs <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No opportunities right now"
                description="Check back soon — alumni post new roles every week."
              />
            ) : (
              <div className="space-y-3">
                {jobs.filter((j) => j.status === "approved").slice(0, 4).map(
                  (job) => (
                    <Link
                      key={job._id}
                      to="/jobs"
                      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <BuildingBadge job={job} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {job.title}
                          </p>
                          <Badge variant={job.type ? JOB_TYPE_STYLES[job.type] : "secondary"}>
                            {job.type ?? "Full-time"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{job.company}</span>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> {job.location}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <CalendarDays className="h-3 w-3" />{" "}
                            {job.deadline ? `${daysRemaining(job.deadline)}d left to apply` : "Open application"}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold sm:self-center ${
                          (job.applicants ?? []).includes(user?._id ?? "")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-brand-primary/10 text-brand-primary"
                        }`}
                      >
                        {(job.applicants ?? []).includes(user?._id ?? "") ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3.5 w-3.5" /> Apply now
                          </>
                        )}
                      </span>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Mentor network */}
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <GraduationCap className="h-4 w-4 text-brand-primary" />
                  My Mentors
                </h3>
                <Link
                  to="/alumni"
                  className="text-xs font-medium text-brand-primary hover:underline"
                >
                  Directory
                </Link>
              </div>
              {loading ? (
                <div className="mt-3 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : myMentors.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Connect with alumni to unlock guidance.
                  </p>
                  <Link
                    to="/alumni"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
                  >
                    <UserPlus className="h-4 w-4" /> Find mentors
                  </Link>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {myMentors.map((row) => (
                    <Link
                      key={row._id}
                      to="/alumni"
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                    >
                      <InitialsAvatar
                        name={row.alumni.name}
                        src={row.alumni.profilePhoto}
                        className="h-10 w-10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {row.alumni.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.alumni.position} · {row.alumni.company}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Community feed */}
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <MessageCircle className="h-4 w-4 text-brand-primary" />
                  Community Feed
                </h3>
                <Link
                  to="/feed"
                  className="text-xs font-medium text-brand-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                    ))
                  : feedPosts.slice(0, 3).map((post) => (
                      <Link
                        key={post._id}
                        to="/feed"
                        className="block rounded-lg p-2 transition-colors hover:bg-accent"
                      >
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <InitialsAvatar
                            name={post.author.name}
                            src={post.author.profilePhoto}
                            className="h-5 w-5 text-[10px]"
                          />
                          <span className="truncate font-medium text-foreground">
                            {post.author.name}
                          </span>
                          <span>· {timeAgo(post.createdAt)}</span>
                        </p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-foreground/80">
                          {post.text}
                        </p>
                      </Link>
                    ))}
              </div>
              <Link
                to="/feed"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                Share an update <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            {/* Upcoming events */}
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CalendarDays className="h-4 w-4 text-brand-red" />
                  Upcoming Events
                </h3>
                <Link
                  to="/events"
                  className="text-xs font-medium text-brand-primary hover:underline"
                >
                  All
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                    ))
                  : upcomingEvents.length === 0
                    ? (
                      <p className="py-3 text-center text-sm text-muted-foreground">
                        No events scheduled yet.
                      </p>
                    )
                    : upcomingEvents.map((ev) => {
                        const date = new Date(ev.eventDate);
                        return (
                          <Link
                            key={ev._id}
                            to="/events"
                            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                          >
                            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
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
      </div>
    </PageContainer>
  );
};

const BuildingBadge = ({ job }: { job: Job }) => {
  const initials = job.company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return <span className="text-sm font-bold">{initials}</span>;
};

export default StudentDashboard;