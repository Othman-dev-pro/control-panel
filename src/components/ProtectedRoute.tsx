import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // The application is Web-Admin only, thus only super_admin should ever be permitted here.
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If the authenticated user is NOT a super_admin, they are rejected.
    // They should use the mobile apps.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This panel is for administration only. Please use the mobile application for standard access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
