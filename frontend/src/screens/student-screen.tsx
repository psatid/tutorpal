import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInfiniteStudents } from "@/hooks/queries/use-infinite-students";
import { useDebounce } from "@/hooks/use-debounce";
import { StudentScreenHeader } from "@/components/students/student-screen-header";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentList } from "@/components/students/student-list";
import {
  StudentDrawer,
  type DrawerMode,
} from "@/components/students/student-drawer";
import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";
import type { GetV1StudentsParams } from "@/api/generated/models/getV1StudentsParams";

export function StudentScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] =
    useState<GetV1StudentsParams["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] =
    useState<GetV1StudentsParams["sortOrder"]>("desc");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedStudent, setSelectedStudent] =
    useState<GetV1Students200DataItem | null>(null);

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteStudents({
    search: debouncedSearchQuery || undefined,
    sortBy,
    sortOrder,
  });

  const students = infiniteData?.pages.flatMap((page) => page.data) || [];

  const handleSortChange = (
    newSortBy: GetV1StudentsParams["sortBy"],
    newSortOrder: GetV1StudentsParams["sortOrder"],
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleViewStudent = useCallback(
    (student: GetV1Students200DataItem) => {
      navigate({
        to: "/students/$studentId",
        params: { studentId: student.id },
      });
    },
    [navigate],
  );

  const handleModeChange = (mode: DrawerMode) => {
    setDrawerMode(mode);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setDrawerMode("create");
      setSelectedStudent(null);
    }
  };

  return (
    <div className="flex flex-col">
      <StudentScreenHeader onAddStudent={handleAddStudent} />

      <StudentToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <StudentList
        students={students}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        onAddStudent={handleAddStudent}
        onViewStudent={handleViewStudent}
      />

      <StudentDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerMode}
        student={selectedStudent}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
