import { configureStore } from '@reduxjs/toolkit';
import termsReducer from '@/features/terms/termsSlice';
import categoriesReducer from '@/features/categories/categoriesSlice';
import usersReducer from '@/features/users/usersSlice';
import sourcesReducer from '@/features/sources/sourcesSlice';

export const store = configureStore({
  reducer: {
    terms: termsReducer,
    categories: categoriesReducer,
    users: usersReducer,
    sources: sourcesReducer,
  },
});

export default store;
