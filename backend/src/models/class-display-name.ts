export type ClassDisplayStudent = {
	name: string;
};

export function getClassDisplayName(
	name: string | null | undefined,
	students: ClassDisplayStudent[],
	fallback = "Unnamed class",
): string {
	const customName = name?.trim();
	if (customName) return customName;

	const names = students.map((student) => student.name.trim()).filter(Boolean);
	if (names.length === 1) return names[0] ?? fallback;
	if (names.length === 2) return `${names[0]} & ${names[1]}`;
	if (names.length > 2) return `${names[0]}, ${names[1]} +${names.length - 2}`;

	return fallback;
}
