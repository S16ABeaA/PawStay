import { useEffect, useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "../services/authApi";
import supabase from "../config/supabaseClient";

const RESEND_COOLDOWN = 45; // seconds

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const code = new URLSearchParams(location.search).get("code") ?? ''; // check if user clicked email link

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cooldown for resend
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle sending reset email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return setError("Please enter your email address");
    if (!emailRegex.test(email)) return setError("Please enter a valid email address");

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast({ title: "Email sent", description: "Check your inbox for the reset link." });
      setIsSubmitted(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend email
  const handleResend = async () => {
    if (isResetSuccess) {
      toast({
        title: "Already reset",
        description: "Your password has already been reset. No need to resend the email.",
      });
      return;
    }
    if (cooldown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email });
      toast({ title: "Email resent", description: "Check your inbox for the reset link." });
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || "Failed to resend email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code) return setError("Invalid or missing reset code.");
    if (!newPassword || !confirmPassword) {
      return setError("Please fill in both password fields");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setIsLoading(true);
    try {
      await supabase.auth.updateUser({ password: newPassword });
      toast({ title: "Password reset!", description: "You can now log in with your new password." });
      setIsResetSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.message.includes("expired")) {
        setError("Reset link has expired. Please request a new one.");
      } else {
        setError(err.message || "Failed to reset password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => navigate("/signin");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 flex flex-col items-center">

          {!code && !isSubmitted && (
            <>
              {/* Send reset email UI */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground">
                  No worries, we'll send you reset instructions
                </p>
              </div>
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  disabled={isLoading}
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {!code && isSubmitted && (
            <>
              {/* Email sent success UI */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Check your email</h2>
                <p className="text-muted-foreground mb-4">
                  We sent a password reset link to <strong>{email}</strong>.
                </p>
              </div>
              <button
                onClick={handleResend}
                disabled={isResetSuccess || isLoading || cooldown > 0}
                className={`w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors ${
                  isLoading || cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isResetSuccess
                  ? "Email Sent"
                  : isLoading
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend Email"}
                {/* {isLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"} */}
              </button>
            </>
          )}

          {code && !isResetSuccess && (
            <>
              {/* Reset password form UI */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
                <p className="text-muted-foreground mb-4">Enter your new password</p>
              </div>
              <form onSubmit={handleResetPassword} className="w-full space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                        disabled={isLoading || isResetSuccess}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        disabled={isLoading || isResetSuccess}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    </div>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading || isResetSuccess} //
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {code && isResetSuccess && (
            <>
              {/* Reset password success */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Password Reset!</h2>
                <p className="text-muted-foreground mb-4">Your password has been updated. You can now sign in.</p>
              </div>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Sign In
              </button>
            </>
          )}

          <button
            onClick={handleBackToLogin}
            className="w-full mt-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;