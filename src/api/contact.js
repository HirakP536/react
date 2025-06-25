import { axiosClient } from "./axiosClient";
import endpoints from "./endpoints";


// get history api
export const getContact = () => axiosClient.get(`${endpoints.contact.getContact}`);
export const addContact = (data) => axiosClient.post(`${endpoints.contact.addContact}`, data);
export const updateContact = (id, data) => axiosClient.put(`${endpoints.contact.updateContact}/${id}`, data);
export const deleteContact = (id) => axiosClient.delete(`${endpoints.contact.deleteContact}/${id}`);
