import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { schedulesKeys } from "@/hooks/queries/query-keys";
import { apiClient } from "@/lib/api-client";

export type ClassDeleteErrorKind = "not-found" | "unknown";

export class ClassDeleteError extends Error {
	constructor(readonly kind: ClassDeleteErrorKind) {
		super("Class deletion failed");
		this.name = "ClassDeleteError";
	}
}

function classifyClassDeleteError(error: unknown): ClassDeleteError {
	if (isAxiosError(error) && error.response?.status === 404) {
		return new ClassDeleteError("not-found");
	}

	return new ClassDeleteError("unknown");
}

export function useDeleteClass(options?: {
	onSuccess?: (id: string) => void;
	onError?: (error: ClassDeleteError, id: string) => void;
}) {
	const queryClient = useQueryClient();

	const reconcileDeletion = async (id: string) => {
		queryClient.removeQueries({ queryKey: classesQueryKeys.detail(id) });
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() }),
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.infinites() }),
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
			queryClient.invalidateQueries({ queryKey: schedulesKeys.all }),
		]);
	};

	return useMutation<void, ClassDeleteError, string>({
		mutationFn: async (id) => {
			try {
				await apiClient.deleteV1ClassesById(id);
			} catch (error) {
				throw classifyClassDeleteError(error);
			}
		},
		onSuccess: async (_, id) => {
			await reconcileDeletion(id);
			if (options?.onSuccess) options.onSuccess(id);
			else toast.success("Class deleted successfully.");
		},
		onError: async (error, id) => {
			if (error.kind === "not-found") await reconcileDeletion(id);
			if (options?.onError) options.onError(error, id);
			else
				toast.error(
					error.kind === "not-found"
						? "This class is no longer available."
						: "Failed to delete class. Please try again.",
				);
		},
	});
}
