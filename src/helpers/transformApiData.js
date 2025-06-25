// helpers/transformApiData.js
import { getCallDetail, getUserCallDetail } from "../api/dashboard";
import { convertCSTToLocalTime } from "../utils/common";

export const transformApiData = async (
  { startDate, endDate, extensionNumber, extensionTenant, tenant },
  userCompanyCode,
  userRole
) => {
  try {
    // console.log("========= TRANSFORM API DATA START =========");
    // console.log("Params:", { startDate, endDate, extensionNumber, extensionTenant, tenant });
    // console.log("User Company Code:", userCompanyCode);
    // console.log("User Role:", userRole);
    
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

    // First map the data
    const transformedData = results?.map((data) => {
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
        return Math?.floor((endTime - startTime) / 1000);
      };      const nameAndNumber = getNameAndNumber(data.clid);
      const duration = durationInSeconds(data.answer, data.end);
      const localStartTime = convertCSTToLocalTime(data.start);
      const extensionCode = data.realsrc?.split("-")[1] || "";

      // console.log("--------------- CALL DEBUG DATA ---------------");
      // console.log("Call ID:", data.uniqueid);
      // console.log("Extension Code:", extensionCode, typeof extensionCode);
      // console.log("User Company Code:", userCompanyCode, typeof userCompanyCode);
      // console.log("realsrc:", data.realsrc);
      // console.log("src:", data.src);      console.log("dst:", data.dst);
      // console.log("wherelanded:", data.wherelanded);
      // console.log("clid:", data.clid);
      // console.log("Direction condition:", extensionCode === userCompanyCode ? "Outgoing" : "Incoming");
      // console.log("String comparison:", `"${String(extensionCode)}" === "${String(userCompanyCode)}"`);
      // console.log("Start time:", data.start);
      // console.log("Answer time:", data.answer);
      // console.log("End time:", data.end);
      // console.log("Duration:", duration);
      // console.log("Status:", data.disposition);
      // console.log("------------------------------------------");      
      if (String(extensionCode) === String(userCompanyCode)) {
        const outgoingData = {
          extension: data.realsrc,
          callerName: nameAndNumber.callerName,
          callerNumber: nameAndNumber.callerNumber,
          receiver: data.wherelanded,
          date: localStartTime,
          duration,
          direction: "Outgoing",
          status: data.disposition,
        };
        // console.log("OUTGOING TRANSFORMED DATA:", outgoingData);
        return outgoingData;
      } else {
        const incomingData = {
          extension: data.wherelanded || data.src,
          callerName: nameAndNumber.callerName,
          callerNumber: nameAndNumber.callerNumber,
          receiver: userCompanyCode,
          date: localStartTime,
          duration,
          direction: "Incoming",
          status: data.disposition,
        };
        // console.log("INCOMING TRANSFORMED DATA:", incomingData);
        return incomingData;
      }
    });    // Then sort by date in descending order (most recent first)
    const sortedData = transformedData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    // console.log("Total Records Processed:", results.length);
    // console.log("Total Records After Transform:", sortedData.length);
    // console.log("========= TRANSFORM API DATA END =========");
    
    return sortedData;
  } catch (error) {
    console.error("Error in transformApiData:", error);
    // console.log("========= TRANSFORM API DATA ERROR =========");
    return [];
  }
};
