import en from "../en/settings";
import type { TranslationShape } from "../types";

const th = {
  title: "การตั้งค่า",
  logout: "ออกจากระบบ",
  cancel: "ยกเลิก",
  language: "Language / ภาษา",
  logoutSuccess: "คุณออกจากระบบแล้ว",
  logoutError: "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
  line: {
    title: "การเชื่อมต่อ LINE",
    description: "เชื่อมต่อ LINE Official Account ของคุณเพื่อส่งข้อความถึงนักเรียน",
    connected: "เชื่อมต่อแล้ว",
    notConnected: "ยังไม่ได้เชื่อมต่อ",
    checking: "กำลังตรวจสอบการเชื่อมต่อ…",
    connectionError: "ไม่สามารถตรวจสอบการเชื่อมต่อ LINE ได้",
    retry: "ลองอีกครั้ง",
    saved: "บันทึกและยืนยันการเชื่อมต่อ LINE แล้ว",
    saveFailed: "ไม่สามารถบันทึกการเชื่อมต่อ LINE ได้",
    connectTitle: "เชื่อมต่อบัญชีทางการของคุณ",
    updateTitle: "อัปเดตข้อมูลรับรอง",
    setupHelp:
      "ช่อง Messaging API และ LINE Login ต้องอยู่ภายใต้ผู้ให้บริการ LINE เดียวกัน",
    accessToken: "โทเค็นเข้าถึงช่อง Messaging API",
    accessTokenHelp:
      "TutorPal เก็บโทเค็นนี้อย่างปลอดภัยและใช้เพื่อส่งข้อความของคุณเท่านั้น",
    loginChannelId: "รหัสช่อง LINE Login",
    loginChannelSecret: "รหัสลับช่อง LINE Login",
    saveAndVerify: "บันทึกและยืนยัน",
    lastVerified: "ยืนยันล่าสุด {{date}}",
    testTitle: "บัญชีทดสอบ",
    testSetup:
      "เชื่อมต่อบัญชี LINE ส่วนตัวของคุณก่อน เพิ่ม Official Account ของคุณเป็นเพื่อนก่อนดำเนินการต่อ",
    testReady:
      "ส่งข้อความทดสอบแบบส่วนตัวเพื่อยืนยันว่า Official Account ของคุณพร้อมใช้งาน",
    connectTestAccount: "เชื่อมต่อบัญชีทดสอบ",
    connectTestFailed: "ไม่สามารถเริ่ม LINE Login ได้ กรุณาลองอีกครั้ง",
    testAccountConnected: "เชื่อมต่อบัญชี LINE ทดสอบของคุณแล้ว",
    testAccountFailed:
      "ไม่สามารถเชื่อมต่อบัญชีทดสอบนั้นได้ ตรวจสอบว่าคุณได้เพิ่ม Official Account เป็นเพื่อนแล้ว",
    sendTest: "ส่งข้อความทดสอบ",
    testSent: "ส่งข้อความทดสอบไปยังบัญชี LINE ส่วนตัวของคุณแล้ว",
    testFailed: "ไม่สามารถส่งข้อความทดสอบได้",
    credentials: "ข้อมูลรับรอง",
    credentialsDescription:
      "โทเค็นที่บันทึกไว้ของคุณจะถูกซ่อนไว้ อัปเดตเฉพาะเมื่อช่อง LINE ของคุณเปลี่ยนแปลง",
    editCredentials: "แก้ไขข้อมูลรับรอง",
    privacyNote:
      "ข้อมูลรับรองของคุณถูกเข้ารหัสและใช้สำหรับข้อความการสอนของคุณเท่านั้น",
    studentLink: "ไปที่นักเรียน",
  },
} as const satisfies TranslationShape<typeof en>;

export default th;
