import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface ClassScreenHeaderProps {
  onAddClass: () => void;
}

export function ClassScreenHeader({ onAddClass }: ClassScreenHeaderProps) {
  const { t } = useTranslation(["classes"]);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
          {t("classes:title")}
        </h2>
        <Button
          size="icon"
          onClick={onAddClass}
          aria-label={t("classes:addButton")}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
