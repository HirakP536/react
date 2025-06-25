import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  newUser: false,
  user: null,
  email: null,
  uuid:null,
  OTPVerified: false,
  dialPad: false,
  dialPadModal: false,
  selectedOrganization: null,
  companyName: null,
  companyCode: null,
  companyExtension: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setUuid: (state, action) => {
      state.uuid = action.payload;
    },
    setOTPVerified: (state, action) => {
      state.OTPVerified = action.payload;
    },
    setDialPad: (state, action) => {
      state.dialPad = action.payload;
    },
    setDialPadModal: (state, action) => {
      state.dialPadModal = action.payload;
    },
    setNewUser: (state, action) => {
      state.newUser = action.payload;
    },
    setSelectedOrganization: (state, action) => {
      state.selectedOrganization = action.payload;
    },
    setCompanyName: (state, action) => {
      state.companyName = action.payload;
    },
    setCompanyCode: (state, action) => {
      state.companyCode = action.payload;
    },
    setCompanyExtension: (state, action) => {
      state.companyExtension = action.payload;
    },

    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.companyName= null,
      state.companyCode= null,
      state.companyExtension= null,
      state.selectedOrganization = null;
      state.isAuthenticated = false;
      state.email = null;
      state.uuid = null;
    },
  },
});

export const { setUser, setEmail,setNewUser, setUuid,setOTPVerified,setDialPad,setSelectedOrganization, setDialPadModal,setCompanyName,setCompanyCode,setCompanyExtension, clearAuth } = authSlice.actions;

export default authSlice.reducer;
