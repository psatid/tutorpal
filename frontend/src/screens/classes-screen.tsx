import { useCallback, useMemo, useState, useRef } from "react";
import { useInfiniteClasses } from "@/hooks/queries/use-infinite-classes";
import { ClassDrawer } from "@/components/classes/class-drawer";
import { ClassScreenHeader } from "@/components/classes/class-screen-header";
import { ClassToolbar } from "@/components/classes/class-toolbar";
import { ClassList } from "@/components/classes/class-list";
import type { GetV1ClassesParams } from "@/api/generated/models/getV1ClassesParams";
import type { GetV1Classes200DataItem } from "@/api/generated/models/getV1Classes200DataItem";

export function ClassesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<GetV1ClassesParams["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<GetV1ClassesParams["sortOrder"]>("desc");

  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "view">("create");
  const [selectedClass, setSelectedClass] = useState<GetV1Classes200DataItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFilters = useMemo<GetV1ClassesParams>(
    () => ({
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    }),
    [searchQuery, sortBy, sortOrder],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteClasses(queryFilters);

  const classes = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const handleSearchQueryChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, []);

  const handleSortChange = useCallback(
    (
      newSortBy: GetV1ClassesParams["sortBy"],
      newSortOrder: GetV1ClassesParams["sortOrder"],
    ) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    [],
  );

  const handleAddClass = useCallback(() => {
    setSelectedClass(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  }, []);

  const handleViewClass = useCallback((classData: GetV1Classes200DataItem) => {
    setSelectedClass(classData);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ClassScreenHeader onAddClass={handleAddClass} />

      <ClassToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <div className="flex-1 overflow-y-auto">
        <ClassList
          classes={classes}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onAddClass={handleAddClass}
          onViewClass={handleViewClass}
        />
      </div>

      <ClassDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        mode={drawerMode}
        classData={selectedClass}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
