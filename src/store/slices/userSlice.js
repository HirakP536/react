import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserList } from "../../api/user";

export const fetchUserList = createAsyncThunk(
  "users/fetchUserList",
  async (companyTenant, { rejectWithValue }) => {
    try {
      const response = await getUserList(companyTenant);
      const data = await response?.data;
      return data?.success || [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.error || "Failed to fetch users");
    }
  }
);

const initialState = {
  users: [],
  status: "idle",
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.users = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserList.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserList.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUserList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unknown error occurred";
      });
  },
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;
