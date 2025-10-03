import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';

const categoriesAdapter = createEntityAdapter({
  selectId: (c) => c.id || c._id || c.slug,
  sortComparer: (a, b) => (a.name || '').localeCompare(b.name || ''),
});

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async (_, thunkAPI) => {
  try {
    const res = await apiService.getCategories();
    if (res && res.data) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || String(err));
  }
});

const slice = createSlice({
  name: 'categories',
  initialState: categoriesAdapter.getInitialState({ loading: false, error: null }),
  reducers: {
    setCategories(state, action) {
      categoriesAdapter.setAll(state, action.payload || []);
    },
    clearCategories(state) {
      categoriesAdapter.removeAll(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { categoriesAdapter.setAll(state, action.payload || []); state.loading = false; })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; });
  }
});

export const { setCategories, clearCategories } = slice.actions;

export default slice.reducer;

export const { selectAll: selectAllCategories, selectById: selectCategoryById, selectIds: selectCategoryIds } = categoriesAdapter.getSelectors((state) => state.categories);
