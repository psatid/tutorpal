import { Hono, type MiddlewareHandler } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { requireAuth } from "../middleware/auth";
import { studentRepository } from "../repositories";
import {
	CreateStudentSchema,
	PaginatedStudentListSchemaResolver,
	StudentDetailSchemaResolver,
	StudentListQuerySchema,
	StudentSchemaResolver,
	UpdateStudentSchema,
} from "../schemas";
import { StudentService } from "../services";
import type { AppEnv } from "../types/hono-env";

export type StudentRouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	studentService: StudentService;
};

export function createStudentRoutes({
	requireAuth,
	studentService,
}: StudentRouteDependencies) {
	return (
		new Hono<AppEnv>()
			.use(requireAuth)
			// Create student
			.post(
				"/",
				describeRoute({
					tags: ["students"],
					description: "Create a new student",
					responses: {
						201: {
							description: "Student created successfully",
							content: {
								"application/json": {
									schema: StudentSchemaResolver,
								},
							},
						},
						400: {
							description: "Validation error",
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
					},
				}),
				validator("json", CreateStudentSchema),
				async (c) => {
					const data = c.req.valid("json");
					const tutorId = c.get("tutorId");
					const student = await studentService.createStudent({
						...data,
						tutorId,
					});
					return c.json(student.toStudentDTO(), 201);
				},
			)

			// List all students
			.get(
				"/",
				describeRoute({
					tags: ["students"],
					description: "Get all students with pagination and search",
					parameters: [
						{
							name: "page",
							in: "query",
							required: false,
							schema: {
								type: "integer",
								default: 1,
								minimum: 1,
							},
							description: "Page number",
						},
						{
							name: "limit",
							in: "query",
							required: false,
							schema: {
								type: "integer",
								default: 10,
								minimum: 1,
								maximum: 100,
							},
							description: "Items per page",
						},
						{
							name: "search",
							in: "query",
							required: false,
							schema: {
								type: "string",
							},
							description: "Search by name or phone number",
						},
						{
							name: "sortBy",
							in: "query",
							required: false,
							schema: {
								type: "string",
								enum: ["name", "phoneNumber", "grade", "createdAt"],
								default: "createdAt",
							},
							description: "Field to sort by",
						},
						{
							name: "sortOrder",
							in: "query",
							required: false,
							schema: {
								type: "string",
								enum: ["asc", "desc"],
								default: "desc",
							},
							description: "Sort order",
						},
					],
					responses: {
						200: {
							description: "Paginated list of students",
							content: {
								"application/json": {
									schema: PaginatedStudentListSchemaResolver,
								},
							},
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
					},
				}),
				validator("query", StudentListQuerySchema),
				async (c) => {
					const query = c.req.valid("query");
					const tutorId = c.get("tutorId");
					const students = await studentService.getAllStudents(tutorId, query);
					return c.json({
						...students,
						data: students.data.map((student) => student.toStudentDTO()),
					});
				},
			)

			// Get single student
			.get(
				"/:id",
				describeRoute({
					tags: ["students"],
					description: "Get a student by ID with enrolled classes",
					responses: {
						200: {
							description: "Student found",
							content: {
								"application/json": {
									schema: StudentDetailSchemaResolver,
								},
							},
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Student not found",
						},
					},
				}),
				async (c) => {
					const id = c.req.param("id");
					const tutorId = c.get("tutorId");
					const student = await studentService.getStudentById(id, tutorId);
					return c.json(student.toStudentDetailDTO());
				},
			)

			// Update student
			.put(
				"/:id",
				describeRoute({
					tags: ["students"],
					description: "Update a student by ID",
					responses: {
						200: {
							description: "Student updated successfully",
							content: {
								"application/json": {
									schema: StudentSchemaResolver,
								},
							},
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Student not found",
						},
						400: {
							description: "Validation error",
						},
					},
				}),
				validator("json", UpdateStudentSchema),
				async (c) => {
					const id = c.req.param("id");
					const data = c.req.valid("json");
					const tutorId = c.get("tutorId");
					const student = await studentService.updateStudent(id, tutorId, data);
					return c.json(student.toStudentDTO());
				},
			)

			// Delete student
			.delete(
				"/:id",
				describeRoute({
					tags: ["students"],
					description: "Delete a student by ID",
					responses: {
						204: {
							description: "Student deleted successfully",
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Student not found",
						},
					},
				}),
				async (c) => {
					const id = c.req.param("id");
					const tutorId = c.get("tutorId");
					await studentService.deleteStudent(id, tutorId);
					return c.body(null, 204);
				},
			)
	);
}

const studentRoutes = createStudentRoutes({
	requireAuth,
	studentService: new StudentService(studentRepository),
});

export default studentRoutes;
export type StudentRoutesType = typeof studentRoutes;
