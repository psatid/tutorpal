import { z } from "zod";

export interface Student {
  id: string;
  name: string;
  phoneNumber: string | null;
  grade: number;
}

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        // Thailand phone format: 0xx-xxx-xxxx, 0812345678, +66812345678
        const thaiPhoneRegex =
          /^(\+66|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
        return thaiPhoneRegex.test(val);
      },
      { message: "Please enter a valid Thailand phone number" }
    ),
  grade: z
    .enum(["6", "7", "8", "9", "10", "11", "12"])
    .refine((val) => val !== undefined, {
      message: "Please select a grade level",
    }),
});

export type StudentFormData = z.infer<typeof studentSchema>;
