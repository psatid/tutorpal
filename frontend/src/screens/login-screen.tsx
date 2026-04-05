import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/mutations/use-login";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { data: session, isPending } = authClient.useSession();

  const { mutate: login, isPending: isLoginPending } = useLogin();

  const onSubmit = async (data: LoginFormData) => {
    login({ email: data.email, password: data.password });
  };

  if (isPending) {
    return <div>Loading...</div>;
  }

  // Redirect if already authenticated
  if (session) {
    navigate({ to: "/" });
    return null;
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Desktop: Split layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-0">
          {/* Left: Editorial panel */}
          <div className="bg-gradient-to-br from-primary/5 to-primary-container/10 rounded-3xl p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-container/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h1 className="font-headline font-extrabold text-5xl text-primary tracking-tight mb-6">
                TutorPal
              </h1>
              <p className="text-2xl text-on-surface-variant font-body mb-12">
                Elevate Your Tutoring Experience
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-on-surface mb-1">
                      Student Management
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      Organize and track your students' progress
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-on-surface mb-1">
                      Schedule Classes
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      Plan and manage your teaching sessions
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ProgressIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-on-surface mb-1">
                      Class Progress
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      Monitor performance and achievements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login form */}
          <div className="p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full space-y-8">
              <div className="text-center md:text-left">
                <h2 className="font-headline font-bold text-3xl text-on-surface mb-2">
                  Welcome back
                </h2>
                <p className="text-on-surface-variant font-body">
                  Enter your credentials to access your account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-on-surface mb-2"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      leftIcon={Mail}
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-on-surface mb-2"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      leftIcon={Lock}
                      error={errors.password?.message}
                      {...register("password")}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary-dim transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  rightIcon={ArrowRight}
                  className="w-full btn-gradient"
                >
                  Sign In
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile: Centered form */}
        <div className="md:hidden">
          <div className="max-w-sm mx-auto w-full space-y-8">
            {/* Mobile branding */}
            <div className="text-center">
              <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">
                TutorPal
              </h1>
              <p className="text-on-surface-variant font-body">
                Elevate Your Tutoring Experience
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="mobile-email"
                    className="block text-sm font-medium text-on-surface mb-2"
                  >
                    Email
                  </label>
                  <Input
                    id="mobile-email"
                    type="email"
                    placeholder="Enter your email"
                    leftIcon={Mail}
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="mobile-password"
                    className="block text-sm font-medium text-on-surface mb-2"
                  >
                    Password
                  </label>
                  <Input
                    id="mobile-password"
                    type="password"
                    placeholder="Enter your password"
                    leftIcon={Lock}
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary-dim transition-colors font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                loading={isLoginPending}
                rightIcon={ArrowRight}
                className="w-full btn-gradient"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon components for feature highlights
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
