import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PawPrint, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { authApi } from "../services/authApi";

const SignIn = () => {
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const intent = searchParams.get("intent");
  const mode = searchParams.get("mode");
  const redirectTo = searchParams.get("redirect");
  const isPartnerFlow = intent === "partner";

  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(() => mode === "signup");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // For sign-up
  const [firstName, setFirstName] = useState(""); 
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const handleSignUp = async () => {
    if (isSignUp && !termsChecked) {
      toast({ title: "Error", description: "You must agree to the terms." });
      return;
    }

    if(password !== confirmPassword){
      toast({ title: "Error", description: "Passwords do not match." });
      return;
    }

    try {
      const result  = await authApi.signUp({
        email,
        password,
        firstName,
        lastName,
        isPartner: isPartnerFlow,
      });

      if (!result?.userId) {
        toast({ title: "Error", description: "Signup failed." });
        return;
      }
      
      navigate("/check-email", { state: { email } });
      
      toast({
        title: "Account Created!", //Sign-up Successful
        description: "Please check your email to confirm your account.",
      });
      
      // await authApi.resendConfirmation({email});
      
      // reset form
      // setFirstName("");
      // setLastName("");
      // setPassword("");
      // setConfirmPassword("");
      // setTermsChecked(false);

      // navigate(redirectTo || "/");
      return;
    } catch(err) {
      toast({ title: "Error", description: err.message || "Failed to sign up." });
    }
  };

  // Signin
  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Email and password are required." });
      return;
    }

    try{
      const result = await authApi.signIn({email, password});
      
      if (result?.message?.includes("confirm your email")) {
        toast({
          title: "Email Not Confirmed",
          description: result.message,
        });
        return;
      }
      
      if (!result?.user) {
        toast({ title: "Error", description: "Sign-in failed. Check your credentials." });
        return;
      }
      
      // Demo: redirect based on email for testing admin panels
      //  if (email.includes("admin@")) {
      //   toast({
      //     title: "Welcome Admin!",
      //     description: "Redirecting to admin dashboard...",
      //   });
      //   navigate("/admin");
      //   return;
      // }
      // if (result.user.role === "admin") {
      //   toast({ 
      //    title: "Welcome Admin!", 
      //    description: "Redirecting to admin dashboard..." 
      //   });
      //   navigate("/admin");
      //   return;
      // }
      
      // if (email.includes("super@") || email.includes("superadmin@")) {
      //   toast({
      //     title: "Welcome Super Admin!",
      //     description: "Redirecting to super admin dashboard...",
      //   });
      //   navigate("/superadmin");
      //   return;
      // }
      // if (result.user.role === "superadmin") {
      //   toast({ 
      //     title: "Welcome Super Admin!", 
      //     description: "Redirecting to super admin dashboard..." 
      //   });
      //   navigate("/superadmin");
      //   return;
      // }

      // For proprietors (partners)
      // if (result.user.role === "proprietor") {
      //   toast({
      //     title: "Welcome Partner!",
      //     description: "Redirecting to partner dashboard...",
      //   });
      //   navigate("/"); /////////
      //   return;
      // }

      localStorage.setItem("pawstay.authenticated", "true");
      console.log("User role:", result.user.role);

      if (result.user.role === "super_admin") {
        toast({
          title: "Welcome, Super Admin! 🔑",
          description: "Redirecting to Super Admin dashboard...",
        });
        navigate("/superadmin", { replace: true });
        return;
      }

      if (result.user.role === "admin") {
        toast({
          title: "Welcome, Admin!",
          description: "Redirecting to Admin dashboard...",
        });
        navigate("/admin", { replace: true });
        return;
      }

      // Regular customers
      toast({
        title: "Welcome! 🎉",
        description: `Logged in as ${result.user.email}`,
      });
      navigate(redirectTo || "/", { replace: true });
    } catch(err) {
      toast({ title: "Error", description: err.message || "Invalid email or password" });
    }   
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await authApi.signInWithGoogle();

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Google sign-in failed.",
      });
    }
  };  

  // CHECK FOR OAUTH RETURN
  useEffect(() => {
    const oauthSuccess = searchParams.get("oauth_success");
    const oauthError = searchParams.get("error");
    const userEmail = searchParams.get("email");

    if (oauthSuccess === "true") {
      localStorage.setItem("pawstay.authenticated", "true");
      // Show welcome toast
      toast({
        title: "Welcome ! 🎉",
        description: `Logged in as ${userEmail || "Google User"}`,
      });
      navigate("/");

    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        missing_code: "Authentication failed. Please try again.",
        auth_failed: "Authentication failed. Please try again.",
        session_failed: "Could not create session. Please try again.",
        server_error: "Server error. Please try again later."
      };
      
      toast({
        title: "Sign In Failed",
        description: errorMessages[oauthError] || "Google sign-in failed. Please try again.",
        variant: "destructive",
      });

      navigate("/signin", { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // localStorage.setItem("pawstay.authenticated", "true");
    
    // // Demo: redirect based on email for testing admin panels
    // if (email.includes("admin@")) {
    //   toast({
    //     title: "Welcome Admin!",
    //     description: "Redirecting to admin dashboard...",
    //   });
    //   navigate("/admin");
    //   return;
    // }
    
    // if (email.includes("super@") || email.includes("superadmin@")) {
    //   toast({
    //     title: "Welcome Super Admin!",
    //     description: "Redirecting to super admin dashboard...",
    //   });
    //   navigate("/superadmin");
    //   return;
    // }
    if(isSignUp){
      await handleSignUp();
    }
    else{
      await handleSignIn();
    }
    // toast({
    //   title: isSignUp ? "Account Created!" : "Welcome Back!",
    //   description: isSignUp
    //     ? "Your account has been created successfully."
    //     : "You have signed in successfully.",
    // });
    // navigate(redirectTo || "/");
  };

  const heading = isPartnerFlow
    ? isSignUp
      ? "Create your partner account"
      : "Sign in to your partner account"
    : isSignUp
      ? "Create Account"
      : "Welcome Back";

  const subheading = isPartnerFlow
    ? isSignUp
      ? "Create an account to list and manage your business."
      : "Sign in to manage your business."
    : isSignUp
      ? "Join the PawStay family today"
      : "Sign in to access your account";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-md mx-auto">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero shadow-glow mb-4">
                <PawPrint className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {heading}
              </h1>
              <p className="text-muted-foreground mt-2">{subheading}</p>
            </div>

            {/* Form Card */}
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-elevated">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="confirmPassword" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {!isSignUp && (
                  <div className="flex items-center justify-end">
                    {/* <div className="flex items-center gap-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm cursor-pointer">
                        Remember me
                      </Label>
                    </div> */}
                    <a href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                )}

                {isSignUp && (
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" className="mt-1" checked={termsChecked} onCheckedChange={(checked) => setTermsChecked(!!checked)} />
                    <Label htmlFor="terms" className="text-sm cursor-pointer text-muted-foreground">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </Label>
                  </div>
                )}

                <Button variant="hero" size="lg" className="w-full">
                  {isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <Button variant="outline" className="w-full gap-2" onClick={handleGoogleAuth}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
                  Continue with Apple
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary font-medium hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignIn;
