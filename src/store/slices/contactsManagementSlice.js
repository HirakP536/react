import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getContact, addContact, updateContact, deleteContact } from "../../api/contact";

// Initial state
const initialState = {
  contactsList: [],
  filteredContactsList: [],
  status: "idle", // idle, loading, succeeded, failed
  error: null,
  selectedContact: null,
};

// Async thunks
export const fetchContactsList = createAsyncThunk(
  "contactsManagement/fetchContacts",
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

export const createNewContact = createAsyncThunk(
  "contactsManagement/createContact",
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await addContact(contactData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Failed to create contact");
    }
  }
);

export const editExistingContact = createAsyncThunk(
  "contactsManagement/editContact",
  async ({ id, contactData }, { rejectWithValue }) => {
    try {
      const response = await updateContact(id, contactData);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Failed to update contact");
    }
  }
);

export const deleteExistingContact = createAsyncThunk(
  "contactsManagement/removeContact",
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
const contactsManagementSlice = createSlice({
  name: "contactsManagement",
  initialState,
  reducers: {
    setFilteredContacts: (state, action) => {
      if (!action.payload) {
        state.filteredContactsList = state.contactsList;
      } else {
        const searchTerm = action.payload.toLowerCase();
        state.filteredContactsList = state.contactsList.filter((contact) => {
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
      .addCase(fetchContactsList.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchContactsList.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contactsList = action.payload;
        state.filteredContactsList = action.payload;
        state.error = null;
      })
      .addCase(fetchContactsList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unknown error occurred";
      })
      
      // Create contact
      .addCase(createNewContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createNewContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contactsList.push(action.payload);
        state.filteredContactsList = state.contactsList;
        state.error = null;
      })
      .addCase(createNewContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to create contact";
      })
      
      // Edit contact
      .addCase(editExistingContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(editExistingContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        const index = state.contactsList.findIndex(contact => contact.id === action.payload.id);
        if (index !== -1) {
          state.contactsList[index] = action.payload;
        }
        state.filteredContactsList = state.contactsList;
        state.error = null;
      })
      .addCase(editExistingContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to update contact";
      })
      
      // Remove contact
      .addCase(deleteExistingContact.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteExistingContact.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contactsList = state.contactsList.filter(contact => contact.id !== action.payload);
        state.filteredContactsList = state.contactsList;
        state.error = null;
      })
      .addCase(deleteExistingContact.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to delete contact";
      });
  },
});

export const { setFilteredContacts, selectContact, clearContactError } = contactsManagementSlice.actions;

export default contactsManagementSlice.reducer;
