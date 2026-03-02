import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authApi } from "@/services/authApi";

type Props = { children: ReactNode };

const RequireAdmin = ({ children }: Props) => {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "authorized" | "unauthorized" | "unauthenticated">("loading");

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const result = await authApi.getProfile();
        if (!mounted) return;

        if (!result?.user) {
          localStorage.removeItem("pawstay.authenticated");
          setState("unauthenticated");
          return;
        }

        localStorage.setItem("pawstay.authenticated", "true");

        const role = result.user.role;
        if (role === "proprietor") {
          setState("authorized");
        } else {
          setState("unauthorized");
        }
      } catch {
        if (!mounted) return;
        localStorage.removeItem("pawstay.authenticated");
        setState("unauthenticated");
      }
    };

    void check();
    return () => { mounted = false; };
  }, []);

  if (state === "loading") return null;

  if (state === "unauthenticated") {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  if (state === "unauthorized") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
