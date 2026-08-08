import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Student } from "@/models/student";
import {
  CheckCircle2,
  Eye,
  Link2,
  MessageSquare,
  MoreVertical,
  Phone,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface StudentRowProps {
  student: Student;
  onView: () => void;
  onDelete: () => void;
  onLinkLine: () => void;
  onSendTestMessage: () => void;
  lineConnectionAvailability: "configured" | "checking" | "unavailable";
}

export function StudentRow({
  student,
  onView,
  onDelete,
  onLinkLine,
  onSendTestMessage,
  lineConnectionAvailability,
}: StudentRowProps) {
  const { t } = useTranslation(["students"]);
  const data = student.getListItemData();
  const linked = data.isLineLinked;
  const needsRelink = data.needsLineRelink;

  return (
    <li className="group scroll-mt-28 md:scroll-mt-32">
      <div className="flex min-h-20 items-center rounded-xl border border-border gap-3 bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-[#f6f9fc] focus-within:bg-[#f6f9fc]">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
          onClick={onView}
          type="button"
        >
          <Avatar size="lg">
            <AvatarFallback className="bg-primary-container font-semibold text-primary">
              {data.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">
                {data.name}
              </p>
              <Badge variant="outline">
                {t("students:grade", { grade: data.grade })}
              </Badge>
              {linked ? (
                <Badge variant="success">
                  <CheckCircle2 />
                  LINE
                </Badge>
              ) : null}
              {needsRelink ? (
                <Badge variant="warning">
                  <TriangleAlert />
                  {t("students:line.needsRelink")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-4" />
              {data.phoneNumber ?? t("students:noPhone")}
            </p>
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("students:actionsFor", { name: data.name })}
                size="icon"
                variant="ghost"
              />
            }
          >
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onView}>
                <Eye />
                {t("students:view")}
              </DropdownMenuItem>
              {!linked ? (
                <DropdownMenuItem
                  disabled={lineConnectionAvailability !== "configured"}
                  onClick={
                    lineConnectionAvailability === "configured"
                      ? onLinkLine
                      : undefined
                  }
                >
                  <Link2 />
                  {t(
                    needsRelink
                      ? "students:line.relinkLabel"
                      : "students:line.linkLabel",
                  )}
                </DropdownMenuItem>
              ) : null}
              {linked ? (
                <DropdownMenuItem onClick={onSendTestMessage}>
                  <MessageSquare />
                  {t("students:line.testMessage")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <Trash2 />
                {t("students:delete.confirmButton")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
