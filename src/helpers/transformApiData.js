// helpers/transformApiData.js
import { getCallDetail, getUserCallDetail } from "../api/dashboard";
import { convertToLocalTime } from "../utils/common";

export const transformApiData = async (
  { startDate, endDate, extensionNumber, extensionTenant, tenant },
  userCompanyCode,
  userRole
) => {
  try {
    let response;
    if (userRole === "user") {
      response = await getUserCallDetail(
        startDate,
        endDate,
        extensionNumber,
        extensionTenant,
        tenant
      );
    } else {
      response = await getCallDetail(
        startDate,
        endDate,
        extensionNumber,
        extensionTenant,
        tenant
      );
    }
    const results = response.data;

    if (!Array.isArray(results)) return [];

    return results.map((data) => {
      const getNameAndNumber = (clid) => {
        const match = clid?.match(/"(.*?)"\s*<(\d+)>/);
        return {
          callerName: match?.[1] || "",
          callerNumber: match?.[2] || clid,
        };
      };

      const durationInSeconds = (start, end) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        return Math.floor((endTime - startTime) / 1000);
      };

      const nameAndNumber = getNameAndNumber(data.clid);
      const duration = durationInSeconds(data.answer, data.end);
      const localStartTime = convertToLocalTime(data.start);
      const extensionCode = data.realsrc?.split("-")[1];

      if (extensionCode === userCompanyCode) {
        return {
          extension: data.realsrc,
          callerName: nameAndNumber.callerName,
          callerNumber: nameAndNumber.callerNumber,
          receiver: data.wherelanded,
          date: localStartTime,
          duration,
          direction: "Outgoing",
          status: data.disposition,
        };
      } else {
        return {
          extension: data.wherelanded || data.src,
          callerName: nameAndNumber.callerName,
          callerNumber: nameAndNumber.callerNumber,
          receiver: userCompanyCode,
          date: localStartTime,
          duration,
          direction: "Incoming",
          status: data.disposition,
        };
      }
    });
  } catch (error) {
    console.error("Error in transformApiData:", error);
    return [];
  }
};
