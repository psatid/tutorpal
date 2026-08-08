import { ChevronRight } from "lucide-react";
import type { Ref } from "react";
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
import { Button } from "@/components/ui/button";

export type CourseDeleteDialogState =
	| "confirm"
	| "checking"
	| "blocked"
	| "revalidation-error";

interface CourseDeleteDialogProps {
	classCount: number | null;
	conflictActionRef: Ref<HTMLButtonElement>;
	course: Course | null;
	error: "unknown" | null;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
	onRetry: () => void;
	onViewClasses: () => void;
	revalidationErrorActionRef: Ref<HTMLButtonElement>;
	state: CourseDeleteDialogState;
}

export function CourseDeleteDialog({
	classCount,
	conflictActionRef,
	course,
	error,
	isPending,
	onClose,
	onConfirm,
	onRetry,
	onViewClasses,
	revalidationErrorActionRef,
	state,
}: CourseDeleteDialogProps) {
	const { t } = useTranslation(["courses"]);

	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			open={Boolean(course)}
		>
			<AlertDialogContent aria-busy={isPending || state === "checking"}>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{state === "confirm"
							? t("courses:deleteTitle", { name: course?.getName() })
							: state === "checking"
								? t("courses:checkingCourseTitle", {
										name: course?.getName(),
									})
								: state === "revalidation-error"
									? t("courses:revalidationErrorTitle", {
											name: course?.getName(),
										})
									: t("courses:deleteBlockedTitle", {
											name: course?.getName(),
										})}
					</AlertDialogTitle>
					<AlertDialogDescription
						aria-live={
							state === "blocked" || state === "revalidation-error"
								? "assertive"
								: undefined
						}
						role={
							state === "blocked" || state === "revalidation-error"
								? "alert"
								: undefined
						}
					>
						{state === "checking"
							? t("courses:checkingCourseClasses")
							: state === "blocked"
								? t("courses:deleteBlockedDescription", {
											count: classCount ?? 1,
										})
								: state === "revalidation-error"
									? t("courses:revalidationErrorDescription")
									: t("courses:deleteDescription")}
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
					<AlertDialogCancel
						disabled={isPending}
						onClick={onClose}
						onKeyDown={(event) => {
							if (
								!event.defaultPrevented &&
								(event.key === "Enter" || event.key === " ")
							) {
								event.preventDefault();
								event.currentTarget.click();
							}
						}}
					>
						{state === "confirm"
							? t("courses:cancel")
							: t("courses:close")}
					</AlertDialogCancel>
					{state === "blocked" ? (
						<Button
							className="w-full sm:w-fit"
							onClick={onViewClasses}
							onKeyDown={(event) => {
								if (
									!event.defaultPrevented &&
									(event.key === "Enter" || event.key === " ")
								) {
									event.preventDefault();
									event.currentTarget.click();
								}
							}}
							ref={conflictActionRef}
							variant="outline"
						>
							{t("courses:viewClassesAction")}
							<ChevronRight data-icon="inline-end" />
						</Button>
					) : null}
					{state === "revalidation-error" ? (
						<Button
							onClick={onRetry}
							onKeyDown={(event) => {
								if (
									!event.defaultPrevented &&
									(event.key === "Enter" || event.key === " ")
								) {
									event.preventDefault();
									event.currentTarget.click();
								}
							}}
							ref={revalidationErrorActionRef}
							variant="outline"
						>
							{t("courses:tryAgain")}
						</Button>
					) : null}
					{state === "confirm" ? (
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
							onKeyDown={(event) => {
								if (
									!event.defaultPrevented &&
									(event.key === "Enter" || event.key === " ")
								) {
									event.preventDefault();
									event.currentTarget.click();
								}
							}}
							variant="destructive"
						>
							{isPending
								? t("courses:deletingCourse")
								: error === "unknown"
									? t("courses:tryAgain")
									: t("courses:deleteCourse")}
						</AlertDialogAction>
					) : null}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
