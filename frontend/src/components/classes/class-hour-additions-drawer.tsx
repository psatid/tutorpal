import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Plus } from "lucide-react";
import { type ComponentProps, useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { RHFInputField } from "@/components/ui/form/rhf";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
	ClassHourAdditionError,
	useAddClassHours,
} from "@/hooks/mutations/use-add-class-hours";
import { useCourses } from "@/hooks/queries/use-courses";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { Class } from "@/models/class";
import {
	createClassHourAdditionFormSchema,
	type ClassHourAdditionFormInput,
	type ClassHourAdditionFormValues,
} from "@/types/class-hour-addition";

interface ClassHourAdditionsDrawerProps {
	classData: Class | null;
	onCloseAutoFocus?: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

const EMPTY_FORM_VALUES: ClassHourAdditionFormInput = {
	source: "custom",
	courseId: "",
	hours: "",
};

type HourAdditionRequest = {
	payloadKey: string;
	requestId: string;
};

function getHourAdditionPayloadKey(
	classId: string,
	source: "course" | "custom",
	courseId: string | undefined,
	hours: string | number | undefined,
) {
	if (source === "course") {
		return `${classId}:course:${courseId ?? ""}`;
	}

	const normalizedHours =
		typeof hours === "string" && hours.trim().length === 0
			? ""
			: Number(hours);
	return `${classId}:custom:${
		Number.isFinite(normalizedHours) ? normalizedHours : String(hours ?? "")
	}`;
}

export function ClassHourAdditionsDrawer({
	classData,
	onCloseAutoFocus,
	onOpenChange,
	open,
}: ClassHourAdditionsDrawerProps) {
	const { t } = useTranslation(["classes", "common"]);
	const formId = `class-hour-additions-form-${useId()}`;
	const initializedOpenRef = useRef(false);
	const hourAdditionRequestRef = useRef<HourAdditionRequest | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const coursesQuery = useCourses({
		limit: 100,
		sortBy: "name",
		sortOrder: "asc",
	});
	const courses = useMemo(
		() =>
			[...(coursesQuery.data?.courses ?? [])].sort((left, right) =>
				left.getName().localeCompare(right.getName()),
			),
		[coursesQuery.data?.courses],
	);
	const isCoursesLoading = coursesQuery.isLoading;
	const hasCourseLoadError = coursesQuery.isError;
	const hasNoCourses =
		!isCoursesLoading && !hasCourseLoadError && courses.length === 0;
	const isCoursePresetUnavailable =
		isCoursesLoading || hasCourseLoadError || hasNoCourses;
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
	} = useForm<ClassHourAdditionFormInput, unknown, ClassHourAdditionFormValues>({
		resolver: zodResolver(createClassHourAdditionFormSchema(t)),
		defaultValues: EMPTY_FORM_VALUES,
	});
	const source = useWatch({ control, name: "source" }) ?? "custom";
	const courseId = useWatch({ control, name: "courseId" }) ?? "";
	const hours = useWatch({ control, name: "hours" }) as
		| string
		| number
		| undefined;
	const watchedPayloadKey = getHourAdditionPayloadKey(
		classData?.getId() ?? "",
		source,
		courseId,
		hours,
	);
	const selectedCourse = courses.find((course) => course.getId() === courseId);
	const selectedCourseHours = selectedCourse
		? DateTime.formatDurationHours(selectedCourse.getDefaultTotalHours())
		: null;
	const courseUnavailable =
		source === "course" &&
		courseId.length > 0 &&
		!isCoursesLoading &&
		!hasCourseLoadError &&
		!selectedCourse;

	useEffect(() => {
		if (hourAdditionRequestRef.current?.payloadKey !== watchedPayloadKey) {
			hourAdditionRequestRef.current = null;
		}
	}, [watchedPayloadKey]);

	const addHours = useAddClassHours({
		onSuccess: (result) => {
			hourAdditionRequestRef.current = null;
			setSubmitError(null);
			toast.success(
				t("classes:hourAdditions.success", {
					hours: DateTime.formatDurationHours(result.addition.hours),
				}),
			);
			onOpenChange(false);
		},
		onError: (error) => {
			if (error.kind === "course-unavailable") {
				setSubmitError(t("classes:hourAdditions.courseUnavailable"));
				void coursesQuery.refetch();
				return;
			}
			setSubmitError(getHourAdditionErrorMessage(error, t));
		},
	});

	useEffect(() => {
		if (!open) {
			initializedOpenRef.current = false;
			hourAdditionRequestRef.current = null;
			setSubmitError(null);
			reset(EMPTY_FORM_VALUES);
			return;
		}
		if (initializedOpenRef.current || isCoursesLoading) return;

		const firstCourse = hasCourseLoadError ? undefined : courses[0];
		reset(
			firstCourse
				? { source: "course", courseId: firstCourse.getId(), hours: "" }
				: EMPTY_FORM_VALUES,
		);
		initializedOpenRef.current = true;
	}, [courses, hasCourseLoadError, isCoursesLoading, open, reset]);

	function changeSource(nextSource: "course" | "custom") {
		if (nextSource === "course" && isCoursePresetUnavailable) return;

		setSubmitError(null);
		setValue("source", nextSource, {
			shouldDirty: true,
			shouldValidate: true,
		});
		if (nextSource === "course" && !courseId && courses[0]) {
			setValue("courseId", courses[0].getId(), {
				shouldDirty: true,
				shouldValidate: true,
			});
		}
	}

	function submit(data: ClassHourAdditionFormValues) {
		if (!classData) return;
		if (data.source === "course" && courseUnavailable) {
			setSubmitError(t("classes:hourAdditions.courseUnavailable"));
			return;
		}
		if (data.source === "course" && isCoursePresetUnavailable) {
			setSubmitError(
				isCoursesLoading
					? t("classes:hourAdditions.coursePresetLoading")
					: hasCourseLoadError
						? t("classes:hourAdditions.coursePresetLoadError")
						: t("classes:hourAdditions.noCourses"),
			);
			return;
		}
		setSubmitError(null);
		const payloadKey = getHourAdditionPayloadKey(
			classData.getId(),
			data.source,
			data.source === "course" ? data.courseId : undefined,
			data.source === "custom" ? data.hours : undefined,
		);
		let hourAdditionRequest = hourAdditionRequestRef.current;
		if (!hourAdditionRequest || hourAdditionRequest.payloadKey !== payloadKey) {
			hourAdditionRequest = {
				payloadKey,
				requestId: crypto.randomUUID(),
			};
			hourAdditionRequestRef.current = hourAdditionRequest;
		}

		addHours.mutate({
			classId: classData.getId(),
			data:
				data.source === "course"
					? {
							source: "course",
							courseId: data.courseId,
							requestId: hourAdditionRequest.requestId,
						}
					: {
							source: "custom",
							hours: data.hours,
							requestId: hourAdditionRequest.requestId,
						},
		});
	}

	const handleOpenChange: NonNullable<
		ComponentProps<typeof ResponsiveDrawer>["onOpenChange"]
	> = (nextOpen, eventDetails) => {
		if (!nextOpen && addHours.isPending) {
			eventDetails?.preventUnmountOnClose();
			return;
		}
		onOpenChange(nextOpen);
	};

	return (
		<ResponsiveDrawer
			description={t("classes:hourAdditions.description")}
			footer={
				<Button
					className="w-full md:w-fit"
					form={formId}
					leftIcon={Plus}
					loading={addHours.isPending}
					disabled={
						source === "course" &&
						(isCoursePresetUnavailable || courseUnavailable)
					}
					type="submit"
				>
					{source === "course" && selectedCourseHours
						? t("classes:hourAdditions.submitPreset", {
								hours: selectedCourseHours,
							})
						: t("classes:hourAdditions.submit")}
				</Button>
			}
			onCloseAutoFocus={onCloseAutoFocus}
			onOpenChange={handleOpenChange}
			open={open}
			title={t("classes:hourAdditions.title")}
		>
			<form className="space-y-6" id={formId} onSubmit={handleSubmit(submit)}>
				<FieldSet>
					<FieldLegend>{t("classes:hourAdditions.sourceLegend")}</FieldLegend>
					<div className="grid gap-3">
						<label
							className={cn(
								"flex cursor-pointer items-start gap-3 rounded-lg border border-input px-3 py-3 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
								source === "course" && "border-primary bg-primary/5",
								isCoursePresetUnavailable && "cursor-not-allowed opacity-60",
							)}
						>
							<input
								checked={source === "course"}
								disabled={isCoursePresetUnavailable}
								name={`${formId}-source`}
								onChange={() => changeSource("course")}
								type="radio"
								value="course"
							/>
							<span className="space-y-1">
								<span className="block text-sm font-medium text-foreground">
									{t("classes:hourAdditions.coursePreset")}
								</span>
								<span className="block text-sm text-muted-foreground">
									{isCoursesLoading
										? t("classes:hourAdditions.coursePresetLoading")
										: hasCourseLoadError
											? t("classes:hourAdditions.coursePresetLoadError")
											: hasNoCourses
												? t("classes:hourAdditions.noCourses")
												: t("classes:hourAdditions.coursePresetDescription")}
								</span>
							</span>
						</label>
						<label
							className={cn(
								"flex cursor-pointer items-start gap-3 rounded-lg border border-input px-3 py-3 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
								source === "custom" && "border-primary bg-primary/5",
							)}
						>
							<input
								checked={source === "custom"}
								name={`${formId}-source`}
								onChange={() => changeSource("custom")}
								type="radio"
								value="custom"
							/>
							<span className="space-y-1">
								<span className="block text-sm font-medium text-foreground">
									{t("classes:hourAdditions.customHours")}
								</span>
								<span className="block text-sm text-muted-foreground">
									{t("classes:hourAdditions.customHoursDescription")}
								</span>
							</span>
						</label>
						{hasCourseLoadError ? (
							<div
								className="rounded-lg border border-destructive/30 bg-destructive/10 p-3"
								role="alert"
							>
								<p className="text-sm text-destructive">
									{t("classes:hourAdditions.coursePresetLoadError")}
								</p>
								<Button
									className="mt-3"
									loading={coursesQuery.isFetching}
									onClick={() => void coursesQuery.refetch()}
									size="sm"
									type="button"
									variant="outline"
								>
									{t("common:retry")}
								</Button>
							</div>
						) : null}
					</div>
				</FieldSet>

				<FieldGroup className="gap-5">
					{source === "course" ? (
						<Controller
							control={control}
							name="courseId"
							render={({ field }) => (
								<Field data-invalid={Boolean(errors.courseId) || courseUnavailable}>
									<FieldLabel htmlFor={`${formId}-course`}>
										{t("classes:hourAdditions.courseLabel")}
									</FieldLabel>
									<Select
										disabled={isCoursePresetUnavailable}
										onValueChange={(value) => {
											field.onChange(value ?? "");
											setSubmitError(null);
										}}
										value={field.value ?? null}
									>
										<SelectTrigger id={`${formId}-course`}>
											<SelectValue
												placeholder={t("classes:hourAdditions.coursePlaceholder")}
											>
												{courseUnavailable
													? t("classes:hourAdditions.unavailableCourse")
													: selectedCourse?.getName()}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
											{courses.map((course) => (
													<SelectItem key={course.getId()} value={course.getId()}>
														{t("classes:hourAdditions.courseOption", {
															hours: DateTime.formatDurationHours(
																course.getDefaultTotalHours(),
															),
															name: course.getName(),
														})}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									<FieldDescription>
										{isCoursesLoading
											? t("classes:hourAdditions.coursePresetLoading")
											: hasCourseLoadError
												? t("classes:hourAdditions.coursePresetLoadError")
												: hasNoCourses
													? t("classes:hourAdditions.noCourses")
													: selectedCourse
														? t("classes:hourAdditions.courseHours", {
																hours: selectedCourseHours,
															})
														: t("classes:hourAdditions.courseHoursPending")}
									</FieldDescription>
									<FieldError>
										{courseUnavailable
											? t("classes:hourAdditions.courseUnavailable")
											: errors.courseId?.message}
									</FieldError>
								</Field>
							)}
						/>
					) : (
						<RHFInputField
							caption={t("classes:hourAdditions.customInputDescription")}
							control={control}
							inputProps={{
								inputMode: "decimal",
								max: 99_999_999.99,
								min: 0.01,
								placeholder: "0.01",
								step: 0.01,
								type: "number",
							}}
							label={t("classes:hourAdditions.customInputLabel")}
							name="hours"
							required
						/>
					)}
				</FieldGroup>

				{submitError ? (
					<p
						className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
						role="alert"
					>
						<CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
						<span>{submitError}</span>
					</p>
				) : null}
			</form>
		</ResponsiveDrawer>
	);
}

function getHourAdditionErrorMessage(
	error: ClassHourAdditionError,
	t: (key: string) => string,
) {
	switch (error.kind) {
		case "class-not-found":
			return t("classes:hourAdditions.classUnavailable");
		case "request-conflict":
			return t("classes:hourAdditions.requestConflict");
		default:
			return t("classes:hourAdditions.error");
	}
}
