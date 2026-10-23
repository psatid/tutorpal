import en from "../en/courses";
import type { TranslationShape } from "../types";

const th = {
	title: "หลักสูตร",
	subtitle:
		"ชุดชั่วโมงและราคาที่ใช้ซ้ำได้สำหรับเพิ่มเวลาให้ชั้นเรียนเมื่อต้องการ",
	count_one: "{{count}} หลักสูตร",
	count_other: "{{count}} หลักสูตร",
	newCourse: "หลักสูตรใหม่",
	createCourse: "สร้างหลักสูตร",
	editCourse: "แก้ไขหลักสูตร",
	saveChanges: "บันทึกการเปลี่ยนแปลง",
	deleteCourse: "ลบหลักสูตร",
	deleteTitle: "ลบ {{name}}?",
	deleteDescription:
		"การดำเนินการนี้จะลบหลักสูตรที่ใช้ซ้ำนี้อย่างถาวร ชั่วโมงที่เพิ่มไปแล้วจะยังคงบันทึกอยู่กับชั้นเรียนนั้น",
	deleteSuccess: "ลบหลักสูตรแล้ว",
	deleteAlreadyRemoved: "หลักสูตรนี้ถูกลบไปแล้ว รายการหลักสูตรได้รับการรีเฟรชแล้ว",
	deletingCourse: "กำลังลบหลักสูตร…",
	deleteError: {
		unknown: "ไม่สามารถลบหลักสูตรนี้ได้ ลองอีกครั้งหรือยกเลิก",
	},
	cancel: "ยกเลิก",
	close: "ปิด",
	tryAgain: "ลองอีกครั้ง",
	formDescription: "กำหนดชั่วโมงและราคาที่ใช้ซ้ำได้สำหรับการเพิ่มครั้งต่อไป",
	searchLabel: "ค้นหาหลักสูตร",
	clearSearch: "ล้างคำค้นหา",
	reset: "รีเซ็ต",
	sortLabel: "เรียงลำดับ",
	actionsFor: "การดำเนินการสำหรับ {{name}}",
	searchCourses: "ค้นหาหลักสูตร",
	noCourses: "ยังไม่มีหลักสูตร",
	noMatches: "ไม่พบหลักสูตรที่ตรงกัน",
	noMatchesDescription: "ลองใช้ชื่อหลักสูตรอื่น",
	noCoursesDescription:
		"สร้างหลักสูตรที่ใช้ซ้ำได้เพื่อเพิ่มชั่วโมงที่ตั้งค่าไว้ให้ชั้นเรียนในภายหลัง",
	defaultHours: "ค่าเริ่มต้น {{hours}} ชั่วโมง",
	courseMetadataHourly: "ค่าเริ่มต้น {{hours}} ชั่วโมง · {{price}}/ชั่วโมง",
	courseMetadataFixed: "ค่าเริ่มต้น {{hours}} ชั่วโมง · แพ็กเกจ {{price}}",
	courseMetadataUnpriced: "ค่าเริ่มต้น {{hours}} ชั่วโมง · ยังไม่ได้ตั้งราคา",
	loadError: {
		title: "ไม่สามารถโหลดหลักสูตรได้",
		description: "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
	},
	sort: {
		"name-asc": "ชื่อ ก–ฮ",
		"createdAt-desc": "ใหม่ล่าสุดก่อน",
		"defaultTotalHours-desc": "ชั่วโมงมากที่สุด",
	},
	validation: {
		courseName: "กรุณากรอกชื่อหลักสูตร",
		hours: "กรุณากรอกจำนวนชั่วโมงที่มากกว่าศูนย์",
		priceRange: "กรุณากรอกจำนวนเงินตั้งแต่ ฿0.00 ถึง ฿9,999,999,999.99",
		pricePrecision: "กรุณากรอกราคาที่มีทศนิยมไม่เกินสองตำแหน่ง",
	},
	pricing: {
		hourly: "{{price}}/ชั่วโมง",
		fixed: "แพ็กเกจ {{price}}",
		unpriced: "ยังไม่ได้ตั้งราคา",
	},
	detail: {
		back: "กลับไปที่หลักสูตร",
		backToCourses: "กลับไปที่หลักสูตร",
		editCourse: "แก้ไขหลักสูตร",
		notFound: "ไม่พบหลักสูตร",
		loadError: {
			title: "ไม่สามารถโหลดรายละเอียดหลักสูตรได้",
			description: "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
		},
		refreshError: "รายละเอียดหลักสูตรอาจไม่เป็นปัจจุบัน ลองอีกครั้งเพื่อรีเฟรช",
		summary: {
			price: "ราคา",
			defaultHours: "ชั่วโมงเริ่มต้น",
			recordedHours: "ชั่วโมงที่บันทึกแล้ว",
			revenueMade: "รายได้ที่บันทึก",
		},
	},
	toast: {
		createSuccess: "สร้างหลักสูตรแล้ว",
		createError: "ไม่สามารถสร้างหลักสูตรนี้ได้",
		updateSuccess: "อัปเดตหลักสูตรแล้ว",
		updateError: "ไม่สามารถอัปเดตหลักสูตรนี้ได้",
	},
	form: {
		nameLabel: "ชื่อหลักสูตร",
		namePlaceholder: "เช่น คณิตศาสตร์",
		hoursLabel: "จำนวนชั่วโมงที่ตั้งไว้",
		hoursDescription:
			"จำนวนนี้จะถูกเพิ่มเมื่อคุณเลือกหลักสูตรนี้ให้ชั้นเรียน การเปลี่ยนแปลงมีผลกับการเพิ่มในอนาคตเท่านั้น",
		priceTypeLegend: "ประเภทราคา",
		hourlyRate: "อัตรารายชั่วโมง",
		hourlyRateOptionDescription:
			"คิดราคาเป็นบาทสำหรับทุกชั่วโมงของชุดชั่วโมงนี้",
		fixedPrice: "ราคาแพ็กเกจคงที่",
		fixedPriceOptionDescription:
			"คิดราคาเป็นบาทหนึ่งราคาสำหรับชุดชั่วโมงทั้งหมด",
		hourlyRateLabel: "อัตรารายชั่วโมง (บาท)",
		hourlyRateDescription: "อัตราต่อชั่วโมงเริ่มต้น เป็นบาท",
		fixedPriceLabel: "ราคาแพ็กเกจคงที่ (บาท)",
		fixedPriceDescription: "ราคาแพ็กเกจทั้งหมด เป็นบาท",
		priceOptional: "ไม่บังคับ — เว้นว่างไว้ได้หากยังไม่ได้กำหนดราคา",
		calculationPreview: "ตัวอย่างรายได้",
		calculationPending:
			"กรอกชั่วโมงและราคาให้ถูกต้องเพื่อดูรายได้เริ่มต้น",
		calculationValue: "{{amount}} สำหรับชุดชั่วโมงนี้",
		priceFutureAdditions: "การเปลี่ยนแปลงราคามีผลกับการเพิ่มในอนาคตเท่านั้น",
	},
} as const satisfies TranslationShape<typeof en>;

export default th;
