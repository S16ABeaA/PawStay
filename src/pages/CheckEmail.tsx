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

// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { authApi } from "../services/authApi";

// const CheckEmail = () => {
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Email sent from signup page
//   const email = location.state?.email || "";

//   // Check if query param ?confirmed=true
//   const confirmed = new URLSearchParams(location.search).get("confirmed") === "true";

//   const [resendLoading, setResendLoading] = useState(false);

//   // Toast on confirmation
//   useEffect(() => {
//     if (confirmed) {
//       toast({
//         title: "Email confirmed! 🎉",
//         description: "You can now sign in to your account.",
//       });
//     }
//   }, [confirmed, toast]);

//   const handleResendEmail = async () => {
//     setResendLoading(true);
//     try {
//       const result = await authApi.resendConfirmation({ email });
//       toast({
//         title: "Email Sent",
//         description: result.message || "Confirmation email resent successfully.",
//       });
//     } catch (err: any) {
//       toast({ title: "Error", description: err.message || "Failed to resend email." });
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//       <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
//         {confirmed ? (
//           <>
//             <div className="text-green-600 text-6xl mb-4">🎉</div>
//             <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
//             <p className="text-gray-600 mb-6">
//               Your email <strong>{email}</strong> has been successfully confirmed. You can now log in.
//             </p>
//             <Button className="w-full" onClick={() => navigate("/signin")}>
//               Go to Sign In
//             </Button>
//           </>
//         ) : (
//           <>
//             <div className="text-blue-500 text-6xl mb-4">📩</div>
//             <h1 className="text-2xl font-bold mb-2">Check your email</h1>
//             <p className="text-gray-600 mb-6">
//               We've sent a confirmation link to <strong>{email}</strong>. 
//               Please click the link in your email to activate your account.
//             </p>
//             <Button
//               className="w-full mb-4"
//               onClick={handleResendEmail}
//               disabled={resendLoading}
//             >
//               {resendLoading ? "Sending..." : "Resend Email"}
//             </Button>
//           </>
//         )}

//         <Button
//           variant="outline"
//           className="w-full mt-2"
//           onClick={() => navigate("/")}
//         >
//           Back to Homepage
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default CheckEmail;

// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { authApi } from "../services/authApi";

// const CheckEmail = () => {
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // email sent from signup page
//   const email = location.state?.email || "";

//   // check if query param ?confirmed=true
//   const confirmed = new URLSearchParams(location.search).get("confirmed") === "true";

//   const [resendLoading, setResendLoading] = useState(false);

//   // toast on confirmation
//   useEffect(() => {
//     if (confirmed) {
//       toast({
//         title: "Email confirmed!",
//         description: "You can now sign in to your account.",
//       });
//     }
//   }, [confirmed, toast]);

//   const handleResendEmail = async () => {
//     setResendLoading(true);
//     try {
//       const result = await authApi.resendConfirmation({ email });
//       toast({
//         title: "Email Sent",
//         description: result.message || "Confirmation email resent successfully.",
//       });
//     } catch (err: any) {
//       toast({ title: "Error", description: err.message || "Failed to resend email." });
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="text-center max-w-md">
//         {!confirmed ? (
//           <>
//             <h1 className="text-2xl font-bold">Check your email 📩</h1>
//             <p className="mt-4 text-muted-foreground">
//               We've sent a confirmation link to <strong>{email}</strong>. 
//               Please click the link in your email to activate your account.
//             </p>

//             <Button
//               className="mt-6"
//               onClick={handleResendEmail}
//               disabled={resendLoading}
//             >
//               {resendLoading ? "Sending..." : "Resend Email"}
//             </Button>
//           </>
//         ) : (
//           <>
//             <h1 className="text-2xl font-bold">Email Confirmed 🎉</h1>
//             <p className="mt-4 text-muted-foreground">
//               Your email has been successfully confirmed. You can now log in.
//             </p>
//             <Button
//               className="mt-6"
//               onClick={() => navigate("/signin")}
//             >
//               Go to Sign In
//             </Button>
//           </>
//         )}

//         <Button
//           variant="outline"
//           className="mt-4"
//           onClick={() => navigate("/")}
//         >
//           Back to Homepage
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default CheckEmail;


// import { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { authApi } from "../services/authApi";

// const CheckEmail = () => {
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const [resendLoading, setResendLoading] = useState(false);

//   const location = useLocation();
  
//   // Try to get email from navigation state or query params
//   const stateEmail = location.state?.email;
//   const queryEmail = new URLSearchParams(location.search).get("email");
//   const email = stateEmail || queryEmail || "";

//   const handleResendEmail = async () => {
//     if (!email) {
//       toast({
//         title: "Error",
//         description: "Email is missing. Please sign up again.",
//       });
//       return;
//     }

//     setResendLoading(true);
//     try {
//       const result = await authApi.resendConfirmation({ email });
//       toast({
//         title: "Email Sent",
//         description: result.message || "Confirmation email resent successfully.",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message || "Failed to resend email.",
//       });
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="text-center max-w-md">
//         <h1 className="text-2xl font-bold mb-4">
//           {email ? "Check your email 📩" : "Email Confirmation"}
//         </h1>

//         {email ? (
//           <p className="text-muted-foreground">
//             We've sent a confirmation link to <strong>{email}</strong>. <br />
//             Please click the link in your email to activate your account.
//           </p>
//         ) : (
//           <p className="text-muted-foreground">
//             Your email has been confirmed! You can now sign in to your account.
//           </p>
//         )}

//         {email && (
//           <Button
//             className="mt-6"
//             onClick={handleResendEmail}
//             disabled={resendLoading}
//           >
//             {resendLoading ? "Sending..." : "Resend Email"}
//           </Button>
//         )}

//         <Button
//           variant="outline"
//           className="mt-4"
//           onClick={() => navigate(email ? "/" : "/signin")}
//         >
//           {email ? "Back to Homepage" : "Go to Sign In"}
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default CheckEmail;

// import { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { authApi } from "../services/authApi";

// const CheckEmail = () => {
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const [resendLoading, setResendLoading] = useState(false);
//   const location = useLocation();
//   const email = location.state?.email || "";

//   const handleResendEmail = async () => {
//     if (!email) return;
//     setResendLoading(true);
//     try {
//       const result = await authApi.resendConfirmation({ email });
//       toast({
//         title: "Email Sent",
//         description: result.message || "Confirmation email resent successfully.",
//       });
//     } catch (err: any) {
//       toast({ title: "Error", description: err.message || "Failed to resend email." });
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-md">
//         <h1 className="text-2xl font-bold">Check Your Email 📩</h1>
//         <p className="mt-4 text-gray-600">
//           We've sent a confirmation link to <strong>{email}</strong>. 
//           Please click the link in your email to activate your account.
//         </p>

//         {/* Resend email button */}
//         <Button
//           className="mt-6 w-full"
//           onClick={handleResendEmail}
//           disabled={resendLoading}
//         >
//           {resendLoading ? "Sending..." : "Resend Email"}
//         </Button>

//         {/* After confirmation, user can go to Sign In */}
//         <Button
//           variant="outline"
//           className="mt-4 w-full"
//           onClick={() => navigate("/signin", { state: { email } })}
//         >
//           I Confirmed, Sign In
//         </Button>

//         {/* Optional: go back home */}
//         <Button
//           variant="ghost"
//           className="mt-2 w-full text-sm text-gray-500"
//           onClick={() => navigate("/")}
//         >
//           Back to Homepage
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default CheckEmail;