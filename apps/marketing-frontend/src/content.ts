export type Locale = 'en' | 'th';
interface Copy {
  title: string; description: string; nav: string[]; open: string; explore: string; menu: string; skip: string;
  hero: string[]; intro: string;
  lesson: string; scheduled: string; student: string; hoursLeft: string; reserved: string; reminder: string;
  workflowLabel: string; calendarTitle: string; calendarBody: string; weekLabel: string; compactWeekLabel: string; noLessons: string;
  workspaceTitle: string[]; workspaceBody: string; workspaceLabel: string; students: string; classes: string; remaining: string; subject: string; lastLesson: string; complete: string;
  lineTitle: string[]; lineBody: string; lineNotes: string[]; linePreview: string;
  faqTitle: string; faqs: { q: string; a: string }[];
  closeTitle: string[]; closeBody: string; footer: string;
  beta: {
    badge: string; nav: string; announcement: string; heroAction: string;
    closeTitle: string[]; closeBody: string; formTitle: string;
    name: string; email: string; subject: string; students: string; line: string;
    optional: string; lineYes: string; lineNo: string; submit: string;
    subjects: { value: string; label: string }[]; studentRanges: { value: string; label: string }[];
    unavailable: string; success: string; validationSummary: string; invalidName: string; invalidEmail: string;
    verificationUnavailable: string; requestFailed: string; requestDisabled: string;
  };
}
export const copy: Record<Locale, Copy> = {
  en: {
    title: 'TutorPal — Plan, manage, track all in one place.',
    description: 'A calmer workspace for independent tutors. Organize lessons, students, and class hours, with reminders through your LINE connection.',
    nav: ['How it works', 'Your workspace', 'Questions'], open: 'Open TutorPal', explore: 'See how it works', menu: 'Menu', skip: 'Skip to content',
    hero: ['Plan, manage, track', 'all in one place.'], intro: 'Keep your lessons, students, hours, and LINE reminders connected—so your teaching day runs smoothly.',
    lesson: 'New lesson', scheduled: 'Scheduled', student: 'Student', hoursLeft: 'Hours remaining', reserved: '2 hours reserved for this lesson', reminder: 'Upcoming LINE reminder',
    workflowLabel: 'Tutoring workflow', calendarTitle: 'Your teaching week, in view.', calendarBody: 'See each student, subject, and lesson time together, so you can plan the week ahead.', weekLabel: '5–11 October 2026', compactWeekLabel: '5–7 October 2026', noLessons: 'No lessons',
    workspaceTitle: ['Every student.', 'The whole picture.'], workspaceBody: 'From the first session to the next milestone, keep students, classes, and remaining hours in one place. Less searching. More context.', workspaceLabel: 'Math teaching workspace', students: 'Students', classes: 'Classes', remaining: 'Hours left', subject: 'Class', lastLesson: 'Last lesson', complete: 'Completed',
    lineTitle: ['A thoughtful reminder.', 'Right in LINE.'], lineBody: 'Connect your LINE Official Account and help students remember what’s next. A class reminder brings the lesson details into a conversation they already use.', lineNotes: ['Your own LINE Official Account', 'Linked students receive a reminder about one hour before class', 'Upcoming reminders follow the scheduled lesson time'], linePreview: 'Upcoming reminder',
    faqTitle: 'A few things you might be wondering.', faqs: [
      {q:'Who is TutorPal for?',a:'TutorPal is made for independent tutors who want a clearer way to organize students, classes, schedules, and lesson hours.'},
      {q:'Is it only for SAT or A-Level tutoring?',a:'No. Those are examples in this demonstration. You can organize tutoring for any subject, level, or learning goal.'},
      {q:'How are lesson hours counted?',a:'Hours are reserved when a lesson is scheduled. Moving or completing that same lesson does not deduct them a second time. In our example, a two-hour lesson takes a ten-hour balance to eight.'},
      {q:'What do I need for LINE reminders?',a:'Connect your LINE Official Account in TutorPal and link each student’s LINE account. Eligible linked students can then receive a reminder about one hour before their scheduled class. Messages use the connected account and are currently in English.'}
    ], closeTitle: ['Make space for', 'the part you love.'], closeBody: 'Bring your tutoring day together with TutorPal.', footer: 'A little more room to teach.',
    beta: {
      badge: 'Beta', nav: 'Join beta', announcement: 'TutorPal is now in beta', heroAction: 'Join the beta',
      closeTitle: ['Help shape TutorPal.', 'Teach with it first.'], closeBody: 'Tell us a little about your teaching. We’ll email you to arrange a demo.', formTitle: 'Request a beta demo',
      name: 'Your name', email: 'Email address', subject: 'Main subject', students: 'Number of students', line: 'Do you use a LINE Official Account?',
      optional: 'Optional', lineYes: 'Yes', lineNo: 'No', submit: 'Request a demo',
      subjects: [{ value: 'math', label: 'Math' }, { value: 'science', label: 'Science' }, { value: 'english', label: 'English' }, { value: 'languages', label: 'Languages' }, { value: 'test-prep', label: 'Test prep' }, { value: 'music-arts', label: 'Music / arts' }, { value: 'something-else', label: 'Something else' }],
      studentRanges: [{ value: '1-5', label: '1–5' }, { value: '6-15', label: '6–15' }, { value: '16-30', label: '16–30' }, { value: '30+', label: '30+' }],
      unavailable: 'Beta requests aren’t available right now. Please check back soon.', success: 'Thanks—we’ve received your request. We’ll be in touch by email.', validationSummary: 'Please fix the highlighted fields.', invalidName: 'Enter your name (up to 120 characters).', invalidEmail: 'Enter a valid email address.', verificationUnavailable: 'Verification isn’t available right now. Please check back soon.', requestFailed: 'We couldn’t send your request. Please try again.', requestDisabled: 'Beta requests aren’t available right now. Please check back soon.',
    }
  },
  th: {
    title: 'TutorPal — วางแผน จัดการ ติดตาม ครบในที่เดียว', description: 'พื้นที่ทำงานสำหรับติวเตอร์ จัดการตารางเรียน นักเรียน และชั่วโมงเรียนในที่เดียว พร้อมแจ้งเตือนผ่าน LINE ของคุณ',
    nav: ['ทำงานอย่างไร', 'พื้นที่ทำงาน', 'คำถามที่พบบ่อย'], open: 'เปิด TutorPal', explore: 'ดูวิธีการทำงาน', menu: 'เมนู', skip: 'ข้ามไปยังเนื้อหา',
    hero: ['วางแผน จัดการ ติดตาม', 'ครบในที่เดียว'], intro: 'เชื่อมตารางเรียน นักเรียน ชั่วโมงเรียน และการแจ้งเตือน LINE ไว้ด้วยกัน ให้ทุกวันสอนดำเนินไปอย่างราบรื่น',
    lesson: 'นัดหมายใหม่', scheduled: 'นัดหมายแล้ว', student: 'นักเรียน', hoursLeft: 'ชั่วโมงคงเหลือ', reserved: 'สำรอง 2 ชั่วโมงสำหรับคาบนี้', reminder: 'การแจ้งเตือน LINE ที่กำลังจะส่ง',
    workflowLabel: 'ขั้นตอนการจัดการสอน', calendarTitle: 'เห็นทั้งสัปดาห์ ก่อนเริ่มคาบถัดไป', calendarBody: 'ดูนักเรียน วิชา และเวลาเรียนในตารางเดียว เพื่อวางแผนสัปดาห์ได้ชัดเจน', weekLabel: '5–11 ตุลาคม 2026', compactWeekLabel: '5–7 ตุลาคม 2026', noLessons: 'ไม่มีคาบเรียน',
    workspaceTitle: ['รู้จักนักเรียนทุกคน', 'เห็นภาพครบในที่เดียว'], workspaceBody: 'ตั้งแต่คาบแรกจนถึงเป้าหมายถัดไป ดูนักเรียน ชั้นเรียน และชั่วโมงคงเหลือได้ในที่เดียว ค้นหาน้อยลง เข้าใจนักเรียนมากขึ้น', workspaceLabel: 'พื้นที่ทำงานสำหรับการสอนคณิตศาสตร์', students: 'นักเรียน', classes: 'ชั้นเรียน', remaining: 'ชั่วโมงคงเหลือ', subject: 'ชั้นเรียน', lastLesson: 'คาบล่าสุด', complete: 'เรียนแล้ว',
    lineTitle: ['เตือนด้วยความใส่ใจ', 'ส่งตรงถึง LINE'], lineBody: 'เชื่อมต่อ LINE Official Account ของคุณ ช่วยให้นักเรียนไม่พลาดคาบถัดไป พร้อมส่งรายละเอียดการเรียนไปยังบทสนทนาที่คุ้นเคย', lineNotes: ['ใช้ LINE Official Account ของคุณเอง', 'นักเรียนที่เชื่อมบัญชีแล้วได้รับแจ้งเตือนก่อนเรียนประมาณ 1 ชั่วโมง', 'การแจ้งเตือนที่กำลังจะส่งอ้างอิงเวลาเรียนล่าสุด'], linePreview: 'ข้อความที่กำลังจะส่ง',
    faqTitle: 'เรื่องที่คุณอาจอยากรู้', faqs: [
      {q:'TutorPal เหมาะกับใคร?',a:'TutorPal ออกแบบสำหรับติวเตอร์อิสระที่ต้องการจัดการนักเรียน ชั้นเรียน ตารางสอน และชั่วโมงเรียนให้เป็นระบบมากขึ้น'},
      {q:'ใช้ได้เฉพาะการติว SAT หรือ A-Level หรือไม่?',a:'ไม่จำกัดวิชา SAT และ A-Level เป็นเพียงตัวอย่างในหน้านี้ คุณสามารถจัดการการสอนได้ทุกวิชา ทุกระดับ และทุกเป้าหมายการเรียนรู้'},
      {q:'ระบบนับชั่วโมงเรียนอย่างไร?',a:'ระบบสำรองชั่วโมงเมื่อสร้างนัดหมาย การเลื่อนเวลาหรือจบคาบเดิมจะไม่หักชั่วโมงซ้ำ ในตัวอย่างนี้ คาบเรียน 2 ชั่วโมงทำให้ยอดจาก 10 ชั่วโมงเหลือ 8 ชั่วโมง'},
      {q:'ต้องเตรียมอะไรเพื่อใช้การแจ้งเตือนผ่าน LINE?',a:'เชื่อมต่อ LINE Official Account ใน TutorPal และเชื่อมบัญชี LINE ของนักเรียนแต่ละคน นักเรียนที่เชื่อมบัญชีและเข้าเงื่อนไขจะได้รับแจ้งเตือนก่อนเรียนประมาณ 1 ชั่วโมง ผ่านบัญชีที่คุณเชื่อมต่อ ปัจจุบันข้อความแจ้งเตือนเป็นภาษาอังกฤษ'}
    ], closeTitle: ['คืนเวลาให้', 'การสอนที่คุณรัก'], closeBody: 'รวมทุกเรื่องของวันสอนไว้ด้วยกันกับ TutorPal', footer: 'มีเวลาให้การสอนมากขึ้น',
    beta: {
      badge: 'เบต้า', nav: 'เข้าร่วมเบต้า', announcement: 'TutorPal เปิดให้ทดลองใช้แบบเบต้า', heroAction: 'เข้าร่วมเบต้า',
      closeTitle: ['ช่วยสร้าง TutorPal ไปด้วยกัน', 'เริ่มสอนด้วยกันก่อนใคร'], closeBody: 'บอกเราเล็กน้อยเกี่ยวกับการสอนของคุณ แล้วเราจะส่งอีเมลเพื่อนัดเดโมให้คุณ', formTitle: 'ขอเดโมเวอร์ชันเบต้า',
      name: 'ชื่อของคุณ', email: 'อีเมล', subject: 'วิชาหลัก', students: 'จำนวนนักเรียน', line: 'คุณใช้ LINE Official Account หรือไม่',
      optional: 'ไม่จำเป็น', lineYes: 'ใช้', lineNo: 'ไม่ใช้', submit: 'ขอเดโม',
      subjects: [{ value: 'math', label: 'คณิตศาสตร์' }, { value: 'science', label: 'วิทยาศาสตร์' }, { value: 'english', label: 'ภาษาอังกฤษ' }, { value: 'languages', label: 'ภาษาอื่น ๆ' }, { value: 'test-prep', label: 'เตรียมสอบ' }, { value: 'music-arts', label: 'ดนตรี / ศิลปะ' }, { value: 'something-else', label: 'อื่น ๆ' }],
      studentRanges: [{ value: '1-5', label: '1–5 คน' }, { value: '6-15', label: '6–15 คน' }, { value: '16-30', label: '16–30 คน' }, { value: '30+', label: 'มากกว่า 30 คน' }],
      unavailable: 'ตอนนี้ยังไม่สามารถรับคำขอเข้าร่วมเบต้าได้ โปรดลองอีกครั้งภายหลัง', success: 'ขอบคุณ เราได้รับคำขอของคุณแล้ว เราจะติดต่อทางอีเมล', validationSummary: 'โปรดตรวจสอบข้อมูลที่ระบุไว้', invalidName: 'กรุณากรอกชื่อของคุณ (ไม่เกิน 120 อักขระ)', invalidEmail: 'กรุณากรอกอีเมลที่ถูกต้อง', verificationUnavailable: 'ตอนนี้การยืนยันตัวตนยังไม่พร้อมใช้งาน โปรดลองอีกครั้งภายหลัง', requestFailed: 'เราไม่สามารถส่งคำขอได้ โปรดลองอีกครั้ง', requestDisabled: 'ตอนนี้ยังไม่สามารถรับคำขอเข้าร่วมเบต้าได้ โปรดลองอีกครั้งภายหลัง',
    }
  }
};
