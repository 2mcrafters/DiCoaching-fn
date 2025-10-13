import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import apiService from '@/services/api';

// Thunk to fetch user-specific stats from backend
export const fetchUserStats = createAsyncThunk(
  'dashboardStats/fetchUserStats',
  async (userId, thunkAPI) => {
    try {
      const res = await apiService.getUserStats(userId);
      return res.data || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || String(err));
    }
  }
);

// Thunk to fetch global stats (for admin dashboard)
export const fetchGlobalStats = createAsyncThunk(
  'dashboardStats/fetchGlobalStats',
  async (_, thunkAPI) => {
    try {
      const res = await apiService.getStats();
      return res.data || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || String(err));
    }
  }
);

const initialState = {
  userStats: {
    // Author stats
    published_terms: 0,
    review_terms: 0,
    draft_terms: 0,
    total_terms: 0,
    // Researcher stats
    terms_liked: 0,
    research_documents: 0,
    total_modifications: 0,
    approved_modifications: 0,
    pending_modifications: 0,
    activity_score: 0,
  },
  globalStats: {
    totalUsers: 0,
    totalTerms: 0,
    totalCategories: 0,
    pendingUsers: 0,
    totalReports: 0,
    totalModifications: 0,
    pendingModifications: 0,
    pendingReports: 0,
    usersByRole: {},
    termsByStatus: {},
    recentUsers: 0,
    recentTerms: 0,
  },
  loading: false,
  error: null,
};

const dashboardStatsSlice = createSlice({
  name: 'dashboardStats',
  initialState,
  reducers: {
    clearStats(state) {
      state.userStats = initialState.userStats;
      state.globalStats = initialState.globalStats;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.userStats = { ...initialState.userStats, ...action.payload };
        state.loading = false;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchGlobalStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalStats.fulfilled, (state, action) => {
        state.globalStats = { ...initialState.globalStats, ...action.payload };
        state.loading = false;
      })
      .addCase(fetchGlobalStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearStats } = dashboardStatsSlice.actions;

export default dashboardStatsSlice.reducer;

// Selectors
export const selectUserStats = (state) => state.dashboardStats.userStats;
export const selectGlobalStats = (state) => state.dashboardStats.globalStats;
export const selectStatsLoading = (state) => state.dashboardStats.loading;
export const selectStatsError = (state) => state.dashboardStats.error;
