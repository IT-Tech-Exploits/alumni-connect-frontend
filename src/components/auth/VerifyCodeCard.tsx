import { useEffect, useState } from "react";
import { CheckCircle2, MailCheck, RotateCcw } from "lucide-react";
import { OtpInput } from "./OtpInput";

export interface VerifyCodeCardProps {
  title: string;
  subtitle: React.ReactNode;
  destination: string;
  verifyLabel?: string;
  backLink?: React.ReactNode;
  /** Called with the entered code. Return true to show the success screen. */
  onVerify: (code: string) => Promise<boolean>;
  /** Called by the "Resend code" button. Omit to hide the resend control. */
  onResend?: () => Promise<void>;
  successTitle: string;
  successDescription: string;
  successAction?: React.ReactNode;
}

const COUNTDOWN_SECONDS = 30;

export function VerifyCodeCard({
  title,
  subtitle,
  destination,
  verifyLabel = "Verify & Sign In",
  backLink,
  onVerify,
  onResend,
  successTitle,
  successDescription,
  successAction,
}: VerifyCodeCardProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleVerify = async (value: string) => {
    if (value.length < 6) return;
    setVerifying(true);
    setError("");
    try {
      const ok = await onVerify(value);
      if (ok) {
        setSuccess(true);
      } else {
        setError("That code doesn't match. Please check and try again.");
        setCode("");
      }
    } catch {
      setError("Something went wrong while verifying. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!onResend) return;
    setResending(true);
    setError("");
    try {
      await onResend();
      setSeconds(COUNTDOWN_SECONDS);
      setCode("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend the code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-gray-900">{successTitle}</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          {successDescription}
        </p>
        {successAction && <div className="mt-6">{successAction}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-gray-900">{destination}</span>. Enter it
        below to continue.
      </p>

      <div className="mt-6">
        <OtpInput
          length={6}
          value={code}
          onChange={setCode}
          onComplete={handleVerify}
          disabled={verifying}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => handleVerify(code)}
        disabled={verifying || code.length < 6}
        className="mt-6 w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-50"
      >
        {verifying ? "Verifying…" : verifyLabel}
      </button>

      <div className="mt-5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <RotateCcw className="h-4 w-4" />
          {!onResend ? null : seconds > 0 ? (
            <span>Resend code in {seconds}s</span>
          ) : (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending}
              className="font-medium text-brand-primary hover:underline"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>
      </div>

{backLink && <div className="mt-5 border-t pt-4">{backLink}</div>}
    </div>
  );
}
