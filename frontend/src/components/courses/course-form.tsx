import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetV1Courses200DataItem } from "@/api/generated/models/getV1Courses200DataItem";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	useCreateCourse,
	useUpdateCourse,
} from "@/hooks/mutations/use-courses";

interface CourseFormProps {
	course: GetV1Courses200DataItem | null;
	onSaved: () => void;
}

export function CourseForm({ course, onSaved }: CourseFormProps) {
	const { t } = useTranslation(["courses"]);
	const [name, setName] = useState(course?.name ?? "");
	const [hours, setHours] = useState(
		course ? String(course.defaultTotalHours) : "",
	);
	const [submitted, setSubmitted] = useState(false);
	const create = useCreateCourse(onSaved);
	const update = useUpdateCourse(onSaved);
	const validHours = Number(hours) > 0;
	const isValid = name.trim().length > 0 && validHours;

	function submit(event: FormEvent) {
		event.preventDefault();
		setSubmitted(true);
		if (!isValid) return;
		const data = { name: name.trim(), defaultTotalHours: Number(hours) };
		if (course) update.mutate({ id: course.id, data });
		else create.mutate(data);
	}

	return (
		<form className="flex flex-col gap-5" id="course-form" onSubmit={submit}>
			<FieldGroup className="gap-5">
				<Field data-invalid={submitted && !name.trim()}>
					<FieldLabel htmlFor="course-name">
						{t("courses:form.nameLabel")}
					</FieldLabel>
					<Input
						aria-invalid={submitted && !name.trim()}
						autoFocus
						id="course-name"
						onChange={(event) => setName(event.target.value)}
						placeholder={t("courses:form.namePlaceholder")}
						value={name}
					/>
					<FieldError>
						{submitted && !name.trim()
							? t("courses:validation.courseName")
							: null}
					</FieldError>
				</Field>
				<Field data-invalid={submitted && !validHours}>
					<FieldLabel htmlFor="course-hours">
						{t("courses:form.hoursLabel")}
					</FieldLabel>
					<Input
						aria-invalid={submitted && !validHours}
						id="course-hours"
						inputMode="decimal"
						min="0.25"
						onChange={(event) => setHours(event.target.value)}
						placeholder="20"
						step="0.25"
						type="number"
						value={hours}
					/>
					<FieldDescription>
						{t("courses:form.hoursDescription")}
					</FieldDescription>
					<FieldError>
						{submitted && !validHours ? t("courses:validation.hours") : null}
					</FieldError>
				</Field>
			</FieldGroup>
		</form>
	);
}
