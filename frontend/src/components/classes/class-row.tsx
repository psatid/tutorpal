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
import { cn } from "@/lib/utils";
import { Class } from "@/models/class";
import { ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

export function ClassRow({
  item,
  onDelete,
  onEdit,
  onOpen,
  actionTriggerRef,
}: {
  item: Class;
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
  actionTriggerRef: (node: HTMLButtonElement | null) => void;
}) {
  const { t } = useTranslation(["classes"]);
  const data = item.getListItemData();
  const isCourseLinked = data.courseName !== null;
  const isHoursExhausted =
    data.remainingHours !== undefined && data.remainingHours <= 0;
  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      !event.defaultPrevented &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <li className="scroll-mt-28 md:scroll-mt-32">
      <div className="flex min-h-20 items-center rounded-lg border border-border gap-3 bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface">
        <Button
          aria-label={t("classes:viewDetailsFor", { name: data.displayName })}
          className="group h-auto min-h-11 min-w-0 flex-1 justify-start gap-3 rounded-lg px-0 py-0 text-left hover:bg-transparent focus-visible:ring-offset-2"
          onClick={onOpen}
          onKeyDown={handleButtonKeyDown}
          variant="ghost"
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="max-w-full truncate font-semibold text-foreground">
                {data.displayName}
              </p>
              <Badge
                className={cn(
                  "whitespace-normal",
                  isCourseLinked
                    ? "border-primary-container bg-primary-container text-primary"
                    : "border-secondary-container bg-secondary-container text-secondary",
                )}
                variant="outline"
              >
                {data.courseName ?? t("classes:customClass")}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.studentNames.join(", ")}
            </p>
            <p
              className={cn(
                "mt-1 text-sm sm:hidden",
                isHoursExhausted ? "text-warning" : "text-muted-foreground",
              )}
            >
              {t("classes:hoursLeft", {
                hours: data.formattedRemainingHours ?? data.formattedTotalHours,
              })}
              <span aria-hidden="true"> · </span>
              {t("classes:hoursTotal", { hours: data.formattedTotalHours })}
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p
              className={cn(
                "font-medium tabular-nums",
                isHoursExhausted && "text-warning",
              )}
            >
              {t("classes:hoursLeft", {
                hours: data.formattedRemainingHours ?? data.formattedTotalHours,
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("classes:hoursTotal", { hours: data.formattedTotalHours })}
            </p>
          </div>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("classes:actionsFor", { name: data.displayName })}
                onKeyDown={handleButtonKeyDown}
                ref={actionTriggerRef}
                size="icon"
                type="button"
                variant="ghost"
              />
            }
          >
            <MoreVertical aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onOpen}>
                <ChevronRight />
                {t("classes:view")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                {t("classes:editClass")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <Trash2 />
                {t("classes:delete.deleteClass")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
