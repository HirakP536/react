/**
 * Utility functions for handling date filters in the Dashboard
 */

/**
 * Get formatted date string in YYYY-MM-DD HH:MM format
 * @param {Date} date - Date object
 * @param {boolean} isStartDate - Whether it's a start date (true) or end date (false)
 * @param {boolean} isToday - Whether the date is today
 * @returns {string} Formatted date string
 */
export const formatDateForAPI = (date, isStartDate = true, isToday = false) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // If it's today's end date, use current time
  if (isToday && !isStartDate) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  const time = isStartDate ? '00:00' : '23:59';
  return `${year}-${month}-${day} ${time}`;
};

/**
 * Get start and end dates for a specific filter type
 * @param {string} filterType - Type of filter (today, yesterday, week, month)
 * @returns {Object} Object with startDate and endDate
 */
export const getDateRangeForFilter = (filterType) => {
  const today = new Date();
  const startDate = new Date();
  let endDate = new Date();
    switch (filterType) {
    case 'today':
      // Start of today
      startDate.setHours(0, 0, 0, 0);
      // End of today
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'yesterday':
      // Start of yesterday
      startDate.setDate(today.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      // End of yesterday
      endDate.setDate(today.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'week': {
      // Start of current week (Sunday)
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      startDate.setDate(today.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      // Current date as end date
      break;
    }
      
    case 'month':
      // Start of current month
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      // Current date as end date
      break;
      
    default:
      // Default to today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);  }
  
  // Check if the selected filter is for today
  const isToday = filterType === 'today';
  
  return {
    startDate: formatDateForAPI(startDate, true, isToday),
    endDate: formatDateForAPI(endDate, false, isToday)
  };
};
