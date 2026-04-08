import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AddClassDrawer } from "@/components/classes/add-class-drawer";
import { ClassCard } from "@/components/classes/class-card";
import { useClasses } from "@/hooks/queries/use-classes";

export function ClassesScreen() {
  const { t } = useTranslation(["classes"]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: classes, isLoading, error } = useClasses();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-pulse w-20 h-20 rounded-2xl bg-surface-variant mb-6" />
        <div className="animate-pulse h-8 w-48 bg-surface-variant rounded mb-2" />
        <div className="animate-pulse h-4 w-64 bg-surface-variant rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <div className="w-20 h-20 rounded-2xl bg-error-container flex items-center justify-center mb-6">
          <GraduationCap className="w-10 h-10 text-on-error-container" />
        </div>
        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-2">
          {t("classes:error.title")}
        </h2>
        <p className="text-on-surface-variant text-center mb-4">
          {error.message}
        </p>
        <Button onClick={() => window.location.reload()}>
          {t("classes:error.retry")}
        </Button>
      </div>
    );
  }

  const hasClasses = classes && classes.length > 0;

  return (
    <div className="flex flex-col min-h-[50vh]">
      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
          <GraduationCap className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
          {t("classes:title")}
        </h2>
        <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
          {t("classes:description", { count: classes?.length ?? 0 })}
        </p>
      </div>

      {/* Classes List or Empty State */}
      {hasClasses ? (
        <div className="w-full max-w-sm mx-auto space-y-4">
          {classes.map((classData) => (
            <ClassCard key={classData.id} classData={classData} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <p className="text-on-surface-variant text-center mb-6">
            {t("classes:empty.description")}
          </p>
          <Button
            onClick={() => setIsDrawerOpen(true)}
            leftIcon={Plus}
          >
            {t("classes:empty.createButton")}
          </Button>
        </div>
      )}

      {/* FAB - Only show when there are classes */}
      {hasClasses && (
        <div className="fixed bottom-24 right-4 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            leftIcon={Plus}
            onClick={() => setIsDrawerOpen(true)}
          >
            {t("classes:addButton")}
          </Button>
        </div>
      )}

      {/* Add Class Drawer */}
      <AddClassDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  );
}
