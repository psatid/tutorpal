export const en = {
  buttons: {
    back: "Back",
    close: "Close",
    next: "Next",
  },
  form: {
    chooseDate: "Choose date",
    chooseWeek: "Choose week",
    hidePassword: "Hide password",
    requiredLabel: "required",
    showPassword: "Show password",
  },
  accessibility: {
    breadcrumb: "Breadcrumb",
    close: "Close",
    closeNamed: "Close {{title}}",
    morePages: "More pages",
    nextPage: "Go to next page",
    pagination: "Pagination",
    previousPage: "Go to previous page",
  },
  calendar: {
    navigation: "Calendar navigation",
    month: "{{month}}",
    day: "{{date}}",
    dayToday: "Today, {{date}}",
    daySelected: "{{date}}, selected",
    dayTodaySelected: "Today, {{date}}, selected",
    weekday: "{{weekday}}",
    previousMonth: "Go to previous month",
    nextMonth: "Go to next month",
    chooseMonth: "Choose month",
    chooseYear: "Choose year",
    weekNumber: "Week {{weekNumber}}",
    weekNumberHeader: "Week number",
  },
} as const;

type SharedCommonLocale = {
  [Section in keyof typeof en]: {
    [Key in keyof (typeof en)[Section]]: string;
  };
};

export const th = {
  buttons: {
    back: "กลับ",
    close: "ปิด",
    next: "ถัดไป",
  },
  form: {
    chooseDate: "เลือกวันที่",
    chooseWeek: "เลือกสัปดาห์",
    hidePassword: "ซ่อนรหัสผ่าน",
    requiredLabel: "จำเป็น",
    showPassword: "แสดงรหัสผ่าน",
  },
  accessibility: {
    breadcrumb: "เส้นทางนำทาง",
    close: "ปิด",
    closeNamed: "ปิด {{title}}",
    morePages: "หน้าเพิ่มเติม",
    nextPage: "ไปหน้าถัดไป",
    pagination: "การแบ่งหน้า",
    previousPage: "ไปหน้าก่อนหน้า",
  },
  calendar: {
    navigation: "การนำทางปฏิทิน",
    month: "{{month}}",
    day: "{{date}}",
    dayToday: "วันนี้ {{date}}",
    daySelected: "{{date}} (เลือกแล้ว)",
    dayTodaySelected: "วันนี้ {{date}} (เลือกแล้ว)",
    weekday: "{{weekday}}",
    previousMonth: "ไปยังเดือนก่อนหน้า",
    nextMonth: "ไปยังเดือนถัดไป",
    chooseMonth: "เลือกเดือน",
    chooseYear: "เลือกปี",
    weekNumber: "สัปดาห์ที่ {{weekNumber}}",
    weekNumberHeader: "หมายเลขสัปดาห์",
  },
} as const satisfies SharedCommonLocale;
