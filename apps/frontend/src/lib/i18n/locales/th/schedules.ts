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
	awaitingConfirmation: {
		banner: {
			label_one: "มี {{count}} ช่วงเรียนที่ต้องยืนยัน",
			label_other: "มี {{count}} ช่วงเรียนที่ต้องยืนยัน",
			title_one: "มี {{count}} ช่วงเรียนที่ต้องยืนยัน",
			title_other: "มี {{count}} ช่วงเรียนที่ต้องยืนยัน",
			description:
				"ช่วงเรียนที่ค้างยืนยันเก่าที่สุดคือ {{date}} ยืนยันเพื่อให้ชั่วโมงของผู้เรียนถูกต้อง",
			descriptionFallback: "ยืนยันช่วงเรียนเพื่อให้ชั่วโมงของผู้เรียนถูกต้อง",
			action: "ตรวจสอบช่วงเรียน",
		},
		drawer: {
			title: "ช่วงเรียนที่ต้องยืนยัน",
			description: "เรียงจากช่วงเรียนที่เก่าที่สุดก่อน",
			listLabel: "ช่วงเรียนที่รอยืนยัน",
			loading: "กำลังโหลดช่วงเรียนที่ต้องยืนยัน…",
			error: "ไม่สามารถโหลดช่วงเรียนที่ต้องยืนยันได้",
			retry: "ลองอีกครั้ง",
			loadingMore: "กำลังโหลดช่วงเรียนที่ต้องยืนยันเพิ่ม…",
			loadMoreError: "ไม่สามารถโหลดช่วงเรียนที่ต้องยืนยันเพิ่มได้",
			allCaughtUpTitle: "จัดการครบแล้ว",
			allCaughtUpDescription:
				"ช่วงเรียนทั้งหมดที่ต้องบันทึกผลได้รับการจัดการแล้ว",
			completeAction:
				"บันทึก {{className}} เวลา {{time}} ระยะเวลา {{duration}} ว่าเสร็จสิ้น",
			noShowAction:
				"บันทึก {{className}} เวลา {{time}} ระยะเวลา {{duration}} ว่าไม่มาเรียน",
		},
	},
	validation: {
		classRequired: "จำเป็นต้องเลือกชั้นเรียน",
		dateRequired: "จำเป็นต้องเลือกวันที่",
		typeRequired: "กรุณาเลือกประเภทช่วงเรียน",
		durationRequired: "ระยะเวลาต้องอย่างน้อย 1 นาที",
		invalidTime: "รูปแบบเวลาไม่ถูกต้อง",
		weekdayRequired: "ต้องเลือกอย่างน้อยหนึ่งวันในสัปดาห์",
		overlappingWeekdayTimes: "ช่วงเรียนที่เกิดซ้ำต้องไม่ทับซ้อนกัน",
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
		noShowDeductSuccess: "บันทึกว่าไม่มาเรียนแล้ว ชั่วโมงยังคงถูกจองไว้",
		noShowReleaseSuccess: "ยกเลิกช่วงเรียนและคืนชั่วโมงแล้ว",
		noShowError: "ไม่สามารถบันทึกว่าไม่มาเรียนได้ กรุณาลองอีกครั้ง",
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
		title: "ทำเครื่องหมายว่าช่วงเรียนนี้เสร็จสิ้นหรือไม่?",
		confirm_one:
			"ช่วงเรียนนี้จะถูกบันทึกว่าเสร็จสิ้นและจะหัก {{hours}} ชั่วโมง",
		confirm_other:
			"ช่วงเรียนนี้จะถูกบันทึกว่าเสร็จสิ้นและจะหัก {{hours}} ชั่วโมง",
		confirmButton: "เสร็จสิ้น",
		cancelButton: "ยกเลิก",
	},
	noShow: {
		action: "ไม่มาเรียน",
		confirm:
			"บันทึกว่าผู้เรียนไม่มาเรียนในช่วงนี้หรือไม่? ชั่วโมง {{hours}} จะยังถูกจองไว้",
		confirmButton: "บันทึกว่าไม่มาเรียน",
		cancelButton: "ยกเลิก",
		title: "บันทึกว่าไม่มาเรียน",
		description:
			"เลือกวิธีจัดการชั่วโมงที่จองไว้สำหรับช่วงเรียนนี้ และเพิ่มบันทึกการไม่มาเรียนแยกต่างหากได้",
		session: {
			date: "วันที่",
			time: "เวลา",
			duration: "ระยะเวลา",
			endDateTime: "สิ้นสุดวันที่ {{date}} เวลา {{time}}",
			endDayOffset_one: "(+{{count}} วัน)",
			endDayOffset_other: "(+{{count}} วัน)",
		},
		outcome: {
			label: "ต้องการจัดการชั่วโมงที่จองไว้อย่างไร?",
			deduct: {
				title: "คงชั่วโมงที่จองไว้",
				description: "บันทึกว่าไม่มาเรียนและหัก {{hours}} ชั่วโมง",
			},
			release: {
				title: "คืนชั่วโมง",
				description: "ยกเลิกช่วงเรียนและคืน {{hours}} ชั่วโมง",
			},
		},
		note: {
			label: "บันทึกการไม่มาเรียน",
			caption: "ไม่บังคับ และแยกจากบันทึกของช่วงเรียน",
			placeholder: "เพิ่มบันทึกเกี่ยวกับการไม่มาเรียน...",
			displayLabel: "บันทึกการไม่มาเรียน",
		},
		submitDeduct: "บันทึกว่าไม่มาเรียนและหัก {{hours}} ชม.",
		submitRelease: "ยกเลิกช่วงเรียนและคืน {{hours}} ชม.",
		submitChooseOutcome: "เลือกวิธีจัดการชั่วโมง",
	},
	restore: {
		action: "คืนค่า",
		confirm: "คืน {{hours}} ชั่วโมงสำหรับช่วงเรียนนี้หรือไม่?",
		confirmButton: "คืนชั่วโมง",
		cancelButton: "ยกเลิก",
	},
	recurring: {
		sectionTitle: "ตารางเรียนซ้ำ",
		emptyDescription:
			"กำหนดรูปแบบรายสัปดาห์สำหรับชั้นเรียนนี้เพื่อให้ช่วงเรียนในอนาคตสอดคล้องกัน",
		noAvailabilityDescription:
			"{{balance}} เพิ่มชั่วโมงก่อนสร้างตารางเรียนซ้ำ",
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
		actions: {
			label: "การดำเนินการสำหรับช่วงเรียน",
		},
		class: {
			label: "ชั้นเรียน",
			placeholder: "เลือกชั้นเรียน",
		},
		date: {
			label: "วันที่",
			recurringLabel: "วันที่เริ่ม",
			recurringCaption: "ครั้งแรกของตารางเรียนซ้ำนี้",
		},
		time: {
			label: "เวลา",
			placeholder: "เลือกเวลา",
		},
		duration: {
			label: "ระยะเวลา",
			placeholder: "เลือกระยะเวลา",
		},
		notes: {
			label: "บันทึก",
			caption: "ไม่บังคับ",
			placeholder: "เพิ่มบันทึก...",
		},
		status: {
			label: "สถานะ",
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
			timeLabel: "เวลา — {{interval}}",
			durationLabel: "ระยะเวลา (นาที) — {{interval}}",
			durationSelectLabel: "ระยะเวลา — {{interval}}",
			durationPlaceholder: "เช่น 60",
			interval: "ช่วงเรียนที่ {{number}}",
			intervalLabel: "{{weekday}} ช่วงเรียนที่ {{number}}",
			add: "เพิ่มช่วงเรียน",
			addInterval: "เพิ่มช่วงเรียนใน{{weekday}}",
			remove: "ลบ",
			removeInterval: "ลบช่วงเรียนที่ {{number}} ใน{{weekday}}",
			noMoreIntervals:
				"ไม่มีเวลาเริ่มที่ช้ากว่าสำหรับ{{weekday}}แล้ว",
			overlap: "ช่วงเรียนที่เกิดซ้ำต้องไม่ทับซ้อนกัน",
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
		selected: "เลือกแล้ว",
		remainingHours: "เหลือ {{hours}} ชม.",
	},
	classNoAvailability: {
		description:
			"{{balance}} เพิ่มชั่วโมงก่อนนัดช่วงเรียน",
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
			"เลื่อนในแนวนอนเพื่อเรียกดูวันที่โดยไม่เปลี่ยนวันที่ที่เลือก เลือกวันที่ด้วยปุ่มของวันนั้น ใช้ปุ่มลูกศรซ้ายและขวาหรือ Page Up และ Page Down เพื่อย้ายโฟกัสโดยไม่เลือก กด Enter หรือ Space เพื่อเลือกวันที่ที่โฟกัสอยู่",
		weekRailLabel: "ตัวเลือกสัปดาห์ของตารางเรียน",
		weekRailInstruction:
			"เลื่อนในแนวนอนเพื่อเรียกดูสัปดาห์โดยไม่เปลี่ยนสัปดาห์ที่เลือก เลือกสัปดาห์ด้วยปุ่มของสัปดาห์นั้น ใช้ปุ่มลูกศรซ้ายและขวาหรือ Page Up และ Page Down เพื่อย้ายโฟกัสโดยไม่เลือก กด Enter หรือ Space เพื่อเลือกสัปดาห์ที่โฟกัสอยู่",
		weekLabel: "สัปดาห์ตั้งแต่ {{start}} ถึง {{end}}",
	},
	viewMode: {
		label: "มุมมองตารางเรียน",
		day: "วัน",
		week: "สัปดาห์",
	},
	timeline: {
		label: "ไทม์ไลน์ตารางเรียนรายสัปดาห์",
		instruction:
			"ใช้ปุ่มลูกศรเพื่อเลื่อนระหว่างช่วงเวลา 30 นาทีและวัน กด Enter หรือ Space เพื่อสร้างช่วงเรียน",
		previousWeek: "สัปดาห์ก่อนหน้า",
		nextWeek: "สัปดาห์ถัดไป",
		openCalendar: "เลือกวันที่ใน {{week}}",
		createCellLabel: "สร้างช่วงเรียนในวันที่ {{date}} เวลา {{time}}",
		currentTimeLabel: "เวลาปัจจุบัน: {{time}}",
		eventLabel:
			"{{className}} วันที่ {{date}} เวลา {{startTime}} ถึง {{endTime}} สถานะ {{status}} ประเภท {{type}}",
	},
} as const satisfies TranslationShape<typeof en>;

export default th;
