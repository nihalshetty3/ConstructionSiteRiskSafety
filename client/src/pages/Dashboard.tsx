import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { axiosInstance } from "@/lib/axios";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [secretData, setSecretData] = useState<any>(null);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSecret = async () => {
    setSecretError(null);
    setSecretData(null);
    setLoadingSecret(true);

    try {
      const response = await axiosInstance.get("/auth/secret");
      setSecretData(response.data);
    } catch (err: any) {
      setSecretError(
        err.response?.data?.error || "Failed to fetch secret data"
      );
    } finally {
      setLoadingSecret(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/90 rounded-md"
          >
            Logout
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">User Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">ID:</span> {user.id}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium">Full Name:</span> {user.fullName}
            </p>
            <p>
              <span className="font-medium">Role:</span>{" "}
              <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                {user.role}
              </span>
            </p>
            <p>
              <span className="font-medium">Email Verified:</span>{" "}
              {user.emailVerified ? (
                <span className="text-green-500">✓ Yes</span>
              ) : (
                <span className="text-destructive">✗ No</span>
              )}
            </p>
          </div>
        </div>

        {(user.role === "ADMIN" || user.role === "SAFETY_OFFICER") && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Protected Route Test</h2>
            <p className="text-sm text-muted-foreground">
              This button calls /auth/secret which requires ADMIN or SAFETY_OFFICER role.
            </p>
            <button
              onClick={handleSecret}
              disabled={loadingSecret}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSecret ? "Loading..." : "Call /auth/secret"}
            </button>

            {secretData && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                <p className="text-sm font-medium text-green-500 mb-2">Success!</p>
                <pre className="text-xs text-foreground overflow-auto">
                  {JSON.stringify(secretData, null, 2)}
                </pre>
              </div>
            )}

            {secretError && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{secretError}</p>
              </div>
            )}
          </div>
        )}

        {user.role !== "ADMIN" && user.role !== "SAFETY_OFFICER" && (
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">
              You don't have permission to access the protected route. Only ADMIN and SAFETY_OFFICER roles can access it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

