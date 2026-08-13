import en from "../en/common";
import type { TranslationShape } from "../types";

const th = {
	appName: "TutorPal",
	form: {
		email: "อีเมล",
		password: "รหัสผ่าน",
		confirmPassword: "ยืนยันรหัสผ่าน",
		showPassword: "แสดงรหัสผ่าน",
		hidePassword: "ซ่อนรหัสผ่าน",
		name: "ชื่อ",
		required: "จำเป็นต้องกรอกข้อมูลนี้",
		invalidEmail: "กรุณากรอกที่อยู่อีเมลที่ถูกต้อง",
		passwordTooShort: "กรุณาใช้รหัสผ่านอย่างน้อย 8 อักขระ",
		passwordsDoNotMatch: "รหัสผ่านไม่ตรงกัน",
	},
	profile: {
		greeting: "สวัสดี {{name}}",
		unknownName: "ไม่ทราบชื่อ",
		unknownEmail: "ไม่มีที่อยู่อีเมล",
	},
	accessibility: {
		toggleSidebar: "สลับแถบด้านข้าง",
		closeNamed: "ปิด {{title}}",
	},
	accessDenied: {
		title: "ต้องมีสิทธิ์ผู้ดูแลระบบ",
		description:
		"บัญชีของคุณเข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์จัดการผู้ใช้ในพอร์ทัลนี้",
		signOut: "ออกจากระบบ",
	},
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
