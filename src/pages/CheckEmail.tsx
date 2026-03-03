import { useEffect, useState } from "react";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);
  
  useEffect(() => {
    if (!email || confirmed) return;

    const sendEmail = async () => {
      setResendLoading(true);
      try {
        const result = await authApi.resendConfirmation({ email });
        toast({
          title: "Email Sent",
          description: result.message || "Confirmation email sent successfully.",
        });
        setCooldown(RESEND_COOLDOWN);
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to send email." });
      } finally {
        setResendLoading(false);
      }
    };
    sendEmail();
  }, [email, confirmed, toast]);

  useEffect(() => {
    if (confirmed) {
      toast({
        title: "Email confirmed! 🎉",
        description: "You can now sign in to your account.",
      });
    }
  }, [confirmed, toast]);

  const handleResendEmail = async () => {
    if (confirmed || cooldown > 0) return;

    setResendLoading(true);
    try {
      const result = await authApi.resendConfirmation({ email });
      toast({
        title: "Email Sent",
        description: result.message || "Confirmation email resent successfully.",
      });
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to resend email." });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => navigate("/signin");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 flex flex-col items-center">
          {confirmed ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Email Confirmed!</h2>
                <p className="text-muted-foreground mb-4">
                  Your email has been successfully confirmed. You can now sign in.
                  {/* <span className="block mt-1 text-foreground font-medium">{email}</span> */}
                </p>
              </div>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Sign In
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Check your email</h2>
                <p className="text-muted-foreground mb-4">
                  We've sent a confirmation link to <strong>{email}</strong>. 
                  Please click the link in your email to activate your account.
                  {/* <span className="block mt-1 text-foreground font-medium">{email}</span>. */}
                  {/* Please click the link in your email to activate your account. */}
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 mb-4">
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading || cooldown > 0}
                  className={`w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors ${
                    resendLoading || cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {resendLoading
                    ? "Sending..."
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend Email"}
                </button>
              </div>

              <button
                onClick={() => navigate("/")}
                className="w-full mt-2 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Homepage
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;