import { DateTime } from "luxon";

/* eslint-disable no-useless-escape */
const toCST = (date) => {
  const options = { timeZone: "America/Chicago", hour12: false };
  const formatter = new Intl.DateTimeFormat("en-US", {
    ...options,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;
  const second = parts.find((p) => p.type === "second").value;

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export const getFormattedDate = (date, isEndOfDay = false) => {
  if (isEndOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return toCST(date);
};

export const startDate = getFormattedDate(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
);
export const endDate = getFormattedDate(new Date(), true);

export const parseVoiceData = (data) => {
  const lines = data?.trim()?.split("\n");
  const headers = lines[0]?.split("|");
  return lines?.slice(1)?.map((line) => {
    const values = line?.split("|");
    const entry = {};
    headers?.forEach((key, index) => {
      entry[key] =
        isNaN(values[index]) ||
        key === "CallerID" ||
        key === "Msgid" ||
        key === "DateTime"
          ? values[index]
          : Number(values[index]);
    });
    return entry;
  });
};

export const formatUSPhone = (value) => {
  if (!value) return "";
  let digits = value?.replace(/[^0-9]/g, "");
  if (digits?.length > 10 && digits.startsWith("1")) {
    digits = digits?.slice(1);
  }
  digits = digits.slice(0, 10);
  if (digits?.length <= 3) return digits;
  if (digits?.length <= 6)
    return `(${digits?.slice(0, 3)}) ${digits?.slice(3)}`;
  return `(${digits?.slice(0, 3)}) ${digits?.slice(3, 6)}-${digits?.slice(6)}`;
};

export const formatUSAPhoneNumber = (value) => {
  if (!value) return "";
  if (value.includes("*") || value.includes("#")) {
    return value.replace(/\s+/g, "");
  }
  let digits = value.replace(/[^0-9]/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value.replace(/\s+/g, "");
};

export const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return "00:00";
  }
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

export function convertCSTToLocalTime(cstDateStr) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cstDateTime = DateTime.fromFormat(cstDateStr, "yyyy-MM-dd HH:mm:ss", {
    zone: "America/Chicago",
  });
  const localDateTime = cstDateTime.setZone(localZone);
  const today = DateTime.now().setZone(localZone).startOf("day");
  const yesterday = today.minus({ days: 1 });
  const timeFormatted = localDateTime.toFormat("hh:mm a");

  if (localDateTime.hasSame(today, "day")) {
    return `Today at ${timeFormatted}`;
  } else if (localDateTime.hasSame(yesterday, "day")) {
    return `Yesterday at ${timeFormatted}`;
  } else {
    return `${localDateTime.toFormat("yyyy-MM-dd")}  ${timeFormatted}`;
  }
}
export function convertCSTToLocalTimeReport(cstDateStr) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cstDateTime = DateTime.fromFormat(cstDateStr, "yyyy-MM-dd HH:mm:ss", {
    zone: "America/Chicago",
  });
  const localDateTime = cstDateTime.setZone(localZone);
  return `${localDateTime.toFormat("yyyy-MM-dd")}  ${localDateTime.toFormat(
    "hh:mm a"
  )}`;
}

export function formatTimeDuration(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return "0 sec";
  }

  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours} hr ${mins} min ${secs} sec`;
  }

  return `${mins} min ${secs} sec`;
}

export const normalizePhoneNumber = (phoneStr) => {
  if (!phoneStr) return "";
  phoneStr = String(phoneStr);
  if (phoneStr.includes("-") && !phoneStr.match(/\d{3}-\d{3}-\d{4}/)) {
    phoneStr = phoneStr.split("-")[0].trim();
  }
  // Only allow digits, * and #
  let filtered = phoneStr.replace(/[^0-9*#]/g, "");
  // If contains * or #, allow up to 16 chars, else only 10 digits
  if (filtered.includes("*") || filtered.includes("#")) {
    return filtered.slice(0, 16);
  }
  // Only digits: trim to 10 digits
  return filtered.slice(0, 13);
};
