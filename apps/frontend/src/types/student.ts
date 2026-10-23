import { z } from "zod";
import type { TFunction } from "i18next";

export function createStudentSchema(t: TFunction) {
  return z.object({
    name: z.string().min(2, t("students:validation.nameMin")),
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
        { message: t("students:validation.phoneInvalid") },
      ),
    grade: z.enum(["6", "7", "8", "9", "10", "11", "12"], {
      error: t("students:validation.gradeRequired"),
    }),
  });
}

export type StudentFormData = z.infer<ReturnType<typeof createStudentSchema>>;
