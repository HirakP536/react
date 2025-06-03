
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCallDetail } from "../../api/dashboard";

export const fetchCallDetails = createAsyncThunk(
  "callDetails/fetchCallDetails",
  async ({ startDate, endDate, extensionNumber, extensionTenant, tenant }, {rejectWithValue} ) => {
    try {
       const response = await getCallDetail(
        startDate,
        endDate,
        extensionNumber,
        extensionTenant,
        tenant
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const callDetailsSlice = createSlice({
  name: "callDetails",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCallDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCallDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchCallDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default callDetailsSlice.reducer;
