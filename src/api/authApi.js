import axios from 'axios';
import endpoints from './endpoints';
import { axiosClient } from './axiosClient';

export const loginUser = (data) => axiosClient.post(endpoints.auth.login, data);
export const registerUser = (data) => axiosClient.post(endpoints.auth.register, data);
export const logoutUser = () => axiosClient.post(endpoints.auth.logout);
export const forgotPassword = (data) => axiosClient.post(endpoints.auth.forgotPassword, data);
export const resetPassword = (data) => axiosClient.post(endpoints.auth.resetPassword, data);

// Expire OTP
export const resendApiHandler = async (uniqueId) => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API_BASE_URL +
          `${endpoints?.auth?.expireOtp}/${uniqueId}/`
      );
      return res;
    } catch (err) {
      console.log( err);
    }
  };
