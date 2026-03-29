import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { studentRepository } from "../repositories";
import {
	CreateStudentSchema,
	CreateStudentSchemaResolver,
	StudentListSchemaResolver,
	StudentSchemaResolver,
	UpdateStudentSchema,
	UpdateStudentSchemaResolver,
} from "../schemas";
import { StudentService } from "../services";

// Initialize service with repository
const studentService = new StudentService(studentRepository);

const studentRoutes = new Hono()
	// Create student
	.post(
		"/",
		describeRoute({
			tags: ["students"],
			description: "Create a new student",
			requestBody: {
				content: {
					"application/json": {
						schema: CreateStudentSchemaResolver as any,
					},
				},
			},
			responses: {
				201: {
					description: "Student created successfully",
					content: {
						"application/json": {
							schema: StudentSchemaResolver as any,
						},
					},
				},
				400: {
					description: "Validation error",
				},
			},
		}),
		sValidator("json", CreateStudentSchema),
		async (c) => {
			const data = c.req.valid("json");
			const student = await studentService.createStudent(data);
			return c.json(student, 201);
		},
	)

	// List all students
	.get(
		"/",
		describeRoute({
			tags: ["students"],
			description: "Get all students",
			responses: {
				200: {
					description: "List of students",
					content: {
						"application/json": {
							schema: StudentListSchemaResolver as any,
						},
					},
				},
			},
		}),
		async (c) => {
			const students = await studentService.getAllStudents();
			return c.json(students);
		},
	)

	// Get single student
	.get(
		"/:id",
		describeRoute({
			tags: ["students"],
			description: "Get a student by ID",
			responses: {
				200: {
					description: "Student found",
					content: {
						"application/json": {
							schema: StudentSchemaResolver as any,
						},
					},
				},
				404: {
					description: "Student not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			const student = await studentService.getStudentById(id);
			return c.json(student);
		},
	)

	// Update student
	.put(
		"/:id",
		describeRoute({
			tags: ["students"],
			description: "Update a student by ID",
			requestBody: {
				content: {
					"application/json": {
						schema: UpdateStudentSchemaResolver as any,
					},
				},
			},
			responses: {
				200: {
					description: "Student updated successfully",
					content: {
						"application/json": {
							schema: StudentSchemaResolver as any,
						},
					},
				},
				404: {
					description: "Student not found",
				},
				400: {
					description: "Validation error",
				},
			},
		}),
		sValidator("json", UpdateStudentSchema),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");
			const student = await studentService.updateStudent(id, data);
			return c.json(student);
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
				404: {
					description: "Student not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			await studentService.deleteStudent(id);
			return c.body(null, 204);
		},
	);

export default studentRoutes;
export type StudentRoutesType = typeof studentRoutes;
