import { beforeEach, describe, expect, mock, test } from "bun:test";

type QueryOptions = {
	queryKey: readonly unknown[];
	queryFn: () => Promise<unknown>;
	placeholderData: unknown;
};

type MutationOptions = {
	mutationFn: (input: any) => Promise<unknown>;
	onSuccess: () => Promise<unknown>;
};

const previousData = (data: unknown) => data;
const apiCalls: Array<{ method: string; args: unknown[] }> = [];
const invalidations: unknown[] = [];

const responses = {
	list: {
		data: [],
		pagination: {
			total: 0,
			page: 1,
			limit: 20,
			totalPages: 0,
			hasNext: false,
			hasPrev: false,
		},
		summaries: { all: 0, active: 0, deactivated: 0 },
	},
	create: { user: { id: "user-1" }, verificationSent: true },
	update: { user: { id: "user-1" }, verificationSent: null },
	password: { success: true, sessionsRevoked: true },
	deactivate: { user: { id: "user-1", status: "deactivated" } },
	reactivate: { user: { id: "user-1", status: "active" } },
	verification: { verificationSent: true },
};

mock.module("@tanstack/react-query", () => ({
	keepPreviousData: previousData,
	useQuery: (options: QueryOptions) => options,
	useQueryClient: () => ({
		invalidateQueries: (filters: unknown) => {
			invalidations.push(filters);
			return Promise.resolve();
		},
	}),
	useMutation: (options: MutationOptions) => options,
}));

mock.module("@/lib/api-client", () => ({
	apiClient: {
		getV1AdminUsers: async (...args: unknown[]) => {
			apiCalls.push({ method: "list", args });
			return { data: responses.list };
		},
		postV1AdminUsers: async (...args: unknown[]) => {
			apiCalls.push({ method: "create", args });
			return { data: responses.create };
		},
		patchV1AdminUsersById: async (...args: unknown[]) => {
			apiCalls.push({ method: "update", args });
			return { data: responses.update };
		},
		postV1AdminUsersByIdPassword: async (...args: unknown[]) => {
			apiCalls.push({ method: "password", args });
			return { data: responses.password };
		},
		postV1AdminUsersByIdDeactivate: async (...args: unknown[]) => {
			apiCalls.push({ method: "deactivate", args });
			return { data: responses.deactivate };
		},
		postV1AdminUsersByIdReactivate: async (...args: unknown[]) => {
			apiCalls.push({ method: "reactivate", args });
			return { data: responses.reactivate };
		},
		postV1AdminUsersByIdVerification: async (...args: unknown[]) => {
			apiCalls.push({ method: "verification", args });
			return { data: responses.verification };
		},
	},
}));

const { useAdminUsers } = await import("./queries/use-admin-users");
const {
	useCreateAdminUser,
	useDeactivateAdminUser,
	useReactivateAdminUser,
	useResendAdminUserVerification,
	useSetAdminUserPassword,
	useUpdateAdminUser,
} = await import("./mutations/use-admin-user-mutations");

beforeEach(() => {
	apiCalls.length = 0;
	invalidations.length = 0;
});

describe("admin user Orval integration", () => {
	test("preserves list params, key, prior-page behavior, and response data", async () => {
		const params = {
			search: "ada",
			status: "active" as const,
			page: 2,
			limit: 20,
		};
		const query = useAdminUsers(params) as QueryOptions;

		expect(query.queryKey).toEqual(["admin-users", "list", params]);
		expect(query.placeholderData).toBe(previousData);
		expect(await query.queryFn()).toBe(responses.list);
		expect(apiCalls).toEqual([{ method: "list", args: [params] }]);
	});

	test("preserves admin-user mutation payloads, response data, and invalidation", async () => {
		const create = useCreateAdminUser() as MutationOptions;
		const update = useUpdateAdminUser() as MutationOptions;
		const password = useSetAdminUserPassword() as MutationOptions;
		const deactivate = useDeactivateAdminUser() as MutationOptions;
		const reactivate = useReactivateAdminUser() as MutationOptions;
		const verification = useResendAdminUserVerification() as MutationOptions;

		const createInput = {
			name: "Ada Lovelace",
			email: "ada@example.com",
			password: "password1",
		};
		const updateInput = { name: "Ada Byron", email: "ada@example.com" };

		expect(await create.mutationFn(createInput)).toBe(responses.create);
		expect(await update.mutationFn({ id: "user-1", input: updateInput })).toBe(
			responses.update,
		);
		expect(await password.mutationFn({ id: "user-1", newPassword: "password2" })).toBe(
			responses.password,
		);
		expect(await deactivate.mutationFn("user-1")).toBe(responses.deactivate);
		expect(await reactivate.mutationFn("user-1")).toBe(responses.reactivate);
		expect(await verification.mutationFn("user-1")).toBe(
			responses.verification,
		);

		expect(apiCalls).toEqual([
			{ method: "create", args: [createInput] },
			{ method: "update", args: ["user-1", updateInput] },
			{ method: "password", args: ["user-1", { newPassword: "password2" }] },
			{ method: "deactivate", args: ["user-1"] },
			{ method: "reactivate", args: ["user-1"] },
			{ method: "verification", args: ["user-1"] },
		]);

		for (const mutation of [
			create,
			update,
			password,
			deactivate,
			reactivate,
			verification,
		]) {
			await mutation.onSuccess();
		}

		expect(invalidations).toEqual(
			Array.from({ length: 6 }, () => ({
				queryKey: ["admin-users", "list"],
			})),
		);
	});
});
