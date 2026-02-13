import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import supabase from "@/config/supabaseClient";

type RequireAuthProps = {
  children: ReactNode;
};

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const localAuthenticated = localStorage.getItem("pawstay.authenticated") === "true";

      if (localAuthenticated) {
        if (isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (isMounted) {
        setIsAuthenticated(Boolean(!error && data.session));
        setIsLoading(false);
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
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
