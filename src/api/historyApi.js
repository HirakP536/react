import { axiosSIP } from "./axiosClient";
import endpoints from "./endpoints";


// get history api
export const getHistory = (startDate,endDate,number,numberTenant,tenant) => axiosSIP.get(`${endpoints.history.getHistory}tenant=${tenant}&key=${import.meta.env.VITE_API_KEY}&format=json&start=${startDate}&end=${endDate}&phone=${number},${numberTenant}`);
