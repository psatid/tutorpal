import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminUserList } from "@/components/admin-users/admin-user-list";
import {
	CreateAdminUserDrawer,
	EditAdminUserDrawer,
	SetAdminUserPasswordDrawer,
} from "@/components/admin-users/admin-user-drawers";
import { AdminUserStatusDialog } from "@/components/admin-users/admin-user-status-dialog";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { ADMIN_USER_PAGE_SIZE } from "@/constants/admin-user-query-keys";
import {
	useCreateAdminUser,
	useDeactivateAdminUser,
	useReactivateAdminUser,
	useResendAdminUserVerification,
	useSetAdminUserPassword,
	useUpdateAdminUser,
} from "@/hooks/mutations/use-admin-user-mutations";
import { useAdminUsers } from "@/hooks/queries/use-admin-users";
import { getApiErrorCode } from "@/lib/api-client";
import type {
	AdminUser,
	AdminUserCreateFormData,
	AdminUserEditFormData,
	AdminUserListStatus,
	AdminUserPasswordFormData,
} from "@/types/admin-user";
import { Route } from "@/routes/_layout/index";

type WorkspaceDrawer =
	| { mode: "create" }
	| { mode: "edit"; user: AdminUser }
	| { mode: "password"; user: AdminUser }
	| null;

export function AdminHomeScreen() {
	const { t } = useTranslation("admin");
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [drawer, setDrawer] = useState<WorkspaceDrawer>(null);
	const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
	const [searchDraft, setSearchDraft] = useState(search.search);
	const focusReturnRef = useRef<{
		element: HTMLElement | null;
		userId?: string;
	} | null>(null);

	useEffect(() => {
		setSearchDraft(search.search);
	}, [search.search]);

	useEffect(() => {
		if (searchDraft === search.search) return;

		const timeout = window.setTimeout(() => {
			void navigate({
				to: "/",
				search: (previous) => ({ ...previous, search: searchDraft, page: 1 }),
			});
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [navigate, search.search, searchDraft]);

	useEffect(() => {
		if (drawer !== null || statusUser !== null || !focusReturnRef.current) {
			return;
		}

		const focusReturn = focusReturnRef.current;
		focusReturnRef.current = null;
		const frame = window.requestAnimationFrame(() => {
			let target = focusReturn.element?.isConnected
				? focusReturn.element
				: null;

			if (!target && focusReturn.userId) {
				target = Array.from(
					document.querySelectorAll<HTMLElement>(
						"[data-admin-user-actions]",
					),
				).find(
					(element) =>
						element.dataset.adminUserActions === focusReturn.userId,
					) ?? null;
			}

			if (!target) {
				target = document.querySelector<HTMLElement>("[data-admin-create]");
			}

			target?.focus();
		});

		return () => window.cancelAnimationFrame(frame);
	}, [drawer, statusUser]);
	const usersQuery = useAdminUsers({
		search: search.search,
		status: search.status,
		page: search.page,
		limit: ADMIN_USER_PAGE_SIZE,
	});

	useEffect(() => {
		const pagination = usersQuery.data?.pagination;
		if (!pagination) return;

		const boundedPage =
			pagination.totalPages === 0
				? 1
				: Math.min(search.page, pagination.totalPages);
		if (boundedPage === search.page) return;

		void navigate({
			to: "/",
			replace: true,
			search: (previous) => ({ ...previous, page: boundedPage }),
		});
	}, [navigate, search.page, usersQuery.data?.pagination]);
	const createUser = useCreateAdminUser();
	const updateUser = useUpdateAdminUser();
	const setPassword = useSetAdminUserPassword();
	const deactivateUser = useDeactivateAdminUser();
	const reactivateUser = useReactivateAdminUser();
	const resendVerification = useResendAdminUserVerification();

	const isMutating =
		createUser.isPending ||
		updateUser.isPending ||
		setPassword.isPending ||
		deactivateUser.isPending ||
		reactivateUser.isPending ||
		resendVerification.isPending;

	const updateSearch = (update: Partial<typeof search>, resetPage = true) => {
		void navigate({
			to: "/",
			search: (previous) => ({
				...previous,
				...update,
				...(resetPage ? { page: 1 } : {}),
			}),
		});
	};

	const rememberFocus = (userId?: string) => {
		focusReturnRef.current = {
			element:
				document.activeElement instanceof HTMLElement
					? document.activeElement
					: null,
			...(userId ? { userId } : {}),
		};
	};

	const openCreateDrawer = () => {
		rememberFocus();
		setDrawer({ mode: "create" });
	};

	const clearFilters = () => {
		setSearchDraft("");
		updateSearch({ search: "", status: "all", page: 1 }, false);
	};

	const showError = (error: unknown) => {
		toast.error(getAdminUserErrorMessage(error, t));
	};

	const handleCreate = (input: AdminUserCreateFormData) => {
		createUser.mutate(input, {
			onSuccess: ({ verificationSent }) => {
				setDrawer(null);
				if (verificationSent) toast.success(t("users.feedback.created"));
				else toast.warning(t("users.feedback.createdWithoutVerification"));
			},
			onError: showError,
		});
	};

	const handleEdit = (user: AdminUser, input: AdminUserEditFormData) => {
		updateUser.mutate(
			{ id: user.id, input },
			{
				onSuccess: ({ verificationSent }) => {
					setDrawer(null);
					if (verificationSent === false) {
						toast.warning(t("users.feedback.updatedWithoutVerification"));
						return;
					}
					toast.success(t("users.feedback.updated"));
				},
				onError: showError,
			},
		);
	};

	const handleSetPassword = (user: AdminUser, input: AdminUserPasswordFormData) => {
		setPassword.mutate(
			{ id: user.id, newPassword: input.newPassword },
			{
				onSuccess: () => {
					setDrawer(null);
					toast.success(t("users.feedback.passwordSet"));
				},
				onError: showError,
			},
		);
	};

	const handleResendVerification = (user: AdminUser) => {
		resendVerification.mutate(user.id, {
			onSuccess: () => toast.success(t("users.feedback.verificationSent")),
			onError: showError,
		});
	};

	const handleStatusConfirm = () => {
		if (!statusUser) return;

		const mutation =
			statusUser.status === "active" ? deactivateUser : reactivateUser;
		const successKey =
			statusUser.status === "active"
				? "users.feedback.deactivated"
				: "users.feedback.reactivated";

		mutation.mutate(statusUser.id, {
			onSuccess: () => {
				setStatusUser(null);
				toast.success(t(successKey));
			},
			onError: showError,
		});
	};

	return (
		<ScreenLayout className="min-h-dvh">
			<div className="mx-auto w-full max-w-6xl space-y-6">
				<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							<h1 className="text-3xl font-light tracking-[-0.02em] text-foreground sm:text-4xl">
								{t("users.title")}
							</h1>
							{usersQuery.data ? (
								<p className="text-sm text-muted-foreground">
									{t("users.total", { count: usersQuery.data.pagination.total })}
								</p>
							) : null}
						</div>
						<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
							{t("users.description")}
						</p>
					</div>
					<Button
						className="w-full sm:w-auto"
						data-admin-create
						leftIcon={UserPlus}
						onClick={openCreateDrawer}
						type="button"
					>
						{t("users.actions.create")}
					</Button>
				</header>

				<AdminUserList
					data={usersQuery.data}
					isError={usersQuery.isError}
					isFetching={usersQuery.isFetching}
					isLoading={usersQuery.isPending}
					isMutating={isMutating}
					onClearFilters={clearFilters}
					onCreate={openCreateDrawer}
					onEdit={(user) => {
						rememberFocus(user.id);
						setDrawer({ mode: "edit", user });
					}}
					onPageChange={(page) => updateSearch({ page }, false)}
					onResendVerification={handleResendVerification}
					onRetry={() => void usersQuery.refetch()}
					onSearchChange={setSearchDraft}
					onSetPassword={(user) => {
						rememberFocus(user.id);
						setDrawer({ mode: "password", user });
					}}
					onStatusChange={(status) =>
						updateSearch({ status: status as AdminUserListStatus })
					}
					onStatusChangeRequest={(user) => {
						rememberFocus(user.id);
						setStatusUser(user);
					}}
					search={searchDraft}
					status={search.status}
				/>
			</div>

			{drawer?.mode === "create" ? (
				<CreateAdminUserDrawer
					isPending={createUser.isPending}
					onOpenChange={(open) => !open && setDrawer(null)}
					onSubmit={handleCreate}
					open
				/>
			) : null}
			{drawer?.mode === "edit" ? (
				<EditAdminUserDrawer
					isPending={updateUser.isPending}
					onOpenChange={(open) => !open && setDrawer(null)}
					onSubmit={(input) => handleEdit(drawer.user, input)}
					open
					user={drawer.user}
				/>
			) : null}
			{drawer?.mode === "password" ? (
				<SetAdminUserPasswordDrawer
					isPending={setPassword.isPending}
					onOpenChange={(open) => !open && setDrawer(null)}
					onSubmit={(input) => handleSetPassword(drawer.user, input)}
					open
					user={drawer.user}
				/>
			) : null}
			<AdminUserStatusDialog
				isPending={deactivateUser.isPending || reactivateUser.isPending}
				onConfirm={handleStatusConfirm}
				onOpenChange={(open) => !open && setStatusUser(null)}
				user={statusUser}
			/>
		</ScreenLayout>
	);
}

function getAdminUserErrorMessage(
	error: unknown,
	t: (key: string) => string,
) {
	switch (getApiErrorCode(error)) {
		case "USER_EMAIL_EXISTS":
			return t("users.errors.emailInUse");
		case "USER_NOT_FOUND":
			return t("users.errors.notFound");
		case "EMAIL_ALREADY_VERIFIED":
			return t("users.errors.alreadyVerified");
		case "VERIFICATION_EMAIL_FAILED":
			return t("users.errors.verificationFailed");
	}

	return t("users.errors.generic");
}
