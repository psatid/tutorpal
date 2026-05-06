import { useState, useMemo } from "react";
import { Check, X, Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudents } from "@/hooks/queries/use-students";

interface StudentSelectorDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function StudentSelectorDrawer({
  isOpen,
  onOpenChange,
  selectedIds,
  onChange,
}: StudentSelectorDrawerProps) {
  const { t } = useTranslation(["classes", "students"]);
  const { data: studentsData, isLoading } = useStudents();
  const students = studentsData?.data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.grade.toString().includes(query)
    );
  }, [students, searchQuery]);

  const handleToggleStudent = (studentId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (filteredStudents.length === 0) return;
    const allIds = filteredStudents.map((s) => s.id);
    const allSelected = allIds.every((id) => localSelectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all visible
      setLocalSelectedIds((prev) =>
        prev.filter((id) => !allIds.includes(id))
      );
    } else {
      // Select all visible
      setLocalSelectedIds((prev) => {
        const newIds = allIds.filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  const handleDone = () => {
    onChange(localSelectedIds);
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset local state to original when closing without saving
    setLocalSelectedIds(selectedIds);
    setSearchQuery("");
    onOpenChange(false);
  };

  const selectedCount = localSelectedIds.length;
  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => localSelectedIds.includes(s.id));

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup className="max-h-[85vh]">
            <DrawerContent>
              {/* Handle */}
              <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto my-4" />

              {/* Header */}
              <div className="px-6 pb-4 border-b border-outline-variant">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                    {t("classes:selector.title")}
                  </h2>
                  <DrawerClose className="p-2 rounded-full hover:bg-surface-variant transition-colors">
                    <X className="w-6 h-6 text-on-surface-variant" />
                  </DrawerClose>
                </div>

                {/* Selected count */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-on-surface-variant">
                    {t("classes:selector.selectedCount", { count: selectedCount })}
                  </span>
                  <button
                    onClick={handleSelectAll}
                    disabled={filteredStudents.length === 0}
                    className="text-sm font-medium text-primary hover:text-primary-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {allVisibleSelected
                      ? t("classes:selector.deselectAll")
                      : t("classes:selector.selectAll")}
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("classes:selector.searchPlaceholder")}
                    className="pl-10"
                    leftIcon={Search}
                  />
                </div>
              </div>

              {/* Student List */}
              <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="animate-pulse w-12 h-12 rounded-full bg-surface-variant" />
                    <div className="animate-pulse h-4 w-32 bg-surface-variant rounded" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-surface-variant mb-3" />
                    <p className="text-on-surface-variant">
                      {searchQuery
                        ? t("classes:selector.noResults")
                        : t("classes:selector.noStudents")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => {
                      const isSelected = localSelectedIds.includes(student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => handleToggleStudent(student.id)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl transition-all
                            ${
                              isSelected
                                ? "bg-primary-container"
                                : "bg-surface-container-low hover:bg-surface-container"
                            }
                          `}
                        >
                          {/* Checkbox */}
                          <div
                            className={`
                              w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                              ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-outline bg-surface"
                              }
                            `}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-on-primary" />
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-on-surface">
                              {student.name}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {t("students:grade", { grade: student.grade })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-outline-variant space-y-3">
                <Button
                  onClick={handleDone}
                  className="w-full"
                  leftIcon={Check}
                >
                  {t("classes:selector.done", { count: selectedCount })}
                </Button>
              </div>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
