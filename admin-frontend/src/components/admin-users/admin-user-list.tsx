import { Loader2, Search, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTime } from "@/lib/date-time";
import type {
	AdminUser,
	AdminUserListResponse,
	AdminUserListStatus,
} from "@/types/admin-user";
import { AdminUserActionsMenu } from "./admin-user-actions-menu";

type AdminUserListProps = {
	data: AdminUserListResponse | undefined;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	search: string;
	status: AdminUserListStatus;
	onSearchChange: (value: string) => void;
	onStatusChange: (value: AdminUserListStatus) => void;
	onRetry: () => void;
	onPageChange: (page: number) => void;
	onCreate: () => void;
	onClearFilters: () => void;
	onEdit: (user: AdminUser) => void;
	onSetPassword: (user: AdminUser) => void;
	onResendVerification: (user: AdminUser) => void;
	onStatusChangeRequest: (user: AdminUser) => void;
	isMutating: boolean;
};

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export function AdminUserList({
	data,
	isLoading,
	isFetching,
	isError,
	search,
	status,
	onSearchChange,
	onStatusChange,
	onRetry,
	onPageChange,
	onCreate,
	onClearFilters,
	onEdit,
	onSetPassword,
	onResendVerification,
	onStatusChangeRequest,
	isMutating,
}: AdminUserListProps) {
	const { t } = useTranslation("admin");
	const hasFilters = search.trim().length > 0 || status !== "all";
	const page = data
		? data.pagination.totalPages === 0
			? 1
			: Math.min(data.pagination.page, data.pagination.totalPages)
		: 1;

	return (
		<section aria-label={t("users.listLabel")} className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
				<div className="min-w-0">
					<label className="sr-only" htmlFor="admin-user-search">
						{t("users.search.label")}
					</label>
					<Input
						id="admin-user-search"
						leftIcon={Search}
						placeholder={t("users.search.placeholder")}
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
					/>
				</div>
				<div>
					<label className="sr-only" htmlFor="admin-user-status">
						{t("users.statusFilter.label")}
					</label>
					<select
										className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors hover:border-input-hover focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/35"
						id="admin-user-status"
						value={status}
						onChange={(event) =>
							onStatusChange(event.target.value as AdminUserListStatus)
						}
					>
						<option value="all">{t("users.statusFilter.all")}</option>
						<option value="active">{t("users.status.active")}</option>
						<option value="deactivated">
							{t("users.status.deactivated")}
						</option>
					</select>
				</div>
			</div>

			{isError && !data ? (
				<ErrorState onRetry={onRetry} />
			) : isLoading && !data ? (
				<SkeletonList />
			) : data ? (
				<>
					{isError ? (
						<div
							className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/25 bg-warning-container px-4 py-3 text-sm text-warning-container-foreground"
							role="status"
						>
							<span>{t("users.error.refresh")}</span>
							<Button onClick={onRetry} size="sm" type="button" variant="outline">
								{t("users.retry")}
							</Button>
						</div>
					) : null}
					{data.data.length === 0 ? (
						<EmptyState
							filtered={hasFilters}
							onClearFilters={onClearFilters}
							onCreate={onCreate}
						/>
					) : (
						<UserRows
							isFetching={isFetching}
							isMutating={isMutating}
							onEdit={onEdit}
							onResendVerification={onResendVerification}
							onSetPassword={onSetPassword}
							onStatusChangeRequest={onStatusChangeRequest}
							users={data.data}
						/>
					)}
						{data.pagination.total > 0 ? (
							<nav
								aria-label={t("users.pagination.label")}
								className="flex flex-wrap items-center justify-between gap-3"
							>
								<p className="min-w-0 text-sm text-muted-foreground" role="status">
									{t("users.pagination.showing", {
										start: (page - 1) * data.pagination.limit + 1,
										end: Math.min(
											page * data.pagination.limit,
											data.pagination.total,
										),
										total: data.pagination.total,
									})}
								</p>
								{data.pagination.totalPages > 1 ? (
									<div className="flex items-center gap-2">
										<Button
											className="h-11 sm:h-8"
												disabled={page <= 1 || isFetching}
												onClick={() => onPageChange(page - 1)}
											size="sm"
											type="button"
											variant="outline"
										>
											{t("users.pagination.previous")}
										</Button>
										<p className="min-w-0 px-1 text-center text-sm text-muted-foreground" role="status">
											{t("users.pagination.page", {
												page,
												totalPages: data.pagination.totalPages,
											})}
										</p>
										<Button
											className="h-11 sm:h-8"
												disabled={page >= data.pagination.totalPages || isFetching}
												onClick={() => onPageChange(page + 1)}
											size="sm"
											type="button"
											variant="outline"
										>
											{t("users.pagination.next")}
										</Button>
									</div>
								) : null}
							</nav>
						) : null}
				</>
			) : null}
		</section>
	);
}

function UserRows({
	users,
	isFetching,
	isMutating,
	onEdit,
	onSetPassword,
	onResendVerification,
	onStatusChangeRequest,
}: Pick<
	AdminUserListProps,
	| "isFetching"
	| "isMutating"
	| "onEdit"
	| "onSetPassword"
	| "onResendVerification"
	| "onStatusChangeRequest"
> & { users: AdminUser[] }) {
	const { t } = useTranslation("admin");

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<div className="hidden grid-cols-[minmax(0,1fr)_7.5rem_8rem_7rem_2.5rem] items-center gap-4 border-b border-border bg-muted/35 px-5 py-3 text-xs font-medium text-muted-foreground sm:grid">
				<span>{t("users.columns.user")}</span>
				<span>{t("users.columns.verification")}</span>
				<span>{t("users.columns.status")}</span>
				<span>{t("users.columns.created")}</span>
				<span className="sr-only">{t("users.columns.actions")}</span>
			</div>
			{users.map((user) => (
				<div
					className="grid min-h-[76px] grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_7.5rem_8rem_7rem_2.5rem] sm:gap-4 sm:px-5"
					key={user.id}
				>
					<div className="flex min-w-0 items-center gap-3">
						<Avatar className="size-10">
							<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-foreground">
								{user.name}
							</p>
							<p className="truncate text-sm text-muted-foreground">{user.email}</p>
							<div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
								<VerificationBadge verified={user.emailVerified} />
								<StatusBadge status={user.status} />
								<span className="text-xs text-muted-foreground">
									{DateTime.formatDate(user.createdAt)}
								</span>
							</div>
						</div>
					</div>
					<div className="hidden sm:block">
						<VerificationBadge verified={user.emailVerified} />
					</div>
					<div className="hidden sm:block">
						<StatusBadge status={user.status} />
					</div>
					<p className="hidden text-sm text-muted-foreground sm:block">
						{DateTime.formatDate(user.createdAt)}
					</p>
					<div className="justify-self-end">
						<AdminUserActionsMenu
							disabled={isMutating}
							onEdit={onEdit}
							onResendVerification={onResendVerification}
							onSetPassword={onSetPassword}
							onStatusChange={onStatusChangeRequest}
							user={user}
						/>
					</div>
				</div>
			))}
			{isFetching ? (
				<div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-5" role="status">
					<Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
					{t("users.refreshing")}
				</div>
			) : null}
		</div>
	);
}

function VerificationBadge({ verified }: { verified: boolean }) {
	const { t } = useTranslation("admin");

	return (
		<span
			className={
				verified
					? "inline-flex rounded-full bg-success-container px-2 py-1 text-xs font-medium text-success-container-foreground"
					: "inline-flex rounded-full bg-warning-container px-2 py-1 text-xs font-medium text-warning-container-foreground"
			}
		>
			{verified ? t("users.verification.verified") : t("users.verification.unverified")}
		</span>
	);
}

function StatusBadge({ status }: { status: AdminUser["status"] }) {
	const { t } = useTranslation("admin");

	return (
		<span
			className={
				status === "active"
					? "inline-flex rounded-full bg-primary-container px-2 py-1 text-xs font-medium text-primary"
					: "inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
			}
		>
			{t(`users.status.${status}`)}
		</span>
	);
}

function SkeletonList() {
	const { t } = useTranslation("admin");

	return (
		<div
			aria-live="polite"
			className="overflow-hidden rounded-xl border border-border bg-card"
			role="status"
		>
			<span className="sr-only">{t("users.loading")}</span>
			{SKELETON_ROWS.map((row) => (
				<div className="flex min-h-[76px] items-center gap-3 border-b border-border px-4 last:border-b-0 sm:px-5" key={row}>
					<div className="size-10 animate-pulse rounded-full bg-muted" />
					<div className="min-w-0 flex-1 space-y-2">
						<div className="h-3 w-32 animate-pulse rounded bg-muted" />
						<div className="h-3 w-48 max-w-full animate-pulse rounded bg-muted" />
					</div>
				</div>
			))}
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	const { t } = useTranslation("admin");

	return (
		<div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-border bg-card px-5 py-8 text-center">
			<p className="text-sm font-medium text-foreground">{t("users.error.load")}</p>
			<p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
				{t("users.error.loadDescription")}
			</p>
			<Button className="mt-5" onClick={onRetry} type="button" variant="outline">
				{t("users.retry")}
			</Button>
		</div>
	);
}

function EmptyState({
	filtered,
	onClearFilters,
	onCreate,
}: {
	filtered: boolean;
	onClearFilters: () => void;
	onCreate: () => void;
}) {
	const { t } = useTranslation("admin");

	return (
		<div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card px-5 py-8 text-center">
			<div className="flex size-11 items-center justify-center rounded-full bg-primary-container text-primary">
				<UsersRound aria-hidden="true" className="size-5" />
			</div>
			<p className="mt-4 text-sm font-medium text-foreground">
				{filtered ? t("users.emptyFiltered.title") : t("users.emptyInitial.title")}
			</p>
			<p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
				{filtered
					? t("users.emptyFiltered.description")
					: t("users.emptyInitial.description")}
			</p>
			{filtered ? (
				<Button className="mt-5" onClick={onClearFilters} type="button" variant="outline">
					{t("users.actions.clearFilters")}
				</Button>
			) : (
				<Button className="mt-5" onClick={onCreate} type="button">
					{t("users.actions.create")}
				</Button>
			)}
		</div>
	);
}

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}
