export type MarketingLanguage = 'en' | 'th'

export type TourId =
  | 'classes'
  | 'add-hours'
  | 'add-schedule'
  | 'schedule-day'
  | 'schedule-week'
  | 'today'

type TourCopy = {
  id: TourId
  progress: string
  label: string
  title: string
  copy: string
  image: string
  alt: string
}

type MarketingCopy = {
  header: {
    homeLabel: string
    primaryNavLabel: string
    mobileNavLabel: string
    mobileMenuLabel: string
    product: string
    workflow: string
    beta: string
    joinBeta: string
    portalLogin: string
    languageLabel: string
    switchLanguage: string
  }
  common: {
    skipToContent: string
    privacy: string
  }
  hero: {
    kicker: string
    titleFirst: string
    titleSecond: string
    summary: string
    joinBeta: string
    seeApp: string
    previewLabel: string
    previewAlt: string
  }
  workflow: {
    title: string
    description: string
    caption: string
    items: TourCopy[]
  }
  benefits: {
    title: string
    description: string
    items: Array<{ title: string; copy: string }>
  }
  faq: {
    title: string
    description: string
    items: Array<{ question: string; answer: string }>
  }
  beta: {
    title: string
    description: string
    smallPrintBefore: string
    smallPrintAfter: string
    form: {
      name: string
      email: string
      subject: string
      note: string
      optional: string
      consentBefore: string
      consentAfter: string
      configuration: string
      sending: string
      joinBeta: string
      nativeSuccess: string
      nativeError: string
      fallbackError: string
      networkError: string
    }
  }
  footer: {
    description: string
  }
  privacy: {
    eyebrow: string
    title: string
    lead: string
    sections: Array<{ title: string; body: string }>
  }
}

export const marketingCopy: Record<MarketingLanguage, MarketingCopy> = {
  en: {
    header: {
      homeLabel: 'TutorPal home',
      primaryNavLabel: 'Primary navigation',
      mobileNavLabel: 'Mobile navigation',
      mobileMenuLabel: 'Toggle navigation menu',
      product: 'Product',
      workflow: 'Workflow',
      beta: 'Beta',
      joinBeta: 'Join the beta',
      portalLogin: 'Portal login',
      languageLabel: 'Language',
      switchLanguage: 'Switch to Thai',
    },
    common: {
      skipToContent: 'Skip to content',
      privacy: 'privacy notice',
    },
    hero: {
      kicker: 'Built for independent tutors',
      titleFirst: 'Your tutoring work,',
      titleSecond: 'in one clear place.',
      summary: 'Plan sessions, track hours, and keep every student moving forward.',
      joinBeta: 'Join the beta',
      seeApp: 'See the app',
      previewLabel: 'TutorPal Home screen preview',
      previewAlt: "TutorPal Home screen showing today's sessions and work ahead",
    },
    workflow: {
      title: 'From class setup to today’s lessons.',
      description: 'Follow the six steps you take in TutorPal: create a class, add hours, schedule it, then review the same session in Day, Week, and Today.',
      caption: 'Scroll through each step to follow one class from setup to today’s session.',
      items: [
        {
          id: 'classes',
          progress: 'Step 1 of 6',
          label: 'Classes',
          title: 'Start with the class.',
          copy: 'See the class, its student, and the teaching hours that remain in one clear list.',
          image: '/product-previews/classes.jpg',
          alt: 'TutorPal Classes list showing a class, its student, and remaining teaching hours',
        },
        {
          id: 'add-hours',
          progress: 'Step 2 of 6',
          label: 'Add hours',
          title: 'Add the hours.',
          copy: 'Set the total teaching hours before the first session.',
          image: '/product-previews/workflow-02-add-hours.jpg',
          alt: 'TutorPal class details showing the Add hours form and remaining hours',
        },
        {
          id: 'add-schedule',
          progress: 'Step 3 of 6',
          label: 'Add schedule',
          title: 'Schedule the first session.',
          copy: 'Choose the class, place, date, time, and duration in one short form.',
          image: '/product-previews/workflow-03-add-schedule.jpg',
          alt: 'TutorPal Add New Schedule form for the class',
        },
        {
          id: 'schedule-day',
          progress: 'Step 4 of 6',
          label: 'Schedule: Day',
          title: 'See the day clearly.',
          copy: 'Use the day view to find the next session and its details at a glance.',
          image: '/product-previews/workflow-04-schedule-day.jpg',
          alt: 'TutorPal Schedules Day view showing the class session',
        },
        {
          id: 'schedule-week',
          progress: 'Step 5 of 6',
          label: 'Schedule: Week',
          title: 'Plan the week in one pass.',
          copy: 'Switch to Week when you want the whole teaching rhythm in view.',
          image: '/product-previews/workflow-05-schedule-week.jpg',
          alt: 'TutorPal Schedules Week view showing upcoming class sessions',
        },
        {
          id: 'today',
          progress: 'Step 6 of 6',
          label: 'Today',
          title: 'Come back to a connected day.',
          copy: 'Open Today to see the same session, what to do next, and the path back to the schedule.',
          image: '/product-previews/workflow-06-today-connected.jpg',
          alt: 'TutorPal Today screen showing the scheduled session and remaining class hours',
        },
      ],
    },
    benefits: {
      title: 'What you get',
      description: 'The everyday pieces of a tutoring practice, kept close enough to help each other.',
      items: [
        { title: 'Students', copy: 'Keep learner details and the next step close to every session.' },
        { title: 'Classes', copy: 'Bring group teaching and individual lessons into the same view.' },
        { title: 'Schedules', copy: 'Plan one-time and recurring sessions around the way you actually teach.' },
        { title: 'Hours', copy: 'Record completed teaching time and see what remains for a course.' },
        { title: 'Revenue', copy: 'Keep the financial side of your work connected to the classes behind it.' },
        { title: 'LINE messaging', copy: 'Send reminders from the channel your students already use.' },
      ],
    },
    faq: {
      title: 'A few useful answers',
      description: 'See how TutorPal fits into the work you already do.',
      items: [
        {
          question: 'Who is TutorPal for?',
          answer: 'TutorPal is for independent tutors who manage their own students, schedules, courses, and classes.',
        },
        {
          question: 'What can I manage?',
          answer: 'You can keep track of students, schedules, classes, reusable courses, completed hours, revenue, and LINE messaging in one place.',
        },
        {
          question: 'How do I join the beta?',
          answer: 'Tell us what you teach through the form below. The TutorPal team will use your details to follow up about the beta.',
        },
      ],
    },
    beta: {
      title: 'Shape the calmer tutoring day.',
      description: 'TutorPal is being built with independent tutors who want less admin and more space for teaching. Tell us what you teach and we will be in touch about the beta.',
      smallPrintBefore: 'We will only use these details to contact you about TutorPal\'s beta. See our',
      smallPrintAfter: '.',
      form: {
        name: 'Your name',
        email: 'Email address',
        subject: 'Subject or teaching area',
        note: 'Anything else?',
        optional: 'Optional',
        consentBefore: 'I agree that TutorPal may use these details to contact me about the beta, as described in the',
        consentAfter: '.',
        configuration: 'Beta sign-up is not configured in this environment yet.',
        sending: 'Sending',
        joinBeta: 'Join the beta',
        nativeSuccess: 'Thanks. Your beta interest is on its way to the TutorPal team.',
        nativeError: 'We could not send that just now. Please check the form and try again.',
        fallbackError: 'We could not send that just now. Please try again.',
        networkError: 'We could not reach TutorPal. Please check your connection and try again.',
      },
    },
    footer: {
      description: 'Calm operations for independent tutors.',
    },
    privacy: {
      eyebrow: 'Privacy',
      title: 'Your beta details, handled simply.',
      lead: 'This notice explains how TutorPal uses the information you provide through the beta interest form.',
      sections: [
        { title: 'What we collect', body: 'Your name, email address, teaching area, and any optional note you choose to provide.' },
        { title: 'Why we use it', body: 'We use these details only to assess and contact people interested in the TutorPal beta. We do not use the form to create a TutorPal account.' },
        { title: 'Where it goes', body: 'Submitted details are sent to the TutorPal team through an internal notification channel. We do not store form submissions in the TutorPal product database.' },
        { title: 'Your choice', body: 'You can ask us to remove your beta interest details by replying to a TutorPal beta message. We will handle the request using the contact details you provide.' },
        { title: 'Changes to this notice', body: 'We may update this notice as the beta changes. The current version is published on this page.' },
      ],
    },
  },
  th: {
    header: {
      homeLabel: 'กลับหน้าแรกของ TutorPal',
      primaryNavLabel: 'เมนูนำทางหลัก',
      mobileNavLabel: 'เมนูนำทางบนมือถือ',
      mobileMenuLabel: 'เปิดหรือปิดเมนูนำทาง',
      product: 'ผลิตภัณฑ์',
      workflow: 'วิธีทำงาน',
      beta: 'เบต้า',
      joinBeta: 'เข้าร่วมเบต้า',
      portalLogin: 'เข้าสู่พอร์ทัล',
      languageLabel: 'ภาษา',
      switchLanguage: 'เปลี่ยนเป็นภาษาอังกฤษ',
    },
    common: {
      skipToContent: 'ข้ามไปยังเนื้อหา',
      privacy: 'ประกาศความเป็นส่วนตัว',
    },
    hero: {
      kicker: 'สร้างมาเพื่อครูสอนพิเศษอิสระ',
      titleFirst: 'งานสอนของคุณ',
      titleSecond: 'อยู่ในที่เดียวที่ชัดเจน',
      summary: 'วางแผนการสอน ติดตามชั่วโมง และดูแลนักเรียนทุกคนต่อไปได้อย่างเป็นระบบ',
      joinBeta: 'เข้าร่วมเบต้า',
      seeApp: 'ดูแอป',
      previewLabel: 'ตัวอย่างหน้าหลักของ TutorPal',
      previewAlt: 'หน้าหลัก TutorPal แสดงเซสชันของวันนี้และงานที่ต้องทำต่อ',
    },
    workflow: {
      title: 'จากสร้างคลาสสู่บทเรียนของวันนี้',
      description: 'ทำตามหกขั้นตอนเดียวกับใน TutorPal: สร้างคลาส เพิ่มชั่วโมง เพิ่มตารางเรียน แล้วดูเซสชันเดิมในมุมมองวัน สัปดาห์ และวันนี้',
      caption: 'เลื่อนดูทีละขั้นเพื่อดูเส้นทางของคลาสเดียวตั้งแต่เริ่มต้นจนถึงเซสชันวันนี้',
      items: [
        {
          id: 'classes',
          progress: 'ขั้นตอนที่ 1 จาก 6',
          label: 'คลาส',
          title: 'เริ่มจากคลาส',
          copy: 'ดูคลาส นักเรียน และชั่วโมงสอนคงเหลือรวมกันในรายการเดียว',
          image: '/product-previews/classes.jpg',
          alt: 'หน้ารายการคลาสของ TutorPal แสดงคลาส นักเรียน และชั่วโมงสอนคงเหลือ',
        },
        {
          id: 'add-hours',
          progress: 'ขั้นตอนที่ 2 จาก 6',
          label: 'เพิ่มชั่วโมง',
          title: 'เพิ่มชั่วโมง',
          copy: 'กำหนดจำนวนชั่วโมงสอนทั้งหมดก่อนเซสชันแรก',
          image: '/product-previews/workflow-02-add-hours.jpg',
          alt: 'หน้ารายละเอียดคลาสของ TutorPal แสดงแบบฟอร์มเพิ่มชั่วโมงและชั่วโมงคงเหลือ',
        },
        {
          id: 'add-schedule',
          progress: 'ขั้นตอนที่ 3 จาก 6',
          label: 'เพิ่มตารางเรียน',
          title: 'จัดเซสชันแรก',
          copy: 'เลือกคลาส สถานที่ วันที่ เวลา และระยะเวลาในฟอร์มสั้น ๆ เดียว',
          image: '/product-previews/workflow-03-add-schedule.jpg',
          alt: 'แบบฟอร์มเพิ่มตารางเรียนใหม่ของ TutorPal สำหรับคลาส',
        },
        {
          id: 'schedule-day',
          progress: 'ขั้นตอนที่ 4 จาก 6',
          label: 'ตารางเรียน: วัน',
          title: 'เห็นภาพของวันชัดเจน',
          copy: 'ใช้มุมมองวันเพื่อหาเซสชันถัดไปและรายละเอียดได้ทันที',
          image: '/product-previews/workflow-04-schedule-day.jpg',
          alt: 'มุมมองตารางเรียนรายวันของ TutorPal แสดงเซสชันของคลาส',
        },
        {
          id: 'schedule-week',
          progress: 'ขั้นตอนที่ 5 จาก 6',
          label: 'ตารางเรียน: สัปดาห์',
          title: 'วางแผนทั้งสัปดาห์ในมุมมองเดียว',
          copy: 'สลับเป็นมุมมองสัปดาห์เมื่อต้องการเห็นจังหวะการสอนทั้งหมด',
          image: '/product-previews/workflow-05-schedule-week.jpg',
          alt: 'มุมมองตารางเรียนรายสัปดาห์ของ TutorPal แสดงเซสชันคลาสที่กำลังจะมาถึง',
        },
        {
          id: 'today',
          progress: 'ขั้นตอนที่ 6 จาก 6',
          label: 'วันนี้',
          title: 'กลับมาที่วันที่มีบริบทครบ',
          copy: 'เปิดวันนี้เพื่อเห็นเซสชันเดิม สิ่งที่ต้องทำต่อ และทางกลับไปยังตารางเรียน',
          image: '/product-previews/workflow-06-today-connected.jpg',
          alt: 'หน้าวันนี้ของ TutorPal แสดงเซสชันตามกำหนดและชั่วโมงคงเหลือของคลาส',
        },
      ],
    },
    benefits: {
      title: 'สิ่งที่คุณจะได้',
      description: 'องค์ประกอบในงานสอนแต่ละวันอยู่ใกล้กันพอที่จะช่วยกันได้',
      items: [
        { title: 'นักเรียน', copy: 'เก็บข้อมูลนักเรียนและขั้นตอนถัดไปไว้ใกล้กับทุกเซสชัน' },
        { title: 'คลาส', copy: 'ดูแลทั้งการสอนแบบกลุ่มและบทเรียนเดี่ยวในมุมมองเดียวกัน' },
        { title: 'ตารางเรียน', copy: 'วางแผนเซสชันครั้งเดียวและแบบประจำตามวิธีสอนจริงของคุณ' },
        { title: 'ชั่วโมง', copy: 'บันทึกเวลาสอนที่เสร็จแล้วและดูชั่วโมงที่เหลือของหลักสูตร' },
        { title: 'รายได้', copy: 'เชื่อมข้อมูลการเงินเข้ากับคลาสที่สร้างรายได้นั้น' },
        { title: 'การส่งข้อความผ่าน LINE', copy: 'ส่งการแจ้งเตือนผ่านช่องทางที่นักเรียนของคุณใช้อยู่แล้ว' },
      ],
    },
    faq: {
      title: 'คำตอบที่ช่วยให้เริ่มต้นได้',
      description: 'ดูว่า TutorPal เข้ากับงานที่คุณทำอยู่แล้วอย่างไร',
      items: [
        {
          question: 'TutorPal เหมาะกับใคร?',
          answer: 'TutorPal เหมาะกับครูสอนพิเศษอิสระที่ดูแลนักเรียน ตารางเรียน หลักสูตร และคลาสของตัวเอง',
        },
        {
          question: 'ฉันจัดการอะไรได้บ้าง?',
          answer: 'คุณติดตามนักเรียน ตารางเรียน คลาส หลักสูตรที่ใช้ซ้ำ ชั่วโมงที่สอนเสร็จ รายได้ และการส่งข้อความผ่าน LINE ได้ในที่เดียว',
        },
        {
          question: 'เข้าร่วมเบต้าได้อย่างไร?',
          answer: 'บอกเราเกี่ยวกับวิชาที่คุณสอนผ่านแบบฟอร์มด้านล่าง ทีม TutorPal จะใช้ข้อมูลเพื่อติดต่อคุณเกี่ยวกับเบต้า',
        },
      ],
    },
    beta: {
      title: 'จัดวันสอนให้สบายขึ้น',
      description: 'TutorPal กำลังพัฒนาร่วมกับครูสอนพิเศษอิสระที่ต้องการลดงานแอดมินและมีเวลาสำหรับการสอนมากขึ้น บอกเราว่าคุณสอนอะไร แล้วเราจะติดต่อคุณเกี่ยวกับเบต้า',
      smallPrintBefore: 'เราจะใช้ข้อมูลนี้เพื่อติดต่อคุณเกี่ยวกับเบต้า TutorPal เท่านั้น ดู',
      smallPrintAfter: '',
      form: {
        name: 'ชื่อของคุณ',
        email: 'อีเมล',
        subject: 'วิชาหรือประเภทการสอน',
        note: 'รายละเอียดเพิ่มเติม',
        optional: 'ไม่บังคับ',
        consentBefore: 'ฉันยินยอมให้ TutorPal ใช้ข้อมูลนี้ติดต่อฉันเกี่ยวกับเบต้า ตามที่ระบุใน',
        consentAfter: '',
        configuration: 'ยังไม่เปิดใช้งานการสมัครเบต้าในสภาพแวดล้อมนี้',
        sending: 'กำลังส่ง',
        joinBeta: 'เข้าร่วมเบต้า',
        nativeSuccess: 'ขอบคุณ ข้อมูลความสนใจเบต้าของคุณถูกส่งไปยังทีม TutorPal แล้ว',
        nativeError: 'ยังส่งข้อมูลไม่ได้ในตอนนี้ โปรดตรวจสอบแบบฟอร์มแล้วลองอีกครั้ง',
        fallbackError: 'ยังส่งข้อมูลไม่ได้ในตอนนี้ โปรดลองอีกครั้ง',
        networkError: 'เชื่อมต่อ TutorPal ไม่ได้ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
      },
    },
    footer: {
      description: 'จัดการงานสอนสำหรับครูสอนพิเศษอิสระให้สบายขึ้น',
    },
    privacy: {
      eyebrow: 'ความเป็นส่วนตัว',
      title: 'เราดูแลรายละเอียดเบต้าของคุณอย่างเรียบง่าย',
      lead: 'ประกาศนี้อธิบายวิธีที่ TutorPal ใช้ข้อมูลที่คุณส่งผ่านแบบฟอร์มความสนใจเบต้า',
      sections: [
        { title: 'เราเก็บข้อมูลอะไร', body: 'ชื่อ อีเมล วิชาหรือประเภทการสอน และรายละเอียดเพิ่มเติมที่คุณเลือกส่ง' },
        { title: 'เราใช้ข้อมูลเพื่ออะไร', body: 'เราใช้ข้อมูลนี้เพื่อประเมินและติดต่อผู้ที่สนใจเบต้า TutorPal เท่านั้น แบบฟอร์มนี้ไม่ได้สร้างบัญชี TutorPal ให้คุณ' },
        { title: 'ข้อมูลถูกส่งไปที่ไหน', body: 'ข้อมูลที่ส่งจะไปยังทีม TutorPal ผ่านช่องทางแจ้งเตือนภายใน เราไม่เก็บข้อมูลจากแบบฟอร์มไว้ในฐานข้อมูลของผลิตภัณฑ์ TutorPal' },
        { title: 'สิทธิ์ของคุณ', body: 'คุณขอให้เราลบข้อมูลความสนใจเบต้าได้โดยตอบกลับข้อความจาก TutorPal เราจะดำเนินการโดยใช้ข้อมูลติดต่อที่คุณให้ไว้' },
        { title: 'การเปลี่ยนแปลงประกาศนี้', body: 'เราอาจอัปเดตประกาศนี้เมื่อเบต้ามีการเปลี่ยนแปลง เวอร์ชันปัจจุบันเผยแพร่ไว้บนหน้านี้' },
      ],
    },
  },
}
