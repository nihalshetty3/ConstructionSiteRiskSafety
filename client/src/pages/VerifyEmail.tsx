import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { FormInput } from "@/components/FormInput";
import { axiosInstance } from "@/lib/axios";

const verifySchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const onSubmit = async (data: VerifyFormData) => {
    setError(null);
    setLoading(true);

    try {
      await axiosInstance.post("/auth/verify-email", {
        email,
        otp: data.otp,
      });
      navigate("/login", { state: { message: "Email verified successfully!" } });
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            We sent a 6-digit code to {email}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            label="Verification Code"
            type="text"
            placeholder="000000"
            maxLength={6}
            {...register("otp")}
            error={errors.otp?.message}
          />

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the code? Check your server console (dev mode) or spam folder.
          </p>
        </form>
      </div>
    </div>
  );
}

