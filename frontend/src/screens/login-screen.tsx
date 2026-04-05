import { Button } from "@/components/ui/button";
import { RHFInputField } from "@/components/form/rhf";
import { useLogin } from "@/hooks/mutations/use-login";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export function LoginScreen() {
  const { t } = useTranslation(["login", "common"]);
  const navigate = useNavigate();
  
  const loginSchema = z.object({
    email: z.email(t("common:form.invalidEmail")),
    password: z.string().min(1, t("common:form.required")),
  });
  
  type LoginFormData = z.infer<typeof loginSchema>;
  
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { data: session } = authClient.useSession();

  const { mutate: login, isPending: isLoginPending } = useLogin();

  const onSubmit = async (data: LoginFormData) => {
    login({ email: data.email, password: data.password });
  };

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
                {t("login:title")}
              </h1>
              <p className="text-2xl text-on-surface-variant font-body mb-12">
                {t("login:tagline")}
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-on-surface mb-1">
                      {t("login:features.studentManagement.title")}
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      {t("login:features.studentManagement.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-on-surface mb-1">
                      {t("login:features.scheduleClasses.title")}
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      {t("login:features.scheduleClasses.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ProgressIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-on-surface mb-1">
                      {t("login:features.classProgress.title")}
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      {t("login:features.classProgress.description")}
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
                  {t("login:welcomeBack")}
                </h2>
                <p className="text-on-surface-variant font-body">
                  {t("login:enterCredentials")}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <RHFInputField
                    control={control}
                    name="email"
                    label={t("common:form.email")}
                    inputProps={{
                      type: "email",
                      placeholder: t("login:emailPlaceholder"),
                      leftIcon: Mail,
                    }}
                  />

                  <RHFInputField
                    control={control}
                    name="password"
                    label={t("common:form.password")}
                    inputProps={{
                      type: "password",
                      placeholder: t("login:passwordPlaceholder"),
                      leftIcon: Lock,
                    }}
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary-dim transition-colors font-medium"
                  >
                    {t("login:forgotPassword")}
                  </button>
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  rightIcon={ArrowRight}
                  className="w-full btn-gradient"
                >
                  {t("common:buttons.signIn")}
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
                {t("login:title")}
              </h1>
              <p className="text-on-surface-variant font-body">
                {t("login:tagline")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <RHFInputField
                  control={control}
                  name="email"
                  label={t("common:form.email")}
                  inputProps={{
                    type: "email",
                    placeholder: t("login:emailPlaceholder"),
                    leftIcon: Mail,
                  }}
                />

                <RHFInputField
                  control={control}
                  name="password"
                  label={t("common:form.password")}
                  inputProps={{
                    type: "password",
                    placeholder: t("login:passwordPlaceholder"),
                    leftIcon: Lock,
                  }}
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary-dim transition-colors font-medium"
                >
                  {t("login:forgotPassword")}
                </button>
              </div>

              <Button
                type="submit"
                loading={isLoginPending}
                rightIcon={ArrowRight}
                className="w-full btn-gradient"
              >
                {t("common:buttons.signIn")}
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
