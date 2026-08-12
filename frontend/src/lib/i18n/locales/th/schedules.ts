import en from "../en/schedules";
import type { TranslationShape } from "../types";

const th = {
	title: "ตารางเรียน",
	managingCount: "กำลังจัดการช่วงเรียนที่นัดไว้ {{count}} รายการในเทอมนี้",
	managingCount_plural: "กำลังจัดการช่วงเรียนที่นัดไว้ {{count}} รายการในเทอมนี้",
	searchPlaceholder: "ค้นหาตามชั้นเรียน...",
	loading: "กำลังโหลดตารางเรียน...",
	error: {
		title: "ไม่สามารถโหลดตารางเรียนได้",
		description: "กรุณาลองอีกครั้ง",
		retry: "ลองอีกครั้ง",
	},
	duration: "{{minutes}} นาที",
	durationHours: "{{hours}} ชม.",
	durationHoursMinutes: "{{hours}} ชม. {{minutes}} นาที",
	validation: {
		classRequired: "จำเป็นต้องเลือกชั้นเรียน",
		dateRequired: "จำเป็นต้องเลือกวันที่",
		typeRequired: "กรุณาเลือกประเภทช่วงเรียน",
		durationRequired: "ระยะเวลาต้องอย่างน้อย 1 นาที",
		invalidTime: "รูปแบบเวลาไม่ถูกต้อง",
		weekdayRequired: "ต้องเลือกอย่างน้อยหนึ่งวันในสัปดาห์",
		timeRequired: "จำเป็นต้องระบุเวลาสำหรับช่วงเรียนครั้งเดียว",
		effectiveDateRequired: "จำเป็นต้องเลือกวันที่มีผล",
	},
	toast: {
		createSuccess: "สร้างช่วงเรียนแล้ว",
		createError: "ไม่สามารถสร้างช่วงเรียนได้ กรุณาลองอีกครั้ง",
		updateSuccess: "อัปเดตช่วงเรียนแล้ว",
		updateError: "ไม่สามารถอัปเดตช่วงเรียนได้ กรุณาลองอีกครั้ง",
		deleteSuccess: "ลบช่วงเรียนแล้ว",
		deleteError: "ไม่สามารถลบช่วงเรียนได้ กรุณาลองอีกครั้ง",
		completeSuccess: "บันทึกช่วงเรียนเสร็จสมบูรณ์และหักชั่วโมงแล้ว",
		completeError: "ไม่สามารถบันทึกช่วงเรียนได้ กรุณาลองอีกครั้ง",
		restoreSuccess: "คืนชั่วโมงแล้ว",
		restoreError: "ไม่สามารถคืนชั่วโมงได้ กรุณาลองอีกครั้ง",
		recurringUpdateSuccess: "อัปเดตตารางเรียนซ้ำแล้ว",
		recurringUpdateError:
			"ไม่สามารถอัปเดตตารางเรียนซ้ำได้ กรุณาลองอีกครั้ง",
	},
	noSchedules: "ยังไม่มีช่วงเรียน",
	noSchedulesDescription: "สร้างช่วงเรียนแรกของคุณเพื่อเริ่มต้น",
	weekNoSchedules: "ไม่มีช่วงเรียนในสัปดาห์นี้",
	weekNoSchedulesDescription:
		"สร้างช่วงเรียนเพื่อดูรูปแบบของสัปดาห์คุณที่นี่",
	weekNoResults: "ไม่พบช่วงเรียนที่ตรงกันในสัปดาห์นี้",
	noResults: "ไม่พบช่วงเรียน",
	status: {
		SCHEDULED: "นัดไว้",
		COMPLETED: "เสร็จสิ้น",
		NO_SHOW: "ไม่มาเรียน",
		CANCELLED: "ยกเลิก",
	},
	type: {
		ON_SITE: "พบที่สถานที่",
		ONLINE: "ออนไลน์",
	},
	delete: {
		confirm: "คุณแน่ใจหรือไม่ว่าต้องการลบช่วงเรียนนี้?",
		confirmButton: "ลบ",
		cancelButton: "ยกเลิก",
	},
	complete: {
		action: "เสร็จสิ้น",
		confirm: "บันทึกช่วงเรียนนี้ว่าเสร็จสิ้นและหัก {{hours}} ชั่วโมงหรือไม่?",
		confirmButton: "เสร็จสิ้น",
		cancelButton: "ยกเลิก",
	},
	noShow: {
		action: "บันทึกว่าไม่มาเรียน",
		confirm:
			"บันทึกว่าผู้เรียนไม่มาเรียนในช่วงนี้หรือไม่? ชั่วโมง {{hours}} จะยังถูกจองไว้",
		confirmButton: "บันทึกว่าไม่มาเรียน",
		cancelButton: "ยกเลิก",
	},
	restore: {
		action: "คืนชั่วโมง",
		confirm: "คืน {{hours}} ชั่วโมงสำหรับช่วงเรียนนี้หรือไม่?",
		confirmButton: "คืนชั่วโมง",
		cancelButton: "ยกเลิก",
	},
	recurring: {
		sectionTitle: "ตารางเรียนซ้ำ",
		emptyDescription:
			"กำหนดรูปแบบรายสัปดาห์สำหรับชั้นเรียนนี้เพื่อให้ช่วงเรียนในอนาคตสอดคล้องกัน",
		noAvailabilityDescription:
			"เพิ่มชั่วโมงก่อนสร้างตารางเรียนซ้ำ",
		addHoursAction: "เพิ่มชั่วโมง",
		createAction: "สร้างตารางเรียนซ้ำ",
		editAction: "แก้ไขตารางเรียนซ้ำ",
		saveAction: "บันทึกการเปลี่ยนแปลง",
		cancelAction: "ยกเลิก",
		confirmAction: "สร้างช่วงเรียนในอนาคตใหม่",
		startsOn: "เริ่ม {{date}}",
		editHint:
			"การแก้ไขจะสร้างรูปแบบใหม่สำหรับอนาคตตั้งแต่วันที่มีผล ช่วงเรียนที่ผ่านมาไม่เปลี่ยนแปลง",
		untouchedTitle: "ช่วงเรียนที่ผ่านมาไม่เปลี่ยนแปลง",
		untouchedDescription:
			"จะสร้างใหม่เฉพาะช่วงเรียนที่สร้างอัตโนมัติตั้งแต่วันที่เลือกเป็นต้นไป",
		startDateLabel: "วันที่เริ่ม",
		startDateCaption:
			"วันแรกที่ตารางเรียนซ้ำนี้เริ่มสร้างช่วงเรียน",
		effectiveDateLabel: "วันที่มีผล",
		effectiveDateCaption:
			"วันแรกที่ TutorPal ควรเปลี่ยนไปใช้รูปแบบตารางเรียนใหม่",
		previewTitle: "ก่อนบันทึก",
		previewDescription:
			"ตั้งแต่ {{date}} เป็นต้นไป ช่วงเรียนในอนาคตที่สร้างไว้ {{count}} รายการจะถูกแทนที่",
		confirmTitle: "อัปเดตตารางเรียนซ้ำหรือไม่?",
		confirmDescription:
			"ตั้งแต่ {{date}} เป็นต้นไป TutorPal จะสร้างช่วงเรียนในอนาคต {{count}} รายการใหม่ตามรูปแบบนี้ ประเภท: {{type}} ช่วงเรียนที่ผ่านมาจะไม่เปลี่ยนแปลง",
		previewType: "ประเภทช่วงเรียน: {{type}}",
		typeNotSelected: "ประเภทช่วงเรียนที่เลือก",
		notSelected: "วันที่ที่คุณเลือก",
		drawer: {
			createTitle: "สร้างตารางเรียนซ้ำ",
			editTitle: "แก้ไขตารางเรียนซ้ำ",
		},
	},
	view: "ดู",
	actionsFor: "การดำเนินการสำหรับ {{name}}",
	remainingHours: "เหลือ {{hours}} ชม.",
	drawer: {
		createTitle: "เพิ่มช่วงเรียนใหม่",
		editTitle: "แก้ไขช่วงเรียน",
		viewTitle: "รายละเอียดช่วงเรียน",
		editButton: "แก้ไข",
		updateButton: "อัปเดตช่วงเรียน",
		closeButton: "ปิด",
		cancelButton: "ยกเลิก",
		class: {
			label: "ชั้นเรียน",
			caption: "จำเป็น",
			placeholder: "เลือกชั้นเรียน",
		},
		date: {
			label: "วันที่",
			caption: "จำเป็น",
			recurringLabel: "วันที่เริ่ม",
			recurringCaption: "ครั้งแรกของตารางเรียนซ้ำนี้",
		},
		time: {
			label: "เวลา",
			caption: "จำเป็น",
		},
		duration: {
			label: "ระยะเวลา (นาที)",
			caption: "จำเป็น",
			placeholder: "เช่น 60",
		},
		notes: {
			label: "บันทึก",
			caption: "ไม่บังคับ",
			placeholder: "เพิ่มบันทึก...",
		},
		status: {
			label: "สถานะ",
			caption: "จำเป็น",
			placeholder: "เลือกสถานะ",
		},
		type: {
			label: "ประเภทช่วงเรียน",
			caption: "เลือกสถานที่ที่จะจัดช่วงเรียนนี้",
			error: "กรุณาเลือกประเภทช่วงเรียน",
		},
		recurring: {
			label: "ทำซ้ำทุกสัปดาห์",
			startDate: {
				label: "วันที่เริ่ม",
				caption: "ครั้งแรกของตารางเรียนซ้ำนี้",
			},
		},
		weekdayTime: {
			label: "ตารางเรียน",
			caption:
				"เลือกวันในสัปดาห์ เวลา และระยะเวลาสำหรับช่วงเรียนซ้ำ",
			selectAll: "เลือกทั้งหมด",
			clearAll: "ล้างทั้งหมด",
			timeLabel: "เวลา",
			timeCaption: "จำเป็น",
			durationLabel: "ระยะเวลา (นาที)",
			durationCaption: "จำเป็น",
			durationPlaceholder: "เช่น 60",
			weekdays: {
				MONDAY: "วันจันทร์",
				TUESDAY: "วันอังคาร",
				WEDNESDAY: "วันพุธ",
				THURSDAY: "วันพฤหัสบดี",
				FRIDAY: "วันศุกร์",
				SATURDAY: "วันเสาร์",
				SUNDAY: "วันอาทิตย์",
			},
		},
	},
	addSchedule: "เพิ่มช่วงเรียน",
	description: "ดูและจัดการปฏิทินการสอนและช่วงเรียนที่กำลังจะมาถึง",
	empty: "ไม่พบช่วงเรียน สร้างช่วงเรียนแรกของคุณเพื่อเริ่มต้น",
	filter: {
		all: "ทั้งหมด",
	},
	classSelector: {
		title: "เลือกชั้นเรียน",
		searchPlaceholder: "ค้นหาตามชั้นเรียนหรือนักเรียน...",
		noClasses: "ยังไม่มีชั้นเรียน",
		noResults: "ไม่พบชั้นเรียน",
		selectButton: "เลือก",
		remainingHours: "เหลือ {{hours}} ชม.",
	},
	classNoAvailability: {
		description:
			"ชั้นเรียนนี้ไม่มีชั่วโมงคงเหลือ เพิ่มชั่วโมงก่อนนัดช่วงเรียน",
		addHours: "เพิ่มชั่วโมง",
	},
	classAvailability: {
		loading: "กำลังตรวจสอบชั่วโมงคงเหลือของชั้นเรียนนี้…",
		loadError:
			"ไม่สามารถโหลดชั่วโมงคงเหลือของชั้นเรียนนี้ได้ ลองอีกครั้งก่อนนัดช่วงเรียน",
	},
	weekSelector: {
		today: "วันนี้",
		selected: "เลือกแล้ว",
		selectedWeek: "สัปดาห์ที่เลือก",
		containsToday: "มีวันนี้อยู่",
		openCalendar: "เปิดปฏิทินสำหรับ {{month}}",
		openWeekCalendar: "เปิดปฏิทินสำหรับ {{week}}",
		dateRailLabel: "ตัวเลือกวันที่ของตารางเรียน",
		dateRailInstruction:
			"เลื่อนในแนวนอนเพื่อดูวันที่ ใช้ปุ่มลูกศรซ้ายและขวาเพื่อเลือกวัน ใช้ Page Up และ Page Down เพื่อเลื่อนทีละสัปดาห์",
		weekRailLabel: "ตัวเลือกสัปดาห์ของตารางเรียน",
		weekRailInstruction:
			"เลื่อนในแนวนอนเพื่อดูสัปดาห์ ใช้ปุ่มลูกศรซ้ายและขวาเพื่อเลือกสัปดาห์ ใช้ Page Up และ Page Down เพื่อเลื่อนทีละสี่สัปดาห์",
		weekLabel: "สัปดาห์ตั้งแต่ {{start}} ถึง {{end}}",
	},
	viewMode: {
		label: "มุมมองตารางเรียน",
		day: "วัน",
		week: "สัปดาห์",
	},
	timeline: {
		label: "ไทม์ไลน์ตารางเรียนรายสัปดาห์",
		previousWeek: "สัปดาห์ก่อนหน้า",
		nextWeek: "สัปดาห์ถัดไป",
		openCalendar: "เลือกวันที่ใน {{week}}",
		eventLabel:
			"{{className}} วันที่ {{date}} เวลา {{startTime}} ถึง {{endTime}} สถานะ {{status}} ประเภท {{type}}",
	},
} as const satisfies TranslationShape<typeof en>;

export default th;
