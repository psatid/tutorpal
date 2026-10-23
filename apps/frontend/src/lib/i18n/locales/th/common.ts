import en from "../en/common";
import type { TranslationShape } from "../types";

const th = {
  appName: "TutorPal",
  buttons: {
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    edit: "แก้ไข",
    create: "สร้าง",
    add: "เพิ่ม",
    search: "ค้นหา",
    signIn: "เข้าสู่ระบบ",
    continue: "ดำเนินการต่อ",
    signOut: "ออกจากระบบ",
    submit: "ส่ง",
  },
  form: {
    email: "อีเมล",
    password: "รหัสผ่าน",
    name: "ชื่อ",
    description: "รายละเอียด",
    required: "จำเป็นต้องกรอกข้อมูลนี้",
    invalidEmail: "กรุณากรอกที่อยู่อีเมลที่ถูกต้อง",
  },
  profile: {
    greeting: "สวัสดี {{name}}",
    unknownName: "ไม่ทราบชื่อ",
    unknownEmail: "ไม่มีที่อยู่อีเมล",
    avatarAlt: "รูปโปรไฟล์",
  },
  impersonation: {
    banner: {
      label: "การแจ้งเตือนมุมมองผู้สอน",
      title: "กำลังอยู่ในมุมมองผู้สอน",
      description: "คุณกำลังดู TutorPal ในฐานะ {{name}}",
      exitError: "ไม่สามารถกลับไปยังมุมมองผู้ดูแลระบบได้ โปรดลองอีกครั้ง",
      recovery:
        "เซสชันผู้ดูแลระบบเดิมของคุณไม่พร้อมใช้งานแล้ว โปรดเข้าสู่ระบบพอร์ทัลผู้ดูแลระบบอีกครั้ง",
      recoveryLink: "ไปยังหน้าเข้าสู่ระบบผู้ดูแล",
    },
  },
  accessibility: {
    toggleSidebar: "สลับแถบด้านข้าง",
    primaryNavigation: "การนำทางหลัก",
  },
  loading: "กำลังโหลด...",
  error: "เกิดข้อผิดพลาด",
  retry: "ลองอีกครั้ง",
  empty: "ไม่พบรายการ",
  today: "วันนี้",
  routeError: {
    title: "ไม่สามารถเปิดหน้านี้ได้",
    description:
      "เกิดข้อผิดพลาดขณะเปิด TutorPal งานของคุณยังปลอดภัย ลองอีกครั้งหรือกลับไปที่แดชบอร์ด",
    retry: "ลองอีกครั้ง",
    retrying: "กำลังลองอีกครั้ง…",
    dashboard: "ไปที่แดชบอร์ด",
  },
  notFound: {
    title: "ไม่พบหน้านี้",
    description:
      "ลิงก์อาจล้าสมัยหรือหน้านี้อาจย้ายไปแล้ว กลับไปที่ TutorPal กันเถอะ",
    dashboard: "ไปที่แดชบอร์ด",
  },
} as const satisfies TranslationShape<typeof en>;

export default th;
