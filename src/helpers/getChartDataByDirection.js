export const getChartDataByDirection = (calls = [], direction = "") => {
  // Define all possible statuses we want to track - keep order consistent
  const allStatuses = ["ANSWERED", "MISSED", "FAILED", "BUSY", "NO ANSWER"];

  // Initialize counts for each status
  const statusCounts = {
    ANSWERED: 0,
    MISSED: 0,
    FAILED: 0,
    BUSY: 0,
    "NO ANSWER": 0,
  };

  // Count occurrences of each status in the filtered call data
  calls.forEach((call) => {
    if (call.direction?.toLowerCase() === direction.toLowerCase()) {
      const status = call.status || "UNKNOWN";

      // If status is one of our tracked statuses, increment its count
      if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
        statusCounts[status] += 1;
      } else if (status === "UNKNOWN") {
        // Map unknown statuses to FAILED
        statusCounts["FAILED"] += 1;
      }
    }
  });

  // Return data in consistent order matching the static labels
  return {
    labels: allStatuses,
    data: allStatuses.map((status) => statusCounts[status]),
  };
};
