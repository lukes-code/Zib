import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Nav } from "@/components/ui/nav";

type ProtectedLayoutProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export const ProtectedLayout = ({
  children,
  requireAdmin = false,
}: ProtectedLayoutProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen">
      <Nav />
      {children}
    </div>
  );
};
