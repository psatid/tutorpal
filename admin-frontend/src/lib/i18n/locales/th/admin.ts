import en from "../en/admin";
import type { TranslationShape } from "../types";

const th = {
	login: {
		eyebrow: "ผู้ดูแลระบบ TutorPal",
		title: "เข้าสู่พอร์ทัลผู้ดูแลระบบ",
		subtitle:
			"จัดการการเข้าถึง TutorPal และสร้างบัญชีผู้ใช้จากพื้นที่ทำงานที่ปลอดภัย",
		emailPlaceholder: "admin@example.com",
		passwordPlaceholder: "กรอกรหัสผ่านของคุณ",
		submit: "เข้าสู่ระบบ",
		error: "ไม่สามารถเข้าสู่ระบบได้",
		footer:
			"บัญชีผู้ดูแลระบบถูกสร้างโดยเจ้าของแอปพลิเคชัน พอร์ทัลนี้ไม่เปิดให้สมัครสมาชิกสาธารณะ",
	},
	users: {
		title: "จัดการผู้ใช้",
		total: "ผู้ใช้ {{count}} คน",
		description: "สร้างและจัดการบัญชีผู้ใช้ทั่วไปของ TutorPal",
		listLabel: "ผู้ใช้",
		namePlaceholder: "อเล็กซ์ มอร์แกน",
		emailPlaceholder: "alex@example.com",
		passwordPlaceholder: "อย่างน้อย 8 อักขระ",
		columns: {
			user: "ผู้ใช้",
			verification: "การยืนยัน",
			status: "สถานะ",
			created: "สร้างเมื่อ",
			actions: "การดำเนินการ",
		},
		search: {
			label: "ค้นหาผู้ใช้",
			placeholder: "ค้นหาชื่อหรืออีเมล",
		},
		statusFilter: {
			label: "กรองตามสถานะ",
			all: "ทุกสถานะ",
		},
		status: {
			active: "ใช้งานอยู่",
			deactivated: "ปิดใช้งานแล้ว",
		},
		verification: {
			verified: "ยืนยันแล้ว",
			unverified: "ยังไม่ยืนยัน",
		},
		actions: {
			create: "สร้างผู้ใช้",
			edit: "แก้ไข",
			setPassword: "ตั้งรหัสผ่าน",
			resendVerification: "ส่งอีเมลยืนยันอีกครั้ง",
			deactivate: "ปิดใช้งาน",
			reactivate: "เปิดใช้งานอีกครั้ง",
			cancel: "ยกเลิก",
			clearFilters: "ล้างตัวกรอง",
			save: "บันทึกการเปลี่ยนแปลง",
			openFor: "เปิดการดำเนินการสำหรับ {{name}}",
		},
		create: {
			title: "สร้างผู้ใช้",
			description: "สร้างผู้ใช้ทั่วไปและส่งอีเมลยืนยัน",
		},
		edit: {
			title: "แก้ไขผู้ใช้",
			description: "อัปเดตชื่อหรืออีเมลของ {{name}}",
		},
		password: {
			title: "ตั้งรหัสผ่าน",
			description: "ตั้งรหัสผ่านใหม่ให้ {{name}} เซสชันที่มีอยู่จะถูกออกจากระบบ",
			confirmPlaceholder: "กรอกรหัสผ่านใหม่อีกครั้ง",
		},
		confirmDeactivate: {
			title: "ปิดใช้งานผู้ใช้นี้หรือไม่",
			description: "{{name}} จะไม่สามารถเข้าใช้ TutorPal ได้จนกว่าจะเปิดใช้งานอีกครั้ง",
		},
		confirmReactivate: {
			title: "เปิดใช้งานผู้ใช้นี้อีกครั้งหรือไม่",
			description: "{{name}} จะสามารถเข้าใช้ TutorPal ได้อีกครั้ง",
		},
		feedback: {
			created: "สร้างผู้ใช้และส่งอีเมลยืนยันแล้ว",
			createdWithoutVerification:
				"สร้างผู้ใช้แล้ว แต่ไม่สามารถส่งอีเมลยืนยันได้ คุณสามารถลองส่งอีกครั้งภายหลัง",
			updated: "อัปเดตผู้ใช้แล้ว",
			updatedWithoutVerification:
				"อัปเดตผู้ใช้แล้ว แต่ไม่สามารถส่งอีเมลยืนยันได้",
			passwordSet: "อัปเดตรหัสผ่านแล้ว",
			verificationSent: "ส่งอีเมลยืนยันแล้ว",
			deactivated: "ปิดใช้งานผู้ใช้แล้ว",
			reactivated: "เปิดใช้งานผู้ใช้อีกครั้งแล้ว",
		},
		errors: {
			generic: "ไม่สามารถดำเนินการได้ โปรดลองอีกครั้ง",
			emailInUse: "อีเมลนี้ถูกใช้งานแล้ว",
			notFound: "ไม่พบผู้ใช้นี้แล้ว",
			alreadyVerified: "อีเมลของผู้ใช้นี้ยืนยันแล้ว",
			verificationFailed: "ไม่สามารถส่งอีเมลยืนยันได้ โปรดลองอีกครั้ง",
		},
		error: {
			load: "ไม่สามารถโหลดรายชื่อผู้ใช้ได้",
			loadDescription: "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
			refresh: "ไม่สามารถรีเฟรชรายชื่อได้ กำลังแสดงรายชื่อผู้ใช้ล่าสุด",
		},
		retry: "ลองอีกครั้ง",
		loading: "กำลังโหลดผู้ใช้…",
		refreshing: "กำลังรีเฟรชรายชื่อผู้ใช้…",
		emptyInitial: {
			title: "ยังไม่มีผู้ใช้",
			description: "สร้างผู้ใช้คนแรกเพื่อให้เข้าถึง TutorPal",
		},
		emptyFiltered: {
			title: "ไม่พบผู้ใช้ที่ตรงกัน",
			description: "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ",
		},
		pagination: {
			label: "การแบ่งหน้าผู้ใช้",
			previous: "ก่อนหน้า",
			next: "ถัดไป",
			page: "หน้า {{page}} จาก {{totalPages}}",
			showing: "แสดง {{start}}–{{end}} จาก {{total}} คน",
		},
	},
} as const satisfies TranslationShape<typeof en>;

export default th;
