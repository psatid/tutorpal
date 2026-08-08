import { Plus, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LineLinkModal } from "@/components/students/line-link-modal";
import { StudentRow } from "@/components/students/student-row";
import { Button } from "@/components/ui/button";
import {
	WorkspaceEmptyState,
	WorkspaceErrorState,
	WorkspaceListSkeleton,
} from "@/components/workspaces/workspace-state";
import { useDeleteStudent } from "@/hooks/mutations/use-delete-student";
import { useGenerateLineLink } from "@/hooks/mutations/use-generate-line-link";
import { useSendLineTestMessage } from "@/hooks/mutations/use-send-line-test-message";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useLineConnection } from "@/hooks/queries/use-line-connection";
import { Student } from "@/models/student";

interface StudentListProps {
	students: Student[];
	isLoading: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => void;
	onAddStudent: (trigger: HTMLButtonElement | null) => void;
	onViewStudent: (student: Student) => void;
	isError: boolean;
	onRetry: () => void;
	hasSearch: boolean;
}

export function StudentList({
	students,
	isLoading,
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	onAddStudent,
	onViewStudent,
	isError,
	onRetry,
	hasSearch,
}: StudentListProps) {
	const { t } = useTranslation(["students"]);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const emptyActionRef = useRef<HTMLButtonElement>(null);

	const deleteMutation = useDeleteStudent();
	const lineLinkMutation = useGenerateLineLink();
	const sendTestMessageMutation = useSendLineTestMessage();
	const lineConnection = useLineConnection();
	const lineConnectionAvailability = lineConnection.data?.configured
		? "configured"
		: lineConnection.isLoading
			? "checking"
			: "unavailable";

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

	const handleLinkLine = (student: Student) => {
		if (student.isLineLinked()) {
			toast.info(t("students:line.alreadyLinked"));
			return;
		}

		const confirmToastId = toast(t("students:line.linkConfirm"), {
			action: {
				label: t("students:line.linkGenerate"),
				onClick: () => {
					toast.dismiss(confirmToastId);

					const loadingToastId = toast.loading(t("students:line.generating"));

					lineLinkMutation.mutate(student.getId(), {
						onSuccess: (data) => {
							toast.dismiss(loadingToastId);
							setGeneratedLinkUrl(data.linkUrl);
						setLinkStudentName(student.getName());
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

	const handleSendTestMessage = (student: Student) => {
		if (!student.isLineLinked()) {
			toast.info(t("students:line.notLinked"));
			return;
		}
		toast(t("students:line.testMessageConfirm"), {
			action: {
				label: t("students:line.testMessageSend"),
					onClick: () => {
						sendTestMessageMutation.mutate(student.getId());
				},
			},
			cancel: {
				label: t("students:delete.cancelButton"),
				onClick: () => {},
			},
		});
	};

	const handleDeleteStudent = (student: Student) => {
		toast(t("students:delete.confirm"), {
			action: {
				label: t("students:delete.confirmButton"),
				onClick: () => deleteMutation.mutate(student.getId()),
			},
			cancel: {
				label: t("students:delete.cancelButton"),
				onClick: () => {},
			},
		});
	};

	if (isLoading) {
		return <WorkspaceListSkeleton rows={5} />;
	}

	if (isError) {
		return (
			<WorkspaceErrorState
				description={t("students:loadError.description")}
				onRetry={onRetry}
				title={t("students:loadError.title")}
			/>
		);
	}

	if (students.length === 0) {
		return (
			<WorkspaceEmptyState
				action={
					!hasSearch ? (
						<Button
							onClick={() => onAddStudent(emptyActionRef.current)}
							ref={emptyActionRef}
						>
							<Plus data-icon="inline-start" />
							{t("students:createStudent")}
						</Button>
					) : undefined
				}
				description={
					hasSearch
						? t("students:noResultsDescription")
						: t("students:noStudentsDescription")
				}
				icon={<UserPlus />}
				title={hasSearch ? t("students:noResults") : t("students:noStudents")}
			/>
		);
	}

	return (
		<>
			<ul className="space-y-3">
				{students.map((student) => (
					<StudentRow
						key={student.getId()}
						onDelete={() => handleDeleteStudent(student)}
						lineConnectionAvailability={lineConnectionAvailability}
						onLinkLine={() => handleLinkLine(student)}
						onSendTestMessage={() => handleSendTestMessage(student)}
						onView={() => onViewStudent(student)}
						student={student}
					/>
				))}
			</ul>

			{/* Load More Indicator */}
			<div ref={loadMoreRef}>
				{isFetchingNextPage && (
					<p className="py-4 text-center text-sm text-muted-foreground">
						{t("students:loadingMore")}
					</p>
				)}
			</div>

			<LineLinkModal
				isOpen={lineLinkModalOpen}
				linkUrl={generatedLinkUrl}
				onOpenChange={setLineLinkModalOpen}
				studentName={linkStudentName}
			/>
		</>
	);
}
