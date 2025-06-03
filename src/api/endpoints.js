// This file contains the API endpoints for the application.
const endpoints = {
  auth: {
    login: `/user/userlogin`,
    forgotPassword: `/user/resetUserApp`,
    expireOtp: `/user/otpexpire`,
  },
  dashboard: {
    stats: `/dashboard/stats`,
    getCompanyList: `/company/listCompany`,
    getCallDetail: `proxyapi.php?reqtype=INFO&info=cdrs&format=json&`,
  },
  user: {
    userList: `/user/listUser/`,
    addUser: `/user/useradd`,
    resetUser: `/user/userNotify`,
    extensionList: `proxyapi.php?reqtype=info&info=extensions&format=json`,
    getDidList: `proxyapi.php?reqtype=info&info=dids&format=json`,
    updateUser: `/user/editTokenUpdate`,
  },
  history: {
    getHistory: `proxyapi.php?reqtype=INFO&info=cdrs&`,
  },
  call: {
    getCall: `proxyapi.php?reqtype=INFO&info=call&`,
    voiceMail: `proxyapi.php?&reqtype=VOICEMAIL&action=messages&`,
    voiceMailAudio: `proxyapi.php?&reqtype=VOICEMAIL&action=message&`,
    voiceMailRead :`proxyapi.php?reqtype=VOICEMAIL&action=markread&`,
    voiceMailDelete:`proxyapi.php?reqtype=VOICEMAIL&action=delete&`
  },
  chat:{
    getChatList: `/message/getuserSideList`,
    getChatMessages: `/message/get-messages/`,
    getReadMessages: `/message/updateRoomRead/`,
  },
  contact:{
    getContact: `/user/listContact`,
    addContact: `/user/addContact`,
    updateContact: `/user/updateContact`,
    deleteContact: `/user/deleteContact`,
  },
};

export default endpoints;
