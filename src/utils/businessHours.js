// src/utils/businessHours.js

const TIMEZONE = "Africa/Johannesburg";

export const SCHEDULE = Object.freeze({
  0: { open: "09:00", close: "18:00" }, // Monday
  1: { open: "09:00", close: "18:00" }, // Tuesday
  2: { open: "09:00", close: "18:00" }, // Wednesday
  3: { open: "09:00", close: "17:00" }, // Thursday
  4: { open: "09:00", close: "17:00" }, // Friday
  5: { open: "09:00", close: "20:00" }, // Saturday
  6: null,                              // Sunday Closed
});

export const DAY_NAMES = Object.freeze([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

function getSastDate() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)])
  );

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
}

function createScheduleDisplay() {
  return DAY_NAMES.reduce((acc, day, index) => {
    const item = SCHEDULE[index];

    acc[day] = item
      ? `${item.open} – ${item.close}`
      : "Closed";

    return acc;
  }, {});
}

export function getBusinessHoursStatus() {
  const now = getSastDate();

  const weekday = (now.getDay() + 6) % 7;
  const today = SCHEDULE[weekday];

  const schedule = createScheduleDisplay();

  if (!today) {
    return {
      isOpen: false,
      day: DAY_NAMES[weekday],
      openTime: null,
      closeTime: null,
      message: "Closed today.",
      minutesUntilClose: null,
      minutesUntilOpen: null,
      closingSoon: false,
      schedule,
    };
  }

  const [openHour, openMinute] = today.open.split(":").map(Number);
  const [closeHour, closeMinute] = today.close.split(":").map(Number);

  const openDate = new Date(now);
  openDate.setHours(openHour, openMinute, 0, 0);

  const closeDate = new Date(now);
  closeDate.setHours(closeHour, closeMinute, 0, 0);

  const isOpen = now >= openDate && now < closeDate;

  const minutesUntilClose = isOpen
    ? Math.ceil((closeDate - now) / 60000)
    : null;

  const minutesUntilOpen = !isOpen && now < openDate
    ? Math.ceil((openDate - now) / 60000)
    : null;

  const closingSoon =
    minutesUntilClose !== null &&
    minutesUntilClose <= 30;

  let message;

  if (now < openDate) {
    message = `Opens today at ${today.open}`;
  } else if (isOpen) {
    message = closingSoon
      ? `Closing in ${minutesUntilClose} minutes`
      : `Open until ${today.close}`;
  } else {
    let nextDayName = null;
    let nextOpenTime = null;

    for (let i = 1; i <= 7; i++) {
      const nextDay = (weekday + i) % 7;

      if (SCHEDULE[nextDay]) {
        nextDayName = DAY_NAMES[nextDay];
        nextOpenTime = SCHEDULE[nextDay].open;
        break;
      }
    }

    message = `Closed. Opens ${nextDayName} at ${nextOpenTime}`;
  }

  return {
    isOpen,
    day: DAY_NAMES[weekday],
    openTime: today.open,
    closeTime: today.close,
    message,
    minutesUntilClose,
    minutesUntilOpen,
    closingSoon,
    timezone: TIMEZONE,
    schedule,
    currentTime: now.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export const isDeliveryOpen = () =>
  getBusinessHoursStatus().isOpen;
