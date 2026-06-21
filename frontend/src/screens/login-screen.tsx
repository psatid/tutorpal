import { Link, Navigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { RHFInputField } from "@/components/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { useLogin } from "@/hooks/mutations/use-login";
import { authClient } from "@/lib/auth-client";

export function LoginScreen() {
  const { t } = useTranslation(["auth", "common"]);

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
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { data: session } = authClient.useSession();
  const { mutate: login, isPending: isLoginPending } = useLogin({
    onError: (error) => {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        toast.error(t("auth:login.unverified"));
        return;
      }

      toast.error(t("auth:login.invalid"));
    },
  });

  if (session) {
    return <Navigate to={APP_ROUTES.HOME} />;
  }

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <AuthShell
      eyebrow={t("auth:brand.eyebrow")}
      title={t("auth:login.title")}
      subtitle={t("auth:login.subtitle")}
      form={
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <RHFInputField
            control={control}
            name="email"
            label={t("common:form.email")}
            inputProps={{
              type: "email",
              placeholder: t("auth:login.emailPlaceholder"),
              leftIcon: Mail,
            }}
          />

          <RHFInputField
            control={control}
            name="password"
            label={t("common:form.password")}
            inputProps={{
              type: "password",
              placeholder: t("auth:login.passwordPlaceholder"),
              leftIcon: Lock,
            }}
          />
          <button type="submit" className="hidden" aria-hidden />
        </form>
      }
      ctaArea={
        <>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("auth:legal")}
          </p>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || isLoginPending}
            className="h-12 w-full"
          >
            {t("auth:login.submit")}
          </Button>
        </>
      }
      footer={
        <p className="flex flex-wrap items-center gap-1">
          <span>{t("auth:login.alternatePrompt")}</span>
          <Link
            to={APP_ROUTES.SIGNUP}
            className={buttonVariants({
              variant: "link",
              className: "h-auto p-0 font-semibold",
            })}
          >
            {t("auth:login.alternateAction")}
          </Link>
        </p>
      }
    />
  );
}
