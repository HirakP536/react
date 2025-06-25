import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { transformApiData } from "../../helpers/transformApiData";

// Async thunk for fetching call history
export const fetchHistoryData = createAsyncThunk(
  "history/fetchHistoryData",
  async (
    {
      startDate,
      endDate,
      extensionNumber,
      extensionTenant,
      tenant,
      userCompanyCode,
      userRole,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await transformApiData(
        {
          startDate,
          endDate,
          extensionNumber,
          extensionTenant,
          tenant,
        },
        userCompanyCode,
        userRole
      );
      const sorted = [...response].sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );
      const uniqueDispositions = ["ALL"];
      const statusSet = new Set();
      sorted.forEach((call) => {
        if (call.status) statusSet.add(call.status);
      });
      uniqueDispositions.push(...Array.from(statusSet));
      return { calls: sorted, dispositionTypes: uniqueDispositions };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch history");
    }
  }
);

const historySlice = createSlice({
  name: "history",
  initialState: {
    allCallDetails: [],
    dispositionTypes: ["ALL"],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistoryData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHistoryData.fulfilled, (state, action) => {
        state.loading = false;
        state.allCallDetails = action.payload.calls;
        state.dispositionTypes = action.payload.dispositionTypes;
      })
      .addCase(fetchHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      });
  },
});

export const selectAllCallDetails = (state) => state.history.allCallDetails;
export const selectHistoryLoading = (state) => state.history.loading;
export const selectDispositionTypes = (state) => state.history.dispositionTypes;

export default historySlice.reducer;
