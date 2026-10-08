import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { weeklyLessons, studentSummaries } from '../src/lessons.ts';

// Run after `bun run build`: bun test tests/static-smoke.test.js
// These exercise shipped HTML without executing the optional enhancement scripts.
const dist = resolve(import.meta.dir, '../dist');
const read = path => readFileSync(resolve(dist, path), 'utf8');
const normalize = text => text.replace(/\s+/g, ' ').trim();
async function select(html, selector) {
  const nodes = [];
  await new HTMLRewriter().on(selector, {
    element(element) {
      const node = { tag: element.tagName, attributes: Object.fromEntries(element.attributes), text: '' };
      nodes.push(node);
    },
    text(chunk) { nodes.at(-1).text += chunk.text; },
  }).transform(new Response(html)).text();
  return nodes;
}

for (const [locale, path, canonical, otherLocale] of [
  ['en', 'index.html', 'https://tutorpal.io/', '/th/'],
  ['th', 'th/index.html', 'https://tutorpal.io/th/', '/'],
]) {
  describe(`prerendered ${locale} homepage`, () => {
    const html = read(path);

    test('has localized metadata and reciprocal search alternates', async () => {
      expect((await select(html, 'html'))[0].attributes.lang).toBe(locale);
      expect((await select(html, 'title'))[0].text).toContain('TutorPal');
      expect((await select(html, 'meta[name="description"]'))[0].attributes.content.length).toBeGreaterThan(40);
      expect((await select(html, 'link[rel="canonical"]')).map(n => n.attributes.href)).toEqual([canonical]);
      expect(Object.fromEntries((await select(html, 'link[rel="alternate"]')).map(n => [n.attributes.hreflang, n.attributes.href]))).toEqual({
        en: 'https://tutorpal.io/', th: 'https://tutorpal.io/th/', 'x-default': 'https://tutorpal.io/',
      });
      expect((await select(html, 'meta[name="robots"]')).some(n => n.attributes.content.includes('noindex'))).toBe(false);
      expect((await select(html, 'meta[name="theme-color"]'))[0].attributes.content).toBe('#FFFFFF');
      expect((await select(html, 'meta[property="og:image"]'))[0].attributes.content).toBe('https://tutorpal.io/social.png');
      const schema = JSON.parse((await select(html, 'script[type="application/ld+json"]'))[0].text);
      expect(schema['@graph'].map(node => node['@type'])).toEqual(['Organization', 'WebSite']);
    });

    test('exposes app CTAs, locale navigation, and working section links in HTML', async () => {
      expect(await select(html, '.nav-cta[href="https://app.tutorpal.io"], .actions > .primary[href="https://app.tutorpal.io"], .closing .primary[href="https://app.tutorpal.io"]')).toHaveLength(3);
      for (const cta of await select(html, '.nav-cta, .mobile-menu-cta, .actions > .primary, .closing .primary')) expect(cta.attributes.href).toBe('https://app.tutorpal.io');
      expect((await select(html, '.language'))[0].attributes.href).toBe(otherLocale);
      const ids = new Set((await select(html, '[id]')).map(n => n.attributes.id));
      for (const link of await select(html, 'a[href^="#"]')) expect(ids.has(link.attributes.href.slice(1))).toBe(true);
      expect(await select(html, 'h1')).toHaveLength(1);
      expect(await select(html, 'main#main')).toHaveLength(1);
      expect(await select(html, '.faq-list details > summary')).toHaveLength(4);
      expect(await select(html, '.faq-list details > .faq-answer > p')).toHaveLength(4);
      expect(await select(html, '.mobile-menu > summary')).toHaveLength(1);
      expect(await select(html, '.closing-decor[aria-hidden="true"] .closing-slot .closing-tile > svg')).toHaveLength(6);
      expect(await select(html, '.closing-decor a, .closing-decor button, .closing-decor [tabindex]')).toHaveLength(0);
      expect(await select(html, '.balance-track[aria-hidden="true"] > [data-balance-fill]')).toHaveLength(4);
      expect((await select(html, '[data-balance-fill]')).map(node => node.attributes.style)).toEqual(['width:48%', 'width:72%', 'width:36%', 'width:60%']);
    });

    test('ships the featured lesson, balance, and consistent upcoming reminder without JavaScript', async () => {
      expect(normalize((await select(html, '.lesson-details'))[0].text)).toContain('16:00 – 18:00');
      expect((await select(html, '.lesson-details time'))[0].attributes.datetime).toBe('2026-10-08');
      expect((await select(html, '.lesson-details time'))[1].attributes.datetime).toBe('2026-10-08T16:00:00+07:00');
      expect(normalize((await select(html, '.lesson-details li:nth-child(4)'))[0].text)).toBe('2 h');
      expect(normalize((await select(html, '.hour-values > strong'))[0].text)).toBe('10 → 8 h');
      expect((await select(html, '.reminder-window'))[0].text).toContain('SAT Math · 15:00');
      expect(normalize((await select(html, '.lesson-window h2'))[0].text)).toBe('SAT Math');
      expect(normalize((await select(html, '.lesson-details li:first-child'))[0].text)).toBe('Min Chantarat');
      expect((await select(html, '[data-hero-card]')).map(node => node.attributes['data-hero-card'])).toEqual(['0', '1', '2', '3']);
      expect(await select(html, '[data-hero-card] > .hero-card-float > .product-card')).toHaveLength(4);
      expect(await select(html, '[data-line-check]')).toHaveLength(3);
      expect(await select(html, '.student-row')).toHaveLength(4);
      expect(await select(html, '.story-pin, .reschedule-scene, .schedule-original, .schedule-updated, .demo-caption, .scene-topline, .scene-index, .hero-baseline, .scroll-cue, .baseline-controls, .hero-light-control, #light-toggle, canvas, .light-field')).toHaveLength(0);
      expect(await select(html, '.hero button, .hero-note')).toHaveLength(0);
      expect((await select(html, '.hero'))[0].text).not.toContain('Made for independent tutors. Built around your day.');
      expect((await select(html, 'h1 > span'))[0].text).toBe(locale === 'en' ? 'all in one place.' : 'ครบในที่เดียว');
      expect(normalize((await select(html, 'h1'))[0].text)).toBe(locale === 'en' ? 'Plan, manage, trackall in one place.' : 'วางแผน จัดการ ติดตามครบในที่เดียว');
      expect(normalize((await select(html, '.hero-description'))[0].text)).toBe(locale === 'en'
        ? 'Keep your lessons, students, hours, and LINE reminders connected—so your teaching day runs smoothly.'
        : 'เชื่อมตารางเรียน นักเรียน ชั่วโมงเรียน และการแจ้งเตือน LINE ไว้ด้วยกัน ให้ทุกวันสอนดำเนินไปอย่างราบรื่น');
      expect(normalize((await select(html, '.actions .secondary'))[0].text)).toBe(locale === 'en' ? 'See how it works' : 'ดูวิธีการทำงาน');
      expect((await select(html, '.site-header .brand > img'))[0].attributes.src).toBe('/app-icon-small.png');
    });

    test('ships twelve chronological English lessons in one calendar, excludes the featured math lesson, and leaves Sunday empty', async () => {
      expect(weeklyLessons.map(lesson => lesson.discipline)).toEqual(Array(12).fill('english'));
      const expected = [
        ['ploy-mon-ielts', '2026-10-05', '10:00 – 12:00', 'IELTS', 'Foundation', 'Ploy'],
        ['nath-mon-sat', '2026-10-05', '16:00 – 18:00', 'SAT English', 'Intensive', 'Nath'],
        ['mook-tue-alevel', '2026-10-06', '11:00 – 13:00', 'A-Level English', 'Basic', 'Mook'],
        ['beam-tue-speaking', '2026-10-06', '17:00 – 19:00', 'IELTS Speaking', 'Intensive', 'Beam'],
        ['fai-wed-sat', '2026-10-07', '10:00 – 12:00', 'SAT English', 'Foundation', 'Fai'],
        ['nath-wed-alevel', '2026-10-07', '15:00 – 17:00', 'A-Level English', 'Intensive', 'Nath'],
        ['ploy-thu-ielts', '2026-10-08', '10:00 – 12:00', 'IELTS', 'Basic', 'Ploy'],
        ['earn-thu-sat', '2026-10-08', '16:00 – 18:00', 'SAT English', 'Intensive', 'Earn'],
        ['mook-fri-alevel', '2026-10-09', '11:00 – 13:00', 'A-Level English', 'Foundation', 'Mook'],
        ['beam-fri-ielts', '2026-10-09', '17:00 – 19:00', 'IELTS', 'Intensive', 'Beam'],
        ['fai-sat-sat', '2026-10-10', '10:00 – 12:00', 'SAT English', 'Basic', 'Fai'],
        ['nath-sat-alevel', '2026-10-10', '14:00 – 16:00', 'A-Level English', 'Intensive', 'Nath'],
      ];
      expect(await select(html, '[data-calendar-frame]')).toHaveLength(1);
      expect((await select(html, '.calendar-toolbar'))[0].text).toContain(locale === 'en' ? '5–11 October 2026' : '5–11 ตุลาคม 2026');
      expect((await select(html, '.calendar-toolbar'))[0].text).toContain('Asia/Bangkok');
      expect((await select(html, '.calendar-day > h3 > time')).map(node => node.attributes.datetime)).toEqual(Array.from({length: 7}, (_, i) => `2026-10-${String(i + 5).padStart(2, '0')}`));
      const events = await select(html, '[data-calendar-event]');
      expect(events.map(node => node.attributes['data-lesson-id'])).toEqual(expected.map(lesson => lesson[0]));
      expect(new Set(events.map(node => node.attributes['data-lesson-id'])).size).toBe(12);
      const starts = (await select(html, '[data-calendar-event] time')).map(node => node.attributes.datetime);
      expect(starts).toEqual([...starts].sort());
      expect(await select(html, '[data-calendar-frame] [data-lesson-id="min-sat"]')).toHaveLength(0);
      expect(events.some(node => /\bMin\b|Math/.test(node.text))).toBe(false);
      for (let day = 5; day <= 10; day++) expect(await select(html, `.calendar-day[aria-labelledby="day-${day}"] [data-calendar-event]`)).toHaveLength(2);
      for (const [id, date, time, curriculum, level, student] of expected) {
        const event = `.calendar-day[aria-labelledby="day-${Number(date.slice(-2))}"] li[data-lesson-id="${id}"]`;
        const nodes = await select(html, event);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].attributes.style).toContain(`--start:${Number(time.slice(0, 2)) - 10}`);
        expect(nodes[0].attributes.style).toContain('--duration:2');
        const timeNode = (await select(html, `${event} time`))[0];
        expect(normalize(timeNode.text)).toBe(time);
        expect(timeNode.attributes.datetime).toBe(`${date}T${time.slice(0, 5)}:00+07:00`);
        expect(normalize((await select(html, `${event} h4`))[0].text)).toBe(curriculum);
        expect(normalize((await select(html, `${event} .event-level`))[0].text)).toBe(level);
        expect(normalize((await select(html, `${event} .event-student`))[0].text)).toBe(student);
        expect((await select(html, `${event} > *`)).map(node => node.tag === 'h4' ? 'curriculum' : node.attributes.class)).toEqual(['event-time', 'curriculum', 'event-level', 'event-student']);
      }
      expect(await select(html, '.calendar-empty')).toHaveLength(1);
      expect(normalize((await select(html, '.calendar-day[aria-labelledby="day-11"] .calendar-empty'))[0].text)).toBe(locale === 'en' ? 'No lessons' : 'ไม่มีคาบเรียน');
      expect(await select(html, '.calendar-day[aria-labelledby="day-11"] [data-calendar-event]')).toHaveLength(0);
    });

    test('preserves the exact upcoming English LINE message in either locale', async () => {
      expect((await select(html, '.chat-bubble'))[0].attributes.lang).toBe('en');
      expect((await select(html, '.chat-bubble p'))[0].text).toBe('Class reminder\n\nHi Min, your SAT Math class starts in 1 hour.\n\nDate: Oct 8, 2026\nTime: 4:00 PM–6:00 PM\nTime zone: Asia/Bangkok');
      expect((await select(html, '.message-note'))[0].text).toContain('15:00');
      expect((await select(html, '.message-note'))[0].text).toContain(locale === 'en' ? 'Upcoming' : 'กำลังจะส่ง');
    });

    test('shows four math student summaries and associates every native cell with its localized header', async () => {
      expect(studentSummaries.map(student => student.discipline)).toEqual(Array(4).fill('math'));
      expect(studentSummaries.every(student => student.id.length > 0)).toBe(true);
      expect(new Set(studentSummaries.map(student => student.id)).size).toBe(4);
      const tables = await select(html, 'table.student-table');
      expect(tables).toHaveLength(1);
      expect(tables[0].attributes['aria-label']).toBe(locale === 'en' ? 'Students' : 'นักเรียน');
      const headers = await select(html, 'table.student-table > thead > tr > th');
      expect(headers.map(header => normalize(header.text))).toEqual(locale === 'en'
        ? ['Student', 'Class', 'Hours left', 'Last lesson']
        : ['นักเรียน', 'ชั้นเรียน', 'ชั่วโมงคงเหลือ', 'คาบล่าสุด']);
      const ids = (await select(html, '[id]')).map(node => node.attributes.id);
      expect(await select(html, 'table.student-table > tbody > tr')).toHaveLength(4);
      expect(await select(html, 'table.student-table > tbody > tr > td')).toHaveLength(16);
      expect(normalize((await select(html, '.workspace-title h3 > span'))[0].text)).toBe('04');
      const expected = [
        ['Min Chantarat', 'SAT Math', 'Foundation', '8'],
        ['Ploy Srisai', 'A-Level Mathematics', 'Intensive', '12'],
        ['Kiet Anan', 'SAT Math', 'Basic', '6'],
        ['Fern Chai', 'A-Level Mathematics', 'Advanced', '10'],
      ];
      for (let row = 0; row < expected.length; row++) {
        const selector = `table.student-table > tbody > tr:nth-child(${row + 1})`;
        expect(normalize((await select(html, `${selector} .person strong`))[0].text)).toBe(expected[row][0]);
        expect(normalize((await select(html, `${selector} .class-name > span`))[0].text)).toBe(expected[row][1]);
        expect(normalize((await select(html, `${selector} .student-level`))[0].text)).toBe(expected[row][2]);
        expect(normalize((await select(html, `${selector} .remaining > strong`))[0].text)).toBe(expected[row][3]);
      }
      for (let column = 0; column < headers.length; column++) {
        const header = headers[column];
        expect(header.attributes.scope).toBe('col');
        expect(header.attributes.id).toBeTruthy();
        expect(ids.filter(id => id === header.attributes.id)).toHaveLength(1);
        expect(header.attributes['aria-hidden']).not.toBe('true');
        expect(header.attributes.hidden).toBeUndefined();
        const cells = await select(html, `table.student-table > tbody > tr > td:nth-child(${column + 1})`);
        expect(cells).toHaveLength(4);
        for (const cell of cells) {
          expect(cell.attributes.headers).toBe(header.attributes.id);
          expect(normalize(cell.text).length).toBeGreaterThan(0);
        }
      }
    });

    test('keeps content local and static, with no forms or remote executable dependencies', async () => {
      expect(await select(html, 'form, input, textarea, iframe, astro-island')).toHaveLength(0);
      const guards = await select(html, 'head > script:not([type]):not([src])');
      expect(guards).toHaveLength(1);
      expect(guards[0].text).toContain('tutorpalRevealBoot');
      expect(guards[0].text).toContain('2000');
      expect(guards[0].text).toContain('state.release');
      expect(html.indexOf('tutorpalRevealBoot')).toBeLessThan(html.indexOf('<body'));
      expect(await select(html, '[data-agenda-remainder], .calendar-remainder')).toHaveLength(0);
      expect(await select(html, '.calendar-day')).toHaveLength(7);
      expect(normalize((await select(html, '.calendar-week-desktop'))[0].text)).toBe(locale === 'en' ? '5–11 October 2026' : '5–11 ตุลาคม 2026');
      expect(normalize((await select(html, '.calendar-week-compact'))[0].text)).toBe(locale === 'en' ? '5–7 October 2026' : '5–7 ตุลาคม 2026');
      expect(html).not.toContain('motion-preparing');
      expect(html).not.toContain('tutorpalMotionBoot');
      for (const script of await select(html, 'script')) {
        if (script.attributes.type) expect(['module', 'application/ld+json']).toContain(script.attributes.type);
        else expect(script.text).toBe(guards[0].text);
        if (script.attributes.src) expect(script.attributes.src.startsWith('/_astro/')).toBe(true);
      }
      for (const asset of await select(html, 'img[src], script[src], link[rel="stylesheet"]')) {
        const url = asset.attributes.src ?? asset.attributes.href;
        expect(url.startsWith('/')).toBe(true);
        expect(existsSync(resolve(dist, url.slice(1)))).toBe(true);
      }
      expect(await select(html, 'canvas, #light-toggle, .light-field')).toHaveLength(0);
    });
  });
}

test('ships a crawlable bilingual sitemap, robots instructions, and a nonindexed 404', async () => {
  const sitemap = read('sitemap.xml');
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])).toEqual(['https://tutorpal.io/', 'https://tutorpal.io/th/']);
  expect(read('robots.txt')).toContain('Sitemap: https://tutorpal.io/sitemap.xml');
  expect(read('robots.txt')).not.toContain('Disallow: /');
  const notFound = read('404.html');
  expect((await select(notFound, 'meta[name="robots"]'))[0].attributes.content).toContain('noindex');
  expect(await select(notFound, 'link[rel="canonical"]')).toHaveLength(0);
  expect(await select(notFound, 'head > script:not([type]):not([src])')).toHaveLength(0);
  expect(await select(notFound, 'a[href="/th/"]')).toHaveLength(1);
  expect((await select(notFound, 'meta[name="theme-color"]'))[0].attributes.content).toBe('#FFFFFF');
  expect((await select(notFound, '.brand > img'))[0].attributes.src).toBe('/app-icon-small.png');
  expect(readFileSync(resolve(dist, 'social.png')).subarray(1, 4).toString()).toBe('PNG');
});

// Hashes of the pre-redesign app icons: the approved direction reuses them byte-for-byte.
test('retains the existing logo assets', () => {
  for (const [name, expected] of [
    ['app-icon.png', '38334d1d1f9e26a45ff2b42d2d01ee811acc3f83697c06b5718c7898c394229a'],
    ['app-icon-small.png', '5afdda3a3916a1264864318523e62bca4cbc76394f30483db950b87d8e223698'],
  ]) expect(createHash('sha256').update(readFileSync(resolve(dist, name))).digest('hex')).toBe(expected);
});
