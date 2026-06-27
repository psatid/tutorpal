import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GetV1StudentsById200ClassesItem } from "@/api/generated/models/getV1StudentsById200ClassesItem";

interface StudentClassListProps {
	classes: GetV1StudentsById200ClassesItem[];
	onViewClass: (classId: string) => void;
}

function formatHours(hours: number) {
	return new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(hours);
}

function EmptyClassList({ onAddClass }: { onAddClass?: () => void }) {
	const { t } = useTranslation(["students"]);
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
				<BookOpen className="w-10 h-10 text-primary/40" />
			</div>
			<h3 className="font-headline font-bold text-lg text-on-surface mb-1">
				{t("students:studentDetail.noClasses")}
			</h3>
			<p className="font-body text-on-surface-variant text-sm max-w-xs mb-4">
				{t("students:studentDetail.noClassesDescription")}
			</p>
			{onAddClass && (
				<Button size="sm" onClick={onAddClass}>
					{t("students:studentDetail.addFirstClass")}
				</Button>
			)}
		</div>
	);
}

export function StudentClassList({
	classes,
	onViewClass,
}: StudentClassListProps) {
	const { t } = useTranslation(["students", "classes"]);

	if (classes.length === 0) {
		return <EmptyClassList />;
	}

	return (
		<div className="space-y-2">
			<div className="bg-primary/5 rounded-lg px-3 py-1.5">
				<h2 className="font-label font-semibold text-xs uppercase tracking-wide text-primary">
					{t("students:studentDetail.enrolledClasses")}
				</h2>
			</div>
			<div className="space-y-2">
				{classes.map((classItem, index) => (
					<motion.button
						key={classItem.id}
						type="button"
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.2,
							delay: index * 0.04,
							ease: [0.25, 0.1, 0.25, 1],
						}}
						onClick={() => onViewClass(classItem.id)}
						className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-outline-variant hover:border-primary transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					>
						<div className="flex-1 min-w-0">
							<p className="font-medium text-on-surface truncate">
								{classItem.name}
							</p>
						</div>

						<Badge
							variant="outline"
							className={cn(
								"shrink-0 gap-1",
								classItem.remainingHours !== undefined &&
									classItem.remainingHours > 0
									? "text-green-600 border-green-600/30"
									: undefined,
							)}
						>
							<Clock className="w-3 h-3" />
							{classItem.remainingHours !== undefined
								? t("classes:hoursWithRemaining", {
										total: formatHours(classItem.totalHours),
										remaining: formatHours(classItem.remainingHours),
									})
								: t("classes:hours", {
										hours: formatHours(classItem.totalHours),
									})}
						</Badge>
					</motion.button>
				))}
			</div>
		</div>
	);
}
