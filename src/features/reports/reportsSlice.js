import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import slugify from "slugify";
import apiService from "@/services/api";

const reportsAdapter = createEntityAdapter({
  selectId: (report) => report.id,
  sortComparer: (a, b) => {
    const aDate = new Date(a.created_at || a.createdAt || 0).getTime();
    const bDate = new Date(b.created_at || b.createdAt || 0).getTime();
    return bDate - aDate;
  },
});

const computeSlug = (value) => {
  if (!value || typeof value !== "string") return null;
  return slugify(value, { lower: true, strict: true });
};

const normalizeReport = (item) => {
  if (!item || typeof item !== "object") return null;
  const rawTitle = item.term_title ?? item.termTitle ?? item.term ?? null;
  const rawSlug =
    item.term_slug ?? item.termSlug ?? item.slug ?? computeSlug(rawTitle);
  return {
    ...item,
    id: item.id ?? item.report_id ?? item._id,
    term_title: rawTitle,
    term_slug: rawSlug,
    reporter_email:
      item.reporter_email ?? item.reporterEmail ?? item.email ?? null,
    created_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    status: item.status ?? "pending",
  };
};

const normalizeReports = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => normalizeReport(item))
    .filter(Boolean);

export const fetchReports = createAsyncThunk(
  "reports/fetchReports",
  async (_, thunkAPI) => {
    try {
      const response = await apiService.getReports();
      const payload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      return normalizeReports(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const updateReport = createAsyncThunk(
  "reports/updateReport",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await apiService.updateReport(id, data);
      const payload = response?.data ?? response ?? {};
      const normalized = normalizeReport(payload);
      if (!normalized) throw new Error("Invalid report response");
      return normalized;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const deleteReport = createAsyncThunk(
  "reports/deleteReport",
  async (id, thunkAPI) => {
    try {
      await apiService.deleteReport(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const createReport = createAsyncThunk(
  "reports/createReport",
  async (payload, thunkAPI) => {
    try {
      const response = await apiService.createReport(payload);
      const data = response?.data ?? response ?? {};
      const normalized = normalizeReport(data);
      if (!normalized) {
        throw new Error("Invalid report response");
      }
      return normalized;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState: reportsAdapter.getInitialState({
    loading: false,
    error: null,
  }),
  reducers: {
    clearReports(state) {
      reportsAdapter.removeAll(state);
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        reportsAdapter.setAll(state, action.payload || []);
        state.loading = false;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        if (action.payload) {
          reportsAdapter.addOne(state, action.payload);
        }
      })
      .addCase(createReport.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        if (action.payload) {
          reportsAdapter.upsertOne(state, action.payload);
        }
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        reportsAdapter.removeOne(state, action.payload);
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || null;
      });
  },
});

export const { clearReports } = reportsSlice.actions;

export default reportsSlice.reducer;

export const {
  selectAll: selectAllReports,
  selectById: selectReportById,
  selectIds: selectReportIds,
} = reportsAdapter.getSelectors((state) => state.reports);

export const selectReportsLoading = (state) => state.reports.loading;
export const selectReportsError = (state) => state.reports.error;
