import { StudentDrawer, type DrawerMode } from "@/components/students/student-drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStudents } from "@/hooks/queries/use-students";
import { useDeleteStudent } from "@/hooks/mutations/use-delete-student";
import type { Student } from "@/types/student";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function EditorialHeader({ count }: { count: number }) {
  const { t } = useTranslation(["students"]);
  
  return (
    <section className="mb-8">
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight">
        {t("students:title")}
      </h2>
      <p className="font-body text-on-surface-variant mt-2 text-lg">
        {t("students:managingCount", { count })}
      </p>
    </section>
  );
}

function SearchInput() {
  const { t } = useTranslation(["students"]);
  
  return (
    <div className="relative mb-10">
      <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
      <input
        type="text"
        placeholder={t("students:searchPlaceholder")}
        className="w-full pl-8 pr-4 py-3 bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all font-body text-on-surface placeholder-outline text-lg outline-none"
      />
    </div>
  );
}

interface StudentCardProps {
  student: Student;
  onClick: () => void;
  onDelete: () => void;
}

function StudentCard({ student, onClick, onDelete }: StudentCardProps) {
  const { t } = useTranslation(["students"]);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div 
      className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex gap-5 items-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] relative"
      onClick={onClick}
    >
      <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-headline font-bold text-2xl">
        {getInitials(student.name)}
      </div>
      <div className="flex-1">
        <h3 className="font-headline font-bold text-xl text-on-surface leading-none">
          {student.name}
        </h3>
        <p className="font-body text-primary text-sm font-semibold mt-1">
          {t("students:grade", { grade: student.grade })}
        </p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-surface-container-high transition-colors outline-none"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <MoreVertical className="w-5 h-5 text-on-surface-variant" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={handleDeleteClick}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AddStudentFAB({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="gradient"
      size="icon"
      onClick={onClick}
      leftIcon={Plus}
      className="fixed bottom-28 right-6 z-40"
    />
  );
}

export function StudentScreen() {
  const { t } = useTranslation(["students"]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const { data: students, isLoading } = useStudents();
  const deleteMutation = useDeleteStudent();

  const handleCreateClick = () => {
    setDrawerMode("create");
    setSelectedStudentId(null);
    setIsDrawerOpen(true);
  };

  const handleStudentClick = (studentId: string) => {
    setDrawerMode("view");
    setSelectedStudentId(studentId);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setTimeout(() => {
        setSelectedStudentId(null);
        setDrawerMode("create");
      }, 300);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id, {
        onSuccess: () => {
          setIsConfirmOpen(false);
          setStudentToDelete(null);
        },
      });
    }
  };

  return (
    <div>
      <EditorialHeader count={students?.length ?? 0} />
      <SearchInput />
      {isLoading ? (
        <div className="text-center py-8 text-on-surface-variant">
          {t("students:loading")}
        </div>
      ) : (
        <div className="space-y-6">
          {students?.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => handleStudentClick(student.id)}
              onDelete={() => handleDeleteClick(student)}
            />
          ))}
        </div>
      )}
      <AddStudentFAB onClick={handleCreateClick} />
      <StudentDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerClose}
        mode={drawerMode}
        studentId={selectedStudentId}
        onModeChange={setDrawerMode}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Delete Student"
        description={studentToDelete
          ? `Are you sure you want to delete "${studentToDelete.name}"? This action cannot be undone.`
          : "Are you sure you want to delete this student? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
