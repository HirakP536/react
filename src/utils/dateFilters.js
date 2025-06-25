import { DateTime } from "luxon";

export const formatDateForAPI = (date, isStartDate = true, isToday = false) => {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dtLocal = DateTime.fromJSDate(date, { zone: localZone });

  const dtAdjusted =
    isToday && !isStartDate
      ? DateTime.local().setZone(localZone)
      : dtLocal.set({
          hour: isStartDate ? 0 : 23,
          minute: isStartDate ? 0 : 59,
          second: 0,
          millisecond: 0,
        });

  const dtCST = dtAdjusted.setZone("America/Chicago");
  return dtCST.toFormat("yyyy-MM-dd HH:mm");
};

export const getDateRangeForFilter = (filterType) => {
  const now = new Date(); 
  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (filterType) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;

    case "yesterday":
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "week": {
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    }

    case "month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;

    default:
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  }

  const isToday = filterType === "today";

  return {
    startDate: formatDateForAPI(startDate, true, isToday),
    endDate: formatDateForAPI(endDate, false, isToday),
  };
};
