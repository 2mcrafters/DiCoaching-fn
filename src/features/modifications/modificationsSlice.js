import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import apiService from "@/services/api";

const DEFAULT_PROPOSER_NAME = "Mohamed Rachid Belhadj";

const safeParseChanges = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (_err) {
      return {};
    }
  }
  return {};
};

export const normalizeModification = (item) => {
  if (!item || typeof item !== "object") return null;

  const firstName =
    item.proposer_firstname || item.firstname || item.proposerFirstName || "";
  const lastName =
    item.proposer_lastname || item.lastname || item.proposerLastName || "";
  const proposerName =
    `${firstName} ${lastName}`.trim() || DEFAULT_PROPOSER_NAME;

  return {
    __normalized: true,
    id: String(item.id ?? item._id ?? Date.now()),
    termId: item.term_id ?? item.termId ?? null,
    termSlug: item.term_slug ?? item.termSlug ?? null,
    termTitle: item.term_title ?? item.termTitle ?? "",
    proposerId: item.proposer_id ?? item.proposerId ?? null,
    proposerName,
    proposerFirstName: firstName,
    proposerLastName: lastName,
    proposerEmail: item.proposer_email ?? item.email ?? null,
    comment: item.comment ?? "",
    adminComment: item.admin_comment ?? item.adminComment ?? null,
    status: item.status ?? "pending",
    reviewerId: item.reviewer_id ?? item.reviewerId ?? null,
    createdAt:
      item.created_at ??
      item.createdAt ??
      item.created_at ??
      new Date().toISOString(),
    reviewedAt: item.reviewed_at ?? item.reviewedAt ?? null,
    changes: safeParseChanges(item.changes),
    raw: item,
  };
};

export const normalizeModifications = (list) =>
  (Array.isArray(list) ? list : []).map((item) => normalizeModification(item)).filter(Boolean);

const modificationsAdapter = createEntityAdapter({
  selectId: (mod) => mod.id,
  sortComparer: (a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  },
});

export const fetchModifications = createAsyncThunk(
  "modifications/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await apiService.getModifications();
      const payload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      return normalizeModifications(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const fetchModificationById = createAsyncThunk(
  "modifications/fetchById",
  async (id, thunkAPI) => {
    try {
      const response = await apiService.getModificationById(id);
      const payload =
        (response && response.data) ?? response ?? {};
      const normalized = normalizeModification(payload);
      if (!normalized) {
        throw new Error("Modification invalide");
      }
      return normalized;
    } catch (error) {
      const message =
        (error && error.message) ||
        (error && error.response && error.response.data?.message) ||
        String(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createModification = createAsyncThunk(
  "modifications/create",
  async (payload, thunkAPI) => {
    try {
      const response = await apiService.createModification(payload);
      const data =
        (response && response.data) ?? response ?? {};
      const normalized = normalizeModification(data);
      if (!normalized) {
        throw new Error("Reponse de creation invalide");
      }
      return normalized;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || String(error));
    }
  }
);

export const reviewModification = createAsyncThunk(
  "modifications/review",
  async ({ id, status, adminComment = null }, thunkAPI) => {
    try {
      const response = await apiService.updateModification(id, {
        status,
        admin_comment: adminComment,
      });
      const data =
        (response && response.data) ?? response ?? {};
      const normalized = normalizeModification(data);
      if (!normalized) {
        throw new Error("Reponse de mise a jour invalide");
      }
      return normalized;
    } catch (error) {
      const message = error.message || String(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = modificationsAdapter.getInitialState({
  loading: false,
  error: null,
  byIdLoading: false,
  byIdError: null,
  selectedId: null,
});

const modificationsSlice = createSlice({
  name: "modifications",
  initialState,
  reducers: {
    clearModifications(state) {
      modificationsAdapter.removeAll(state);
      state.error = null;
      state.byIdError = null;
      state.selectedId = null;
    },
    setSelectedModification(state, action) {
      state.selectedId = action.payload ?? null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModifications.fulfilled, (state, action) => {
        modificationsAdapter.setAll(state, action.payload || []);
        state.loading = false;
      })
      .addCase(fetchModifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || null;
      })
      .addCase(fetchModificationById.pending, (state) => {
        state.byIdLoading = true;
        state.byIdError = null;
      })
      .addCase(fetchModificationById.fulfilled, (state, action) => {
        if (action.payload) {
          modificationsAdapter.upsertOne(state, action.payload);
          state.selectedId = action.payload.id;
        }
        state.byIdLoading = false;
      })
      .addCase(fetchModificationById.rejected, (state, action) => {
        state.byIdLoading = false;
        state.byIdError = action.payload || action.error?.message || null;
      })
      .addCase(createModification.fulfilled, (state, action) => {
        if (action.payload) {
          modificationsAdapter.addOne(state, action.payload);
        }
      })
      .addCase(createModification.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || null;
      })
      .addCase(reviewModification.pending, (state) => {
        state.byIdLoading = true;
        state.byIdError = null;
      })
      .addCase(reviewModification.fulfilled, (state, action) => {
        if (action.payload) {
          modificationsAdapter.upsertOne(state, action.payload);
        }
        state.byIdLoading = false;
      })
      .addCase(reviewModification.rejected, (state, action) => {
        state.byIdLoading = false;
        state.byIdError = action.payload || action.error?.message || null;
      });
  },
});

export const { clearModifications, setSelectedModification } =
  modificationsSlice.actions;

export default modificationsSlice.reducer;

export const {
  selectAll: selectAllModifications,
  selectById: selectModificationById,
  selectIds: selectModificationIds,
} = modificationsAdapter.getSelectors((state) => state.modifications);

export const selectModificationsLoading = (state) => state.modifications.loading;
export const selectModificationsError = (state) => state.modifications.error;
export const selectModificationDetailsLoading = (state) =>
  state.modifications.byIdLoading;
export const selectModificationDetailsError = (state) =>
  state.modifications.byIdError;
