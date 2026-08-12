import en from "../en/dashboard";
import type { TranslationShape } from "../types";

const th = {
  title: "แดชบอร์ด",
  description: "ศูนย์กลางสำหรับจัดการตารางสอนและนักเรียนของคุณ",
  stats: {
    activeStudents: "นักเรียนที่กำลังเรียน",
    classesToday: "ชั้นเรียนวันนี้",
  },
  today: {
    title: "วันนี้",
    description: "ช่วงเวลาสอนและสิ่งที่ต้องทำต่อจากนี้",
    openSchedule: "เปิดตารางเรียน",
    summary: "นัดหมาย {{count}} รายการ · วางแผน {{duration}}",
    agenda: "กำหนดการวันนี้",
    sessionToConfirm: "ช่วงเรียนที่ต้องยืนยัน",
    sessionToConfirmDescription: "เลือกวิธีบันทึกช่วงเรียนที่นัดหมายไว้นี้",
    noSessionToConfirmTitle: "ไม่มีรายการให้ยืนยัน",
    noSessionToConfirmDescription: "ไม่มีช่วงเรียนที่นัดไว้เหลือในวันนี้",
    noShowAction: "ไม่มาเรียน",
    loading: "กำลังโหลดช่วงเรียนของวันนี้…",
    waitingForConfirmation: "กำลังรอการยืนยันของคุณ…",
    updating: "กำลังอัปเดตช่วงเรียน…",
    sessions: "ช่วงเรียน",
    sessionCount_one: "{{count}} ช่วงเรียน",
    sessionCount_other: "{{count}} ช่วงเรียน",
    loadError: "ไม่สามารถโหลดช่วงเรียนของวันนี้ได้",
    retry: "ลองอีกครั้ง",
    emptyTitle: "ไม่มีช่วงเรียนที่นัดไว้",
    emptyDescription: "ตารางของคุณว่างสำหรับวันนี้",
    timezone: "เวลาที่แสดงเป็นเวลาท้องถิ่นของคุณ",
  },
} as const satisfies TranslationShape<typeof en>;

export default th;
