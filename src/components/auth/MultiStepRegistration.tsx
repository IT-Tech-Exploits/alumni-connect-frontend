import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Presentation,
  ShieldCheck,
  User as UserIcon,
  UserRound,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getDepartmentsApi, type Department } from "../../api/userApi";
import { sendVerificationCodeApi } from "../../api/authApi";
import { getProgrammesForDepartment, parseStudentId, CAMPUSES } from "../../data/departments";
import { Select } from "../shared/Select";
import { OtpInput } from "./OtpInput";
import { alumniGraduationYears, expectedGraduationYears } from "../../lib/gradYears";

type Role = "student" | "alumni";
type Step = 1 | 2 | 3 | 4;

interface FormState {
  role: Role;
  name: string;
  email: string;
  phone: string;
  department: string;
  program: string;
  registrationNumber: string;
  graduationYear: string;
  campus: string;
  password: string;
  confirmPassword: string;
}

const initialForm: FormState = {
  role: "student",
  name: "",
  email: "",
  phone: "",
  department: "",
  program: "",
  registrationNumber: "",
  graduationYear: "",
  campus: "",
  password: "",
  confirmPassword: "",
};

const STEP_LABELS: { step: Step; label: string; icon: React.ReactNode }[] = [
  { step: 1, label: "Personal", icon: <UserIcon className="h-4 w-4" /> },
  { step: 2, label: "Academic", icon: <GraduationCap className="h-4 w-4" /> },
  { step: 3, label: "Security", icon: <ShieldCheck className="h-4 w-4" /> },
  { step: 4, label: "Verify", icon: <BadgeCheck className="h-4 w-4" /> },
];

function getYearOptions(role: Role) {
  if (role === "student") {
    return expectedGraduationYears().map((y) => String(y));
  }
  return alumniGraduationYears().map((y) => String(y));
}

export default function MultiStepRegistration() {
  const { registerStudent, registerAlumni } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    getDepartmentsApi()
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setDeptLoading(false));
  }, []);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const set = (name: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => update({ [name]: e.target.value } as Partial<FormState>);

  const programmes = useMemo(
    () => getProgrammesForDepartment(form.department),
    [form.department],
  );

  const parsedId = useMemo(
    () => (form.registrationNumber ? parseStudentId(form.registrationNumber) : null),
    [form.registrationNumber],
  );

  const idTouched = form.registrationNumber.trim().length > 0;
  const idInvalid = idTouched && !parsedId;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const passwordOk = form.password.length >= 6;
  const passwordsMatch = form.password === form.confirmPassword && passwordOk;

  const validateStep = (s: Step): string | null => {
    if (s === 1) {
      if (!form.name.trim()) return "Please enter your full name.";
      if (!emailValid) return "Please enter a valid email address.";
      if (!form.phone.trim()) return "Please enter your phone number.";
    }
    if (s === 2) {
      if (!form.department) return "Please select your department.";
      if (!form.program) return "Please select your programme.";
      if (form.role === "student") {
        if (!form.registrationNumber.trim()) return "Please enter your student ID.";
        if (idInvalid) return "Student ID format is incorrect.";
        if (!form.campus) return "Please select your campus.";
      } else {
        if (!form.graduationYear) return "Please select your graduation year.";
      }
    }
    if (s === 3) {
      if (!passwordOk) return "Password must be at least 6 characters.";
      if (!passwordsMatch) return "Passwords do not match.";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => (s + 1) as Step);
    if (step === 3) {
      sendVerificationCodeApi(form.email).catch(() => {
        setError(
          "We couldn't email a verification code. Check the address and try again.",
        );
      });
    }
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(1, (s - 1)) as Step);
  };

  const onSwitchRole = (role: Role) => {
    setForm((f) => ({ ...f, role, department: "", program: "", registrationNumber: "" }));
  };

  const handleFinish = async () => {
    setError("");
    if (step !== 4) return;
    if (verificationCode.length < 6) {
      setError("Enter the 6-digit code we emailed you.");
      return;
    }
    setFinalizing(true);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        program: form.program,
        password: form.password,
        graduationYear: form.graduationYear || undefined as unknown as string,
        campus: form.campus,
        code: verificationCode,
      };
      if (form.role === "student") {
        payload.registrationNumber = form.registrationNumber;
        await registerStudent(payload);
      } else {
        payload.graduationYear = form.graduationYear;
        await registerAlumni(payload);
      }
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <ol className="flex items-center gap-1">
        {STEP_LABELS.map((s, i) => {
          const active = s.step === step;
          const done = s.step < step;
          return (
            <li key={s.step} className="flex flex-1 items-center gap-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    done
                      ? "border-brand-primary bg-brand-primary text-white"
                      : active
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  {done ? <BadgeCheck className="h-4 w-4" /> : s.icon}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    active || done ? "text-brand-primary" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`mb-5 h-0.5 flex-1 rounded ${done ? "bg-brand-primary" : "bg-gray-200"}`} />
              )}
            </li>
          );
        })}
      </ol>

      {/* ============ STEP 1: Personal ============ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSwitchRole("student")}
              disabled={finalizing}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-colors ${
                form.role === "student"
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <UserRound className="h-6 w-6" />
              <span className="text-sm font-semibold">Student</span>
              <span className="text-[11px] text-muted-foreground">Currently studying</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole("alumni")}
              disabled={finalizing}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-colors ${
                form.role === "alumni"
                  ? "border-brand-red bg-brand-red/5 text-brand-red"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <GraduationCap className="h-6 w-6" />
              <span className="text-sm font-semibold">Alumni</span>
              <span className="text-[11px] text-muted-foreground">Already graduated</span>
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Tapiwa Moyo"
                className="h-10 w-full rounded-md border border-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className="h-10 w-full rounded-md border border-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+263 77 123 4567"
                className="h-10 w-full rounded-md border border-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============ STEP 2: Academic ============ */}
      {step === 2 && (
        <div className="space-y-4">
          {form.role === "student" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Student ID <span className="text-muted-foreground">(Registration Number)</span>
              </label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={set("registrationNumber")}
                  placeholder="e.g. BIT/23/BT/NE/004"
                  className={`h-10 w-full rounded-md border border-input pl-9 pr-3 font-mono text-sm uppercase placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                    idInvalid ? "border-red-400 ring-2 ring-red-100" : ""
                  }`}
                />
              </div>
              {!idTouched && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Format:{" "}
                  <span className="font-mono">PROGRAMME/YEAR/CAMPUS/MODE/SEQUENCE</span>
                </p>
              )}
              {idInvalid && (
                <p className="mt-1 text-xs text-red-600">
                  That doesn't look like a valid student ID. Expected format like{" "}
                  <span className="font-mono">BIT/23/BT/NE/004</span>.
                </p>
              )}
              {parsedId && (
                <div className="mt-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    <BadgeCheck className="h-4 w-4" /> ID Recognised
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Programme</dt>
                      <dd className="font-medium">{parsedId.programmeName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Entry Year</dt>
                      <dd className="font-medium">{parsedId.entryYear}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Campus</dt>
                      <dd className="font-medium">{parsedId.campusName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Entry Mode</dt>
                      <dd className="font-medium">{parsedId.modeName}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}

          <Select
            label="Department"
            value={form.department}
            onChange={(v) =>
              update({ department: v, program: "" })
            }
            options={departments.map((d) => ({ value: d.name, label: `${d.name} (${d.code})` }))}
            placeholder={deptLoading ? "Loading departments…" : "Select your department"}
            disabled={deptLoading}
          />
          <Select
            label="Programme"
            value={form.program}
            onChange={(v) => update({ program: v })}
            options={programmes.map((p) => ({
              value: p.name,
              label: `${p.name} (${p.code}) — ${p.duration} yrs`,
            }))}
            placeholder={form.department ? "Select your programme" : "Select a department first"}
            disabled={!form.department}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={form.role === "student" ? "Campus" : "Campus Attended"}
              value={form.campus}
              onChange={(v) => update({ campus: v })}
              options={CAMPUSES.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))}
              placeholder="Select campus"
            />
            <Select
              label={form.role === "student" ? "Expected Graduation" : "Graduation Year"}
              value={form.graduationYear}
              onChange={(v) => update({ graduationYear: v })}
              options={getYearOptions(form.role).map((y) => ({ value: y, label: y }))}
              placeholder="Select year"
            />
          </div>
        </div>
      )}

      {/* ============ STEP 3: Security ============ */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="At least 6 characters"
                className="h-10 w-full rounded-md border border-input pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.password && (
              <p className={`mt-1 text-xs ${passwordOk ? "text-emerald-600" : "text-amber-600"}`}>
                {passwordOk ? "Strong enough — nice work." : "Password must be at least 6 characters."}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                placeholder="Re-enter your password"
                className="h-10 w-full rounded-md border border-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
            {form.confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-brand-primary/5 px-3 py-2.5 text-xs text-brand-primary">
            <Presentation className="mt-0.5 h-4 w-4 shrink-0" />
            <span>We never store plain-text passwords — they are hashed on the server.</span>
          </div>
        </div>
      )}

      {/* ============ STEP 4: Verify ============ */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Verification code</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{form.email || "your email"}</span>.
                Enter it below to complete your {form.role} registration.
              </p>
            </div>
          </div>

          <OtpInput
            length={6}
            value={verificationCode}
            onChange={setVerificationCode}
          />

          <div className="rounded-md bg-brand-primary/5 px-3 py-2 text-center text-xs text-muted-foreground">
            The code expires shortly — request a new one if it stops working.
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-brand-primary/5 px-3 py-2.5 text-xs text-brand-primary">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Summary: <strong>{form.name}</strong> · {form.program || form.role} ·{" "}
              {form.registrationNumber || form.graduationYear || "Alumni"}
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
            <Zap className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your {form.role} account activates instantly — you'll be signed in
              as soon as you finish. No administrator approval needed.
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1 || finalizing}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={finalizing}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-red px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-redDark disabled:opacity-60"
          >
            {finalizing ? "Creating account…" : "Create My Account"}
            {!finalizing && <BadgeCheck className="h-4 w-4" />}
          </button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-red hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}