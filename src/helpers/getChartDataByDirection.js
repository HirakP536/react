export const getChartDataByDirection = (calls = [], direction = "") => {
  const allStatuses = [...new Set(calls.map(call => call.status || "UNKNOWN"))]
    .filter(status => status !== "CONGESTION");

  const statusCounts = allStatuses.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  calls.forEach((call) => {
    if (call.direction?.toLowerCase() === direction.toLowerCase()) {
      const status = call.status || "UNKNOWN";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
  });

  return {
    labels: allStatuses,
    data: allStatuses.map((status) => statusCounts[status]),
  };
};
