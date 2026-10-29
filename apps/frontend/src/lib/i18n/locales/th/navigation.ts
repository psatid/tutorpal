import en from "../en/navigation";
import type { TranslationShape } from "../types";

const th = {
  home: "หน้าหลัก",
  students: "นักเรียน",
  classes: "ชั้นเรียน",
  courses: "หลักสูตร",
  schedules: "ตารางเรียน",
  schedulesWithAwaitingConfirmation:
    "ตารางเรียน มี {{count}} ช่วงเรียนที่ต้องยืนยัน",
  integrations: "การเชื่อมต่อ",
  settings: "การตั้งค่า",
  lineConnection: "การเชื่อมต่อ LINE",
  primaryNavigation: "การนำทางหลัก",
} as const satisfies TranslationShape<typeof en>;

export default th;
