import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DashboardScreen() {
  const { t } = useTranslation(["dashboard"]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
        <LayoutDashboard className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
        {t("dashboard:title")}
      </h2>
      <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
        {t("dashboard:description")}
      </p>

      <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col items-center">
          <span className="font-headline font-bold text-3xl text-primary">24</span>
          <span className="font-label text-sm text-on-surface-variant mt-1">
            {t("dashboard:stats.activeStudents")}
          </span>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col items-center">
          <span className="font-headline font-bold text-3xl text-primary">8</span>
          <span className="font-label text-sm text-on-surface-variant mt-1">
            {t("dashboard:stats.classesToday")}
          </span>
        </div>
      </div>
    </div>
  );
}
