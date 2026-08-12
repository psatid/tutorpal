import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RHFInputField, RHFSelectField } from "@/components/ui/form/rhf";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { createStudentSchema, type StudentFormData } from "@/types/student";

export function StudentForm({ onCreated }: { onCreated: () => void }) {
	const { t } = useTranslation(["students"]);
	const gradeOptions = ["6", "7", "8", "9", "10", "11", "12"].map(
		(grade) => ({ value: grade, label: t("students:grade", { grade }) }),
	);
	const { handleSubmit, control } = useForm<StudentFormData>({
		resolver: zodResolver(createStudentSchema(t)),
		defaultValues: { name: "", phone: "", grade: undefined },
	});
	const create = useCreateStudent({ onSuccess: onCreated });

	return (
		<form
			className="flex flex-col gap-5"
			id="student-form"
			onSubmit={handleSubmit((data) => create.mutate(data))}
		>
			<RHFInputField
				caption={t("students:drawer.name.caption")}
				control={control}
				inputProps={{
					autoFocus: true,
					placeholder: t("students:drawer.name.placeholder"),
				}}
				label={t("students:drawer.name.label")}
				name="name"
			/>
			<RHFInputField
				caption={t("students:drawer.phone.caption")}
				control={control}
				inputProps={{
					type: "tel",
					placeholder: t("students:drawer.phone.placeholder"),
				}}
				label={t("students:drawer.phone.label")}
				name="phone"
			/>
			<RHFSelectField
				caption={t("students:drawer.grade.caption")}
				control={control}
				label={t("students:drawer.grade.label")}
				name="grade"
				options={gradeOptions}
				selectProps={{ placeholder: t("students:drawer.grade.placeholder") }}
			/>
		</form>
	);
}
