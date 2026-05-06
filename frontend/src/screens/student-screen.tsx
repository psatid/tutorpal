import { useState, useRef } from "react";
import { Plus, Search, UserPlus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectInput, type SelectInputOption } from "@/components/ui/select";
import { useInfiniteStudents } from "@/hooks/queries/use-infinite-students";
import { useDeleteStudent } from "@/hooks/mutations/use-delete-student";
import { useGenerateLineLink } from "@/hooks/mutations/use-generate-line-link";
import { useSendLineTestMessage } from "@/hooks/mutations/use-send-line-test-message";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { StudentCard } from "@/components/students/student-card";
import {
	StudentDrawer,
	type DrawerMode,
} from "@/components/students/student-drawer";
import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";
import type { GetV1StudentsParams } from "@/api/generated/models/getV1StudentsParams";
import { studentsKeys } from "@/hooks/queries/query-keys";

export function StudentScreen() {
	const { t } = useTranslation(["students"]);
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const [sortBy, setSortBy] =
		useState<GetV1StudentsParams["sortBy"]>("createdAt");
	const [sortOrder, setSortOrder] =
		useState<GetV1StudentsParams["sortOrder"]>("desc");
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
	const [selectedStudent, setSelectedStudent] =
		useState<	GetV1Students200DataItem | null>(null);

	const loadMoreRef = useRef<HTMLDivElement>(null);

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

	// Flatten all pages into a single list
	const students = infiniteData?.pages.flatMap((page) => page.data) || [];
	const totalStudents = infiniteData?.pages[0]?.pagination.total || 0;

	// Sort options
	const sortOptions: SelectInputOption<string>[] = [
		{ value: "createdAt-desc", label: t("students:sort.newest") },
		{ value: "createdAt-asc", label: t("students:sort.oldest") },
		{ value: "name-asc", label: t("students:sort.nameAsc") },
		{ value: "name-desc", label: t("students:sort.nameDesc") },
		{ value: "grade-asc", label: t("students:sort.gradeAsc") },
		{ value: "grade-desc", label: t("students:sort.gradeDesc") },
	];

	const deleteMutation = useDeleteStudent();
	const lineLinkMutation = useGenerateLineLink();
	const sendTestMessageMutation = useSendLineTestMessage();

	// Add intersection observer for automatic loading
	useIntersectionObserver(
		loadMoreRef,
		() => {
			if (hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		},
		{
			enabled: students.length > 0 && !isLoading,
			threshold: 0.1,
		},
	);

  const handleLinkLine = (student: 	GetV1Students200DataItem) => {
    if (student.lineUserId) {
      toast.info("This student already has a LINE account linked.");
      return;
    }
    toast(t("students:line.linkConfirm"), {
      action: {
        label: t("students:line.linkGenerate"),
        onClick: () => {
          lineLinkMutation.mutate(student.id, {
            onSuccess: (data) => {
              navigator.clipboard.writeText(data.linkUrl).then(() => {
                toast.success(t("students:line.linkCopied"));
              }).catch(() => {
                toast.info(`Link: ${data.linkUrl}`);
              });
            },
          });
        },
      },
      cancel: {
        label: t("students:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleSendTestMessage = (student: GetV1Students200DataItem) => {
    if (!student.lineUserId) {
      toast.info(t("students:line.notLinked"));
      return;
    }
    toast(t("students:line.testMessageConfirm"), {
      action: {
        label: t("students:line.testMessageSend"),
        onClick: () => {
          sendTestMessageMutation.mutate(student.id);
        },
      },
      cancel: {
        label: t("students:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleSortChange = (value: string | null) => {
		if (!value) return;
		const [newSortBy, newSortOrder] = value.split("-") as [
			GetV1StudentsParams["sortBy"],
			GetV1StudentsParams["sortOrder"],
		];
		setSortBy(newSortBy);
		setSortOrder(newSortOrder);
		// Invalidate query to restart from page 1 when sort changes
		queryClient.invalidateQueries({ queryKey: studentsKeys.infinite() });
	};

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleViewStudent = (student: 	GetV1Students200DataItem) => {
    setSelectedStudent(student);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

  const handleDeleteStudent = (student: 	GetV1Students200DataItem) => {
    toast(t("students:delete.confirm"), {
      action: {
        label: t("students:delete.confirmButton"),
        onClick: () => deleteMutation.mutate(student.id),
      },
      cancel: {
        label: t("students:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
              {t("students:title")}
            </h2>
            {totalStudents > 0 && (
              <p className="font-body text-on-surface-variant mt-1">
                {t("students:managingCount", { count: totalStudents })}
              </p>
            )}
          </div>
          <Button
            size="icon"
            onClick={handleAddStudent}
            aria-label={t("students:addStudent")}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search and Sort */}
      {totalStudents > 0 && (
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("students:searchPlaceholder")}
              leftIcon={Search}
            />
          </div>
          <SelectInput
            value={`${sortBy}-${sortOrder}`}
            onValueChange={handleSortChange}
            options={sortOptions}
            placeholder={t("students:sort.label")}
            className="flex-1"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="animate-pulse w-16 h-16 rounded-full bg-surface-variant" />
          <div className="animate-pulse h-4 w-40 bg-surface-variant rounded" />
          <p className="text-sm text-on-surface-variant">
            {t("students:loading")}
          </p>
        </div>
      ) : totalStudents === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
            <UserPlus className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
            {t("students:noStudents")}
          </h3>
          <p className="font-body text-on-surface-variant max-w-xs mb-6">
            {t("students:noStudentsDescription")}
          </p>
          <Button onClick={handleAddStudent} leftIcon={Plus}>
            {t("students:addStudent")}
          </Button>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserPlus className="w-12 h-12 text-surface-variant mb-3" />
          <p className="text-on-surface-variant">{t("students:noResults")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onView={() => handleViewStudent(student)}
                onDelete={() => handleDeleteStudent(student)}
                onLinkLine={() => handleLinkLine(student)}
                onSendTestMessage={() => handleSendTestMessage(student)}
              />
            ))}
          </div>

          {/* Load More Indicator */}
          <div ref={loadMoreRef}>
            {isFetchingNextPage && (
              <div className="flex justify-center items-center py-4 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
                <span className="text-sm text-on-surface-variant">
                  {t("students:loadingMore")}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Student Drawer */}
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
