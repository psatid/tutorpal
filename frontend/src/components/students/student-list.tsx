import { useRef, useState } from "react";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteStudent } from "@/hooks/mutations/use-delete-student";
import { useGenerateLineLink } from "@/hooks/mutations/use-generate-line-link";
import { useSendLineTestMessage } from "@/hooks/mutations/use-send-line-test-message";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { StudentCard } from "@/components/students/student-card";
import { LineLinkModal } from "@/components/students/line-link-modal";
import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";

interface StudentListProps {
  students: GetV1Students200DataItem[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onAddStudent: () => void;
  onViewStudent: (student: GetV1Students200DataItem) => void;
}

export function StudentList({
  students,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onAddStudent,
  onViewStudent,
}: StudentListProps) {
  const { t } = useTranslation(["students"]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const deleteMutation = useDeleteStudent();
  const lineLinkMutation = useGenerateLineLink();
  const sendTestMessageMutation = useSendLineTestMessage();

  const [lineLinkModalOpen, setLineLinkModalOpen] = useState(false);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState("");
  const [linkStudentName, setLinkStudentName] = useState("");

  useIntersectionObserver(
    loadMoreRef,
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    {
      enabled: students.length > 0 && !isLoading,
      threshold: 0.1,
    },
  );

  const handleLinkLine = (student: GetV1Students200DataItem) => {
    if (student.lineUserId) {
      toast.info(t("students:line.alreadyLinked"));
      return;
    }

    const confirmToastId = toast(t("students:line.linkConfirm"), {
      action: {
        label: t("students:line.linkGenerate"),
        onClick: () => {
          toast.dismiss(confirmToastId);

          const loadingToastId = toast.loading(t("students:line.generating"));

          lineLinkMutation.mutate(student.id, {
            onSuccess: (data) => {
              toast.dismiss(loadingToastId);
              setGeneratedLinkUrl(data.linkUrl);
              setLinkStudentName(student.name);
              setLineLinkModalOpen(true);
            },
            onError: (error) => {
              toast.dismiss(loadingToastId);
              toast.error(
                error.message ||
                  "Failed to generate LINE link. Please try again.",
              );
            },
          });
        },
      },
      cancel: {
        label: t("students:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleSendTestMessage = (student: GetV1Students200DataItem) => {
    if (!student.lineUserId) {
      toast.info(t("students:line.notLinked"));
      return;
    }
    toast(t("students:line.testMessageConfirm"), {
      action: {
        label: t("students:line.testMessageSend"),
        onClick: () => {
          sendTestMessageMutation.mutate(student.id);
        },
      },
      cancel: {
        label: t("students:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleDeleteStudent = (student: GetV1Students200DataItem) => {
    toast(t("students:delete.confirm"), {
      action: {
        label: t("students:delete.confirmButton"),
        onClick: () => deleteMutation.mutate(student.id),
      },
      cancel: {
        label: t("students:delete.cancelButton"),
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
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-outline-variant"
          >
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
          <UserPlus className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
          {t("students:noStudents")}
        </h3>
        <p className="font-body text-on-surface-variant max-w-xs mb-6">
          {t("students:noStudentsDescription")}
        </p>
        <Button onClick={onAddStudent} leftIcon={Plus}>
          {t("students:addStudent")}
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
        {students.map((student) => (
          <motion.div
            key={student.id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <StudentCard
              student={student}
              onView={() => onViewStudent(student)}
              onDelete={() => handleDeleteStudent(student)}
              onLinkLine={() => handleLinkLine(student)}
              onSendTestMessage={() => handleSendTestMessage(student)}
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
              {t("students:loadingMore")}
            </span>
          </div>
        )}
      </div>

      <LineLinkModal
        isOpen={lineLinkModalOpen}
        onOpenChange={setLineLinkModalOpen}
        linkUrl={generatedLinkUrl}
        studentName={linkStudentName}
      />
    </>
  );
}
