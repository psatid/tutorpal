import en from "../en/settings";
import type { TranslationShape } from "../types";

const th = {
  title: "การตั้งค่า",
  logout: "ออกจากระบบ",
  exitTutorView: "ออกจากมุมมองผู้สอน",
  exitingTutorView: "กำลังออกจากมุมมองผู้สอน…",
  cancel: "ยกเลิก",
  language: "Language / ภาษา",
  logoutSuccess: "คุณออกจากระบบแล้ว",
  logoutError: "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
  account: {
    title: "บัญชี",
    description: "จัดการวิธีเข้าสู่ระบบ TutorPal ของคุณ",
    methodsTitle: "วิธีเข้าสู่ระบบ",
    methodsDescription: "เฉพาะวิธีเข้าสู่ระบบที่เชื่อมต่อแล้วเท่านั้นที่เข้าถึงบัญชีของคุณได้",
    checking: "กำลังตรวจสอบวิธีเข้าสู่ระบบ…",
    fetchError: "ไม่สามารถตรวจสอบวิธีเข้าสู่ระบบของคุณได้",
    retry: "ลองอีกครั้ง",
    linked: "เชื่อมต่อแล้ว",
    notLinked: "ยังไม่ได้เชื่อมต่อ",
    password: {
      title: "รหัสผ่าน",
      description: "เข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ",
    },
    google: {
      title: "Google",
      description: "เข้าสู่ระบบด้วยบัญชี Google ที่เชื่อมต่อกับ TutorPal",
    },
    line: {
      title: "LINE",
      description: "เชื่อมต่อ LINE หลังจากเข้าสู่ระบบด้วยรหัสผ่านหรือ Google",
      connect: "เชื่อมต่อ LINE",
      connecting: "กำลังเชื่อมต่อ LINE…",
      checking: "กำลังตรวจสอบความพร้อมใช้งานของการเข้าสู่ระบบด้วย LINE…",
      unavailable: "การเข้าสู่ระบบด้วย LINE ยังไม่พร้อมใช้งานในขณะนี้",
      availabilityError:
        "ไม่สามารถตรวจสอบความพร้อมใช้งานของการเข้าสู่ระบบด้วย LINE ได้ กรุณาลองอีกครั้ง",
      retryAvailability: "ลองอีกครั้ง",
      connected: "เชื่อมต่อ LINE กับบัญชีของคุณแล้ว",
      connectFailed: "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองอีกครั้ง",
      notReflected: "ยังไม่ได้เชื่อมต่อ LINE กรุณาลองอีกครั้ง",
    },
  },
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
    credentialsInvalid: "ข้อมูลรับรอง LINE ไม่ถูกต้อง โปรดตรวจสอบแล้วลองอีกครั้ง",
    connectionRequired: "เชื่อมต่อและยืนยันบัญชี LINE ของคุณก่อนดำเนินการต่อ",
    testRecipientRequired: "เชื่อมต่อบัญชี LINE ส่วนตัวสำหรับทดสอบก่อนดำเนินการต่อ",
    testAccountNotFriend:
      "เพิ่ม LINE Official Account ของคุณเป็นเพื่อน แล้วลองเชื่อมต่อบัญชีทดสอบอีกครั้ง",
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
