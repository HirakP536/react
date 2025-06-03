import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getExtensionList } from "../../api/user";

export const fetchExtension = createAsyncThunk(
  "extension/fetchExtension",
  async ({key,companyTenant}, {rejectWithValue} ) => {
    try {
      const response = await getExtensionList(key,companyTenant);
      const data = await response?.data;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const extensionSlice = createSlice({
  name: "extension",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExtension.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExtension.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchExtension.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default extensionSlice.reducer;
