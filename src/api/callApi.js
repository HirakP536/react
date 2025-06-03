import { axiosSIP } from "./axiosClient";
import endpoints from "./endpoints";

// Get Call API
export const getVoicemail = (tenant,numberTenant) => axiosSIP.get(`${endpoints.call.voiceMail}tenant=${tenant}&key=${import.meta.env.VITE_API_KEY}&mailbox=${numberTenant}`);
export const playVoicemail = (tenant,msgid) => axiosSIP.get(`${endpoints.call.voiceMailAudio}tenant=${tenant}&key=${import.meta.env.VITE_API_KEY}&msgid=${msgid}`);
export const readVoiceMail = (tenant,msgid) => axiosSIP.get(`${endpoints.call.voiceMailRead}tenant=${tenant}&key=${import.meta.env.VITE_API_KEY}&msgid=${msgid}`);
export const deleteVoiceMail = (tenant,msgid) => axiosSIP.get(`${endpoints.call.voiceMailRead}tenant=${tenant}&key=${import.meta.env.VITE_API_KEY}&msgid=${msgid}`);