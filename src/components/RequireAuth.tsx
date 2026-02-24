import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authApi } from "@/services/authApi";

type RequireAuthProps = {
  children: ReactNode;
  /** When true, redirect unauthenticated users to the sign-up form instead of sign-in */
  signUpFirst?: boolean;
};

const RequireAuth = ({ children, signUpFirst = false }: RequireAuthProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const result = await authApi.getProfile();
        const hasSession = Boolean(result?.user);

        if (isMounted) {
          setIsAuthenticated(hasSession);
          if (hasSession) {
            localStorage.setItem("pawstay.authenticated", "true");
          } else {
            localStorage.removeItem("pawstay.authenticated");
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          localStorage.removeItem("pawstay.authenticated");
          setIsLoading(false);
        }
      }
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    const mode = signUpFirst ? "&mode=signup" : "";
    return <Navigate to={`/signin?redirect=${redirect}${mode}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
