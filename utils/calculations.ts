
import { 
  differenceInYears, 
  parseISO, 
  isAfter, 
  isBefore, 
  startOfMonth, 
  subMonths, 
  getYear, 
  getMonth, 
  getDate,
  addDays,
  isSameDay,
  isEqual,
  startOfDay
} from 'date-fns';
import { Employee, LeaveRequest, LeaveBalance, LeaveType, RequestStatus } from '../types';
import { FEDERAL_HOLIDAYS, MAX_VACATION_DAYS } from '../constants';

/**
 * Calculates leave accrual by simulating day-by-day from hire date to now.
 * This is the only way to accurately enforce the June 30th cap historically.
 */
export const calculateAccruals = (employee: Employee, requests: LeaveRequest[]): LeaveBalance => {
  const hireDate = startOfDay(parseISO(employee.hireDate));
  const now = startOfDay(new Date());
  
  let vBal = 0;
  let sBal = 0;
  let hBal = 0;

  // Filter and sort approved requests for this employee
  const myApprovedRequests = requests
    .filter(r => r.employeeId === employee.id && r.status === RequestStatus.Approved)
    .map(r => ({ ...r, dateObj: startOfDay(parseISO(r.date)) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  let currentDate = new Date(hireDate);

  // Iterate from hireDate to now
  while (currentDate <= now) {
    const day = getDate(currentDate);
    const month = getMonth(currentDate); // 0-11
    const year = getYear(currentDate);

    // 1. Accrual at the start of each month
    if (day === 1) {
      const yearsTenure = differenceInYears(currentDate, hireDate);
      
      // Vacation Accrual
      if (yearsTenure < 1) vBal += 0.5;
      else if (yearsTenure < 10) vBal += 1.0;
      else vBal += 1.5;

      // Sick Accrual
      sBal += 1.0;
    }

    // 2. Holiday Accrual
    const isHoliday = FEDERAL_HOLIDAYS.some(h => isSameDay(parseISO(h.date), currentDate));
    if (isHoliday) {
      hBal += 1;
    }

    // 3. Process Leave for today
    const requestToday = myApprovedRequests.find(r => isSameDay(r.dateObj, currentDate));
    if (requestToday) {
      if (requestToday.type === LeaveType.Sick) {
        sBal -= 1;
      } else if (requestToday.type === LeaveType.Vacation) {
        // Use Holiday first, then Vacation
        if (hBal > 0) {
          hBal -= 1;
        } else {
          vBal -= 1;
        }
      }
    }

    // 4. Annual Reset on June 30th
    // "Anything over 30 vacation days is rolled into retirement... not available after June 30th"
    if (month === 5 && day === 30) {
      if (vBal > MAX_VACATION_DAYS) {
        vBal = MAX_VACATION_DAYS;
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return {
    vacation: Math.max(0, vBal),
    sick: Math.max(0, sBal),
    holiday: Math.max(0, hBal)
  };
};

export const getRequestWindow = (date: Date): { start: string, end: string, label: string } => {
  const month = getMonth(date);
  const year = getYear(date);
  if (month < 6) {
    return { start: `${year}-01-01`, end: `${year}-06-30`, label: `Jan-Jun ${year}` };
  } else {
    return { start: `${year}-07-01`, end: `${year}-12-31`, label: `Jul-Dec ${year}` };
  }
};

/**
 * Determines if a request date is locked for seniority bumping.
 * Rule: Once the month before the time period starts, no more kicking.
 */
export const isLockedForBumping = (requestDate: string): boolean => {
  const reqDate = parseISO(requestDate);
  const reqMonth = getMonth(reqDate);
  const reqYear = getYear(reqDate);
  
  // Window start is either Jan 1 or July 1
  const windowStart = reqMonth < 6 
    ? new Date(reqYear, 0, 1) 
    : new Date(reqYear, 6, 1);
    
  const lockStartDate = subMonths(windowStart, 1);
  const now = new Date();
  
  // Locked if current date is on or after the 1st of the month preceding the window
  return isAfter(now, lockStartDate) || isEqual(startOfDay(now), startOfDay(lockStartDate));
};

export const getSeniorityRank = (employee: Employee): number => {
  return new Date(employee.hireDate).getTime(); // Lower timestamp = higher seniority
};
