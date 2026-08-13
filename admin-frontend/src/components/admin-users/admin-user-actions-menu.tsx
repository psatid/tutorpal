import {
	Ban,
	Ellipsis,
	KeyRound,
	Mail,
	Pencil,
	RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/types/admin-user";

type AdminUserActionsMenuProps = {
	user: AdminUser;
	disabled?: boolean;
	onEdit: (user: AdminUser) => void;
	onSetPassword: (user: AdminUser) => void;
	onResendVerification: (user: AdminUser) => void;
	onStatusChange: (user: AdminUser) => void;
};

export function AdminUserActionsMenu({
	user,
	disabled,
	onEdit,
	onSetPassword,
	onResendVerification,
	onStatusChange,
}: AdminUserActionsMenuProps) {
	const { t } = useTranslation("admin");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={t("users.actions.openFor", { name: user.name })}
						data-admin-user-actions={user.id}
						disabled={disabled}
						size="icon"
						type="button"
						variant="ghost"
					/>
				}
			>
				<Ellipsis aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-48">
				<DropdownMenuItem onClick={() => onEdit(user)}>
					<Pencil aria-hidden="true" />
					{t("users.actions.edit")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onSetPassword(user)}>
					<KeyRound aria-hidden="true" />
					{t("users.actions.setPassword")}
				</DropdownMenuItem>
				{!user.emailVerified ? (
					<DropdownMenuItem onClick={() => onResendVerification(user)}>
						<Mail aria-hidden="true" />
						{t("users.actions.resendVerification")}
					</DropdownMenuItem>
				) : null}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => onStatusChange(user)}
					variant={user.status === "active" ? "destructive" : "default"}
				>
					{user.status === "active" ? (
						<Ban aria-hidden="true" />
					) : (
						<RotateCcw aria-hidden="true" />
					)}
					{user.status === "active"
						? t("users.actions.deactivate")
						: t("users.actions.reactivate")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
