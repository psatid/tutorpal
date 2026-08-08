import { useTranslation } from "react-i18next";
import { CourseForm } from "@/components/courses/course-form";
import { Button } from "@/components/ui/button";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import type { Course } from "@/models/course";

interface CourseFormDrawerProps {
	course: Course | null;
	onCloseAutoFocus: () => void;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	open: boolean;
}

export function CourseFormDrawer({
	course,
	onCloseAutoFocus,
	onOpenChange,
	onSaved,
	open,
}: CourseFormDrawerProps) {
	const { t } = useTranslation(["courses"]);
	const formTitle = course
		? t("courses:editCourse")
		: t("courses:createCourse");

	return (
		<ResponsiveDrawer
			description={t("courses:formDescription")}
			footer={
				<Button className="w-full md:w-fit" form="course-form" type="submit">
					{course
						? t("courses:saveChanges")
						: t("courses:createCourse")}
				</Button>
			}
			onCloseAutoFocus={onCloseAutoFocus}
			onOpenChange={onOpenChange}
			open={open}
			title={formTitle}
		>
			<CourseForm
				course={course}
				key={`${course?.getId() ?? "new"}-${open}`}
				onSaved={onSaved}
			/>
		</ResponsiveDrawer>
	);
}
