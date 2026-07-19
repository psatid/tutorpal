import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Phone, CheckCircle2, TriangleAlert } from "lucide-react";
import { Student } from "@/models/student";

interface StudentInfoHeaderProps {
  studentData: Student;
  onBack: () => void;
  onEdit: () => void;
}

export function StudentInfoHeader({
  studentData,
  onBack,
  onEdit,
}: StudentInfoHeaderProps) {
  const { t } = useTranslation(["students"]);
  const data = studentData.getDetailsHeaderData();

  return (
    <div className="bg-card border border-outline-variant rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={t("students:studentDetail.back")}
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>

        <Avatar size="lg">
          <AvatarFallback className="bg-primary text-white font-semibold">
            {data.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="font-headline font-bold text-xl text-on-surface truncate">
            {data.name}
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          aria-label={t("students:studentDetail.editStudent")}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          {t("students:grade", { grade: data.grade })}
        </Badge>

        {data.phoneNumber && (
          <Badge variant="outline" className="gap-1">
            <Phone className="w-3 h-3" />
            {data.phoneNumber}
          </Badge>
        )}

        {data.isLineLinked && (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30">
            <CheckCircle2 className="w-3 h-3" />
            LINE
          </Badge>
        )}
        {data.needsLineRelink && (
          <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-700">
            <TriangleAlert className="w-3 h-3" />
            {t("students:line.needsRelink")}
          </Badge>
        )}
      </div>
    </div>
  );
}
