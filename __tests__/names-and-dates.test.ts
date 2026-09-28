import { fullName, initials } from '../src/utils/names';
import { toDisplayDate, toIsoDate } from '../src/utils/dates';

describe('fullName', () => {
  it('never prints "undefined" for a missing last name', () => {
    expect(fullName({ firstName: 'Mary' })).toBe('Mary');
    expect(fullName({ firstName: 'Mary', lastName: '' })).toBe('Mary');
    expect(fullName({ firstName: 'Mary', lastName: 'Raj' })).toBe('Mary Raj');
    expect(fullName(null)).toBe('');
  });
});

describe('initials', () => {
  it('uses whatever name parts exist', () => {
    expect(initials({ firstName: 'Mary' })).toBe('M');
    expect(initials({ firstName: 'mary', lastName: 'raj' })).toBe('MR');
    expect(initials(undefined)).toBe('?');
  });
});

describe('date of birth parsing', () => {
  it('turns DD/MM/YYYY into an ISO date', () => {
    expect(toIsoDate('22/06/2002')).toBe('2002-06-22');
    expect(toIsoDate('5-1-1990')).toBe('1990-01-05');
  });

  it('rejects impossible, future and malformed dates', () => {
    expect(toIsoDate('31/02/2000')).toBeNull();
    expect(toIsoDate('01/01/2999')).toBeNull();
    expect(toIsoDate('2002-06-22')).toBeNull();
    expect(toIsoDate('01/01/1850')).toBeNull();
  });

  it('round-trips for editing', () => {
    expect(toDisplayDate('2002-06-22')).toBe('22/06/2002');
    expect(toDisplayDate(undefined)).toBe('');
  });
});
