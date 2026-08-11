import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { DefaultValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StudentSelectorDrawer } from "@/components/classes/student-selector-drawer";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { RHFInputField } from "@/components/ui/form/rhf";
import { useCreateClass } from "@/hooks/mutations/use-create-class";
import { useUpdateClass } from "@/hooks/mutations/use-update-class";
import type { Class } from "@/models/class";
import {
	classFormSchema,
	type ClassFormInput,
	type ClassFormValues,
} from "@/types/class";

export type ClassFormMode = "create" | "edit" | "view";

interface ClassFormProps {
	classData?: Class | null;
	formId?: string;
	isOpen?: boolean;
	mode?: ClassFormMode;
	onPendingChange?: (pending: boolean) => void;
	onSuccess?: () => void;
}

function getClassFormDefaultValues(
	classData?: Class | null,
): DefaultValues<ClassFormInput> {
	const formData = classData?.getFormData();

	return {
		name: formData?.name ?? "",
		studentIds: formData?.studentIds ?? [],
	};
}

export function ClassForm({
	classData,
	formId,
	isOpen,
	mode = "create",
	onPendingChange,
	onSuccess,
}: ClassFormProps) {
	const { t } = useTranslation(["classes"]);
	const generatedFormId = useId();
	const resolvedFormId = formId ?? `class-form-${generatedFormId}`;
	const studentsId = `${resolvedFormId}-students`;
	const [isStudentSelectorOpen, setIsStudentSelectorOpen] = useState(false);
	const {
		control,
		handleSubmit,
		reset,
		setValue,
	} = useForm<ClassFormInput, unknown, ClassFormValues>({
		resolver: zodResolver(classFormSchema),
		defaultValues: getClassFormDefaultValues(classData),
	});
	const studentIds = useWatch({ control, name: "studentIds" }) ?? [];
	const isReadOnly = mode === "view";
	const create = useCreateClass({ onSuccess });
	const update = useUpdateClass({ onSuccess });
	const isPending = create.isPending || update.isPending;

	useEffect(() => {
		reset(getClassFormDefaultValues(classData));
		if (!isOpen) setIsStudentSelectorOpen(false);
	}, [classData, isOpen, mode, reset]);

	useEffect(() => {
		onPendingChange?.(isPending);
	}, [isPending, onPendingChange]);

	function submit(data: ClassFormValues) {
		if (isReadOnly) return;

		if (mode === "edit" && classData) {
			update.mutate({ id: classData.getId(), data });
			return;
		}

		create.mutate(data);
	}

	return (
		<form
			className="flex flex-col gap-5"
			id={resolvedFormId}
			onSubmit={handleSubmit(submit)}
		>
			<FieldGroup className="gap-5">
				<RHFInputField
					caption={t("classes:createForm.nameDescription")}
					control={control}
					disabled={isReadOnly}
					inputProps={{
						autoFocus: isOpen && mode === "create",
						placeholder: t("classes:createForm.namePlaceholder"),
					}}
					label={t("classes:createForm.nameLabel")}
					name="name"
					required
				/>
				<Field>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-1">
							<FieldLabel htmlFor={studentsId}>
								{t("classes:createForm.studentsLabel")}
							</FieldLabel>
							<FieldDescription>
								{t("classes:createForm.studentsDescription")}
							</FieldDescription>
						</div>
						<Button
							aria-haspopup="dialog"
							disabled={isReadOnly}
							id={studentsId}
							leftIcon={UserPlus}
							onClick={() => setIsStudentSelectorOpen(true)}
							type="button"
							variant="outline"
						>
							{studentIds.length > 0
								? t("classes:createForm.editStudents", {
									count: studentIds.length,
								})
								: t("classes:createForm.addStudents")}
						</Button>
					</div>
					{studentIds.length > 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("classes:createForm.studentCount", {
								count: studentIds.length,
							})}
						</p>
					) : null}
					<StudentSelectorDrawer
						isOpen={isStudentSelectorOpen}
						onChange={(nextStudentIds) =>
							setValue("studentIds", nextStudentIds, {
								shouldDirty: true,
							})
						}
						onOpenChange={setIsStudentSelectorOpen}
						selectedIds={studentIds}
					/>
				</Field>
			</FieldGroup>
		</form>
	);
}

export const CreateClassForm = ClassForm;
