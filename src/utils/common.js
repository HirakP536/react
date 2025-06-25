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
  // Check if value is undefined or null
  if (!value) return "";
  // Remove all non-digit characters
  let digits = value?.replace(/[^0-9]/g, "");
  // Remove leading country code if present (e.g., +1)
  if (digits?.length > 10 && digits.startsWith("1")) {
    digits = digits?.slice(1);
  }
  digits = digits.slice(0, 10);
  // Format as (123) 456-7890
  if (digits?.length <= 3) return digits;
  if (digits?.length <= 6)
    return `(${digits?.slice(0, 3)}) ${digits?.slice(3)}`;
  return `(${digits?.slice(0, 3)}) ${digits?.slice(3, 6)}-${digits?.slice(6)}`;
};

export const formatDuration = (seconds) => {
  // Add null check
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return '00:00';
  }
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

export function convertCSTToLocalTime(cstDateStr) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Parse CST string and convert to local time zone
  const localDateTime = DateTime.fromFormat(cstDateStr, "yyyy-MM-dd HH:mm:ss", {
    zone: "America/Chicago",
  }).setZone(localZone);

  const today = DateTime.now().setZone(localZone).startOf("day");
  const yesterday = today.minus({ days: 1 });

  if (localDateTime.hasSame(today, "day")) {
    return "Today";
  } else if (localDateTime.hasSame(yesterday, "day")) {
    return "Yesterday";
  } else {
    return localDateTime.toFormat("yyyy-MM-dd");
  }
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
