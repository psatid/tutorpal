import '@fontsource-variable/outfit'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useRef, type ReactNode } from 'react'
import { BetaLeadForm } from './beta-lead-form'
import { FaqSection } from './faq-section'
import { Footer } from './footer'
import { MarketingHeader } from './marketing-header'
import { useMarketingLanguage } from './marketing-language'
import './marketing-homepage.css'

type NativeStatus = 'success' | 'error' | undefined

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

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

function TodayPanel({
  completed = false,
  compact = false,
}: {
  completed?: boolean
  compact?: boolean
}) {
  const { thai, lesson } = useHomepageCopy()
  const status = completed
    ? thai
      ? 'เสร็จสิ้น'
      : 'Completed'
    : thai
      ? 'ตามตาราง'
      : 'Scheduled'
  return (
    <figure className={`marketing-panel today-panel${compact ? ' is-compact' : ''}`}>
      {compact ? (
        <div className="compact-today-title">
          <span>
            {completed
              ? thai
                ? 'ประวัติเซสชัน'
                : 'Session history'
              : thai
                ? 'เซสชันที่ต้องยืนยัน'
                : 'Session to confirm'}
          </span>
          <strong>{lesson}</strong>
        </div>
      ) : (
        <>
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
        </>
      )}
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
    <article className={`homepage-story-beat homepage-story-beat-${index}`} data-reveal-card>
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
        <h2 key={thai ? 'line-th' : 'line-en'} id="line-proof-title" data-split-heading>{heading}</h2>
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
  useGSAP(
    () => {
      const root = mainRef.current
      if (!root) return

      const mm = gsap.matchMedia()
      let refreshFrame: number | undefined
      const refresh = () => {
        if (refreshFrame) cancelAnimationFrame(refreshFrame)
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = undefined
          ScrollTrigger.refresh()
        })
      }

      const animateLineReminder = () => {
        const proof = root.querySelector<HTMLElement>('.line-proof')
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
              { y: 6, opacity: 0.76 },
            { y: 0, opacity: 1, duration: 0.26, stagger: 0.08 },
          )
          .fromTo(
            message,
            {
              x: -24,
              y: 20,
              scale: 0.97,
              opacity: 0.7,
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.6,
            },
          )
      }

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const heroKicker = root.querySelector<HTMLElement>('.hero-kicker')
        const heroTitle = root.querySelector<HTMLElement>('.homepage-hero h1')
        const heroSupport = root.querySelector<HTMLElement>('.hero-support')
        const heroCta = root.querySelector<HTMLElement>('.hero-actions')
        const heroWeek = root.querySelector<HTMLElement>('.hero-week-motion')
        const heroBalance = root.querySelector<HTMLElement>('.hero-balance-motion')
        const heroToday = root.querySelector<HTMLElement>('.hero-today-motion')

        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from(heroKicker, { y: 12, opacity: 0.78, duration: 0.48 })
          .from(heroTitle, { y: 24, opacity: 0.78, duration: 0.64 }, '-=0.36')
          .from(heroSupport, { y: 14, opacity: 0.78, duration: 0.5 }, '-=0.44')
          .from(heroCta, { y: 12, opacity: 0.78, duration: 0.5 }, '-=0.4')
          .from(heroWeek, { y: 28, opacity: 0.76, duration: 0.68 }, '-=0.3')
          .from(heroBalance, { y: 18, opacity: 0.78, duration: 0.48 }, '-=0.52')
          .from(heroToday, { y: 18, opacity: 0.78, duration: 0.48 }, '-=0.42')

        root.querySelectorAll<HTMLElement>('[data-reveal-card]').forEach((card) => {
          const copy = card.querySelector<HTMLElement>('.story-copy')
          const media = card.querySelector<HTMLElement>('.scene-media')
          if (!copy || !media) return
          gsap.timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: {
              trigger: card,
              start: 'top 79%',
              toggleActions: 'play none none none',
            },
          })
            .from(copy, { y: 18, opacity: 0.76, duration: 0.46 })
            .from(media, { y: 26, opacity: 0.76, scale: 0.985, duration: 0.6 }, '-=0.34')
        })

        const balanceProgress = root.querySelector<HTMLElement>('.story-balance .balance-progress i')
        if (balanceProgress) {
          gsap.from(balanceProgress, {
            scaleX: 0.7,
            transformOrigin: 'left center',
            duration: 0.54,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: balanceProgress,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          })
        }

        const pendingConfirm = root.querySelector<HTMLElement>('.workflow-proof-scheduled .confirm-box')
        const completedConfirm = root.querySelector<HTMLElement>('.workflow-proof-completed .confirm-box')
        if (pendingConfirm && completedConfirm) {
          gsap.timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: {
              trigger: pendingConfirm,
              start: 'top 76%',
              toggleActions: 'play none none none',
            },
          })
            .from(pendingConfirm, { y: 12, opacity: 0.76, duration: 0.38 })
            .from(completedConfirm, { y: 12, opacity: 0.76, duration: 0.42 }, '-=0.2')
        }

        animateLineReminder()
      })

      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
        const splits = Array.from(
          root.querySelectorAll<HTMLElement>('[data-split-heading]'),
          (heading) => SplitText.create(heading, {
            type: 'lines',
            mask: 'lines',
            aria: 'auto',
            autoSplit: true,
            onSplit: (split) => gsap.from(split.lines, {
              yPercent: 105,
              opacity: 0.74,
              duration: 0.58,
              ease: 'power3.out',
              stagger: 0.08,
              scrollTrigger: {
                trigger: heading,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }),
          }),
        )
        const balancePlane = root.querySelector<HTMLElement>('.hero-balance-plane')
        const todayPlane = root.querySelector<HTMLElement>('.hero-today-plane')
        const hero = root.querySelector<HTMLElement>('.homepage-hero')
        const story = root.querySelector<HTMLElement>('.homepage-story')

        if (balancePlane && hero) {
          gsap.to(balancePlane, {
            y: -20,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
          })
        }
        if (todayPlane && hero) {
          gsap.to(todayPlane, {
            y: -34,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
          })
        }
        if (story) {
          gsap.from(story, {
            y: 24,
            opacity: 0.86,
            duration: 0.68,
            ease: 'power3.out',
            scrollTrigger: { trigger: story, start: 'top 82%', toggleActions: 'play none none none' },
          })
        }
        return () => splits.forEach((split) => split.revert())
      })

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
      <MarketingHeader floating />
      <main ref={mainRef} id="main-content" className="marketing-homepage">
        <section
          className="homepage-hero"
          id="product"
          aria-labelledby="homepage-title"
        >
          <div className="hero-copy">
            <p className="hero-kicker">
              {thai ? 'ผู้ช่วยที่จัดระเบียบวันสอน' : 'For independent tutors'}
            </p>
            <h1 id="homepage-title">
              {thai
                ? 'ทุกอย่างสำหรับวันสอนที่ชัดเจนขึ้น'
                : 'Everything for a clearer teaching day.'}
            </h1>
            <p className="hero-support">
              {thai
                ? 'มุมมองที่ทำให้วันสอนเดินหน้า อยู่ใกล้กันพอจะใช้ได้ทันที'
                : 'The views that keep a teaching day moving sit close enough to use when you need them.'}
            </p>
            <div className="hero-actions">
              <a className="button" href="#workflow">
                {thai ? 'สำรวจ TutorPal' : 'Explore TutorPal'}
              </a>
              <a className="text-link" href="#beta">
                {copy.hero.joinBeta}
              </a>
            </div>
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
        <section className="homepage-transition" aria-label={thai ? 'จังหวะของวันสอน' : 'Teaching-day rhythm'}>
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
          <div className="story-introduction">
            <p className="story-promise">
              {thai
                ? 'บริบทที่ชัดเจน ทำให้ทุกขั้นตอนต่อกัน'
                : 'Clear context keeps every next step connected.'}
            </p>
          </div>
          <StoryBeat
            index={1}
            title={thai ? 'คลาสที่มีบริบท' : 'A class with context.'}
            copy={
              thai
                ? 'รู้จักผู้เรียน ชั่วโมงที่เหลือ และรายได้ที่บันทึกแล้ว'
                : 'See the learner, remaining hours, and recorded revenue.'
            }
          >
            <div className="feature-panel story-balance"><BalancePanel /></div>
          </StoryBeat>
          <div className="workflow-proof-grid" aria-label={thai ? 'การวางแผนและสถานะเซสชัน' : 'Planning and session states'}>
            <article className="workflow-proof-planning" data-reveal-card>
              <div className="story-copy">
                <h2>{thai ? 'วางแผนทั้งวันและสัปดาห์' : 'Plan the day and the week.'}</h2>
                <p>
                  {thai
                    ? 'เซสชันเดียวกันอยู่ในมุมมองที่เหมาะกับการตัดสินใจ'
                    : 'The same session appears in the view that helps you decide.'}
                </p>
              </div>
              <div className="scene-media">
                <div className="paired-panels">
                  <WeekMaster />
                  <DayPanel />
                </div>
              </div>
            </article>
            <article className="workflow-proof-state workflow-proof-scheduled" data-reveal-card>
              <div className="story-copy">
                <h2>{thai ? 'มาถึงอย่างพร้อม' : 'Arrive prepared.'}</h2>
                <p>
                  {thai
                    ? 'ยืนยันสิ่งที่เกิดขึ้น แล้วไปต่ออย่างมั่นใจ'
                    : 'Confirm what happened, then move ahead with confidence.'}
                </p>
              </div>
              <div className="scene-media"><TodayPanel compact /></div>
            </article>
            <article className="workflow-proof-state workflow-proof-completed" data-reveal-card>
              <div className="story-copy">
                <h2>{thai ? 'เก็บบทเรียนที่เสร็จแล้ว' : 'Keep completed lessons close.'}</h2>
                <p>
                  {thai
                    ? 'เซสชันที่เสร็จแล้วอยู่ในประวัติของคลาสเดียวกัน'
                    : 'A completed session stays in the history of the same class.'}
                </p>
              </div>
              <div className="scene-media"><TodayPanel completed compact /></div>
            </article>
          </div>
        </section>
        <section className="capability-stage" id="benefits" aria-labelledby="capability-title">
          <div className="capability-introduction">
            <h2 key={thai ? 'capability-th' : 'capability-en'} id="capability-title" data-split-heading>
              {thai
                ? 'ทุกส่วนของวันสอน เชื่อมถึงกัน'
                : 'Every part of a teaching day, connected.'}
            </h2>
            <p className="capability-copy">
              {thai
                ? 'นักเรียน คลาส ชั่วโมง ตาราง และรายได้ อยู่ใกล้กับการเตือนที่ส่งถึงผู้เรียน'
                : 'Students, classes, hours, schedules, and revenue stay close to the reminder that reaches your learner.'}
            </p>
          </div>
          <LineReminderProof />
        </section>
        <div className="homepage-closing">
          <FaqSection />
        </div>
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
