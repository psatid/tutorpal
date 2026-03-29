import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { prisma } from "../lib/db";
import { AppError } from "../lib/error";

// Validation schemas
const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  grade: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreateStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().optional(),
  grade: z.number().int(),
});

const UpdateStudentSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phoneNumber: z.string().optional(),
  grade: z.number().int().optional(),
});

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
            schema: resolver(CreateStudentSchema) as any,
          },
        },
      },
      responses: {
        201: {
          description: "Student created successfully",
          content: {
            "application/json": {
              schema: resolver(StudentSchema) as any,
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

      const student = await prisma.student.create({
        data: {
          name: data.name,
          phoneNumber: data.phoneNumber || null,
          grade: data.grade,
        },
      });

      return c.json(
        {
          ...student,
          createdAt: student.createdAt.toISOString(),
          updatedAt: student.updatedAt.toISOString(),
        },
        201
      );
    }
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
              schema: resolver(z.array(StudentSchema)) as any,
            },
          },
        },
      },
    }),
    async (c) => {
      const students = await prisma.student.findMany({
        orderBy: { createdAt: "desc" },
      });

      return c.json(
        students.map((student) => ({
          ...student,
          createdAt: student.createdAt.toISOString(),
          updatedAt: student.updatedAt.toISOString(),
        }))
      );
    }
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
              schema: resolver(StudentSchema) as any,
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

      const student = await prisma.student.findUnique({
        where: { id },
      });

      if (!student) {
        throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
      }

      return c.json({
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      });
    }
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
            schema: resolver(UpdateStudentSchema) as any,
          },
        },
      },
      responses: {
        200: {
          description: "Student updated successfully",
          content: {
            "application/json": {
              schema: resolver(StudentSchema) as any,
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

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
      }

      const student = await prisma.student.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.phoneNumber !== undefined && {
            phoneNumber: data.phoneNumber || null,
          }),
          ...(data.grade !== undefined && { grade: data.grade }),
        },
      });

      return c.json({
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      });
    }
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

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
      }

      await prisma.student.delete({
        where: { id },
      });

      return c.body(null, 204);
    }
  );

export default studentRoutes;
export type StudentRoutesType = typeof studentRoutes;
