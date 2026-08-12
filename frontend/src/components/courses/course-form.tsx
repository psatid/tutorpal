import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RHFInputField } from "@/components/ui/form/rhf";
import {
	useCreateCourse,
	useUpdateCourse,
} from "@/hooks/mutations/use-courses";
import type { Course } from "@/models/course";
import {
	type CourseFormData,
	type CourseFormInput,
	createCourseSchema,
} from "@/types/course";

interface CourseFormProps {
	course: Course | null;
	onSaved: () => void;
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
		},
	});
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
		</form>
	);
}
