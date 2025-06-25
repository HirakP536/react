import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getVoicemail } from "../../api/callApi";
import { parseVoiceData } from "../../utils/common";

export const fetchVoiceMail = createAsyncThunk(
  "extension/fetchVoiceMail",
  async ({ tenant, extensionNumber }, { rejectWithValue }) => {
    try {
      const response = await getVoicemail(tenant, extensionNumber);
      const data = await response?.data;
      const parsedData = parseVoiceData(data);

      const enhancedData = parsedData?.map((item) => {
        const isPlayed = item.Dir && item.Dir.includes("/Old");
        const isUnplayed = item.Dir && item.Dir.includes("/INBOX");
        return {
          ...item,
          isPlayed,
          isUnplayed,
        };
      });

      const unplayedVoicemails = enhancedData
        .filter((item) => item?.isUnplayed && !item?.isPlayed)
        .reduce((acc, item) => {
          acc[item.Msgid] = item;
          return acc;
        }, {});

      const sortedData = enhancedData?.sort(
        (a, b) => new Date(b.DateTime) - new Date(a.DateTime)
      );

      return {
        allVoicemails: sortedData,
        unplayedVoicemails: unplayedVoicemails,
        unplayedCount: Object.keys(unplayedVoicemails).length,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const voicemailSlice = createSlice({
  name: "voicemail",
  initialState: {
    data: null,
    unplayedVoicemails: {},
    unplayedCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    markAsPlayed: (state, action) => {
      const msgId = action.payload;
      if (state.unplayedVoicemails[msgId]) {
        delete state.unplayedVoicemails[msgId];
        state.unplayedCount = Object.keys(state.unplayedVoicemails).length;
      }
      if (state.data?.allVoicemails) {
        state.data.allVoicemails = state.data.allVoicemails.map((item) =>
          item.Msgid === msgId
            ? { ...item, isPlayed: true, isUnplayed: false }
            : item
        );
      }
    },
    updateVoicemailStatus: (state, action) => {
      const { msgId, isPlayed, isUnplayed } = action.payload;
      if (isPlayed && !isUnplayed) {
        if (state.unplayedVoicemails[msgId]) {
          delete state.unplayedVoicemails[msgId];
          state.unplayedCount = Object.keys(state.unplayedVoicemails).length;
        }
      }
      if (state.data?.allVoicemails) {
        state.data.allVoicemails = state.data.allVoicemails.map((item) =>
          item.Msgid === msgId ? { ...item, isPlayed, isUnplayed } : item
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVoiceMail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVoiceMail.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.unplayedVoicemails = action.payload.unplayedVoicemails;
        state.unplayedCount = action.payload.unplayedCount;
        state.error = null;
      })
      .addCase(fetchVoiceMail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { markAsPlayed, updateVoicemailStatus } = voicemailSlice.actions;
export default voicemailSlice.reducer;
