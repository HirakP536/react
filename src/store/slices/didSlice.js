import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDidList } from "../../api/user";

export const fetchDidList = createAsyncThunk(
  "extension/fetchDidList",
  async ({key,companyTenant}, {rejectWithValue} ) => {
    try {
      const response = await getDidList(key,companyTenant);
      const data = await response?.data;
      const filteredData = data.filter(item => {
        // Filter out FAX DIDs
        const didLabel = item["5"] ? item["5"].toString().toLowerCase() : '';
        return !didLabel.includes("fax");
      });
      return filteredData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);  

const didSlice = createSlice({
  name: "did",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDidList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDidList.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchDidList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.data = [];
      });
  },
});

export default didSlice.reducer;
