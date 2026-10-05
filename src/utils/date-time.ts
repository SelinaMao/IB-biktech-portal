import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "Asia/Phnom_Penh";

export const getCurrentDateTimeISOString = (
  tz: string = DEFAULT_TIMEZONE,
): string => {
  try {
    return !tz ? dayjs().toISOString() : dayjs().tz(tz).toISOString();
  } catch (error) {
    console.error(error);
    return new Date().toISOString();
  }
};

export const getCurrentDateTime = (tz: string = DEFAULT_TIMEZONE): Dayjs => {
  try {
    return !tz ? dayjs() : dayjs().tz(tz);
  } catch (error) {
    console.error(error);
    return dayjs();
  }
};

export const formatDate = (
  date: string,
  format: string = "DD MMM YYYY",
  tz: string = DEFAULT_TIMEZONE,
): string => {
  if (!date) return "-";
  try {
    return !tz ? dayjs(date).format(format) : dayjs(date).tz(tz).format(format);
  } catch (error) {
    console.error(error);
    return new Date().toDateString();
  }
};

export const formatDateTime = (
  date: string,
  tz: string = DEFAULT_TIMEZONE,
): string => formatDate(date, "DD MMM YYYY, h:mm A", tz);

export const getCurrentDateFormat = (
  format: string = "DD MMM YYYY",
  tz: string = DEFAULT_TIMEZONE,
): string => {
  try {
    return !tz ? dayjs().format(format) : dayjs().tz(tz).format(format);
  } catch (error) {
    console.error(error);
    return dayjs().format(format);
  }
};

export const convertDate = (
  date: string,
  fromTimezone: string,
  toTimezone: string,
  format: string = "YYYY-MM-DD hh:mm:ss",
): string => {
  if (
    !date ||
    !fromTimezone ||
    !toTimezone ||
    fromTimezone.toLowerCase() === toTimezone.toLowerCase()
  )
    return date;

  const dateUTC = dayjs.tz(date, fromTimezone).toISOString();
  return dayjs(dateUTC).tz(toTimezone).format(format);
};

/**
 * Accepts "YYYY-MM-DD HH:mm:ss" (treated as UTC) or an ISO string.
 */
export const convertUTCToTimezoneDate = (
  dateUTC: string,
  toTimezone: string,
  format: string = "YYYY-MM-DD HH:mm:ss",
): string => {
  if (!dateUTC || !toTimezone) return dateUTC;

  let dateTime = dateUTC;
  const [date, time] = dateTime.split(" ");
  if (date && time) dateTime = `${date}T${time}Z`;

  return dayjs(dateTime).tz(toTimezone).format(format);
};

export const convertUTCToTimezoneUTCDate = (
  dateUTC: string,
  toTimezone: string,
): string => {
  if (!dateUTC || !toTimezone) return dateUTC;

  let dateTime = dateUTC;
  const [date, time] = dateTime.split(" ");
  if (date && time) dateTime = `${date}T${time}Z`;

  return dayjs(dateTime).tz(toTimezone).toISOString();
};

export const secondsToDuration = (seconds: number): string => {
  const day = 86400;
  const hour = 3600;
  const minute = 60;

  const d = Math.floor(seconds / day);
  const h = Math.floor((seconds % day) / hour);
  const m = Math.floor((seconds % hour) / minute);
  const s = Math.floor(seconds % minute);

  const parts = [
    d > 0 ? `${d} ${d > 1 ? "days" : "day"}` : "",
    h > 0 ? `${h} ${h > 1 ? "hours" : "hour"}` : "",
    m > 0 ? `${m} ${m > 1 ? "minutes" : "minute"}` : "",
    s > 0 ? `${s} ${s > 1 ? "seconds" : "second"}` : "",
  ];

  return parts.filter(Boolean).join(" ");
};
