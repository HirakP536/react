import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getContact, addContact, updateContact, deleteContact } from "../../api/contact";

// Initial state
const initialState = {
  contacts: [],
  filteredContacts: [],
  status: "idle", // idle, loading, succeeded, failed
  error: null,
  selectedContact: null,
};

// Async thunks
export const fetchContacts = createAsyncThunk(
  "contacts/fetchContacts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getContact();
      const filteredData = response?.data?.success.filter(item => item?.firstName);
      return filteredData;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Failed to fetch contacts");
    }
  }
);

export const createContact = createAsyncThunk(
  "contacts/createContact",
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await addContact(contactData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Failed to create contact");
    }
  }
);

export const editContact = createAsyncThunk(
  "contacts/editContact",
  async ({ id, contactData }, { rejectWithValue }) => {
    try {
      const response = await updateContact(id, contactData);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Failed to update contact");
    }
  }
);

export const removeContact = createAsyncThunk(
  "contacts/removeContact",
  async (id, { rejectWithValue }) => {
    try {
      await deleteContact(id);
      return id;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Failed to delete contact");
    }
  }
);

// Create the slice
const contactSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    setFilteredContacts: (state, action) => {
      if (!action.payload) {
        state.filteredContacts = state.contacts;
      } else {
        const searchTerm = action.payload.toLowerCase();
        state.filteredContacts = state.contacts.filter((contact) => {
          const fullName = `${contact?.firstName || ""} ${contact?.lastName || ""}`.toLowerCase();
          return fullName.includes(searchTerm);
        });
      }
    },
    selectContact: (state, action) => {
      state.selectedContact = action.payload;
    },
    clearContactError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts = action.payload;
        state.filteredContacts = action.payload;
        state.error = null;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unknown error occurred";
      })
      
      // Create contact
      .addCase(createContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts.push(action.payload);
        state.filteredContacts = state.contacts;
        state.error = null;
      })
      .addCase(createContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to create contact";
      })
      
      // Edit contact
      .addCase(editContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(editContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        const index = state.contacts.findIndex(contact => contact.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
        state.filteredContacts = state.contacts;
        state.error = null;
      })
      .addCase(editContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to update contact";
      })
      
      // Remove contact
      .addCase(removeContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts = state.contacts.filter(contact => contact.id !== action.payload);
        state.filteredContacts = state.contacts;
        state.error = null;
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to delete contact";
      });
  },
});

export const { setFilteredContacts, selectContact, clearContactError } = contactSlice.actions;

export default contactSlice.reducer;
