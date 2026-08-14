import { ArrowLeft, Pencil } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { CourseFormDrawer } from "@/components/courses/course-form-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_ROUTES } from "@/constants/routes";
import { useCourseDetails } from "@/hooks/queries/use-course-details";

interface CourseDetailScreenProps {
	courseId: string;
}

function isCourseNotFoundError(error: unknown): boolean {
	if (!isAxiosError(error)) return false;

	const payload = error.response?.data as { errorCode?: string } | undefined;
	return (
		payload?.errorCode === "COURSE_NOT_FOUND" || error.response?.status === 404
	);
}

export function CourseDetailScreen({ courseId }: CourseDetailScreenProps) {
	const { t } = useTranslation(["courses", "classes", "common"]);
	const navigate = useNavigate();
	const editOriginRef = useRef<HTMLButtonElement | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const {
		data: course,
		error: courseError,
		isError,
		isLoading,
		refetch,
	} = useCourseDetails(courseId);
	const isNotFound = isCourseNotFoundError(courseError);

	const handleBack = useCallback(() => {
		navigate({ to: APP_ROUTES.COURSES });
	}, [navigate]);

	const handleEdit = useCallback(() => {
		const activeElement = document.activeElement;
		editOriginRef.current =
			activeElement instanceof HTMLButtonElement ? activeElement : null;
		setIsFormOpen(true);
	}, []);

	const focusEditOrigin = useCallback(() => {
		editOriginRef.current?.focus();
	}, []);

	if (isLoading && !course) {
		return <CourseDetailSkeleton />;
	}

	if (isNotFound || (!course && !isError)) {
		return (
			<div className="flex h-full flex-col items-center justify-center py-8 text-center">
				<p className="text-on-surface-variant">
					{t("courses:detail.notFound")}
				</p>
				<Button
					className="mt-4"
					onClick={handleBack}
					type="button"
					variant="ghost"
				>
					{t("courses:detail.backToCourses")}
				</Button>
			</div>
		);
	}

	if (!course) {
		return (
			<div className="flex h-full items-center justify-center py-8">
				<div
					className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-5"
					role="alert"
				>
					<h1 className="text-lg font-medium text-on-surface">
						{t("courses:detail.loadError.title")}
					</h1>
					<p className="mt-1 text-sm text-on-surface-variant">
						{t("courses:detail.loadError.description")}
					</p>
					<Button
						className="mt-4"
						onClick={() => {
							void refetch();
						}}
						type="button"
						variant="outline"
					>
						{t("common:retry")}
					</Button>
				</div>
			</div>
		);
	}

	const summary = course.getDetailSummaryData();
	const price =
		summary.formattedPriceAmount === null
			? t("courses:pricing.unpriced")
			: summary.pricingMode === "hourly_rate"
				? t("courses:pricing.hourly", {
						price: summary.formattedPriceAmount,
					})
				: t("courses:pricing.fixed", {
						price: summary.formattedPriceAmount,
					});

	return (
		<div className="flex h-full flex-col gap-6 py-4">
			<header className="rounded-xl border border-border bg-card p-4 sm:p-5">
				<div className="flex items-center gap-3">
					<button
						aria-label={t("courses:detail.back")}
						className="-ml-2 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
						onClick={handleBack}
						type="button"
					>
						<ArrowLeft aria-hidden="true" className="size-5 text-on-surface" />
					</button>
					<h1 className="min-w-0 flex-1 break-words text-xl font-medium leading-tight tracking-[-0.01em] text-on-surface sm:text-2xl">
						{course.getName()}
					</h1>
					<Button
						aria-label={t("courses:detail.editCourse")}
						onClick={handleEdit}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Pencil aria-hidden="true" className="size-4" />
					</Button>
				</div>
				<dl className="mt-5 grid overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-2">
					<SummaryItem label={t("courses:detail.summary.price")} value={price} />
					<SummaryItem
						label={t("courses:detail.summary.defaultHours")}
						value={t("courses:defaultHours", {
							hours: summary.formattedDefaultTotalHours,
						})}
					/>
					<SummaryItem
						label={t("courses:detail.summary.recordedHours")}
						value={t("courses:defaultHours", {
							hours: summary.formattedRecordedHours ?? "0",
						})}
					/>
					<SummaryItem
						label={t("courses:detail.summary.revenueMade")}
						value={summary.formattedRecordedRevenue ?? t("classes:revenue.notRecorded")}
					/>
				</dl>
			</header>

			{isError ? (
				<div
					className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-container px-3 py-4 sm:flex-row sm:items-center sm:justify-between"
					role="alert"
				>
					<p className="text-sm text-warning-container-foreground">
						{t("courses:detail.refreshError")}
					</p>
					<Button
						className="w-full sm:w-auto"
						onClick={() => {
							void refetch();
						}}
						type="button"
						variant="outline"
					>
						{t("common:retry")}
					</Button>
				</div>
			) : null}

			<CourseFormDrawer
				course={course}
				onCloseAutoFocus={focusEditOrigin}
				onOpenChange={setIsFormOpen}
				onSaved={() => setIsFormOpen(false)}
				open={isFormOpen}
			/>
		</div>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0 bg-card px-4 py-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="mt-1 break-words font-medium tabular-nums text-foreground">
				{value}
			</dd>
		</div>
	);
}

function CourseDetailSkeleton() {
	return (
		<div className="flex h-full flex-col gap-6 py-4">
			<div className="rounded-xl border border-border bg-card p-4 sm:p-5">
				<div className="flex items-center gap-3">
					<Skeleton className="size-11 rounded-full" />
					<Skeleton className="h-7 w-2/5 rounded" />
					<Skeleton className="size-11 rounded-full" />
				</div>
				<div className="mt-5 grid overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-2">
					<Skeleton className="h-20 rounded-none bg-card" />
					<Skeleton className="h-20 rounded-none bg-card" />
					<Skeleton className="h-20 rounded-none bg-card" />
				</div>
			</div>
		</div>
	);
}
