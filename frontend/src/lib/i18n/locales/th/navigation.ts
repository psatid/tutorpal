import en from "../en/navigation";
import type { TranslationShape } from "../types";

const th = {
  home: "หน้าหลัก",
  students: "นักเรียน",
  classes: "ชั้นเรียน",
  courses: "หลักสูตร",
  schedules: "ตารางเรียน",
  settings: "การตั้งค่า",
  primaryNavigation: "การนำทางหลัก",
} as const satisfies TranslationShape<typeof en>;

export default th;
