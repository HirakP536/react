import { DateTime } from 'luxon';

export const formatDateForAPI = (date, isStartDate = true, isToday = false) => {
  const dt = DateTime.fromJSDate(date).setZone('America/Chicago');

  if (isToday && !isStartDate) {
    // Use the actual current time in CST/CDT
    return dt.toFormat('yyyy-MM-dd HH:mm');
  }

  // Use 00:00 for start, 23:59 for end
  const time = isStartDate ? { hour: 0, minute: 0 } : { hour: 23, minute: 59 };
  const adjusted = dt.set(time);
  return adjusted.toFormat('yyyy-MM-dd HH:mm');
};
export const getDateRangeForFilter = (filterType) => {
  const now = new Date();
  const startDate = new Date();
  let endDate = new Date();

  switch (filterType) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'yesterday':
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'week': {
      const dayOfWeek = now.getDay(); // Sunday = 0
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      // endDate stays as now
      break;
    }

    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      // endDate stays as now
      break;

    default:
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  }

  const isToday = filterType === 'today';

  return {
    startDate: formatDateForAPI(startDate, true, isToday),
    endDate: formatDateForAPI(endDate, false, isToday),
  };
};
