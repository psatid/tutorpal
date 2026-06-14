import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useStudent } from "@/hooks/queries/use-student";
import { StudentInfoHeader } from "@/components/students/student-info-header";
import { StudentClassList } from "@/components/students/student-class-list";
import {
  StudentDrawer,
  type DrawerMode,
} from "@/components/students/student-drawer";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentDetailScreenProps {
  studentId: string;
}

export function StudentDetailScreen({ studentId }: StudentDetailScreenProps) {
  const { t } = useTranslation(["students"]);
  const navigate = useNavigate();

  const { data: studentData, isLoading } = useStudent(studentId);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("edit");

  const handleBack = useCallback(() => {
    navigate({ to: "/students" });
  }, [navigate]);

  const handleEditStudent = useCallback(() => {
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  }, []);

  const handleViewClass = useCallback(
    (classId: string) => {
      navigate({ to: "/classes/$classId", params: { classId } });
    },
    [navigate],
  );

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <div className="bg-card border border-outline-variant rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <Skeleton className="flex-1 h-6 rounded" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-outline-variant"
            >
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-on-surface-variant">
          {t("students:studentDetail.notFound")}
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-4 text-sm text-primary font-medium hover:underline"
        >
          {t("students:studentDetail.backToStudents")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <StudentInfoHeader
        studentData={studentData}
        onBack={handleBack}
        onEdit={handleEditStudent}
      />

      <StudentClassList
        classes={studentData.classes}
        onViewClass={handleViewClass}
      />

      <StudentDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerMode}
        student={studentData}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
