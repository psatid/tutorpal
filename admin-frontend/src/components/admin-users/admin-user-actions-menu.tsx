import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserBlock01Icon as BanHugeIcon,
  MoreHorizontalIcon as EllipsisHugeIcon,
  Key01Icon as KeyRoundHugeIcon,
  Mail01Icon as MailHugeIcon,
  ComputerIcon as MonitorHugeIcon,
  PencilEdit01Icon as PencilHugeIcon,
  RotateLeft01Icon as RotateCcwHugeIcon,
} from "@hugeicons/core-free-icons";
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
	onOpenTutorView: (user: AdminUser) => void;
	onStatusChange: (user: AdminUser) => void;
};

export function AdminUserActionsMenu({
	user,
	disabled,
	onEdit,
	onSetPassword,
	onResendVerification,
	onOpenTutorView,
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
				<HugeiconsIcon icon={EllipsisHugeIcon} strokeWidth={2} aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-48">
				<DropdownMenuItem onClick={() => onEdit(user)}>
					<HugeiconsIcon icon={PencilHugeIcon} strokeWidth={2} aria-hidden="true" />
					{t("users.actions.edit")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onSetPassword(user)}>
					<HugeiconsIcon icon={KeyRoundHugeIcon} strokeWidth={2} aria-hidden="true" />
					{t("users.actions.setPassword")}
				</DropdownMenuItem>
				{!user.emailVerified ? (
					<DropdownMenuItem onClick={() => onResendVerification(user)}>
						<HugeiconsIcon icon={MailHugeIcon} strokeWidth={2} aria-hidden="true" />
						{t("users.actions.resendVerification")}
					</DropdownMenuItem>
				) : null}
				{user.status === "active" ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => onOpenTutorView(user)}>
							<HugeiconsIcon icon={MonitorHugeIcon} strokeWidth={2} aria-hidden="true" />
							{t("users.actions.openTutorView")}
						</DropdownMenuItem>
					</>
				) : null}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => onStatusChange(user)}
					variant={user.status === "active" ? "destructive" : "default"}
				>
					{user.status === "active" ? (
						<HugeiconsIcon icon={BanHugeIcon} strokeWidth={2} aria-hidden="true" />
					) : (
						<HugeiconsIcon icon={RotateCcwHugeIcon} strokeWidth={2} aria-hidden="true" />
					)}
					{user.status === "active"
						? t("users.actions.deactivate")
						: t("users.actions.reactivate")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
