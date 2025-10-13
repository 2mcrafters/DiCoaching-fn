import { configureStore } from '@reduxjs/toolkit';
import termsReducer from '@/features/terms/termsSlice';
import categoriesReducer from '@/features/categories/categoriesSlice';
import usersReducer from '@/features/users/usersSlice';
import sourcesReducer from '@/features/sources/sourcesSlice';
import dashboardStatsReducer from "@/features/dashboard/dashboardStatsSlice";
import modificationsReducer from "@/features/modifications/modificationsSlice";
import reportsReducer from "@/features/reports/reportsSlice";

export const store = configureStore({
  reducer: {
    terms: termsReducer,
    categories: categoriesReducer,
    users: usersReducer,
    sources: sourcesReducer,
    dashboardStats: dashboardStatsReducer,
    modifications: modificationsReducer,
    reports: reportsReducer,
  },
});

export default store;
