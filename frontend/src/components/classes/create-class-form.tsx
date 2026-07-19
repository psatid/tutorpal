import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateClass } from "@/hooks/mutations/use-create-class";
import { useStudents } from "@/hooks/queries/use-students";
import type { Course } from "@/models/course";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";

export const CUSTOM_CLASS_VALUE = "__custom__";

interface CreateClassFormProps {
	courses: Course[];
	preferredCourseId?: string | null;
	onCreated: () => void;
}

export function CreateClassForm({
	courses,
	preferredCourseId,
	onCreated,
}: CreateClassFormProps) {
	const { t } = useTranslation(["classes"]);
	const initialCourse = preferredCourseId ?? CUSTOM_CLASS_VALUE;
	const [courseId, setCourseId] = useState(initialCourse);
	const selectedCourse =
		courses.find((course) => course.getId() === courseId) ?? null;
	const [name, setName] = useState("");
	const [hours, setHours] = useState(
		selectedCourse ? String(selectedCourse.getDefaultTotalHours()) : "",
	);
	const [studentIds, setStudentIds] = useState<string[]>([]);
	const [studentSearch, setStudentSearch] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const studentsQuery = useStudents({
		limit: 100,
		search: studentSearch || undefined,
		sortBy: "name",
		sortOrder: "asc",
	});
	const create = useCreateClass({ onSuccess: onCreated });
	const custom = courseId === CUSTOM_CLASS_VALUE;
	const validName = !custom || name.trim().length > 0;
	const validHours = Number(hours) > 0;
	const validStudents = studentIds.length > 0;
	const selectedStudents = (studentsQuery.data?.students ?? []).filter((student) =>
		studentIds.includes(student.getId()),
	);
	const previewName =
		name.trim() ||
		(selectedStudents.length === 1
			? selectedStudents[0]?.getName()
			: selectedStudents.length === 2
				? `${selectedStudents[0]?.getName()} & ${selectedStudents[1]?.getName()}`
				: selectedStudents.length > 2
					? `${selectedStudents[0]?.getName()}, ${selectedStudents[1]?.getName()} +${selectedStudents.length - 2}`
					: selectedCourse?.getName() || t("classes:createForm.previewName"));

	function changeCourse(value: string | null) {
		const next = value ?? CUSTOM_CLASS_VALUE;
		setCourseId(next);
		const course = courses.find((item) => item.getId() === next);
		setHours(course ? String(course.getDefaultTotalHours()) : "");
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		setSubmitted(true);
		if (!validName || !validHours || !validStudents) return;
		create.mutate({
			courseId: custom ? null : courseId,
			name: name.trim() || null,
			totalHours: Number(hours),
			studentIds,
		});
	}

	return (
		<form className="flex flex-col gap-5" id="class-form" onSubmit={submit}>
			<FieldGroup className="gap-5">
				<Field>
					<FieldLabel>{t("classes:createForm.courseLabel")}</FieldLabel>
					<Select onValueChange={changeCourse} value={courseId}>
						<SelectTrigger>
							<SelectValue
								placeholder={t("classes:createForm.coursePlaceholder")}
							>
								{custom ? t("classes:customClass") : selectedCourse?.getName()}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value={CUSTOM_CLASS_VALUE}>
									{t("classes:customClass")}
								</SelectItem>
								{courses.map((course) => (
									<SelectItem key={course.getId()} value={course.getId()}>
										{course.getName()}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<FieldDescription>
						{t("classes:createForm.courseDescription")}
					</FieldDescription>
				</Field>
				<Field data-invalid={submitted && !validName}>
					<FieldLabel htmlFor="class-name">
						{t("classes:createForm.nameLabel")}
						{custom ? "" : ` ${t("classes:createForm.optional")}`}
					</FieldLabel>
					<Input
						aria-invalid={submitted && !validName}
						id="class-name"
						onChange={(event) => setName(event.target.value)}
						placeholder={
							custom
								? t("classes:createForm.customNamePlaceholder")
								: t("classes:createForm.courseNamePlaceholder")
						}
						value={name}
					/>
					<FieldDescription>
						{custom
							? t("classes:createForm.customNameDescription")
							: t("classes:createForm.courseNameDescription")}
					</FieldDescription>
					<FieldError>
						{submitted && !validName ? t("classes:createForm.nameError") : null}
					</FieldError>
				</Field>
				<Field data-invalid={submitted && !validHours}>
					<FieldLabel htmlFor="class-hours">
						{t("classes:createForm.hoursLabel")}
					</FieldLabel>
					<Input
						aria-invalid={submitted && !validHours}
						id="class-hours"
						inputMode="decimal"
						min="0.25"
						onChange={(event) => setHours(event.target.value)}
						step="0.25"
						type="number"
						value={hours}
					/>
					<FieldError>
						{submitted && !validHours
							? t("classes:createForm.hoursError")
							: null}
					</FieldError>
				</Field>
				<Field data-invalid={submitted && !validStudents}>
					<FieldLabel htmlFor="student-search">
						{t("classes:createForm.studentsLabel")}
					</FieldLabel>
					<Input
						id="student-search"
						leftIcon={Search}
						onChange={(event) => setStudentSearch(event.target.value)}
						placeholder={t("classes:createForm.studentSearch")}
						value={studentSearch}
					/>
					<fieldset
						aria-label={t("classes:createForm.selectStudents")}
						className="max-h-44 overflow-y-auto rounded-xl border border-border"
					>
						{studentsQuery.isLoading ? (
							<div className="flex flex-col gap-2 p-3">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						) : (studentsQuery.data?.students ?? []).length === 0 ? (
							<p className="p-4 text-sm text-muted-foreground">
								{t("classes:createForm.noStudents")}
							</p>
						) : (
							(studentsQuery.data?.students ?? []).map((student) => {
				const selected = studentIds.includes(student.getId());
								return (
									<button
										aria-pressed={selected}
										className={cn(
											"flex min-h-11 w-full items-center justify-between border-b border-border px-3 text-left text-sm last:border-0",
											selected && "bg-primary/5 text-primary",
										)}
									key={student.getId()}
										onClick={() =>
											setStudentIds((current) =>
												selected
													? current.filter((id) => id !== student.getId())
													: [...current, student.getId()],
											)
										}
										type="button"
									>
										<span className="truncate font-medium">{student.getName()}</span>
										<span>
											{selected
												? t("classes:createForm.selected")
												: t("classes:createForm.add")}
										</span>
									</button>
								);
							})
						)}
					</fieldset>
					<FieldError>
						{submitted && !validStudents
							? t("classes:createForm.studentsError")
							: null}
					</FieldError>
				</Field>
			</FieldGroup>
			<div aria-live="polite" className="rounded-xl bg-primary/5 p-4">
				<p className="truncate font-semibold text-foreground">{previewName}</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{custom ? t("classes:customClass") : selectedCourse?.getName()} ·{" "}
					{t("classes:createForm.studentCount", { count: studentIds.length })} ·{" "}
					{validHours
						? t("classes:createForm.hours", {
								hours: DateTime.formatDurationHours(Number(hours)),
							})
						: t("classes:createForm.hoursNotSet")}
				</p>
			</div>
		</form>
	);
}
