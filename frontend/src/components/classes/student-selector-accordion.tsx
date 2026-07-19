import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Users, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudents } from "@/hooks/queries/use-students";

interface StudentSelectorAccordionProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function StudentSelectorAccordion({
  selectedIds,
  onChange,
}: StudentSelectorAccordionProps) {
  const { t } = useTranslation(["classes", "students"]);
  const { data: studentsData, isLoading } = useStudents();
  const students = studentsData?.students ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when accordion opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [isOpen]);

  // Sync local state when prop changes (when accordion is closed)
  useMemo(() => {
    if (!isOpen) {
      setLocalSelectedIds(selectedIds);
    }
  }, [selectedIds, isOpen]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.getName().toLowerCase().includes(query) ||
        student.getGrade().toString().includes(query)
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
    const allIds = filteredStudents.map((student) => student.getId());
    const allSelected = allIds.every((id) => localSelectedIds.includes(id));

    if (allSelected) {
      setLocalSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setLocalSelectedIds((prev) => {
        const newIds = allIds.filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  const handleToggleAccordion = () => {
    if (isOpen) {
      onChange(localSelectedIds);
      setSearchQuery("");
    } else {
      setLocalSelectedIds(selectedIds);
    }
    setIsOpen(!isOpen);
  };

  const selectedCount = localSelectedIds.length;
  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => localSelectedIds.includes(student.getId()));

  const displayCount = isOpen ? selectedCount : selectedIds.length;

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden">
      {/* Accordion Header / Trigger */}
      <button
        type="button"
        onClick={handleToggleAccordion}
        className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
            <Users className="w-5 h-5 text-on-secondary-container" />
          </div>
          <div className="text-left">
            <p className="font-medium text-on-surface">
              {displayCount > 0
                ? t("classes:form.students.selectedCount", {
                    count: displayCount,
                  })
                : t("classes:form.students.placeholder")}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Accordion Content */}
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 bg-surface border-t border-outline-variant space-y-4">
          {/* Selected count & Select All */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-on-surface-variant">
              {t("classes:selector.selectedCount", { count: selectedCount })}
            </span>
            <button
              type="button"
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
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("classes:selector.searchPlaceholder")}
            leftIcon={Search}
          />

          {/* Student List */}
          <div className="overflow-y-auto max-h-[300px] space-y-1">
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
              <div className="space-y-1">
                {filteredStudents.map((student) => {
                  const isSelected = localSelectedIds.includes(student.getId());
                  return (
                    <button
                      type="button"
                      key={student.getId()}
                      onClick={() => handleToggleStudent(student.getId())}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl transition-all
                        ${
                          isSelected
                            ? "bg-primary-container"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }
                      `}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleStudent(student.getId())}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-on-surface">
                          {student.getName()}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {t("students:grade", { grade: student.getGrade() })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Done Button */}
          <Button
            type="button"
            onClick={handleToggleAccordion}
            className="w-full"
          >
            {t("classes:selector.done", { count: selectedCount })}
          </Button>
        </div>
      </div>
    </div>
  );
}
