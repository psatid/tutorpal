import '@fontsource-variable/outfit'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, type ReactNode } from 'react'
import { BetaLeadForm } from './beta-lead-form'
import { FaqSection } from './faq-section'
import { Footer } from './footer'
import { MarketingHeader } from './marketing-header'
import { useMarketingLanguage } from './marketing-language'
import './marketing-homepage.css'

type NativeStatus = 'success' | 'error' | undefined

gsap.registerPlugin(ScrollTrigger, useGSAP)

function useHomepageCopy() {
  const { language, copy } = useMarketingLanguage()
  const thai = language === 'th'
  return {
    copy,
    thai,
    lesson: 'English foundations',
    learner: 'Maya Chen',
  }
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
  return (
    <article className={`homepage-story-beat homepage-story-beat-${index}`}>
      <div className="story-copy-slot">
        <div className="story-copy">
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
      </div>
      <div className="scene-media">{children}</div>
    </article>
  )
}

function LineReminderProof() {
  const { thai } = useHomepageCopy()
  const heading = thai ? 'การเชื่อมต่อ LINE' : 'LINE integration'
  const transcript =
    'Class reminder\n\nHi Maya Chen, your English foundations class starts in 1 hour.\n\nDate: Aug 16, 2026\nTime: 9:00 AM–10:00 AM\nTime zone: Asia/Bangkok'
  return (
    <section className="line-proof" aria-labelledby="line-proof-title">
      <div>
        <h2 id="line-proof-title">{heading}</h2>
        <p>
          {thai
            ? 'เชื่อมต่อ LINE Official Account และส่งการแจ้งเตือนคลาสให้กับนักเรียนที่เชื่อมไว้'
            : 'Connect your LINE Official Account and send class reminders to linked students.'}
        </p>
      </div>
      <div className="line-reminder-stage" data-motion>
        <div className="line-account">
          <span className="line-account-mark" aria-hidden="true">
            LINE
          </span>
          <div>
            <strong>{thai ? 'บัญชีสอนของคุณ' : 'Your tutoring account'}</strong>
            <span>LINE Official Account</span>
          </div>
        </div>
        <p className="line-message-date">Aug 16, 2026</p>
        <p className="line-reminder-message">{transcript}</p>
      </div>
    </section>
  )
}

export function MarketingHomepage({
  nativeStatus,
}: {
  nativeStatus: NativeStatus
}) {
  const { copy, thai } = useHomepageCopy()
  const mainRef = useRef<HTMLElement>(null)
  const transitionPhrases = thai
    ? ['ก่อนเปิดแท็บต่อไป', 'คุณรู้แล้วว่า', 'วันนี้ต้องให้ความสำคัญกับอะไร']
    : [
        'Before the next tab opens,',
        'you know what deserves',
        'your attention.',
      ]
  const transitionText = thai
    ? 'ก่อนเปิดแท็บต่อไป คุณรู้แล้วว่าวันนี้ต้องให้ความสำคัญกับอะไร'
    : 'Before the next tab opens, you know what deserves your attention.'

  useGSAP(
    () => {
      const mm = gsap.matchMedia(mainRef)
      let refreshFrame: number | undefined
      const refresh = () => {
        if (refreshFrame) cancelAnimationFrame(refreshFrame)
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = undefined
          ScrollTrigger.refresh()
        })
      }

      const animateScenes = (scrub: boolean) => {
        const beats = Array.from(
          mainRef.current?.querySelectorAll<HTMLElement>(
            '.homepage-story-beat',
          ) ?? [],
        )

        beats.forEach((beat, index) => {
          const copy = beat.querySelector<HTMLElement>('.story-copy')
          const media = beat.querySelector<HTMLElement>('.scene-media')
          if (!copy || !media) return

          const timeline = gsap.timeline({
            defaults: { ease: scrub ? 'none' : 'power3.out' },
            delay: index === 3 ? 0.16 : 0,
            scrollTrigger: {
              trigger: beat,
              start: scrub ? 'top 82%' : 'top 84%',
              end: scrub ? 'center 64%' : undefined,
              scrub: scrub || undefined,
              toggleActions: scrub ? undefined : 'play none none none',
            },
          })

          timeline
            .fromTo(
              copy,
              { y: 20, opacity: 0.65 },
              { y: 0, opacity: 1, duration: scrub ? 0.8 : 0.45 },
            )
            .fromTo(
              media,
              { y: 36, scale: 0.96, opacity: 0.65, clipPath: 'inset(10% 0 0)' },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                clipPath: 'inset(0 0 0)',
                duration: scrub ? 1 : 0.6,
              },
              scrub ? 0 : 0.04,
            )

          if (index === 0) {
            const progress = beat.querySelector<HTMLElement>('.balance-progress i')
            if (progress) {
              timeline.fromTo(
                progress,
                { scaleX: 0.6 },
                { scaleX: 1, duration: scrub ? 0.45 : 0.3 },
                '<0.1',
              )
            }
          }

          if (index === 1) {
            const week = beat.querySelector<HTMLElement>('.week-master')
            const day = beat.querySelector<HTMLElement>('.day-panel')
            if (week) {
              timeline.fromTo(
                week,
                { y: 16, opacity: 0.72 },
                { y: 0, opacity: 1, duration: scrub ? 0.45 : 0.3 },
                '<0.08',
              )
            }
            if (day) {
              timeline.fromTo(
                day,
                { y: 16, opacity: 0.72 },
                { y: 0, opacity: 1, duration: scrub ? 0.45 : 0.3 },
                '<0.12',
              )
            }
          }

          const confirmation = beat.querySelector<HTMLElement>('.confirm-box')
          if (index === 2 && confirmation) {
            timeline.to(
              confirmation,
              {
                outlineColor: 'var(--marketing-accent)',
                outlineOffset: '2px',
                duration: scrub ? 0.4 : 0.25,
              },
              '<0.12',
            )
          }
          if (index === 3 && confirmation) {
            timeline.fromTo(
              confirmation,
              { y: 8, opacity: 0.72, scale: 0.98 },
              { y: 0, opacity: 1, scale: 1, duration: scrub ? 0.45 : 0.3 },
              '<0.12',
            )
          }
        })
      }

      const animateLineReminder = () => {
        const proof = mainRef.current?.querySelector<HTMLElement>('.line-proof')
        const stage = proof?.querySelector<HTMLElement>('.line-reminder-stage')
        const account = proof?.querySelector<HTMLElement>('.line-account')
        const date = proof?.querySelector<HTMLElement>('.line-message-date')
        const message = proof?.querySelector<HTMLElement>('.line-reminder-message')
        if (!stage || !account || !date || !message) return

        const timeline = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: stage,
            start: 'top 72%',
            toggleActions: 'play none none none',
          },
        })
        timeline
          .fromTo(
            [account, date],
            { y: 6, opacity: 0.8 },
            { y: 0, opacity: 1, duration: 0.26, stagger: 0.08 },
          )
          .fromTo(
            message,
            {
              x: -24,
              y: 20,
              scale: 0.97,
              opacity: 0.55,
              clipPath: 'inset(8% 0 0)',
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
              clipPath: 'inset(0 0 0)',
              duration: 0.6,
            },
          )
      }

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-motion]', { clearProps: 'all' })
      })

      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1119px)', () => {
        animateScenes(false)
        animateLineReminder()
      })

      mm.add(
        '(prefers-reduced-motion: no-preference) and (min-width: 1120px)',
        () => {
          const heroTimeline = gsap.timeline({
            defaults: { ease: 'power3.out' },
          })
          heroTimeline
            .fromTo(
              '.hero-week-motion',
              { y: 30, opacity: 0.72 },
              { y: 0, opacity: 1, duration: 0.62 },
            )
            .fromTo(
              '.hero-balance-motion',
              { y: 18, opacity: 0.76 },
              { y: 0, opacity: 1, duration: 0.48 },
              '-=0.38',
            )
            .fromTo(
              '.hero-today-motion',
              { y: 22, opacity: 0.76 },
              { y: 0, opacity: 1, duration: 0.5 },
              '-=0.42',
            )

          gsap.fromTo(
            '.transition-phrase',
            { opacity: 0.6 },
            {
              opacity: 1,
              stagger: 0.16,
              scrollTrigger: {
                trigger: '.homepage-transition',
                start: 'top 72%',
                end: 'center 60%',
                scrub: true,
              },
            },
          )
          animateScenes(true)
          animateLineReminder()
        },
      )

      ScrollTrigger.sort()
      let cancelled = false
      refresh()
      document.fonts?.ready.then(() => {
        if (!cancelled) refresh()
      })
      return () => {
        cancelled = true
        if (refreshFrame) cancelAnimationFrame(refreshFrame)
        mm.revert()
      }
    },
    { scope: mainRef, dependencies: [thai], revertOnUpdate: true },
  )

  return (
    <>
      <a className="skip-link" href="#main-content">
        {copy.common.skipToContent}
      </a>
      <MarketingHeader />
      <main ref={mainRef} id="main-content" className="marketing-homepage">
        <section
          className="homepage-hero"
          id="product"
          aria-labelledby="homepage-title"
        >
          <div className="hero-copy">
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
          <div className="homepage-product-universe">
            <div className="hero-balance-motion" data-motion>
              <div className="hero-balance-plane">
                <BalancePanel compact />
              </div>
            </div>
            <div className="hero-week-motion" data-motion>
              <div className="hero-week-plane">
                <WeekMaster />
              </div>
            </div>
            <div className="hero-today-motion" data-motion>
              <div className="hero-today-plane">
                <TodayPanel />
              </div>
            </div>
          </div>
        </section>
        <section className="homepage-transition">
          <p className="homepage-transition-visual" aria-hidden="true">
            {transitionPhrases.map((phrase) => (
              <span key={phrase} className="transition-phrase">
                {phrase}
              </span>
            ))}
          </p>
          <p className="screen-reader-text">{transitionText}</p>
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
          <div className="lesson-state-row">
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
          </div>
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
