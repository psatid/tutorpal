import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { DefaultValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StudentSelectorDrawer } from "@/components/classes/student-selector-drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useStudents } from "@/hooks/queries/use-students";
import { getNameTone, nameToneAvatarClasses } from "@/lib/name-tone";
import type { Class } from "@/models/class";
import {
	createClassFormSchema,
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
		resolver: zodResolver(createClassFormSchema(t)),
		defaultValues: getClassFormDefaultValues(classData),
	});
	const studentIds = useWatch({ control, name: "studentIds" }) ?? [];
	const {
		data: studentsData,
		isFetching: isStudentsFetching,
		isLoading: isStudentsLoading,
	} = useStudents({
		limit: 100,
		sortBy: "name",
		sortOrder: "asc",
	});
	const studentsById = new Map(
		[
			...(classData?.getStudents() ?? []),
			...(studentsData?.students ?? []),
		].map((student) => [student.getId(), student]),
	);
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
						<ul
							aria-label={t("classes:createForm.studentsLabel")}
							className="flex flex-wrap gap-2"
						>
							{studentIds.map((studentId) => {
								const student = studentsById.get(studentId);
								const name = student?.getName() ?? t(
									isStudentsLoading || isStudentsFetching
										? "classes:createForm.studentLoading"
										: "classes:createForm.studentUnavailable",
								);

								return (
									<li
										className="flex max-w-full min-w-0 items-center gap-2 rounded-lg bg-surface-container-low py-1 pr-3 pl-1"
										key={studentId}
									>
										<Avatar size="sm">
											<AvatarFallback
												className={
													student
														? nameToneAvatarClasses[getNameTone(name)]
														: "bg-[#273951] text-white"
												}
											>
												{student ? (
													student.getInitials()
												) : (
													<UserRound className="size-3" />
												)}
											</AvatarFallback>
										</Avatar>
										<span className="min-w-0 break-words text-sm text-on-surface">
											{name}
										</span>
									</li>
								);
							})}
						</ul>
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
