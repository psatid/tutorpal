import { useTranslation } from "react-i18next";
import type { Course } from "@/models/course";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CourseDeleteDialogProps {
	course: Course | null;
	error: "unknown" | null;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function CourseDeleteDialog({
	course,
	error,
	isPending,
	onClose,
	onConfirm,
}: CourseDeleteDialogProps) {
	const { t } = useTranslation(["courses"]);

	return (
		<AlertDialog
			onOpenChange={(open, eventDetails) => {
				if (!open && isPending) {
					eventDetails.preventUnmountOnClose();
					return;
				}
				if (!open) onClose();
			}}
			open={Boolean(course)}
		>
			<AlertDialogContent aria-busy={isPending}>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("courses:deleteTitle", { name: course?.getName() })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("courses:deleteDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{error === "unknown" ? (
					<p
						className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
						role="alert"
					>
						{t("courses:deleteError.unknown")}
					</p>
				) : null}
				{isPending ? (
					<p className="text-sm text-muted-foreground" role="status">
						{t("courses:deletingCourse")}
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending} onClick={onClose}>
						{t("courses:cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						aria-label={
							isPending
								? t("courses:deletingCourse")
								: error === "unknown"
									? t("courses:tryAgain")
									: t("courses:deleteCourse")
						}
						loading={isPending}
						onClick={onConfirm}
						variant="destructive"
					>
						{isPending
							? t("courses:deletingCourse")
							: error === "unknown"
								? t("courses:tryAgain")
								: t("courses:deleteCourse")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
