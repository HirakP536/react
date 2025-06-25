import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserIp } from '../../api/ipAddressApi';


// Async thunk to fetch IP address
export const fetchIpAddress = createAsyncThunk(
  'ipAddress/fetchIpAddress',
  async (_, { rejectWithValue }) => {
    try {
      const ip = await getUserIp();
      if (!ip) {
        return rejectWithValue('Failed to fetch IP address');
      }
      return ip;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch IP address');
    }
  }
);

const ipAddressSlice = createSlice({
  name: 'ipAddress',
  initialState: {
    ip: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearIpAddress: (state) => {
      state.ip = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIpAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIpAddress.fulfilled, (state, action) => {
        state.ip = action.payload;
        state.loading = false;
      })
      .addCase(fetchIpAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearIpAddress } = ipAddressSlice.actions;
export default ipAddressSlice.reducer;