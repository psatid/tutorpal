import { useCallback, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface UseWorkspaceSearchControlsOptions<SortValue extends string> {
	defaultSort: SortValue;
	debounceMs?: number;
	additionalDirty?: boolean;
	onResetAdditional?: () => void;
}

export function useWorkspaceSearchControls<SortValue extends string>({
	defaultSort,
	debounceMs = 300,
	additionalDirty = false,
	onResetAdditional,
}: UseWorkspaceSearchControlsOptions<SortValue>) {
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortValue>(defaultSort);
	const debouncedSearch = useDebounce(search, debounceMs);

	const reset = useCallback(() => {
		setSearch("");
		setSort(defaultSort);
		onResetAdditional?.();
	}, [defaultSort, onResetAdditional]);

	return {
		search,
		debouncedSearch,
		setSearch,
		sort,
		setSort,
		isDirty: search !== "" || sort !== defaultSort || additionalDirty,
		reset,
	};
}
