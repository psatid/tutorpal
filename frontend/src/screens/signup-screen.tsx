import { Link, Navigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, Mail, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { RHFInputField } from "@/components/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { useSendVerificationEmail } from "@/hooks/mutations/use-send-verification-email";
import { AuthFlowError, useSignup } from "@/hooks/mutations/use-signup";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SignupStep = 0 | 1 | 2;

export function SignupScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const [step, setStep] = useState<SignupStep>(0);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const signupSchema = z.object({
    name: z.string().min(2, t("common:form.required")),
    email: z.email(t("common:form.invalidEmail")),
    password: z.string().min(8, t("auth:signup.steps.password.error")),
  });

  type SignupFormData = z.infer<typeof signupSchema>;

  const {
    control,
    handleSubmit,
    setFocus,
    trigger,
    formState: { isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    shouldFocusError: true,
    shouldUnregister: false,
  });

  const { data: session } = authClient.useSession();
  const { mutate: signup, isPending: isSignupPending } = useSignup();
  const { mutate: resendVerification, isPending: isResendingVerification } =
    useSendVerificationEmail();

  const stepConfig = useMemo(
    () => [
      {
        title: t("auth:signup.steps.name.title"),
        description: t("auth:signup.steps.name.description"),
        placeholder: t("auth:signup.steps.name.placeholder"),
        icon: UserRound,
        type: "text" as const,
      },
      {
        title: t("auth:signup.steps.email.title"),
        description: t("auth:signup.steps.email.description"),
        placeholder: t("auth:signup.steps.email.placeholder"),
        icon: Mail,
        type: "email" as const,
      },
      {
        title: t("auth:signup.steps.password.title"),
        description: t("auth:signup.steps.password.description"),
        placeholder: t("auth:signup.steps.password.placeholder"),
        icon: Lock,
        type: "password" as const,
      },
    ],
    [t],
  );

  if (session) {
    return <Navigate to={APP_ROUTES.HOME} />;
  }

  const currentStep = stepConfig[step]!;
  const stepFields = [
    "name",
    "email",
    "password",
  ] as const satisfies ReadonlyArray<keyof SignupFormData>;

  useEffect(() => {
    setFocus(stepFields[step]!);
  }, [setFocus, step]);

  const handleNext = async () => {
    const isValid = await trigger(stepFields[step]!);
    if (!isValid) {
      return;
    }

    if (step < 2) {
      setStep((prev) => (prev + 1) as SignupStep);
      return;
    }

    handleSubmit((data) => {
      signup(data, {
        onSuccess: () => {
          setSubmittedEmail(data.email);
          setIsComplete(true);
        },
        onError: (error) => {
          const authError = error as AuthFlowError;
          if (
            authError.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
            authError.code === "FAILED_TO_CREATE_USER"
          ) {
            toast.error(t("auth:signup.emailExists"));
            return;
          }

          toast.error(authError.message || t("auth:signup.resendError"));
        },
      });
    })();
  };

  const handleBack = () => {
    if (step === 0) {
      return;
    }

    setStep((prev) => (prev - 1) as SignupStep);
  };

  if (isComplete) {
    return (
      <AuthShell
        eyebrow={t("auth:brand.eyebrow")}
        title={t("auth:signup.successTitle")}
        subtitle={t("auth:signup.successBody", { email: submittedEmail })}
        form={
          <div className="rounded-2xl border border-border bg-accent px-5 py-4 text-sm leading-6 text-muted-foreground">
            {t("auth:legal")}
          </div>
        }
        ctaArea={
          <>
            <Button
              onClick={() =>
                resendVerification(submittedEmail, {
                  onSuccess: () =>
                    toast.success(t("auth:signup.resendSuccess")),
                  onError: () => toast.error(t("auth:signup.resendError")),
                })
              }
              loading={isResendingVerification}
              variant="outline"
              className="h-12 w-full"
            >
              {t("auth:signup.resend")}
            </Button>
            <Link
              to={APP_ROUTES.LOGIN}
              className={buttonVariants({
                className: "h-12 w-full",
              })}
            >
              {t("auth:login.submit")}
            </Link>
          </>
        }
        footer={
          <p className="flex flex-wrap items-center gap-1">
            <span>{t("auth:signup.alternatePrompt")}</span>
            <Link
              to={APP_ROUTES.LOGIN}
              className={buttonVariants({
                variant: "link",
                className: "h-auto p-0 font-semibold",
              })}
            >
              {t("auth:signup.alternateAction")}
            </Link>
          </p>
        }
      />
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth:brand.eyebrow")}
      title={currentStep.title}
      subtitle={currentStep.description}
      form={
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleNext();
          }}
          className="space-y-6"
        >
          <div className="flex gap-2">
            {stepConfig.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= step ? "bg-primary" : "bg-accent"
                }`}
              />
            ))}
          </div>

          <div className="relative min-h-26">
            <div
              className={cn(
                "transition-opacity",
                step === 0
                  ? "relative visible opacity-100"
                  : "pointer-events-none absolute inset-0 invisible opacity-0",
              )}
              aria-hidden={step !== 0}
            >
              <RHFInputField
                control={control}
                name="name"
                label={t("common:form.name")}
                inputProps={{
                  type: "text",
                  placeholder: t("auth:signup.steps.name.placeholder"),
                  leftIcon: UserRound,
                }}
              />
            </div>

            <div
              className={cn(
                "transition-opacity",
                step === 1
                  ? "relative visible opacity-100"
                  : "pointer-events-none absolute inset-0 invisible opacity-0",
              )}
              aria-hidden={step !== 1}
            >
              <RHFInputField
                control={control}
                name="email"
                label={t("common:form.email")}
                inputProps={{
                  type: "email",
                  placeholder: t("auth:signup.steps.email.placeholder"),
                  leftIcon: Mail,
                }}
              />
            </div>

            <div
              className={cn(
                "transition-opacity",
                step === 2
                  ? "relative visible opacity-100"
                  : "pointer-events-none absolute inset-0 invisible opacity-0",
              )}
              aria-hidden={step !== 2}
            >
              <RHFInputField
                control={control}
                name="password"
                label={t("common:form.password")}
                inputProps={{
                  type: "password",
                  placeholder: t("auth:signup.steps.password.placeholder"),
                  leftIcon: Lock,
                }}
              />
            </div>
          </div>
          <button type="submit" className="hidden" aria-hidden />
        </form>
      }
      ctaArea={
        <>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("auth:legal")}
          </p>
          <div className="flex gap-3">
            {step > 0 ? (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="h-12 px-4"
              >
                <ArrowLeft className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                void handleNext();
              }}
              loading={isSubmitting || isSignupPending}
              className="h-12 flex-1"
            >
              {step === 2
                ? t("auth:signup.submit")
                : t("common:buttons.continue")}
            </Button>
          </div>
        </>
      }
      footer={
        <p className="flex flex-wrap items-center gap-1">
          <span>{t("auth:signup.alternatePrompt")}</span>
          <Link
            to={APP_ROUTES.LOGIN}
            className={buttonVariants({
              variant: "link",
              className: "h-auto p-0 font-semibold",
            })}
          >
            {t("auth:signup.alternateAction")}
          </Link>
        </p>
      }
    />
  );
}
