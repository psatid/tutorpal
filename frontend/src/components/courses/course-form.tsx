import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { RHFInputField } from "@/components/ui/form/rhf";
import {
	useCreateCourse,
	useUpdateCourse,
} from "@/hooks/mutations/use-courses";
import { calculateCourseRevenue } from "@/lib/course-pricing";
import { DateTime } from "@/lib/date-time";
import type { Course } from "@/models/course";
import {
	COURSE_PRICING_MODES,
	type CoursePricingMode,
	type CourseFormData,
	type CourseFormInput,
	createCourseSchema,
} from "@/types/course";
import { MAX_THB_AMOUNT } from "@/types/money";

interface CourseFormProps {
	course: Course | null;
	onSaved: () => void;
}

function toFiniteNumber(value: unknown) {
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value !== "string" || value.trim() === "") return null;

	const parsedValue = Number(value);
	return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function CourseForm({ course, onSaved }: CourseFormProps) {
	const { t } = useTranslation(["courses"]);
	const courseFormData = course?.getFormData();
	const { control, handleSubmit } = useForm<
		CourseFormInput,
		unknown,
		CourseFormData
	>({
		resolver: zodResolver(createCourseSchema(t)),
		defaultValues: {
			name: courseFormData?.name ?? "",
			defaultTotalHours: courseFormData
				? courseFormData.defaultTotalHours
				: "",
			pricingMode: courseFormData?.pricingMode ?? "hourly_rate",
			priceAmount: courseFormData?.priceAmount ?? "",
		},
	});
	const pricingMode =
		useWatch({ control, name: "pricingMode" }) ?? "hourly_rate";
	const defaultTotalHours = useWatch({ control, name: "defaultTotalHours" });
	const priceAmount = useWatch({ control, name: "priceAmount" });
	const parsedDefaultTotalHours = toFiniteNumber(defaultTotalHours);
	const parsedPriceAmount = toFiniteNumber(priceAmount);
	const calculatedRevenue =
		parsedPriceAmount === null ||
		(pricingMode === "hourly_rate" &&
			(parsedDefaultTotalHours === null || parsedDefaultTotalHours <= 0))
			? null
			: calculateCourseRevenue(
					parsedDefaultTotalHours ?? 0,
					pricingMode,
					parsedPriceAmount,
				);
	const priceLabel =
		pricingMode === "hourly_rate"
			? t("courses:form.hourlyRateLabel")
			: t("courses:form.fixedPriceLabel");
	const priceDescription =
		pricingMode === "hourly_rate"
			? t("courses:form.hourlyRateDescription")
			: t("courses:form.fixedPriceDescription");
	const create = useCreateCourse(onSaved);
	const update = useUpdateCourse(onSaved);

	function submit(data: CourseFormData) {
		if (course) update.mutate({ id: course.getId(), data });
		else create.mutate(data);
	}

	return (
		<form
			className="flex flex-col gap-5"
			id="course-form"
			onSubmit={handleSubmit(submit)}
		>
			<RHFInputField
				control={control}
				inputProps={{
					autoFocus: true,
					placeholder: t("courses:form.namePlaceholder"),
				}}
				label={t("courses:form.nameLabel")}
				name="name"
			/>
			<RHFInputField
				caption={t("courses:form.hoursDescription")}
				control={control}
				inputProps={{
					inputMode: "decimal",
					min: 0.25,
					placeholder: "20",
					step: 0.25,
					type: "number",
				}}
				label={t("courses:form.hoursLabel")}
				name="defaultTotalHours"
			/>
			<Controller
				control={control}
				name="pricingMode"
				render={({ field }) => (
					<FieldSet className="gap-3">
						<FieldLegend>
							{t("courses:form.priceTypeLegend")}
						</FieldLegend>
						<div className="grid gap-3">
							{COURSE_PRICING_MODES.map((mode) => (
								<label
									className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-input px-3 py-3 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 ${
										field.value === mode
											? "border-primary bg-primary/5"
											: ""
									}`}
									key={mode}
								>
									<input
										checked={field.value === mode}
										name="course-pricing-mode"
										onChange={() => field.onChange(mode)}
										type="radio"
										value={mode}
									/>
									<span className="space-y-1">
										<span className="block text-sm font-medium text-foreground">
											{t(
												`courses:form.${getPriceTypeLabelKey(mode)}`,
											)}
										</span>
										<span className="block text-sm text-muted-foreground">
											{t(
												`courses:form.${getPriceTypeDescriptionKey(mode)}`,
											)}
										</span>
									</span>
								</label>
							))}
						</div>
					</FieldSet>
				)}
			/>
			<RHFInputField
				caption={`${priceDescription} ${t("courses:form.priceOptional")}`}
				control={control}
				inputProps={{
					inputMode: "decimal",
					max: MAX_THB_AMOUNT,
					min: 0,
					placeholder: "0.00",
					rightAdornment: (
						<span aria-hidden="true" className="text-sm text-muted-foreground">
							฿
						</span>
					),
					step: 0.01,
					type: "number",
				}}
				label={priceLabel}
				name="priceAmount"
			/>
			<div
				aria-live="polite"
				className="rounded-lg border border-border bg-surface px-3 py-3"
			>
				<p className="text-sm font-medium text-foreground">
					{t("courses:form.calculationPreview")}
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{calculatedRevenue === null
						? t("courses:form.calculationPending")
						: t("courses:form.calculationValue", {
							amount: DateTime.formatThaiBaht(calculatedRevenue),
						})}
				</p>
			</div>
			<p className="text-sm text-muted-foreground">
				{t("courses:form.priceFutureAdditions")}
			</p>
		</form>
	);
}

function getPriceTypeLabelKey(mode: CoursePricingMode) {
	return mode === "hourly_rate" ? "hourlyRate" : "fixedPrice";
}

function getPriceTypeDescriptionKey(mode: CoursePricingMode) {
	return mode === "hourly_rate"
		? "hourlyRateOptionDescription"
		: "fixedPriceOptionDescription";
}
