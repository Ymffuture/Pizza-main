// src/utils/businessHours.js
// Mirrors the Python logic in utils/business_hours.py
// All times are SAST (UTC+2)

const SCHEDULE = {
  0: { open: "09:00", close: "17:00" },   // Monday
  1: { open: "09:00", close: "17:00" },   // Tuesday
  2: { open: "03:00", close: "17:00" },   // Wednesday
  3: { open: "09:00", close: "17:00" },   // Thursday
  4: { open: "09:00", close: "17:00" },   // Friday
  5: { open: "09:00", close: "14:00" },   // Saturday
  6: null ,                                  // Sunday — closed
};

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function sastNow() {
  // Get current time in SAST (UTC+2) without relying on browser timezone
  const now = new Date();
  // UTC offset for SAST is always +120 minutes (no DST)
  const sastOffset = 120;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + sastOffset * 60000);
}

/**
 * Returns { isOpen, day, openTime, closeTime, message, minutesUntilClose, schedule }
 */
export function getBusinessHoursStatus() {
  const now = sastNow();
  const weekday = now.getDay();         // 0=Sun, 1=Mon ... 6=Sat
  // JS getDay is 0=Sun, Python weekday is 0=Mon — convert
  const pythonWeekday = (weekday + 6) % 7;   // 0=Mon ... 6=Sun

  const todaySchedule = SCHEDULE[pythonWeekday];

  const schedule = {
    "Monday":    "09:00 – 17:00",
    "Tuesday":   "09:00 – 17:00",
    "Wednesday": "09:00 – 17:00",
    "Thursday":  "09:00 – 17:00",
    "Friday":    "09:00 – 17:00",
    "Saturday":  "09:00 – 14:00",
    "Sunday":    "Closed",
  };

  if (!todaySchedule) {
    return {
      isOpen: false,
      day: DAY_NAMES[pythonWeekday],
      openTime: null,
      closeTime: null,
      message: "Closed today (Sunday). We reopen Monday at 09:00.",
      minutesUntilClose: null,
      closingSoon: false,
      schedule,
    };
  }

  const [oh, om] = todaySchedule.open.split(":").map(Number);
  const [ch, cm] = todaySchedule.close.split(":").map(Number);

  const openMs  = new Date(now).setHours(oh, om, 0, 0);
  const closeMs = new Date(now).setHours(ch, cm, 0, 0);
  const nowMs   = now.getTime();

  const isOpen = nowMs >= openMs && nowMs < closeMs;
  const minutesUntilClose = isOpen ? Math.floor((closeMs - nowMs) / 60000) : null;
  const closingSoon = minutesUntilClose !== null && minutesUntilClose <= 30;

  let message;
  if (nowMs < openMs) {
    message = `Opens at ${todaySchedule.open} today.`;
  } else if (isOpen) {
    message = closingSoon
      ? `Closing in ${minutesUntilClose} min! Order now.`
      : `Open until ${todaySchedule.close} today.`;
  } else {
    // Find next open day
    let nextMsg = "Reopening tomorrow at 09:00.";
    for (let d = 1; d <= 7; d++) {
      const nextWd = (pythonWeekday + d) % 7;
      if (SCHEDULE[nextWd]) {
        const nextDayName = DAY_NAMES[nextWd];
        const nextOpen    = SCHEDULE[nextWd].open;
        nextMsg = d === 1
          ? `Closed for today. Opens tomorrow (${nextDayName}) at ${nextOpen}.`
          : `Closed for today. Opens ${nextDayName} at ${nextOpen}.`;
        break;
      }
    }
    message = nextMsg;
  }

  return {
    isOpen,
    day: DAY_NAMES[pythonWeekday],
    openTime:  todaySchedule.open,
    closeTime: todaySchedule.close,
    message,
    minutesUntilClose,
    closingSoon,
    schedule,
  };
}

/**
 * Returns true if delivery is currently available.
 * Use this to gate checkout.
 */
export function isDeliveryOpen() {
  return getBusinessHoursStatus().isOpen;
}
