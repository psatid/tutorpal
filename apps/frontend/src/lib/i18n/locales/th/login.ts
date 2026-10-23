import en from "../en/login";
import type { TranslationShape } from "../types";

const th = {
  title: "TutorPal",
  tagline: "ยกระดับประสบการณ์การสอนของคุณ",
  welcomeBack: "ยินดีต้อนรับกลับ",
  enterCredentials: "กรอกข้อมูลเข้าสู่ระบบเพื่อเข้าถึงบัญชีของคุณ",
  emailPlaceholder: "กรอกอีเมลของคุณ",
  passwordPlaceholder: "กรอกรหัสผ่านของคุณ",
  forgotPassword: "ลืมรหัสผ่าน?",
  features: {
    studentManagement: {
      title: "จัดการนักเรียน",
      description: "จัดระเบียบและติดตามความก้าวหน้าของนักเรียน",
    },
    scheduleClasses: {
      title: "จัดตารางเรียน",
      description: "วางแผนและจัดการช่วงเวลาการสอนของคุณ",
    },
    classProgress: {
      title: "ความคืบหน้าของชั้นเรียน",
      description: "ติดตามผลการเรียนและความสำเร็จ",
    },
  },
} as const satisfies TranslationShape<typeof en>;

export default th;
