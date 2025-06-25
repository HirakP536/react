import { axiosClient, axiosSIP } from "./axiosClient";
import endpoints from "./endpoints";

export const getCompanyList = () =>
  axiosClient.get(`${endpoints.dashboard.getCompanyList}`);
export const getCallDetail = (
  startDate,
  endDate,
  tenant
) =>
  axiosSIP.get(
    `${endpoints.dashboard.getCallDetail}tenant=${tenant}&key=${
      import.meta.env.VITE_API_KEY
    }&start=${startDate}&end=${endDate}`
  );

export const getUserCallDetail = (
  startDate,
  endDate,
  number,
  tenant
) =>
  axiosSIP.get(
    `${endpoints.dashboard.getCallDetail}tenant=${tenant}&key=${
      import.meta.env.VITE_API_KEY
    }&start=${startDate}&end=${endDate}&phone=${number}`
  );

export const updateCompanyPermission = (companyId, data) =>
  axiosClient.put(
    `${endpoints.dashboard.updateCompanyPermission}${companyId}/`,
    data
  );
