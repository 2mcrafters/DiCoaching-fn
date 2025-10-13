import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';
import { normalizeTerms } from "@/lib/normalizeTerm";

const termsAdapter = createEntityAdapter({
  selectId: (term) => term.id || term._id || term.slug,
  sortComparer: (a, b) => (a.term || "").localeCompare(b.term || ""),
});

export const fetchTerms = createAsyncThunk(
  "terms/fetchTerms",
  async (params = {}, thunkAPI) => {
    try {
      const data = await apiService.getTerms(params);
      // backend returns { status, data }
      if (data && data.data) return normalizeTerms(data.data);
      if (Array.isArray(data)) return normalizeTerms(data);
      return [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const createTerm = createAsyncThunk(
  "terms/createTerm",
  async (payload, thunkAPI) => {
    try {
      const res = await apiService.createTerm(payload);
      const created = res && res.data ? res.data : res;
      const [normalized] = normalizeTerms([created]);
      return normalized;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const updateTerm = createAsyncThunk(
  "terms/updateTerm",
  async ({ id, changes }, thunkAPI) => {
    try {
      const res = await apiService.updateTerm(id, changes);
      const updated = res && res.data ? res.data : res;
      const [normalized] = normalizeTerms([updated]);
      return normalized;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const deleteTerm = createAsyncThunk(
  "terms/deleteTerm",
  async (id, thunkAPI) => {
    try {
      await apiService.deleteTerm(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

const termsSlice = createSlice({
  name: 'terms',
  initialState: termsAdapter.getInitialState({ loading: false, error: null }),
  reducers: {
    setTerms(state, action) {
      termsAdapter.setAll(state, action.payload || []);
    },
    clearTerms(state) {
      termsAdapter.removeAll(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTerms.fulfilled, (state, action) => {
        termsAdapter.setAll(state, action.payload || []);
        state.loading = false;
      })
      .addCase(fetchTerms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(createTerm.fulfilled, (state, action) => {
        if (action.payload) {
          termsAdapter.addOne(state, action.payload);
        }
      })
      .addCase(createTerm.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateTerm.fulfilled, (state, action) => {
        if (action.payload) {
          termsAdapter.upsertOne(state, action.payload);
        }
      })
      .addCase(updateTerm.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteTerm.fulfilled, (state, action) => {
        termsAdapter.removeOne(state, action.payload);
      })
      .addCase(deleteTerm.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  }
});

export const { setTerms, clearTerms } = termsSlice.actions;

export default termsSlice.reducer;

// Selectors
export const {
  selectAll: selectAllTerms,
  selectById: selectTermById,
  selectIds: selectTermIds,
} = termsAdapter.getSelectors((state) => state.terms);
