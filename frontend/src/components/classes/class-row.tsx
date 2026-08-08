import { ChevronRight, MoreVertical, Trash2, Users } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
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
import { Class } from "@/models/class";

export function ClassRow({
  item,
  onDelete,
  onOpen,
  actionTriggerRef,
}: {
  item: Class;
  onDelete: () => void;
  onOpen: () => void;
  actionTriggerRef: (node: HTMLButtonElement | null) => void;
}) {
  const { t } = useTranslation(["classes"]);
  const data = item.getListItemData();
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
    <div className="flex min-h-20 items-center gap-2 border-b border-border py-4 last:border-0">
      <Button
        aria-label={t("classes:viewDetailsFor", { name: data.displayName })}
        className="group h-auto min-h-11 min-w-0 flex-1 justify-start gap-3 rounded-lg px-0 py-0 text-left hover:bg-transparent focus-visible:ring-offset-2"
        onClick={onOpen}
        onKeyDown={handleButtonKeyDown}
        variant="ghost"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="max-w-full truncate font-semibold text-foreground">
              {data.displayName}
            </p>
            <Badge className="max-w-full truncate" variant="outline">
              {data.courseName ?? t("classes:customClass")}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {data.studentNames.join(", ")}
          </p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="font-medium tabular-nums">
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
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2 />
              {t("classes:delete.deleteClass")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
