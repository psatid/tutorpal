import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "@tanstack/react-router";
import { Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { RHFInputField, RHFPasswordField } from "@/components/ui/form/rhf";
import { useLogin } from "@/hooks/mutations/use-login";
import { authClient } from "@/lib/auth-client";
import {
	createAdminLoginSchema,
	type AdminLoginFormData,
} from "@/types/admin-login";

export function AdminLoginScreen() {
	const { t: adminT } = useTranslation("admin");
	const { t: commonT } = useTranslation("common");
	const { data: session } = authClient.useSession();
	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<AdminLoginFormData>({
		resolver: zodResolver(createAdminLoginSchema(commonT)),
		defaultValues: { email: "", password: "" },
	});
	const { mutate: login, isPending } = useLogin({
		onError: (error) => {
			toast.error(error.message || adminT("login.error"));
		},
	});

	if (session) {
		return <Navigate to="/" />;
	}

	return (
		<AuthShell
			eyebrow={adminT("login.eyebrow")}
			title={adminT("login.title")}
			subtitle={adminT("login.subtitle")}
			form={
				<form
					className="space-y-5"
					noValidate
					onSubmit={handleSubmit((data) => login(data))}
				>
					<RHFInputField
						control={control}
						name="email"
						label={commonT("form.email")}
						inputProps={{
							type: "email",
							placeholder: adminT("login.emailPlaceholder"),
							leftIcon: Mail,
						}}
					/>
					<RHFPasswordField
						control={control}
						name="password"
						label={commonT("form.password")}
						inputProps={{
							placeholder: adminT("login.passwordPlaceholder"),
							leftIcon: Lock,
						}}
					/>
					<Button
						className="h-12 w-full"
						loading={isSubmitting || isPending}
						type="submit"
					>
						{adminT("login.submit")}
					</Button>
				</form>
			}
			footer={
				<p>{adminT("login.footer")}</p>
			}
		/>
	);
}
