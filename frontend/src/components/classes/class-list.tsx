import { useRef } from "react";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteClass } from "@/hooks/mutations/use-delete-class";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { ClassCard } from "@/components/classes/class-card";
import type { GetV1Classes200DataItem } from "@/api/generated/models/getV1Classes200DataItem";

interface ClassListProps {
  classes: GetV1Classes200DataItem[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onAddClass: () => void;
  onViewClass: (classData: GetV1Classes200DataItem) => void;
}

export function ClassList({
  classes,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onAddClass,
  onViewClass,
}: ClassListProps) {
  const { t } = useTranslation(["classes"]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const deleteMutation = useDeleteClass();

  useIntersectionObserver(
    loadMoreRef,
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    {
      enabled: classes.length > 0 && !isLoading,
      threshold: 0.1,
    },
  );

  const handleDeleteClass = (classData: GetV1Classes200DataItem) => {
    toast(t("classes:delete.confirm"), {
      action: {
        label: t("classes:delete.confirmButton"),
        onClick: () => deleteMutation.mutate(classData.id),
      },
      cancel: {
        label: t("classes:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-full flex items-start gap-4 p-4 rounded-xl bg-card border border-outline-variant"
          >
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
          <UserPlus className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
          {t("classes:noClasses")}
        </h3>
        <p className="font-body text-on-surface-variant max-w-xs mb-6">
          {t("classes:noClassesDescription")}
        </p>
        <Button onClick={onAddClass} leftIcon={Plus}>
          {t("classes:addButton")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="space-y-2"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03 },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {classes.map((classData) => (
          <motion.div
            key={classData.id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <ClassCard
              classData={classData}
              onView={() => onViewClass(classData)}
              onDelete={() => handleDeleteClass(classData)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Indicator */}
      <div ref={loadMoreRef}>
        {isFetchingNextPage && (
          <div className="flex justify-center items-center py-4 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
            <span className="text-sm text-on-surface-variant">
              {t("classes:loadingMore")}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
