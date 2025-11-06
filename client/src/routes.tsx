import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const routes = [
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/verify",
    element: <VerifyEmail />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
];

