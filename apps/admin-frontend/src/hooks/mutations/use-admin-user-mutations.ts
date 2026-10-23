import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatchV1AdminUsersByIdBody } from "@/api/generated/models/patchV1AdminUsersByIdBody";
import type { PostV1AdminUsersBody } from "@/api/generated/models/postV1AdminUsersBody";
import type { PostV1AdminUsersByIdPasswordBody } from "@/api/generated/models/postV1AdminUsersByIdPasswordBody";
import { adminUserQueryKeys } from "@/constants/admin-user-query-keys";
import { apiClient } from "@/lib/api-client";

function useAdminUserListInvalidation() {
	const queryClient = useQueryClient();

	return () =>
		queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.lists() });
}

export function useCreateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: async (input: PostV1AdminUsersBody) =>
			(await apiClient.postV1AdminUsers(input)).data,
		onSuccess: invalidateLists,
	});
}

export function useUpdateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: string;
			input: PatchV1AdminUsersByIdBody;
		}) => (await apiClient.patchV1AdminUsersById(id, input)).data,
		onSuccess: invalidateLists,
	});
}

export function useSetAdminUserPassword() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: async ({
			id,
			newPassword,
		}: {
			id: string;
			newPassword: PostV1AdminUsersByIdPasswordBody["newPassword"];
		}) =>
			(await apiClient.postV1AdminUsersByIdPassword(id, { newPassword })).data,
		onSuccess: invalidateLists,
	});
}

export function useDeactivateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: async (id: string) =>
			(await apiClient.postV1AdminUsersByIdDeactivate(id)).data,
		onSuccess: invalidateLists,
	});
}

export function useReactivateAdminUser() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: async (id: string) =>
			(await apiClient.postV1AdminUsersByIdReactivate(id)).data,
		onSuccess: invalidateLists,
	});
}

export function useResendAdminUserVerification() {
	const invalidateLists = useAdminUserListInvalidation();

	return useMutation({
		mutationFn: async (id: string) =>
			(await apiClient.postV1AdminUsersByIdVerification(id)).data,
		onSuccess: invalidateLists,
	});
}
