import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "../services/authApi";

const RESEND_COOLDOWN = 45; // seconds

const CheckEmail = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Email sent from signup page
  const email = location.state?.email || "";

  // Check if query param ?confirmed=true
  const confirmed = new URLSearchParams(location.search).get("confirmed") === "true";

  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Toast on confirmation
  useEffect(() => {
    if (confirmed) {
      toast({
        title: "Email confirmed! 🎉",
        description: "You can now sign in to your account.",
      });
    }
  }, [confirmed, toast]);

  // Handle resend cooldown countdown
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (confirmed || cooldown > 0) return;

    setResendLoading(true);
    try {
      const result = await authApi.resendConfirmation({ email });
      toast({
        title: "Email Sent",
        description: result.message || "Confirmation email resent successfully.",
      });
      setCooldown(RESEND_COOLDOWN); // start cooldown
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to resend email." });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
        {confirmed ? (
          <>
            <div className="text-green-600 text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your email <strong>{email}</strong> has been successfully confirmed. You can now log in.
            </p>
            <Button className="w-full" onClick={() => navigate("/signin")}>
              Go to Sign In
            </Button>
          </>
        ) : (
          <>
            <div className="text-blue-500 text-6xl mb-4">📩</div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a confirmation link to <strong>{email}</strong>. 
              Please click the link in your email to activate your account.
            </p>
            <Button
              className="w-full mb-4"
              onClick={handleResendEmail}
              disabled={resendLoading || cooldown > 0}
            >
              {resendLoading
                ? "Sending..."
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend Email"}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => navigate("/")}
        >
          Back to Homepage
        </Button>
      </div>
    </div>
  );
};

export default CheckEmail;