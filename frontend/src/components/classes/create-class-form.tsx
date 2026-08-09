import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { DefaultValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RHFInputField } from "@/components/ui/form/rhf";
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
import { useUpdateClass } from "@/hooks/mutations/use-update-class";
import { useStudents } from "@/hooks/queries/use-students";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { Class } from "@/models/class";
import type { Course } from "@/models/course";
import {
  classFormSchema,
  type ClassFormInput,
  type ClassFormValues,
} from "@/types/class";

export const CUSTOM_CLASS_VALUE = "__custom__";

export type ClassFormMode = "create" | "edit" | "view";

interface ClassFormProps {
  classData?: Class | null;
  courses?: Course[];
  formId?: string;
  isOpen?: boolean;
  mode?: ClassFormMode;
  onPendingChange?: (pending: boolean) => void;
  onSuccess?: () => void;
  preferredCourseId?: string | null;
}

function getClassFormDefaultValues({
  classData,
  courses,
  mode,
  preferredCourseId,
}: Pick<
  ClassFormProps,
  "classData" | "courses" | "mode" | "preferredCourseId"
>): DefaultValues<ClassFormInput> {
  const formData = classData?.getFormData();
  const courseId =
    mode === "create"
      ? (preferredCourseId ?? CUSTOM_CLASS_VALUE)
      : (classData?.getCourseId() ?? CUSTOM_CLASS_VALUE);
  const selectedCourse = courses?.find((course) => course.getId() === courseId);

  return {
    courseId,
    name: formData?.name ?? "",
    totalHours: formData?.totalHours ?? selectedCourse?.getDefaultTotalHours() ?? "",
    studentIds: formData?.studentIds ?? [],
  };
}

export function ClassForm({
  classData,
  courses = [],
  formId,
  isOpen,
  mode = "create",
  onPendingChange,
  onSuccess,
  preferredCourseId,
}: ClassFormProps) {
  const { t } = useTranslation(["classes", "common"]);
  const generatedFormId = useId();
  const resolvedFormId = formId ?? `class-form-${generatedFormId}`;
  const courseControlId = `${resolvedFormId}-course`;
  const courseDescriptionId = `${courseControlId}-description`;
  const nameId = `${resolvedFormId}-name`;
  const nameDescriptionId = `${nameId}-description`;
  const nameErrorId = `${nameId}-error`;
  const hoursId = `${resolvedFormId}-hours`;
  const hoursErrorId = `${hoursId}-error`;
  const studentsLabelId = `${resolvedFormId}-students-label`;
  const studentSearchId = `${resolvedFormId}-student-search`;
  const studentsId = `${resolvedFormId}-students`;
  const studentsErrorId = `${studentsId}-error`;
  const [studentSearch, setStudentSearch] = useState("");
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setError,
    setValue,
    trigger,
    formState: { dirtyFields },
  } = useForm<ClassFormInput, unknown, ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: getClassFormDefaultValues({
      classData,
      courses,
      mode,
      preferredCourseId,
    }),
  });
  const courseId = useWatch({ control, name: "courseId" }) ?? CUSTOM_CLASS_VALUE;
  const name = useWatch({ control, name: "name" }) ?? "";
  const totalHours = useWatch({ control, name: "totalHours" }) ?? "";
  const studentIds = useWatch({ control, name: "studentIds" }) ?? [];
  const isCreate = mode === "create";
  const isReadOnly = mode === "view";
  const custom = courseId === CUSTOM_CLASS_VALUE;
  const selectedCourse =
    courses.find((course) => course.getId() === courseId) ?? null;
  const studentsQuery = useStudents({
    limit: 100,
    search: studentSearch || undefined,
    sortBy: "name",
    sortOrder: "asc",
  });
  const create = useCreateClass({ onSuccess });
  const update = useUpdateClass({ onSuccess });
  const isPending = create.isPending || update.isPending;
  const selectedStudents = (studentsQuery.data?.students ?? []).filter((student) =>
    studentIds.includes(student.getId()),
  );
  const numericHours = Number(totalHours);
  const hasValidHours =
    Number.isFinite(numericHours) && numericHours >= 0.25;
  const courseLabel = custom
    ? t("classes:customClass")
    : (selectedCourse?.getName() ??
      classData?.getCourseName() ??
      t("classes:createForm.coursePlaceholder"));
  const previewName =
    name.trim() ||
    (selectedStudents.length === 1
      ? selectedStudents[0]?.getName()
      : selectedStudents.length === 2
        ? selectedStudents[0]?.getName() +
          " & " +
          selectedStudents[1]?.getName()
        : selectedStudents.length > 2
          ? selectedStudents[0]?.getName() +
            ", " +
            selectedStudents[1]?.getName() +
            " +" +
            (selectedStudents.length - 2)
          : courseLabel || t("classes:createForm.previewName"));

  useEffect(() => {
    reset(
      getClassFormDefaultValues({
        classData,
        courses,
        mode,
        preferredCourseId,
      }),
    );
    setStudentSearch("");
  }, [classData, isOpen, mode, preferredCourseId, reset]);

  useEffect(() => {
    if (
      !isOpen ||
      !isCreate ||
      !preferredCourseId ||
      courseId !== preferredCourseId ||
      !selectedCourse ||
      dirtyFields.totalHours ||
      getValues("totalHours") !== ""
    ) {
      return;
    }

    setValue("totalHours", selectedCourse.getDefaultTotalHours(), {
      shouldValidate: true,
    });
  }, [
    courseId,
    dirtyFields.totalHours,
    getValues,
    isCreate,
    isOpen,
    preferredCourseId,
    selectedCourse,
    setValue,
  ]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  function changeCourse(value: string | null) {
    if (!isCreate) return;

    const nextCourseId = value ?? CUSTOM_CLASS_VALUE;
    const course = courses.find((item) => item.getId() === nextCourseId);
    setValue("courseId", nextCourseId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("totalHours", course?.getDefaultTotalHours() ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger("name");
  }

  function toggleStudent(studentId: string) {
    const nextStudentIds = studentIds.includes(studentId)
      ? studentIds.filter((id) => id !== studentId)
      : [...studentIds, studentId];
    setValue("studentIds", nextStudentIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function submit(data: ClassFormValues) {
    if (isReadOnly) return;

    if (mode === "edit" && classData) {
      update.mutate({
        id: classData.getId(),
        data: {
          name: data.name,
          totalHours: data.totalHours,
          studentIds: data.studentIds,
        },
      });
      return;
    }

    create.mutate({
      courseId: data.courseId === CUSTOM_CLASS_VALUE ? null : data.courseId,
      name: data.name || null,
      totalHours: data.totalHours,
      studentIds: data.studentIds,
    });
  }

  function handleInvalidSubmit() {
    const values = getValues();
    if (
      values.courseId === CUSTOM_CLASS_VALUE &&
      values.name.trim().length === 0
    ) {
      setError("name", {
        type: "validate",
        message: t("classes:createForm.nameError"),
      });
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      id={resolvedFormId}
      onSubmit={handleSubmit(submit, handleInvalidSubmit)}
    >
      <FieldGroup className="gap-5">
        <Controller
          control={control}
          name="courseId"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={courseControlId}>
                {t("classes:createForm.courseLabel")}
              </FieldLabel>
              <Select
                disabled={!isCreate}
                onValueChange={changeCourse}
                value={field.value}
              >
                <SelectTrigger
                  aria-describedby={courseDescriptionId}
                  id={courseControlId}
                >
                  <SelectValue
                    placeholder={t("classes:createForm.coursePlaceholder")}
                  >
                    {courseLabel}
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
              <FieldDescription id={courseDescriptionId}>
                {t("classes:createForm.courseDescription")}
              </FieldDescription>
            </Field>
          )}
        />
        <RHFInputField
          caption={
            custom
              ? t("classes:createForm.customNameDescription")
              : t("classes:createForm.courseNameDescription")
          }
          captionId={nameDescriptionId}
          control={control}
          disabled={isReadOnly}
          errorId={nameErrorId}
          inputProps={{
            "aria-describedby": nameDescriptionId,
            id: nameId,
            placeholder: custom
              ? t("classes:createForm.customNamePlaceholder")
              : t("classes:createForm.courseNamePlaceholder"),
          }}
          label={
            custom
              ? t("classes:createForm.nameLabel")
              : t("classes:createForm.nameLabel") +
                " " +
                t("classes:createForm.optional")
          }
          name="name"
        />
        <RHFInputField
          control={control}
          disabled={isReadOnly}
          errorId={hoursErrorId}
          inputProps={{
            id: hoursId,
            inputMode: "decimal",
            min: 0.25,
            step: 0.25,
            type: "number",
          }}
          label={t("classes:createForm.hoursLabel")}
          name="totalHours"
        />
        <Controller
          control={control}
          name="studentIds"
          render={({ fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor={studentSearchId} id={studentsLabelId}>
                {t("classes:createForm.studentsLabel")}
              </FieldLabel>
              <Input
                disabled={isReadOnly}
                id={studentSearchId}
                leftIcon={Search}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder={t("classes:createForm.studentSearch")}
                value={studentSearch}
              />
              {studentsQuery.isError ? (
                <div
                  className="flex flex-col items-start gap-3 rounded-xl border border-border p-4"
                  role="alert"
                >
                  <p className="text-sm text-muted-foreground">
                    {t("classes:createForm.studentsLoadError")}
                  </p>
                  <Button
                    loading={studentsQuery.isFetching}
                    onClick={() => studentsQuery.refetch()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t("common:retry")}
                  </Button>
                </div>
              ) : (
                <fieldset
                  aria-describedby={
                    fieldState.error ? studentsErrorId : undefined
                  }
                  aria-invalid={!!fieldState.error}
                  aria-labelledby={studentsLabelId}
                  className="max-h-44 overflow-y-auto rounded-xl border border-border"
                  id={studentsId}
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
                          disabled={isReadOnly}
                          key={student.getId()}
                          onClick={() => toggleStudent(student.getId())}
                          type="button"
                        >
                          <span className="truncate font-medium">
                            {student.getName()}
                          </span>
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
              )}
              <FieldError id={studentsErrorId}>
                {fieldState.error?.message}
              </FieldError>
            </Field>
          )}
        />
      </FieldGroup>
      <div aria-live="polite" className="rounded-xl bg-primary/5 p-4">
        <p className="truncate font-semibold text-foreground">{previewName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {courseLabel} ·{" "}
          {t("classes:createForm.studentCount", { count: studentIds.length })} ·{" "}
          {hasValidHours
            ? t("classes:createForm.hours", {
                hours: DateTime.formatDurationHours(numericHours),
              })
            : t("classes:createForm.hoursNotSet")}
        </p>
      </div>
    </form>
  );
}

export const CreateClassForm = ClassForm;
