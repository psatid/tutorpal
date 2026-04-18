import { useState, useMemo } from "react";
import { Plus, Search, Users, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClasses } from "@/hooks/queries/use-classes";
import { useDeleteClass } from "@/hooks/mutations/use-delete-class";
import { ClassCard } from "@/components/classes/class-card";
import {
  ClassDrawer,
  type DrawerMode,
} from "@/components/classes/class-drawer";
import type { Class } from "@/types/class";

export function ClassesScreen() {
  const { t } = useTranslation(["classes"]);
  const { data: classes, isLoading } = useClasses();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const deleteMutation = useDeleteClass();

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (!searchQuery.trim()) return classes;

    const query = searchQuery.toLowerCase();
    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(query) ||
        cls.totalHours.toString().includes(query)
    );
  }, [classes, searchQuery]);

  const handleAddClass = () => {
    setSelectedClass(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleViewClass = (classData: Class) => {
    setSelectedClass(classData);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

  const handleDeleteClass = (classData: Class) => {
    toast(t("classes:delete.confirm"), {
      action: {
        label: t("classes:delete.confirmButton"),
        onClick: () => deleteMutation.mutate(classData.id),
      },
      cancel: {
        label: t("classes:delete.cancelButton"),
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
      setSelectedClass(null);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
              {t("classes:title")}
            </h2>
            {classes && classes.length > 0 && (
              <p className="font-body text-on-surface-variant mt-1">
                {t("classes:managingCount", { count: classes.length })}
              </p>
            )}
          </div>
          <Button
            size="icon"
            onClick={handleAddClass}
            aria-label={t("classes:addButton")}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      {classes && classes.length > 0 && (
        <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("classes:searchPlaceholder")}
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
            {t("classes:loading")}
          </p>
        </div>
      ) : !classes || classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
            {t("classes:noClasses")}
          </h3>
          <p className="font-body text-on-surface-variant max-w-xs mb-6">
            {t("classes:noClassesDescription")}
          </p>
          <Button onClick={handleAddClass} leftIcon={Plus}>
            {t("classes:addButton")}
          </Button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-surface-variant mb-3" />
          <p className="text-on-surface-variant">{t("classes:noResults")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClasses.map((classData) => (
            <ClassCard
              key={classData.id}
              classData={classData}
              onView={() => handleViewClass(classData)}
              onDelete={() => handleDeleteClass(classData)}
            />
          ))}
        </div>
      )}

      {/* Class Drawer */}
      <ClassDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerMode}
        classData={selectedClass}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
