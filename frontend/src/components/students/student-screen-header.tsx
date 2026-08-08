import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface StudentScreenHeaderProps {
  onAddStudent: () => void;
}

export function StudentScreenHeader({
  onAddStudent,
}: StudentScreenHeaderProps) {
  const { t } = useTranslation(["students"]);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <h2 className="font-headline text-3xl font-normal tracking-[-0.02em] text-on-surface leading-tight">
          {t("students:title")}
        </h2>
        <Button
          size="icon"
          onClick={onAddStudent}
          aria-label={t("students:addStudent")}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
