import { axiosClient, axiosSIP } from "./axiosClient";
import endpoints from "./endpoints";

export const getUserList = (companyName) => axiosClient.get(`${endpoints.user?.userList}${companyName}`);
export const resetUser = (id) => axiosClient.post(`${endpoints.user?.resetUser}`,{userid:id});
export const getExtensionList = (key,companyTenant) => axiosSIP.get(`${endpoints.user?.extensionList}&key=${key}&tenant=${companyTenant}`);
export const getDidList = (key,companyTenant) => axiosSIP.get(`${endpoints.user?.getDidList}&key=${key}&tenant=${companyTenant}`);
export const addUser = (data) => axiosClient.post(`${endpoints.user?.addUser}`, data);
export const updateUser = (data) => axiosClient.post(endpoints.user?.updateUser, data);
export const newUserUpdate = (data) => axiosClient.post(endpoints.user?.newUserUpdate, data);