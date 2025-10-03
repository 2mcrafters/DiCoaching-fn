import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';

const sourcesAdapter = createEntityAdapter({
  selectId: (s) => s.id || s._id || s.slug,
  sortComparer: (a, b) => (a.name || '').localeCompare(b.name || ''),
});

export const fetchSources = createAsyncThunk('sources/fetchSources', async (_, thunkAPI) => {
  try {
    const res = await apiService.getSources ? await apiService.getSources() : [];
    if (res && res.data) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || String(err));
  }
});

const slice = createSlice({
  name: 'sources',
  initialState: sourcesAdapter.getInitialState({ loading: false, error: null }),
  reducers: {
    setSources(state, action) { sourcesAdapter.setAll(state, action.payload || []); },
    clearSources(state) { sourcesAdapter.removeAll(state); }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSources.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSources.fulfilled, (state, action) => { sourcesAdapter.setAll(state, action.payload || []); state.loading = false; })
      .addCase(fetchSources.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; });
  }
});

export const { setSources, clearSources } = slice.actions;

export default slice.reducer;

export const { selectAll: selectAllSources, selectById: selectSourceById, selectIds: selectSourceIds } = sourcesAdapter.getSelectors((state) => state.sources);
