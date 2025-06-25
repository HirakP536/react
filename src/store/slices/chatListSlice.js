import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getChatList } from "../../api/chatApi";

export const fetchChatList = createAsyncThunk(
  "extension/fetchChatList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getChatList();
      const data = await response?.data;
      const processedData = {
        allChats: data?.chat_rooms || [],
        unreadChats: (data?.chat_rooms || []).filter(
          (chat) => chat.unread_counts > 0
        ),
        totalUnreadCount: (data?.chat_rooms || []).reduce(
          (sum, chat) => sum + (chat.unread_counts || 0),
          0
        ),
        chatsByParticipant: (data?.chat_rooms || []).reduce((acc, chat) => {
          const participant = chat.participants?.[0]?.formatcontact || null;
          if (participant) {
            acc[participant] = chat;
          }
          return acc;
        }, {}),
      };
      return processedData;
    } catch (error) {
      console.error("Error fetching chat list:", error);
      return rejectWithValue(error.message);
    }
  }
);

const chatListSlice = createSlice({
  name: "chatList",
  initialState: {
    data: null,
    allChats: [],
    unreadChats: [],
    totalUnreadCount: 0,
    chatsByParticipant: {},
    loading: false,
    error: null,
  },
  reducers: {
    // Add a reducer to mark a chat as read
    markChatAsRead: (state, action) => {
      const chatId = action.payload;

      // Find the chat in allChats and update its unread count
      if (state.data?.allChats) {
        state.data.allChats = state.data.allChats.map((chat) =>
          chat.id === chatId ? { ...chat, unread_counts: 0 } : chat
        );
      }

      // Update unreadChats by filtering out the read chat
      if (state.data?.unreadChats) {
        state.data.unreadChats = state.data.unreadChats.filter(
          (chat) => chat.id !== chatId
        );
      }

      // Recalculate total unread count
      if (state.data?.allChats) {
        state.data.totalUnreadCount = state.data.allChats.reduce(
          (sum, chat) => sum + (chat.unread_counts || 0),
          0
        );
      }

      // Update the chat in chatsByParticipant
      if (state.data?.chatsByParticipant) {
        const chat = state.data.allChats.find((c) => c.id === chatId);
        if (chat && chat.participants?.[0]?.formatcontact) {
          const participant = chat.participants[0].formatcontact;
          state.data.chatsByParticipant[participant] = {
            ...chat,
            unread_counts: 0,
          };
        }
      }
    },

    // Add a reducer to increment unread count for a chat
    incrementUnreadCount: (state, action) => {
      const { chatId, count = 1 } = action.payload;

      // Find the chat in allChats and update its unread count
      if (state.data?.allChats) {
        state.data.allChats = state.data.allChats.map((chat) => {
          if (chat.id === chatId) {
            const newCount = (chat.unread_counts || 0) + count;
            return { ...chat, unread_counts: newCount };
          }
          return chat;
        });
      }

      // Update unreadChats
      if (state.data?.allChats) {
        state.data.unreadChats = state.data.allChats.filter(
          (chat) => chat.unread_counts > 0
        );
      }

      // Recalculate total unread count
      if (state.data?.allChats) {
        state.data.totalUnreadCount = state.data.allChats.reduce(
          (sum, chat) => sum + (chat.unread_counts || 0),
          0
        );
      }

      // Update the chat in chatsByParticipant
      if (state.data?.chatsByParticipant) {
        const chat = state.data.allChats.find((c) => c.id === chatId);
        if (chat && chat.participants?.[0]?.formatcontact) {
          const participant = chat.participants[0].formatcontact;
          state.data.chatsByParticipant[participant] = chat;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatList.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.allChats = action.payload.allChats || [];
        state.unreadChats = action.payload.unreadChats || [];
        state.totalUnreadCount = action.payload.totalUnreadCount || 0;
        state.chatsByParticipant = action.payload.chatsByParticipant || {};
        state.error = null;
      })
      .addCase(fetchChatList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { markChatAsRead, incrementUnreadCount } = chatListSlice.actions;
export default chatListSlice.reducer;
