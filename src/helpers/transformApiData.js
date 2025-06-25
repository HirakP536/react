// helpers/transformApiData.js
import { getCallDetail, getUserCallDetail } from "../api/dashboard";

// getCallDetail
export const getCallDetailHandler = async (
  { startDate, endDate, tenant }
) => {
  let TotalResults = [];
  try {
    const response = await getCallDetail(startDate, endDate, tenant);
    TotalResults = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching call details:", error);
  }

  const uniqueResults = [];
  const seen = new Set();

  for (const item of TotalResults) {
    const uniqueKey = `${item.start}_${item.src}_${item.dst}`;
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      uniqueResults.push(item);
    }
  }
  const transformedData = uniqueResults?.map((data) => {
    const status = data.disposition === "NO ANSWER" ? "MISSED" : data.disposition;
    const direction =
      data?.userfield === "[outbound]" ? "Outgoing" : "Incoming";
      const filterData = {
        extension: data.realsrc,
        direction: direction,
        status: status,
      };
      return filterData;
  });

  return transformedData;
};

export const transformApiData = async ({
  startDate,
  endDate,
  extensionNumber,
  extensionTenant,
  tenant,
}) => {
  try {
    let responseData1 = [];
    let responseData2 = [];

    // Get call data for extensionNumber
    try {
      const response1 = await getUserCallDetail(
        startDate,
        endDate,
        extensionNumber,
        tenant
      );
      responseData1 = response1?.data?.filter(item => item?.disposition !== "CONGESTION");
    } catch (error) {
      console.error(
        `Error fetching data for extension ${extensionNumber}:`,
        error
      );
    }

    // Get call data for extensionTenant
    try {
      const response2 = await getUserCallDetail(
        startDate,
        endDate,
        extensionTenant,
        tenant
      );
      responseData2 = response2?.data?.filter(item => item?.disposition !== "CONGESTION");
    } catch (error) {
      console.error(
        `Error fetching data for extension ${extensionTenant}:`,
        error
      );
    }

    const outGoingData = responseData2?.map((data) => {
      const nameAndNumber = getNameAndNumber(data.clid);
      const duration = durationInSeconds(data.answer, data.end)
      const status = data.disposition === "NO ANSWER" ? "MISSED" : data.disposition;

      return {
        extension: data.realsrc.replace(/-\w+\b/, ""),
        callerName: nameAndNumber.callerName,
        callerNumber: nameAndNumber.callerNumber,
        receiver: data.wherelanded,
        date: data.start,
        duration,
        direction: "Outgoing",
        status: status,
        originalDate: data.start,
      };
    });

    const inComingData = responseData1?.map((data) => {
      const nameAndNumber = getNameAndNumber(data.clid);
      const duration = durationInSeconds(data.answer, data.end);
      const status = data.disposition === "NO ANSWER" ? "MISSED" : data.disposition;
      return {
        extension: data.wherelanded,
        callerName: nameAndNumber.callerName,
        callerNumber: nameAndNumber.callerNumber,
        receiver: data.wherelanded,
        date: data.start,
        duration,
        direction: "Incoming",
        status: status,
        originalDate: data.start,
      };
    });

    const combinedData = [...inComingData, ...outGoingData];
    const filteredCombinedData = filterDuplicateCalls(combinedData);
    
    // Sort by date (newest first)
    filteredCombinedData.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
    return filteredCombinedData;
  } catch (error) {
    console.error("Error in transformApiData:", error);
    return [];
  }
};

const filterDuplicateCalls = (calls) => {
  const uniqueCallsMap = new Map();
  
  calls.forEach(call => {
    const exactKey = `${call.callerNumber}-${call.receiver}-${call.date}`;
    
    if (!uniqueCallsMap.has(exactKey)) {
      uniqueCallsMap.set(exactKey, [call]);
    } else {
      uniqueCallsMap.get(exactKey).push(call);
    }
  });
  
  const exactMatches = [];
  uniqueCallsMap.forEach(callGroup => {
    if (callGroup.length === 1) {
      exactMatches.push(callGroup[0]);
    } else {
      const callWithDuration = callGroup.find(call => call.duration > 0);
      
      if (callWithDuration) {
        exactMatches.push(callWithDuration);
      } else {
        exactMatches.push(callGroup[0]);
      }
    }
  });
  const finalCalls = [];
  const processed = new Set();
  
  exactMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  exactMatches.forEach(call => {
    const callIdentifier = `${call.callerNumber}-${call.receiver}-${call.date}`;
    if (processed.has(callIdentifier)) return;
    
    processed.add(callIdentifier);
    
    const nearDuplicates = exactMatches.filter(other => {
      if (other === call) return false;
      if (processed.has(`${other.callerNumber}-${other.receiver}-${other.date}`)) return false;
      
      if (other.callerNumber !== call.callerNumber || other.receiver !== call.receiver) return false;
      
      const timeDiff = Math.abs(new Date(call.date) - new Date(other.date));
      return timeDiff <= 5000;
    });
    
    if (nearDuplicates.length > 0) {
      nearDuplicates.forEach(dupe => {
        processed.add(`${dupe.callerNumber}-${dupe.receiver}-${dupe.date}`);
      });
      const allRelatedCalls = [call, ...nearDuplicates];
      
      allRelatedCalls.sort((a, b) => b.duration - a.duration);
      
      finalCalls.push(allRelatedCalls[0]);
    } else {
      finalCalls.push(call);
    }
  });
  
  return finalCalls;
};

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
