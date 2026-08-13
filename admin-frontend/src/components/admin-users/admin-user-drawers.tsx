import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Plus, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RHFInputField, RHFPasswordField } from "@/components/ui/form/rhf";
import {
	createAdminUserEditSchema,
	createAdminUserPasswordSchema,
	createAdminUserSchema,
	type AdminUser,
	type AdminUserCreateFormData,
	type AdminUserEditFormData,
	type AdminUserPasswordFormData,
} from "@/types/admin-user";
import { AdminUserDrawer } from "./admin-user-drawer";

const CREATE_USER_FORM_ID = "create-admin-user-form";
const EDIT_USER_FORM_ID = "edit-admin-user-form";
const SET_PASSWORD_FORM_ID = "set-admin-user-password-form";

const EMPTY_CREATE_VALUES: AdminUserCreateFormData = {
	name: "",
	email: "",
	password: "",
};

const EMPTY_PASSWORD_VALUES: AdminUserPasswordFormData = {
	newPassword: "",
	confirmPassword: "",
};

type DrawerBaseProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isPending: boolean;
};

export function CreateAdminUserDrawer({
	open,
	onOpenChange,
	isPending,
	onSubmit,
}: DrawerBaseProps & { onSubmit: (data: AdminUserCreateFormData) => void }) {
	const { t: commonT } = useTranslation("common");
	const { t } = useTranslation("admin");
	const form = useForm<AdminUserCreateFormData>({
		resolver: zodResolver(createAdminUserSchema(commonT)),
		defaultValues: EMPTY_CREATE_VALUES,
	});

	useEffect(() => {
		if (!open) form.reset(EMPTY_CREATE_VALUES);
	}, [form, open]);

	return (
		<AdminUserDrawer
			description={t("users.create.description")}
			footer={
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						disabled={isPending}
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						{t("users.actions.cancel")}
					</Button>
					<Button
						form={CREATE_USER_FORM_ID}
						leftIcon={Plus}
						loading={isPending}
						type="submit"
					>
						{t("users.actions.create")}
					</Button>
				</div>
			}
			isPending={isPending}
			onOpenChange={onOpenChange}
			open={open}
			title={t("users.create.title")}
		>
			<form
				className="space-y-5"
				id={CREATE_USER_FORM_ID}
				noValidate
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<RHFInputField
					control={form.control}
					inputProps={{ autoComplete: "name", placeholder: t("users.namePlaceholder") }}
					label={commonT("form.name")}
					name="name"
					required
				/>
				<RHFInputField
					control={form.control}
					inputProps={{
						autoComplete: "email",
						placeholder: t("users.emailPlaceholder"),
						type: "email",
					}}
					label={commonT("form.email")}
					name="email"
					required
				/>
				<RHFPasswordField
					control={form.control}
					inputProps={{
						autoComplete: "new-password",
						placeholder: t("users.passwordPlaceholder"),
					}}
					label={commonT("form.password")}
					name="password"
					required
				/>
			</form>
		</AdminUserDrawer>
	);
}

export function EditAdminUserDrawer({
	open,
	onOpenChange,
	isPending,
	user,
	onSubmit,
}: DrawerBaseProps & {
	user: AdminUser;
	onSubmit: (data: AdminUserEditFormData) => void;
}) {
	const { t: commonT } = useTranslation("common");
	const { t } = useTranslation("admin");
	const form = useForm<AdminUserEditFormData>({
		resolver: zodResolver(createAdminUserEditSchema(commonT)),
		defaultValues: { name: user.name, email: user.email },
	});

	useEffect(() => {
		if (open) form.reset({ name: user.name, email: user.email });
		else form.reset({ name: "", email: "" });
	}, [form, open, user.email, user.name]);

	return (
		<AdminUserDrawer
			description={t("users.edit.description", { name: user.name })}
			footer={
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						disabled={isPending}
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						{t("users.actions.cancel")}
					</Button>
					<Button
						form={EDIT_USER_FORM_ID}
						leftIcon={Save}
						loading={isPending}
						type="submit"
					>
						{t("users.actions.save")}
					</Button>
				</div>
			}
			isPending={isPending}
			onOpenChange={onOpenChange}
			open={open}
			title={t("users.edit.title")}
		>
			<form
				className="space-y-5"
				id={EDIT_USER_FORM_ID}
				noValidate
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<RHFInputField
					control={form.control}
					inputProps={{ autoComplete: "name" }}
					label={commonT("form.name")}
					name="name"
					required
				/>
				<RHFInputField
					control={form.control}
					inputProps={{ autoComplete: "email", type: "email" }}
					label={commonT("form.email")}
					name="email"
					required
				/>
			</form>
		</AdminUserDrawer>
	);
}

export function SetAdminUserPasswordDrawer({
	open,
	onOpenChange,
	isPending,
	user,
	onSubmit,
}: DrawerBaseProps & {
	user: AdminUser;
	onSubmit: (data: AdminUserPasswordFormData) => void;
}) {
	const { t: commonT } = useTranslation("common");
	const { t } = useTranslation("admin");
	const form = useForm<AdminUserPasswordFormData>({
		resolver: zodResolver(createAdminUserPasswordSchema(commonT)),
		defaultValues: EMPTY_PASSWORD_VALUES,
	});

	useEffect(() => {
		if (!open) form.reset(EMPTY_PASSWORD_VALUES);
	}, [form, open]);

	return (
		<AdminUserDrawer
			description={t("users.password.description", { name: user.name })}
			footer={
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						disabled={isPending}
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						{t("users.actions.cancel")}
					</Button>
					<Button
						form={SET_PASSWORD_FORM_ID}
						leftIcon={KeyRound}
						loading={isPending}
						type="submit"
					>
						{t("users.actions.setPassword")}
					</Button>
				</div>
			}
			isPending={isPending}
			onOpenChange={onOpenChange}
			open={open}
			title={t("users.password.title")}
		>
			<form
				className="space-y-5"
				id={SET_PASSWORD_FORM_ID}
				noValidate
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<RHFPasswordField
					control={form.control}
					inputProps={{
						autoComplete: "new-password",
						placeholder: t("users.passwordPlaceholder"),
					}}
					label={commonT("form.password")}
					name="newPassword"
					required
				/>
				<RHFPasswordField
					control={form.control}
					inputProps={{
						autoComplete: "new-password",
						placeholder: t("users.password.confirmPlaceholder"),
					}}
					label={commonT("form.confirmPassword")}
					name="confirmPassword"
					required
				/>
			</form>
		</AdminUserDrawer>
	);
}
