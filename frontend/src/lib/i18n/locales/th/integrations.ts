import en from "../en/integrations";
import type { TranslationShape } from "../types";

const th = {
  title: "การเชื่อมต่อ",
  description: "เชื่อมต่อเครื่องมือที่ใช้สอนและสื่อสารกับนักเรียน",
  groups: {
    messaging: "การส่งข้อความ",
    onlineClasses: "ห้องเรียนออนไลน์",
  },
  line: {
    name: "LINE",
    description: "ส่งข้อความถึงนักเรียนผ่าน LINE Official Account ของคุณ",
    connected: "เชื่อมต่อแล้ว",
    notConnected: "ยังไม่ได้เชื่อมต่อ",
    connectionError: "ไม่สามารถตรวจสอบการเชื่อมต่อ LINE ได้ กรุณาลองอีกครั้ง",
    setUp: "ตั้งค่า LINE",
    manage: "จัดการ",
  },
  zoom: {
    name: "Zoom",
    description: "สร้างและจัดการการประชุมสำหรับห้องเรียนออนไลน์",
    comingSoon: "เร็ว ๆ นี้",
  },
  googleMeet: {
    name: "Google Meet",
    description: "สร้างและจัดการการประชุมสำหรับห้องเรียนออนไลน์",
    comingSoon: "เร็ว ๆ นี้",
  },
  loadingLine: "กำลังโหลดการเชื่อมต่อ LINE",
  retry: "ลองอีกครั้ง",
  privacyNote: "ข้อมูลการเชื่อมต่อของคุณเข้ารหัสและใช้เฉพาะในพื้นที่ทำงานสอนของคุณ",
} as const satisfies TranslationShape<typeof en>;

export default th;
