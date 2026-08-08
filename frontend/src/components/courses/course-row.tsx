import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Course } from "@/models/course";
import { ChevronRight, Clock, Edit3, MoreVertical, Trash2 } from "lucide-react";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";

interface CourseRowProps {
  actionTriggerRef: Ref<HTMLButtonElement>;
  course: Course;
  onDelete: () => void;
  onEdit: () => void;
  onViewClasses: () => void;
}

export function CourseRow({
  actionTriggerRef,
  course,
  onDelete,
  onEdit,
  onViewClasses,
}: CourseRowProps) {
  const { t } = useTranslation(["courses"]);
  const data = course.getListItemData();

  return (
    <li className="scroll-mt-28 md:scroll-mt-32">
      <div className="flex min-h-20 items-center gap-3 rounded-xl border border-outline-variant bg-card p-4 transition-colors motion-reduce:transition-none hover:border-primary focus-within:border-primary">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{data.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {t("courses:defaultHours", {
              hours: data.formattedDefaultTotalHours,
            })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground sm:hidden">
            {t("courses:classCount", { count: data.classCount })}
          </p>
        </div>
        <Button
          className="hidden shrink-0 sm:inline-flex"
          onClick={onViewClasses}
          variant="ghost"
        >
          {t("courses:classCount", { count: data.classCount })}
          <ChevronRight data-icon="inline-end" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("courses:actionsFor", { name: data.name })}
                onKeyDown={(event) => {
                  if (
                    !event.defaultPrevented &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                ref={actionTriggerRef}
                size="icon"
                variant="ghost"
              />
            }
          >
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onViewClasses}>
                <ChevronRight />
                {t("courses:viewClasses", { count: data.classCount })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 />
                {t("courses:editCourse")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <Trash2 />
                {t("courses:deleteCourse")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
