import { CourseRow } from "@/components/courses/course-row";
import { Course } from "@/models/course";

interface CourseListProps {
	actionTriggerRef: (courseId: string, node: HTMLButtonElement | null) => void;
	courses: Course[];
	onDelete: (course: Course, index: number) => void;
	onEdit: (course: Course) => void;
	onViewClasses: (course: Course) => void;
}

export function CourseList({
	actionTriggerRef,
	courses,
	onDelete,
	onEdit,
	onViewClasses,
}: CourseListProps) {
	return (
		<ul className="overflow-hidden rounded-lg border border-border bg-card">
			{courses.map((course, index) => (
				<CourseRow
					actionTriggerRef={(node) => actionTriggerRef(course.getId(), node)}
					course={course}
					onDelete={() => onDelete(course, index)}
					onEdit={() => onEdit(course)}
					onViewClasses={() => onViewClasses(course)}
					key={course.getId()}
				/>
			))}
		</ul>
	);
}
