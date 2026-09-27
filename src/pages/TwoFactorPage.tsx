import { Link, useSearchParams } from "react-router-dom";
import { VerifyCodeCard } from "../components/auth/VerifyCodeCard";
import { verifyTwoFactorApi } from "../api/authApi";
import LogoHeader from "../components/layout/LogoHeader";
import Background from "../components/layout/Background";

const TwoFactorPage = () => {
  const [params] = useSearchParams();
  const destination = params.get("to") ?? "your authenticator app";

  const handleVerify = async (code: string) => {
    await verifyTwoFactorApi(code);
    return true;
  };

  return (
    <Background imagePath="/background.jpg">
      <div className="min-h-screen flex flex-col">
        <LogoHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <VerifyCodeCard
              title="Two-step verification"
              subtitle="For your security, enter the verification code from your authenticator app or SMS."
              destination={destination}
              onVerify={handleVerify}
              verifyLabel="Verify"
              successTitle="Identity verified"
              successDescription="You're all set. Continuing to your dashboard now…"
              successAction={
                <Link
                  to="/dashboard"
                  className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight"
                >
                  Continue to Dashboard
                </Link>
              }
              backLink={
                <Link
                  to="/login"
                  className="text-sm font-medium text-brand-primary hover:underline"
                >
                  ← Back to sign in
                </Link>
              }
            />
          </div>
        </div>
      </div>
    </Background>
  );
};

export default TwoFactorPage;
