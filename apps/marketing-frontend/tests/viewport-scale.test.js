import { expect, test } from 'bun:test';
import { scaleViewportQueries } from './support/viewport-scale.js';

test('zoom fixture adjusts only CSS media conditions and preserves product dimensions', () => {
  const css='.hero-product{max-width:440px;min-height:200px;width:100%}@media(max-width:767px){.card{max-width:300px;min-width:120px}}@media screen and (width >= 1024px){.copy{max-width:816px}}@media(prefers-reduced-motion:reduce){.tile{width:64px}}';
  expect(scaleViewportQueries(css,true)).toBe('.hero-product{max-width:440px;min-height:200px;width:100%}@media(max-width:1534px){.card{max-width:300px;min-width:120px}}@media screen and (width >= 2048px){.copy{max-width:816px}}@media(prefers-reduced-motion:reduce){.tile{width:64px}}');
});
test('standalone matchMedia conditions retain the same doubled breakpoint approximation', () => {
  expect(scaleViewportQueries('(min-width: 1024px) and (height < 700px)')).toBe('(min-width: 2048px) and (height < 1400px)');
  expect(scaleViewportQueries('(prefers-reduced-motion: reduce)')).toBe('(prefers-reduced-motion: reduce)');
});
