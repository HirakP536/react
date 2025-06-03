import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  email: null,
  uuid:null,
  OTPVerified: false,
  dialPad: false,
  dialPadModal: false,
  selectedOrganization: null,
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
    setSelectedOrganization: (state, action) => {
      state.selectedOrganization = action.payload;
    },

    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setEmail, setUuid,setOTPVerified,setDialPad,setSelectedOrganization, setDialPadModal, clearAuth } = authSlice.actions;

export default authSlice.reducer;
