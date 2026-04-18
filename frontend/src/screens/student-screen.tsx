import { useState, useMemo } from "react";
import { Plus, Search, Users, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/queries/use-students";
import { useDeleteStudent } from "@/hooks/mutations/use-delete-student";
import { StudentCard } from "@/components/students/student-card";
import {
  StudentDrawer,
  type DrawerMode,
} from "@/components/students/student-drawer";
import type { GetV1Students200Item } from "@/api/generated/models/getV1Students200Item";

export function StudentScreen() {
  const { t } = useTranslation(["students"]);
  const { data: students, isLoading } = useStudents();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedStudent, setSelectedStudent] =
    useState<GetV1Students200Item | null>(null);

  const deleteMutation = useDeleteStudent();

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.grade.toString().includes(query) ||
        (student.phoneNumber && student.phoneNumber.includes(query))
    );
  }, [students, searchQuery]);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleViewStudent = (student: GetV1Students200Item) => {
    setSelectedStudent(student);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

  const handleDeleteStudent = (student: GetV1Students200Item) => {
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
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
              {t("students:title")}
            </h2>
            {students && students.length > 0 && (
              <p className="font-body text-on-surface-variant mt-1">
                {t("students:managingCount", { count: students.length })}
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

      {/* Search */}
      {students && students.length > 0 && (
        <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("students:searchPlaceholder")}
            leftIcon={Search}
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
      ) : !students || students.length === 0 ? (
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
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-surface-variant mb-3" />
          <p className="text-on-surface-variant">{t("students:noResults")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onView={() => handleViewStudent(student)}
              onDelete={() => handleDeleteStudent(student)}
            />
          ))}
        </div>
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
