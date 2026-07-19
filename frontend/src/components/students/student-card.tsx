import { Trash2, Phone, Eye, MoreVertical, Link2, CheckCircle2, MessageSquare, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InfoCard } from "@/components/ui/info-card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Student } from "@/models/student";

interface StudentCardProps {
  student: Student;
  onView: () => void;
  onDelete: () => void;
  onLinkLine: () => void;
  onSendTestMessage: () => void;
}

export function StudentCard({ student, onView, onDelete, onLinkLine, onSendTestMessage }: StudentCardProps) {
  const { t } = useTranslation(["students"]);
  const data = student.getListItemData();
  const isLineLinked = data.isLineLinked;
  const needsLineRelink = data.needsLineRelink;

  return (
    <InfoCard onClick={onView}>
      <Avatar size="lg">
        <AvatarFallback className="bg-primary text-white font-semibold">
          {data.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-on-surface truncate">{data.name}</p>
          <Badge variant="outline" className="shrink-0">
            {t("students:grade", { grade: data.grade })}
          </Badge>
          {isLineLinked && (
            <Badge variant="outline" className="shrink-0 gap-1 text-green-600 border-green-600/30">
              <CheckCircle2 className="w-3 h-3" />
              LINE
            </Badge>
          )}
          {needsLineRelink && (
            <Badge variant="outline" className="shrink-0 gap-1 border-amber-500/30 text-amber-700">
              <TriangleAlert className="w-3 h-3" />
              {t("students:line.needsRelink")}
            </Badge>
          )}
        </div>
        {data.phoneNumber && (
          <span className="flex items-center gap-1 text-sm text-on-surface-variant mt-0.5">
            <Phone className="w-3 h-3" />
            {data.phoneNumber}
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="w-4 h-4 text-on-surface-variant" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="w-4 h-4" />
            {t("students:view")}
          </DropdownMenuItem>
          {!isLineLinked && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLinkLine(); }}>
              <Link2 className="w-4 h-4" />
              {t(needsLineRelink ? "students:line.relinkLabel" : "students:line.linkLabel")}
            </DropdownMenuItem>
          )}
          {isLineLinked && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendTestMessage(); }}>
              <MessageSquare className="w-4 h-4" />
              {t("students:line.testMessage")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
            {t("students:delete.confirmButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </InfoCard>
  );
}
