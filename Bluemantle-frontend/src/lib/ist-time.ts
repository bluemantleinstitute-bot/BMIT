const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;
export const IST_TIME_ZONE = "Asia/Kolkata";

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export const toUtcIsoFromIstInput = (value: string) => {
  const match = value.match(DATETIME_LOCAL_PATTERN);

  if (!match) {
    return new Date(value).toISOString();
  }

  const [, year, month, day, hour, minute, second = "0"] = match;
  const istAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return new Date(istAsUtc - IST_OFFSET_MS).toISOString();
};

export const toIstDateTimeLocalValue = (value: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
};

export const formatDateInIst = (
  value: string,
  options: Intl.DateTimeFormatOptions = {}
) => new Date(value).toLocaleDateString("en-IN", { timeZone: IST_TIME_ZONE, ...options });

export const formatTimeInIst = (
  value: string,
  options: Intl.DateTimeFormatOptions = {}
) =>
  new Date(value).toLocaleTimeString("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });

export const formatDateTimeInIst = (
  value: string,
  options: Intl.DateTimeFormatOptions = {}
) =>
  new Date(value).toLocaleString("en-IN", {
    timeZone: IST_TIME_ZONE,
    ...options,
  });
