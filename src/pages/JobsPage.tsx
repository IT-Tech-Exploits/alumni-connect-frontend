import { useEffect, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";
import {
  getJobsApi,
  createJobApi,
  applyJobApi,
  updateJobApi,
  referStudentApi,
  hasReferredApi,
} from "../api/jobApi";
import type { DirectoryUser, Job } from "../types";
import { getStudentsDirectoryApi } from "../api/directoryApi";

export interface JobFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  requirements: string;
  salary: string;
  deadline: string;
  contactEmail: string;
}

interface PostJobModalProps {
  onClose: () => void;
  onSubmit: (form: JobFormData) => void;
  submitting: boolean;
  error: string;
  isAdmin?: boolean;
  editJob?: Job | null;
}

// ─── Validation Function ──────────────────────────────────────────────────────────
const validateJobForm = (
  form: JobFormData,
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Title validation
  if (!form.title.trim()) {
    errors.title = "Job title is required";
  } else if (form.title.trim().length < 3) {
    errors.title = "Job title must be at least 3 characters";
  } else if (form.title.trim().length > 100) {
    errors.title = "Job title must be less than 100 characters";
  }

  // Company validation
  if (!form.company.trim()) {
    errors.company = "Company name is required";
  } else if (form.company.trim().length < 2) {
    errors.company = "Company name must be at least 2 characters";
  }

  // Location validation (optional but validate if provided)
  if (form.location.trim() && form.location.trim().length > 200) {
    errors.location = "Location must be less than 200 characters";
  }

  // Description validation
  if (!form.description.trim()) {
    errors.description = "Job description is required";
  } else if (form.description.trim().length < 20) {
    errors.description = "Job description must be at least 20 characters";
  } else if (form.description.trim().length > 5000) {
    errors.description = "Job description must be less than 5000 characters";
  }

  // Type validation
  const validTypes = ["full-time", "part-time", "internship", "remote"];
  if (!form.type || !validTypes.includes(form.type)) {
    errors.type = "Please select a valid job type";
  }

  // Requirements validation (optional)
  if (form.requirements.trim()) {
    const reqs = form.requirements
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (reqs.length > 20) {
      errors.requirements = "Maximum 20 requirements allowed";
    }
    reqs.forEach((req, idx) => {
      if (req.length > 100) {
        errors.requirements = `Requirement ${idx + 1} exceeds 100 characters`;
      }
    });
  }

  // Salary validation (optional but validate format if provided)
  if (form.salary.trim()) {
    if (form.salary.trim().length > 100) {
      errors.salary = "Salary information is too long";
    }
  }

  // Deadline validation
  if (form.deadline) {
    const deadlineDate = new Date(form.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(deadlineDate.getTime())) {
      errors.deadline = "Invalid date format";
    } else if (deadlineDate < today) {
      errors.deadline = "Deadline cannot be in the past";
    }
  }

  // Email validation
  if (form.contactEmail.trim()) {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(form.contactEmail.trim())) {
      errors.contactEmail = "Please enter a valid email address";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// ─── Job Detail Modal ──────────────────────────────────────────────────────────
export function JobDetailModal({
  job,
  onClose,
  onApply,
  userRole,
  onEdit,
  onRefer,
  referred,
}: {
  job: Job;
  onClose: () => void;
  onApply: (id: string) => void;
  userRole?: string;
  onEdit?: (job: Job) => void;
  onRefer?: () => void;
  referred?: boolean;
}) {
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string>("");

  const typeBadgeColor = (type?: string) => {
    if (type === "internship") return "bg-orange-100 text-orange-700";
    if (type === "remote") return "bg-green-100 text-green-700";
    if (type === "part-time") return "bg-purple-100 text-purple-700";
    return "bg-blue-100 text-[#1e3a6e]";
  };

  const canEdit =
    userRole === "admin" ||
    (userRole === "alumni" && job.postedBy?._id === userRole);

  const handleApply = async () => {
    setApplying(true);
    setApplyError("");
    try {
      await onApply(job._id);
      onClose();
    } catch (err: any) {
      setApplyError(err.message || "Failed to apply for this job");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-gray-900 text-lg leading-snug">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${typeBadgeColor(job.type)}`}
            >
              {job.type || "Full-time"}
            </span>
            {job.status === "pending" && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                Pending Approval
              </span>
            )}
            {job.status === "rejected" && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">
                Rejected
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{job.location || "Not specified"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{job.postedBy?.name || "Alumni"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {job.applicants && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>
                  {job.applicants.length} applicant
                  {job.applicants.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Job Description
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Requirements
              </h4>
              <ul className="space-y-1.5">
                {job.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1e3a6e] flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply Error */}
          {applyError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{applyError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          {canEdit && onEdit && (
            <button
              onClick={() => {
                onEdit(job);
                onClose();
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Edit Job
            </button>
          )}
          <button
            onClick={onClose}
            className={`${canEdit && onEdit ? "flex-1" : "flex-[2]"} border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors`}
          >
            Close
          </button>
          {userRole === "alumni" && job.status === "approved" && onRefer && (
            <button
              onClick={onRefer}
              disabled={referred}
              className="flex-1 bg-brand-primary hover:bg-brand-primaryLight text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {referred ? "Referred ✓" : "Refer a Student"}
            </button>
          )}
          {userRole === "student" && job.status === "approved" && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 bg-[#1e3a6e] hover:bg-[#162d57] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {applying ? "Applying..." : "Apply Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Refer a Student Modal ──────────────────────────────────────────────────────
export function ReferJobModal({
  job,
  onClose,
  onReferred,
}: {
  job: Job;
  onClose: () => void;
  onReferred: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [students, setStudents] = useState<DirectoryUser[]>([]);

  useEffect(() => {
    let active = true;
    getStudentsDirectoryApi()
      .then((res) => {
        if (active) setStudents(res.students ?? []);
      })
      .catch(() => {
        if (active) setFormError("Could not load the student list.");
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (!studentId) {
      setFormError("Select a student to refer.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await referStudentApi(job._id, studentId, note.trim());
      onReferred();
    } catch {
      setFormError("Could not submit referral");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Refer a Student</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {job.title} — {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Student
        </label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
        >
          <option value="">Select a student…</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} — {s.program || s.department || "Student"}
            </option>
          ))}
        </select>

        <label className="mt-4 mb-1 block text-sm font-semibold text-gray-700">
          Why should they be considered?{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Strong React skills and completed the Cloud Internship..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
        />

        {formError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="flex-1 rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Referral"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Job Modal (Updated with validation and error handling) ────────────────────────────────────────────
export function PostJobModal({
  onClose,
  onSubmit,
  submitting,
  error,
  isAdmin = false,
  editJob = null,
}: PostJobModalProps) {
  const [form, setForm] = useState<JobFormData>({
    title: editJob?.title || "",
    company: editJob?.company || "",
    location: editJob?.location || "",
    description: editJob?.description || "",
    type: editJob?.type || "full-time",
    requirements: editJob?.requirements?.join(", ") || "",
    salary: editJob?.salary || "",
    deadline: editJob?.deadline || "",
    contactEmail: editJob?.contactEmail || "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form when editJob changes
  useEffect(() => {
    if (editJob) {
      setForm({
        title: editJob.title || "",
        company: editJob.company || "",
        location: editJob.location || "",
        description: editJob.description || "",
        type: editJob.type || "full-time",
        requirements: editJob.requirements?.join(", ") || "",
        salary: editJob.salary || "",
        deadline: editJob.deadline || "",
        contactEmail: editJob.contactEmail || "",
      });
      // Reset validation state when editing different job
      setFieldErrors({});
      setTouched({});
    }
  }, [editJob]);

  const set =
    (key: keyof JobFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const newValue = e.target.value;
      setForm((prev) => ({ ...prev, [key]: newValue }));

      // Clear field error when user starts typing
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: "" }));
      }
    };

  const handleBlur = (key: keyof JobFormData) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    // Validate on blur
    const validation = validateJobForm(form);
    if (validation.errors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: validation.errors[key] }));
    }
  };

  const handleSubmit = () => {
    // Mark all fields as touched
    const allTouched = Object.keys(form).reduce(
      (acc, key) => {
        acc[key as keyof JobFormData] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setTouched(allTouched);

    // Validate form
    const validation = validateJobForm(form);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const errorElement = document.getElementById(`field-${firstErrorField}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    onSubmit(form);
  };

  const isEditing = !!editJob;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">
              {isEditing ? "Edit Job" : "Post a New Job"}
            </h3>
            {isAdmin && !isEditing && (
              <p className="text-xs text-green-600 mt-0.5 font-medium">
                ✓ As admin, this job will be published immediately
              </p>
            )}
            {isEditing && (
              <p className="text-xs text-blue-600 mt-0.5 font-medium">
                ✎ Editing existing job posting
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div id="field-title">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineer"
              value={form.title}
              onChange={set("title")}
              onBlur={() => handleBlur("title")}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                touched.title && fieldErrors.title
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {touched.title && fieldErrors.title && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>
            )}
          </div>

          {/* Company + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div id="field-company">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Company name"
                value={form.company}
                onChange={set("company")}
                onBlur={() => handleBlur("company")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                  touched.company && fieldErrors.company
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.company && fieldErrors.company && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.company}
                </p>
              )}
            </div>
            <div id="field-location">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Blantyre, Remote"
                value={form.location}
                onChange={set("location")}
                onBlur={() => handleBlur("location")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                  touched.location && fieldErrors.location
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.location && fieldErrors.location && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.location}
                </p>
              )}
            </div>
          </div>

          {/* Type + Salary */}
          <div className="grid grid-cols-2 gap-3">
            <div id="field-type">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={form.type}
                onChange={set("type")}
                onBlur={() => handleBlur("type")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] bg-white ${
                  touched.type && fieldErrors.type
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
              {touched.type && fieldErrors.type && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.type}</p>
              )}
            </div>
            <div id="field-salary">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Salary / Range
              </label>
              <input
                type="text"
                placeholder="e.g. MK 500,000/mo"
                value={form.salary}
                onChange={set("salary")}
                onBlur={() => handleBlur("salary")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                  touched.salary && fieldErrors.salary
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.salary && fieldErrors.salary && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.salary}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div id="field-description">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              value={form.description}
              onChange={set("description")}
              onBlur={() => handleBlur("description")}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] resize-none ${
                touched.description && fieldErrors.description
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {touched.description && fieldErrors.description && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Requirements */}
          <div id="field-requirements">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Requirements{" "}
              <span className="text-gray-400 font-normal">
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              placeholder="React, Node.js, 2 years experience"
              value={form.requirements}
              onChange={set("requirements")}
              onBlur={() => handleBlur("requirements")}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                touched.requirements && fieldErrors.requirements
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {touched.requirements && fieldErrors.requirements && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.requirements}
              </p>
            )}
          </div>

          {/* Deadline + Contact Email */}
          <div className="grid grid-cols-2 gap-3">
            <div id="field-deadline">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={set("deadline")}
                onBlur={() => handleBlur("deadline")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                  touched.deadline && fieldErrors.deadline
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.deadline && fieldErrors.deadline && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.deadline}
                </p>
              )}
            </div>
            <div id="field-contactEmail">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="hr@company.com"
                value={form.contactEmail}
                onChange={set("contactEmail")}
                onBlur={() => handleBlur("contactEmail")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] ${
                  touched.contactEmail && fieldErrors.contactEmail
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.contactEmail && fieldErrors.contactEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.contactEmail}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 bg-[#1e3a6e] hover:bg-[#162d57] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? isEditing
                  ? "Updating..."
                  : "Posting..."
                : isEditing
                  ? "Update Job"
                  : isAdmin
                    ? "Publish Job"
                    : "Post Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page (Updated with comprehensive error handling) ─────────────────────────────────────────────────
const JobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [referringJob, setReferringJob] = useState<Job | null>(null);
  const [referredIds, setReferredIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [error, setError] = useState("");
  const [postError, setPostError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetchError, setFetchError] = useState("");

  const canPost =
    user?.role === "alumni" ||
    user?.role === "student" ||
    user?.role === "admin";

  const fetchJobs = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getJobsApi();
      const visible =
        user?.role === "admin"
          ? data
          : data.filter((j) => j.status === "approved");
      setJobs(visible);
    } catch (err: any) {
      console.error("Failed to fetch jobs:", err);
      setFetchError(
        err.message || "Failed to load jobs. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleSubmit = async (form: JobFormData) => {
    // Validate form first
    const validation = validateJobForm(form);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setPostError(firstError);
      return;
    }

    setSubmitting(true);
    setPostError("");

    try {
      const jobData = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        type: form.type as Job["type"],
        requirements: form.requirements
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        salary: form.salary.trim(),
        deadline: form.deadline,
        contactEmail: form.contactEmail.trim(),
      };

      if (editingJob) {
        // Update existing job
        await updateJobApi(editingJob._id, jobData);
        setSuccess("Job updated successfully!");
        setEditingJob(null);
      } else {
        // Create new job
        await createJobApi(jobData);
        const msg =
          user?.role === "admin"
            ? "Job posted and published immediately."
            : "Job posted! It will appear after admin approval.";
        setSuccess(msg);
      }
      setShowPostModal(false);
      await fetchJobs(); // Refresh the job list
    } catch (err: any) {
      console.error("Job operation failed:", err);
      setPostError(
        err.message ||
          "Failed to save job. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowPostModal(true);
  };

  const handleApply = async (id: string) => {
    try {
      await applyJobApi(id);
      setSuccess("Application submitted successfully!");
      // Optionally refresh jobs to update applicant count
      await fetchJobs();
    } catch (err: any) {
      console.error("Application failed:", err);
      throw new Error(err.message || "Failed to submit application");
    }
  };

  const handleRefer = async (job: Job) => {
    if ((await hasReferredApi(job._id)) && !referredIds.has(job._id)) {
      setReferredIds((prev) => new Set(prev).add(job._id));
      setSuccess("You already referred this job.");
      return;
    }
    setReferringJob(job);
  };

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType ? j.type === filterType : true;
    return matchSearch && matchType;
  });

  const typeBadgeColor = (type?: string) => {
    if (type === "internship") return "bg-orange-100 text-orange-700";
    if (type === "remote") return "bg-green-100 text-green-700";
    if (type === "part-time") return "bg-purple-100 text-purple-700";
    return "bg-blue-100 text-[#1e3a6e]";
  };

  return (
    <PageContainer title="Job Board">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Job Opportunities</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} position{filtered.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
        {canPost && (
          <button
            onClick={() => {
              setEditingJob(null);
              setPostError("");
              setShowPostModal(true);
            }}
            className="bg-[#1e3a6e] hover:bg-[#162d57] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post a Job
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <span>{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="text-green-500 hover:text-green-700"
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500">
            ✕
          </button>
        </div>
      )}
      {fetchError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <span>{fetchError}</span>
          <button
            onClick={() => {
              setFetchError("");
              fetchJobs();
            }}
            className="text-yellow-600 hover:text-yellow-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] bg-white"
        >
          <option value="">All Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="remote">Remote</option>
        </select>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {search || filterType
              ? "No jobs found matching your search."
              : "No jobs available at the moment."}
          </p>
          {(search || filterType) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterType("");
              }}
              className="mt-2 text-sm text-[#1e3a6e] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <div
              key={job._id}
              onClick={() => setSelectedJob(job)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#1e3a6e]/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="font-semibold text-gray-900 text-base group-hover:text-[#1e3a6e] transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${typeBadgeColor(job.type)}`}
                >
                  {job.type || "Full-time"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {job.location || "Location not specified"}
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {job.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Posted by {job.postedBy?.name || "Alumni"}
                </span>
                <span className="text-xs font-medium text-[#1e3a6e] group-hover:underline">
                  View details →
                </span>
              </div>

              {/* Admin-only status badge */}
              {user?.role === "admin" && job.status !== "approved" && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      job.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          userRole={user?.role}
          onEdit={handleEditJob}
          onRefer={() => void handleRefer(selectedJob)}
          referred={referredIds.has(selectedJob._id)}
        />
      )}

      {/* Refer a Student Modal */}
      {referringJob && (
        <ReferJobModal
          job={referringJob}
          onClose={() => setReferringJob(null)}
          onReferred={() => {
            setReferringJob(null);
            setReferredIds((prev) => new Set(prev).add(referringJob._id));
            setSuccess("Referral submitted! The student has been added as an applicant.");
          }}
        />
      )}

      {/* Post/Edit Job Modal */}
      {showPostModal && (
        <PostJobModal
          onClose={() => {
            setShowPostModal(false);
            setPostError("");
            setEditingJob(null);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={postError}
          isAdmin={user?.role === "admin"}
          editJob={editingJob}
        />
      )}
    </PageContainer>
  );
};

export default JobsPage;
