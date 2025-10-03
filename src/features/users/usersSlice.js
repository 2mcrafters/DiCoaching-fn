import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';

const usersAdapter = createEntityAdapter({
  selectId: (u) => u.id || u._id || u.email,
  sortComparer: (a, b) => (a.name || '').localeCompare(b.name || ''),
});

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, thunkAPI) => {
  try {
    const res = await apiService.getUsers ? await apiService.getUsers() : [];
    if (res && res.data) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || String(err));
  }
});

const slice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState({ loading: false, error: null }),
  reducers: {
    setUsers(state, action) { usersAdapter.setAll(state, action.payload || []); },
    clearUsers(state) { usersAdapter.removeAll(state); }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { usersAdapter.setAll(state, action.payload || []); state.loading = false; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; });
  }
});

export const { setUsers, clearUsers } = slice.actions;

export default slice.reducer;

export const { selectAll: selectAllUsers, selectById: selectUserById, selectIds: selectUserIds } = usersAdapter.getSelectors((state) => state.users);
