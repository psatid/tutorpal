import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserQueryKeys } from "@/constants/admin-user-query-keys";
import {
	createAdminUser,
	deactivateAdminUser,
	reactivateAdminUser,
	resendAdminUserVerification,
	setAdminUserPassword,
	updateAdminUser,
} from "@/lib/admin-users-api";
import type {
	AdminUserCreateFormData,
	AdminUserEditFormData,
} from "@/types/admin-user";

function useAdminUserListInvalidation() {
	const queryClient = useQueryClient();

	return () =>
		queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.lists() });
}

export function useCreateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: (input: AdminUserCreateFormData) => createAdminUser(input),
		onSuccess: invalidateLists,
	});
}

export function useUpdateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: AdminUserEditFormData }) =>
			updateAdminUser(id, input),
		onSuccess: invalidateLists,
	});
}

export function useSetAdminUserPassword() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
			setAdminUserPassword(id, newPassword),
		onSuccess: invalidateLists,
	});
}

export function useDeactivateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: deactivateAdminUser,
		onSuccess: invalidateLists,
	});
}

export function useReactivateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: reactivateAdminUser,
		onSuccess: invalidateLists,
	});
}

export function useResendAdminUserVerification() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: resendAdminUserVerification,
		onSuccess: invalidateLists,
	});
}
