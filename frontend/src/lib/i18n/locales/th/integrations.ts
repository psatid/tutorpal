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
  lineConfiguration: {
    allIntegrations: "การเชื่อมต่อทั้งหมด",
    supported: "รองรับ",
    description: "เชื่อมต่อ LINE Official Account เพื่อส่งข้อความจากพื้นที่ทำงานสอนของคุณ",
    loading: "กำลังตรวจสอบการเชื่อมต่อ LINE",
    connectionError: {
      title: "ไม่สามารถตรวจสอบ LINE ได้",
    },
    connectionStatus: {
      credentialsConfigured: "ตั้งค่าข้อมูลรับรองแล้ว",
      testRecipientConnected: "เชื่อมต่อผู้รับทดสอบแล้ว",
    },
    account: {
      basicId: "Basic ID",
      lastVerified: "ตรวจสอบล่าสุด",
    },
    setupProgress: {
      title: "การตั้งค่า LINE",
      step: "ขั้นตอนที่ {{number}}",
      steps: {
        credentials: "บันทึกข้อมูลรับรอง",
        testRecipient: "เชื่อมต่อผู้รับทดสอบ",
        testMessage: "ส่งข้อความทดสอบ",
      },
      status: {
        complete: "เสร็จแล้ว",
        next: "ขั้นตอนถัดไป",
        available: "พร้อมใช้งาน",
        upcoming: "ดำเนินการขั้นตอนก่อนหน้าให้เสร็จก่อน",
      },
    },
    testRecipient: {
      title: "เชื่อมต่อผู้รับทดสอบ",
      description: "อนุญาตบัญชี LINE ที่เพิ่ม Official Account ของคุณแล้ว",
      action: "เชื่อมต่อผู้รับทดสอบ",
    },
    testMessage: {
      title: "ส่งข้อความทดสอบ",
      description: "ส่งข้อความไปยังผู้รับทดสอบที่อนุญาตแล้ว",
      action: "ส่งข้อความทดสอบ",
    },
    credentials: {
      title: "ข้อมูลรับรอง LINE",
      summaryDescription: "อัปเดตข้อมูลรับรองสำหรับการเชื่อมต่อ LINE นี้",
      connectTitle: "เชื่อมต่อ LINE",
      editTitle: "อัปเดตข้อมูลรับรอง LINE",
      description: "กรอกข้อมูลรับรองจาก LINE Developers Console ระบบจะไม่แสดงค่าลับที่บันทึกไว้ที่นี่",
      accessToken: "Messaging API channel access token",
      accessTokenHelp: "ใช้ long-lived channel access token จาก Messaging API channel ของคุณ",
      loginChannelId: "LINE Login channel ID",
      loginChannelIdHelp: "ใช้ channel ID จาก LINE Login channel ของคุณ",
      loginChannelSecret: "LINE Login channel secret",
      loginChannelSecretHelp: "ใช้ channel secret จาก LINE Login channel ของคุณ",
      required: "จำเป็น",
      save: "บันทึกข้อมูลรับรอง",
      edit: "แก้ไขข้อมูลรับรอง",
    },
    actions: {
      cancel: "ยกเลิก",
    },
    about: {
      title: "เกี่ยวกับ LINE",
      capabilitiesTitle: "สิ่งที่ทำได้",
      capabilitiesDescription: "ส่งข้อความการสอนและทดสอบการส่งผ่าน LINE Official Account ของคุณ",
      requirementsTitle: "สิ่งที่ต้องเตรียม",
      requirements: {
        officialAccount: "LINE Official Account",
        channels: "Messaging API channel และ LINE Login channel",
        testRecipient: "บัญชีทดสอบที่เพิ่ม Official Account ของคุณแล้ว",
      },
      developersConsole: "เปิด LINE Developers Console",
    },
    messages: {
      saved: "บันทึกข้อมูลรับรอง LINE แล้ว",
      saveFailed: "ไม่สามารถบันทึกข้อมูลรับรอง LINE ได้ กรุณาลองอีกครั้ง",
      connectTestFailed: "ไม่สามารถเริ่มการอนุญาตผู้รับทดสอบได้ กรุณาลองอีกครั้ง",
      testSent: "ส่งข้อความทดสอบแล้ว",
      testFailed: "ไม่สามารถส่งข้อความทดสอบได้ กรุณาลองอีกครั้ง",
      testAccountConnected: "เชื่อมต่อผู้รับทดสอบแล้ว",
      testAccountFailed: "ไม่สามารถเชื่อมต่อผู้รับทดสอบได้ กรุณาลองอีกครั้ง",
    },
    errors: {
      credentialsInvalid: "ข้อมูลรับรอง LINE ไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง",
      connectionRequired: "บันทึกข้อมูลรับรอง LINE ก่อนดำเนินการนี้",
      testRecipientRequired: "เชื่อมต่อผู้รับทดสอบก่อนส่งข้อความทดสอบ",
      testAccountNotFriend: "บัญชีทดสอบต้องเพิ่ม LINE Official Account ของคุณก่อน",
    },
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
