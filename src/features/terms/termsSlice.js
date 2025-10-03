import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';

const termsAdapter = createEntityAdapter({
  selectId: (term) => term.id || term._id || term.slug,
  sortComparer: (a, b) => (a.term || '').localeCompare(b.term || ''),
});

export const fetchTerms = createAsyncThunk('terms/fetchTerms', async (params = {}, thunkAPI) => {
  try {
    const data = await apiService.getTerms(params);
    // backend returns { status, data }
    if (data && data.data) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || String(error));
  }
});

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
