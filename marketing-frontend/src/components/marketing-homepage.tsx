import { useEffect, useRef, type ReactNode } from 'react'
import lineReminderDemo from '../assets/marketing/line-reminder-demo.webp'
import tutorObjects from '../assets/marketing/tutor-objects.webp'
import { BetaLeadForm } from './beta-lead-form'
import { FaqSection } from './faq-section'
import { Footer } from './footer'
import { MarketingHeader } from './marketing-header'
import { useMarketingLanguage } from './marketing-language'
import './marketing-homepage.css'

type NativeStatus = 'success' | 'error' | undefined

function useSceneReveal<T extends HTMLElement = HTMLElement>() {
  const sceneRef = useRef<T>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      scene.classList.add('is-revealed')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        scene.classList.add('is-revealed')
        observer.disconnect()
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )

    observer.observe(scene)
    return () => observer.disconnect()
  }, [])

  return sceneRef
}

function useHomepageCopy() {
  const { language, copy } = useMarketingLanguage()
  const thai = language === 'th'
  return {
    copy,
    thai,
    lesson: 'English foundations',
    learner: 'Maya Chen',
    previewLabel: thai ? 'ตัวอย่าง TutorPal' : 'Illustrative TutorPal preview',
  }
}

function PreviewCaption() {
  const { previewLabel } = useHomepageCopy()
  return <figcaption>{previewLabel}</figcaption>
}

function BalancePanel({ compact = false }: { compact?: boolean }) {
  const { thai, lesson, learner } = useHomepageCopy()
  return (
    <figure
      className={`marketing-panel balance-panel${compact ? ' is-compact' : ''}`}
    >
      <div className="panel-topline">
        <span>{thai ? 'คลาส' : 'Class'}</span>
        <span className="panel-dot" />
      </div>
      <div className="class-person">
        <span className="avatar" aria-hidden="true">
          M
        </span>
        <div>
          <strong>{lesson}</strong>
          <span>{learner}</span>
        </div>
      </div>
      <div className="member-chips">
        <span>{thai ? 'นักเรียน' : 'Student'}</span>
        <span>{thai ? 'รายบุคคล' : 'Individual'}</span>
      </div>
      <div className="balance-box">
        <span>{thai ? 'ชั่วโมงคงเหลือ' : 'Remaining hours'}</span>
        <strong>
          7.0 <small>/ 10.0 h</small>
        </strong>
        <div className="balance-progress">
          <i />
        </div>
        <p>{thai ? 'รายได้ที่บันทึกแล้ว ฿2,400' : 'Recorded revenue ฿2,400'}</p>
      </div>
      <PreviewCaption />
    </figure>
  )
}

function TodayPanel({ completed = false }: { completed?: boolean }) {
  const { thai, lesson } = useHomepageCopy()
  const status = completed
    ? thai
      ? 'เสร็จสิ้น'
      : 'Completed'
    : thai
      ? 'ตามตาราง'
      : 'Scheduled'
  return (
    <figure className="marketing-panel today-panel">
      <div className="panel-appbar">
        <span className="mini-logo">T</span>
        <strong>{thai ? 'หน้าหลัก' : 'Home'}</strong>
        <span>{thai ? 'ไทย' : 'English'}</span>
      </div>
      <div className="today-title">
        <span>{thai ? 'วันอาทิตย์ 16 สิงหาคม' : 'Sunday, August 16'}</span>
        <h3>{thai ? 'วันนี้' : 'Today'}</h3>
        <p>
          {thai ? 'เซสชันและงานที่รออยู่' : 'Your sessions and the work ahead.'}
        </p>
      </div>
      <div className="agenda-row">
        <span>09:00</span>
        <div>
          <strong>{lesson}</strong>
          <small>{thai ? 'ออนไลน์ · 1 ชม.' : 'Online · 1 h'}</small>
        </div>
        <em className={completed ? 'is-completed' : undefined}>{status}</em>
      </div>
      <div className={`confirm-box${completed ? ' is-completed' : ''}`}>
        <span>
          {completed
            ? thai
              ? 'เซสชันล่าสุด'
              : 'Recent session'
            : thai
              ? 'เซสชันที่ต้องยืนยัน'
              : 'Session to confirm'}
        </span>
        <strong>{lesson}</strong>
        <p>09:00 – 10:00</p>
        <div aria-hidden="true">
          {completed ? (
            <span>{status}</span>
          ) : (
            <>
              <span>{thai ? 'ทำเสร็จ' : 'Complete'}</span>
              <span>{thai ? 'ไม่มา' : 'No show'}</span>
            </>
          )}
        </div>
      </div>
      <PreviewCaption />
    </figure>
  )
}

function WeekMaster() {
  const { thai, lesson } = useHomepageCopy()
  return (
    <figure className="marketing-panel week-master">
      <div className="panel-appbar">
        <strong>{thai ? 'ตารางเรียน' : 'Schedules'}</strong>
        <span>{thai ? 'ไทย' : 'English'}</span>
      </div>
      <div className="week-toolbar" aria-hidden="true">
        <strong>{thai ? '10–16 ส.ค. 2026' : 'Aug 10–16, 2026'}</strong>
        <span>{thai ? 'วันนี้' : 'Today'}</span>
        <span>{thai ? 'วัน' : 'Day'}</span>
        <span className="is-selected">{thai ? 'สัปดาห์' : 'Week'}</span>
      </div>
      <div className="week-chips" aria-hidden="true">
        <span>{thai ? '3–9 ส.ค.' : 'Aug 3–9'}</span>
        <span className="is-selected">{thai ? '10–16 ส.ค.' : 'Aug 10–16'}</span>
        <span>{thai ? '17–23 ส.ค.' : 'Aug 17–23'}</span>
      </div>
      <div className="week-actions" aria-hidden="true">
        <span>{thai ? 'ค้นหาตามคลาส…' : 'Search by class…'}</span>
        <strong>+ {thai ? 'เพิ่มตาราง' : 'Add Schedule'}</strong>
      </div>
      <div className="week-filters" aria-hidden="true">
        <span className="is-selected">{thai ? 'ทั้งหมด' : 'All'}</span>
        <span>{thai ? 'ตามตาราง' : 'Scheduled'}</span>
        <span>{thai ? 'เสร็จสิ้น' : 'Completed'}</span>
        <span>{thai ? 'ไม่มา' : 'No Show'}</span>
        <span>{thai ? 'ยกเลิก' : 'Cancelled'}</span>
      </div>
      <div className="week-calendar">
        <div>
          <small>{thai ? 'ศ.' : 'FRI'}</small>
          <strong>14</strong>
        </div>
        <div>
          <small>{thai ? 'ส.' : 'SAT'}</small>
          <strong>15</strong>
        </div>
        <div className="is-today">
          <small>{thai ? 'อา.' : 'SUN'}</small>
          <strong>16</strong>
        </div>
        <span>09:00</span>
        <span>10:00</span>
        <span>11:00</span>
        <article>
          <strong>{lesson}</strong>
          <small>09:00–10:00 · {thai ? 'ออนไลน์' : 'Online'}</small>
        </article>
      </div>
      <span className="week-crop-note">
        {thai
          ? 'มุมมองสัปดาห์ · รายละเอียด ศ.–อา.'
          : 'Week view · Fri–Sun detail'}
      </span>
      <PreviewCaption />
    </figure>
  )
}

function DayPanel() {
  const { thai, lesson } = useHomepageCopy()
  return (
    <figure className="marketing-panel day-panel">
      <div className="week-head">
        <strong>{thai ? 'ตารางเรียน' : 'Schedules'}</strong>
        <span>{thai ? 'วัน' : 'Day'}</span>
      </div>
      <div className="day-date">
        <span>‹</span>
        <strong>{thai ? 'อาทิตย์ 16 ส.ค.' : 'Sun, Aug 16'}</strong>
        <span>›</span>
      </div>
      <div className="day-grid">
        <span>09:00</span>
        <div>
          <strong>{lesson}</strong>
          <small>{thai ? 'ออนไลน์ · 60 นาที' : 'Online · 60 min'}</small>
          <em>{thai ? 'ตามตาราง' : 'Scheduled'}</em>
        </div>
        <span>10:00</span>
      </div>
      <PreviewCaption />
    </figure>
  )
}

function StoryBeat({
  index,
  title,
  copy,
  children,
}: {
  index: number
  title: string
  copy: string
  children: ReactNode
}) {
  const sceneRef = useSceneReveal<HTMLElement>()
  return (
    <article
      ref={sceneRef}
      className={`homepage-story-beat homepage-story-beat-${index}`}
    >
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {children}
    </article>
  )
}

function LineReminderProof() {
  const { thai } = useHomepageCopy()
  const lineProofRef = useSceneReveal<HTMLElement>()
  const heading = thai ? 'การเชื่อมต่อ LINE' : 'LINE integration'
  const transcript =
    'Class reminder\n\nHi Maya Chen, your English foundations class starts in 1 hour.\n\nDate: Aug 16, 2026\nTime: 9:00 AM–10:00 AM\nTime zone: Asia/Bangkok'
  return (
    <section
      ref={lineProofRef}
      className="line-proof"
      aria-labelledby="line-proof-title"
    >
      <div>
        <h2 id="line-proof-title">{heading}</h2>
        <p>
          {thai
            ? 'เชื่อมต่อ LINE Official Account และส่งการแจ้งเตือนคลาสให้กับนักเรียนที่เชื่อมไว้'
            : 'Connect your LINE Official Account and send class reminders to linked students.'}
        </p>
      </div>
      <figure>
        <img
          src={lineReminderDemo}
          width={800}
          height={1000}
          loading="lazy"
          alt={
            thai
              ? 'ตัวอย่างเดโม LINE ที่แสดงข้อความเตือนคลาส English foundations สำหรับ Maya Chen'
              : 'Illustrative demo LINE reminder message for Maya Chen about English foundations'
          }
        />
        <figcaption>
          {thai
            ? 'ตัวอย่างการแจ้งเตือน LINE'
            : 'Illustrative LINE reminder preview'}
        </figcaption>
        <p className="screen-reader-text">{transcript}</p>
      </figure>
    </section>
  )
}

export function MarketingHomepage({
  nativeStatus,
}: {
  nativeStatus: NativeStatus
}) {
  const { copy, thai } = useHomepageCopy()
  const heroRef = useSceneReveal<HTMLDivElement>()
  return (
    <>
      <a className="skip-link" href="#main-content">
        {copy.common.skipToContent}
      </a>
      <MarketingHeader />
      <main id="main-content">
        <section
          className="homepage-hero"
          id="product"
          aria-labelledby="homepage-title"
        >
          <div>
            <h1 id="homepage-title">
              {thai
                ? 'ทุกอย่างสำหรับวันสอนที่ชัดเจนขึ้น'
                : 'Everything for a clearer teaching day.'}
            </h1>
            <p>
              {thai
                ? 'มุมมองที่ทำให้วันสอนเดินหน้า อยู่ใกล้กันพอจะใช้ได้ทันที'
                : 'The views that keep a teaching day moving sit close enough to use when you need them.'}
            </p>
            <a className="button" href="#workflow">
              {thai ? 'สำรวจ TutorPal' : 'Explore TutorPal'}
            </a>
          </div>
          <div ref={heroRef} className="homepage-product-universe">
            <BalancePanel compact />
            <WeekMaster />
            <TodayPanel />
            <span className="connection connection-one">
              {thai ? 'คลาส' : 'Class'} <i /> {thai ? 'ตาราง' : 'Schedule'}
            </span>
            <span className="connection connection-two">
              {thai ? 'ตาราง' : 'Schedule'} <i /> {thai ? 'วันนี้' : 'Today'}
            </span>
            <img
              src={tutorObjects}
              width={1536}
              height={1024}
              loading="lazy"
              alt=""
              aria-hidden="true"
            />
          </div>
        </section>
        <section className="homepage-transition">
          <p>
            {thai
              ? 'ก่อนเปิดแท็บต่อไป คุณรู้แล้วว่าวันนี้ต้องให้ความสำคัญกับอะไร'
              : 'Before the next tab opens, you know what deserves your attention.'}
          </p>
        </section>
        <section
          className="homepage-story"
          id="workflow"
          aria-label={thai ? 'เส้นทางการสอน' : 'Teaching journey'}
        >
          <StoryBeat
            index={1}
            title={thai ? 'คลาสที่มีบริบท' : 'A class with context.'}
            copy={
              thai
                ? 'รู้จักผู้เรียน ชั่วโมงที่เหลือ และรายได้ที่บันทึกแล้ว'
                : 'See the learner, remaining hours, and recorded revenue.'
            }
          >
            <BalancePanel />
          </StoryBeat>
          <StoryBeat
            index={2}
            title={
              thai ? 'วางแผนทั้งวันและสัปดาห์' : 'Plan the day and the week.'
            }
            copy={
              thai
                ? 'เซสชันเดียวกันอยู่ในมุมมองที่เหมาะกับการตัดสินใจ'
                : 'The same session appears in the view that helps you decide.'
            }
          >
            <div className="paired-panels">
              <DayPanel />
              <WeekMaster />
            </div>
          </StoryBeat>
          <StoryBeat
            index={3}
            title={thai ? 'มาถึงอย่างพร้อม' : 'Arrive prepared.'}
            copy={
              thai
                ? 'ยืนยันสิ่งที่เกิดขึ้น แล้วไปต่ออย่างมั่นใจ'
                : 'Confirm what happened, then move ahead with confidence.'
            }
          >
            <TodayPanel />
          </StoryBeat>
          <StoryBeat
            index={4}
            title={
              thai ? 'เก็บบทเรียนที่เสร็จแล้ว' : 'Keep completed lessons close.'
            }
            copy={
              thai
                ? 'เซสชันที่เสร็จแล้วอยู่ในประวัติของคลาสเดียวกัน'
                : 'A completed session stays in the history of the same class.'
            }
          >
            <TodayPanel completed />
          </StoryBeat>
        </section>
        <section
          className="capability-rail"
          id="benefits"
          aria-label={thai ? 'ความสามารถของ TutorPal' : 'TutorPal capabilities'}
        >
          <strong>
            {thai
              ? 'นักเรียน · คลาส · ชั่วโมง · ตาราง · รายได้'
              : 'Students · Classes · Hours · Schedules · Revenue'}
          </strong>
        </section>
        <LineReminderProof />
        <FaqSection />
        <section
          className="beta-section"
          id="beta"
          aria-labelledby="beta-title"
        >
          <div className="section-layout beta-layout">
            <div className="beta-copy">
              <h2 id="beta-title">{copy.beta.title}</h2>
              <p>{copy.beta.description}</p>
              <p className="small-print">
                {copy.beta.smallPrintBefore}{' '}
                <a href="/privacy">{copy.common.privacy}</a>
                {copy.beta.smallPrintAfter}
              </p>
            </div>
            <BetaLeadForm nativeStatus={nativeStatus} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
