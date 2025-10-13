import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';

const categoriesAdapter = createEntityAdapter({
  selectId: (c) => c.id || c._id || c.slug,
  sortComparer: (a, b) =>
    (a.libelle || a.name || "").localeCompare(b.libelle || b.name || ""),
});

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, thunkAPI) => {
    try {
      const res = await apiService.getCategories();
      if (res && res.data) return res.data;
      if (Array.isArray(res)) return res;
      return [];
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || String(err));
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (payload, thunkAPI) => {
    try {
      const res = await apiService.post("/api/categories", payload);
      return res.data || res;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || String(err));
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ id, changes }, thunkAPI) => {
    try {
      const res = await apiService.put(`/api/categories/${id}`, changes);
      return res.data || res;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || String(err));
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id, thunkAPI) => {
    try {
      await apiService.delete(`/api/categories/${id}`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || String(err));
    }
  }
);

const slice = createSlice({
  name: "categories",
  initialState: categoriesAdapter.getInitialState({
    loading: false,
    error: null,
  }),
  reducers: {
    setCategories(state, action) {
      categoriesAdapter.setAll(state, action.payload || []);
    },
    clearCategories(state) {
      categoriesAdapter.removeAll(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        categoriesAdapter.setAll(state, action.payload || []);
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        if (action.payload) categoriesAdapter.addOne(state, action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (action.payload) categoriesAdapter.upsertOne(state, action.payload);
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        categoriesAdapter.removeOne(state, action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCategories, clearCategories } = slice.actions;

export default slice.reducer;

export const { selectAll: selectAllCategories, selectById: selectCategoryById, selectIds: selectCategoryIds } = categoriesAdapter.getSelectors((state) => state.categories);
