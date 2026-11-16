import { addDays, dateNote, daysUntil, estimateUseBy, formatDay, toDay } from './dates';

// Thursday, November 12, 2026.
const today = '2026-11-12';

describe('toDay', () => {
  it("is the phone's own calendar day, late at night too", () => {
    expect(toDay(new Date(2026, 10, 12, 0, 5))).toBe('2026-11-12');
    expect(toDay(new Date(2026, 10, 12, 23, 55))).toBe('2026-11-12');
    expect(toDay(new Date(2026, 0, 3, 12, 0))).toBe('2026-01-03');
  });
});

describe('addDays', () => {
  it.each([
    ['2026-11-12', 7, '2026-11-19'],
    ['2026-11-12', 0, '2026-11-12'],
    ['2026-11-12', -1, '2026-11-11'],
    ['2026-12-30', 3, '2027-01-02'],
    ['2028-02-28', 1, '2028-02-29'],
  ])('%s plus %s days is %s', (day, count, expected) => {
    expect(addDays(day, count)).toBe(expected);
  });

  it('is not thrown off when the clocks change', () => {
    // US clocks go back on November 1, 2026, and forward on March 14, 2027.
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(addDays('2027-03-13', 2)).toBe('2027-03-15');
  });
});

describe('daysUntil', () => {
  it.each([
    ['2026-11-12', 0],
    ['2026-11-13', 1],
    ['2026-11-15', 3],
    ['2026-11-11', -1],
    ['2027-11-12', 365],
  ])('%s is %s days from today', (day, expected) => {
    expect(daysUntil(day, today)).toBe(expected);
  });

  it('counts whole days across a clock change', () => {
    expect(daysUntil('2026-11-02', '2026-10-31')).toBe(2);
  });
});

describe('formatDay', () => {
  it('writes a day as "Wed, Nov 11"', () => {
    expect(formatDay('2026-11-11')).toBe('Wed, Nov 11');
    expect(formatDay('2026-11-12')).toBe('Thu, Nov 12');
    expect(formatDay('2027-01-03')).toBe('Sun, Jan 3');
  });
});

describe('dateNote', () => {
  it.each([
    ['2026-11-12', 'Today'],
    ['2026-11-13', 'Tomorrow'],
    ['2026-11-14', '2 days'],
    ['2026-11-15', '3 days'],
  ])('puts %s in the use-soon pill as "%s"', (useBy, text) => {
    expect(dateNote(useBy, 'use_by', today)).toEqual({ type: 'soon', text });
  });

  it('says a date that has passed is past, without calling the food unsafe', () => {
    expect(dateNote('2026-11-11', 'use_by', today)).toEqual({
      type: 'past',
      text: 'Past date, check first',
    });
    expect(dateNote('2026-10-01', 'estimated', today).type).toBe('past');
  });

  it('shows a later date in the meta line', () => {
    expect(dateNote('2026-11-16', 'use_by', today)).toEqual({
      type: 'later',
      text: 'Use by Mon, Nov 16',
    });
  });

  it('says so when the date is a guess', () => {
    expect(dateNote('2026-12-08', 'estimated', today)).toEqual({
      type: 'later',
      text: 'Use by about Dec 8',
    });
  });

  it('adds the year when the date is most of a year away', () => {
    expect(dateNote('2028-03-05', 'use_by', today).text).toBe('Use by Mar 5, 2028');
    expect(dateNote('2028-03-05', 'estimated', today).text).toBe('Use by about Mar 5, 2028');
  });
});

describe('estimateUseBy', () => {
  it('guesses a week in the fridge, three months frozen, and six months in the pantry', () => {
    expect(estimateUseBy('fridge', today)).toBe('2026-11-19');
    expect(estimateUseBy('freezer', today)).toBe('2027-02-10');
    expect(estimateUseBy('pantry', today)).toBe('2027-05-11');
  });
});
