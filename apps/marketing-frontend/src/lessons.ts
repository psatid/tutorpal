import type { Locale } from './content';
export interface Lesson {
  id: string; date: string; student: string; shortName: string; subject: string;
  discipline: 'english' | 'math'; curriculum: string; level: string;
  startHour: number; endHour: number; tone: 'lavender' | 'peach' | 'mint';
}
export const featuredLesson: Lesson = {
  id: 'min-sat', date: '2026-10-08', student: 'Min Chantarat', shortName: 'Min',
  subject: 'SAT Math', discipline: 'math', curriculum: 'SAT Math', level: 'Foundation', startHour: 16, endHour: 18, tone: 'lavender',
};
export const weeklyLessons: readonly Lesson[] = [
  {id:'ploy-mon-ielts',date:'2026-10-05',student:'Ploy Srisai',shortName:'Ploy',discipline:'english',subject:'English',curriculum:'IELTS',level:'Foundation',startHour:10,endHour:12,tone:'peach'},
  {id:'nath-mon-sat',date:'2026-10-05',student:'Nath Kittisak',shortName:'Nath',discipline:'english',subject:'English',curriculum:'SAT English',level:'Intensive',startHour:16,endHour:18,tone:'lavender'},
  {id:'mook-tue-alevel',date:'2026-10-06',student:'Mook',shortName:'Mook',discipline:'english',subject:'English',curriculum:'A-Level English',level:'Basic',startHour:11,endHour:13,tone:'mint'},
  {id:'beam-tue-speaking',date:'2026-10-06',student:'Beam',shortName:'Beam',discipline:'english',subject:'English',curriculum:'IELTS Speaking',level:'Intensive',startHour:17,endHour:19,tone:'peach'},
  {id:'fai-wed-sat',date:'2026-10-07',student:'Fai',shortName:'Fai',discipline:'english',subject:'English',curriculum:'SAT English',level:'Foundation',startHour:10,endHour:12,tone:'lavender'},
  {id:'nath-wed-alevel',date:'2026-10-07',student:'Nath Kittisak',shortName:'Nath',discipline:'english',subject:'English',curriculum:'A-Level English',level:'Intensive',startHour:15,endHour:17,tone:'mint'},
  {id:'ploy-thu-ielts',date:'2026-10-08',student:'Ploy Srisai',shortName:'Ploy',discipline:'english',subject:'English',curriculum:'IELTS',level:'Basic',startHour:10,endHour:12,tone:'peach'},
  {id:'earn-thu-sat',date:'2026-10-08',student:'Earn',shortName:'Earn',discipline:'english',subject:'English',curriculum:'SAT English',level:'Intensive',startHour:16,endHour:18,tone:'lavender'},
  {id:'mook-fri-alevel',date:'2026-10-09',student:'Mook',shortName:'Mook',discipline:'english',subject:'English',curriculum:'A-Level English',level:'Foundation',startHour:11,endHour:13,tone:'mint'},
  {id:'beam-fri-ielts',date:'2026-10-09',student:'Beam',shortName:'Beam',discipline:'english',subject:'English',curriculum:'IELTS',level:'Intensive',startHour:17,endHour:19,tone:'peach'},
  {id:'fai-sat-sat',date:'2026-10-10',student:'Fai',shortName:'Fai',discipline:'english',subject:'English',curriculum:'SAT English',level:'Basic',startHour:10,endHour:12,tone:'lavender'},
  {id:'nath-sat-alevel',date:'2026-10-10',student:'Nath Kittisak',shortName:'Nath',discipline:'english',subject:'English',curriculum:'A-Level English',level:'Intensive',startHour:14,endHour:16,tone:'mint'},
];
export interface StudentSummary {
  id: string; name: string; initial: string; discipline: 'math'; curriculum: string; level: string;
  hours: number; lastLesson: string; tone: Lesson['tone'];
}
export const studentSummaries: readonly StudentSummary[] = [
  {id:'min-math',name:'Min Chantarat',initial:'M',discipline:'math',curriculum:'SAT Math',level:'Foundation',hours:8,lastLesson:'01 Oct',tone:'lavender'},
  {id:'ploy-math',name:'Ploy Srisai',initial:'P',discipline:'math',curriculum:'A-Level Mathematics',level:'Intensive',hours:12,lastLesson:'03 Oct',tone:'peach'},
  {id:'kiet-math',name:'Kiet Anan',initial:'K',discipline:'math',curriculum:'SAT Math',level:'Basic',hours:6,lastLesson:'05 Oct',tone:'mint'},
  {id:'fern-math',name:'Fern Chai',initial:'F',discipline:'math',curriculum:'A-Level Mathematics',level:'Advanced',hours:10,lastLesson:'03 Oct',tone:'lavender'},
];
export const weekDays = [
  {date:'2026-10-05',number:5,en:'Monday',th:'วันจันทร์'},
  {date:'2026-10-06',number:6,en:'Tuesday',th:'วันอังคาร'},
  {date:'2026-10-07',number:7,en:'Wednesday',th:'วันพุธ'},
  {date:'2026-10-08',number:8,en:'Thursday',th:'วันพฤหัสบดี'},
  {date:'2026-10-09',number:9,en:'Friday',th:'วันศุกร์'},
  {date:'2026-10-10',number:10,en:'Saturday',th:'วันเสาร์'},
  {date:'2026-10-11',number:11,en:'Sunday',th:'วันอาทิตย์'},
] as const;
export const clockTime = (hour: number) => `${String(hour).padStart(2,'0')}:00`;
export const lessonTime = (lesson: Lesson) => `${clockTime(lesson.startHour)} – ${clockTime(lesson.endHour)}`;
export const lessonDateTime = (lesson: Lesson, end = false) => `${lesson.date}T${clockTime(end ? lesson.endHour : lesson.startHour)}:00+07:00`;
export const featuredDate: Record<Locale,string> = {en:'Thursday, 8 October',th:'วันพฤหัสบดีที่ 8 ตุลาคม'};
export const reminderTime = clockTime(featuredLesson.startHour - 1);
const englishTime = (hour: number) => `${hour > 12 ? hour-12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
export const reminderMessage = `Class reminder\n\nHi ${featuredLesson.shortName}, your ${featuredLesson.subject} class starts in 1 hour.\n\nDate: Oct 8, 2026\nTime: ${englishTime(featuredLesson.startHour)}–${englishTime(featuredLesson.endHour)}\nTime zone: Asia/Bangkok`;
