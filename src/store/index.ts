import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import rootReducer from "./root-reducer";

/**
 * `makeStore` is a factory (not a singleton) so the App Router can create one
 * store per request on the server — avoids cross-request state leakage in SSR.
 * See src/store/StoreProvider.tsx for the per-request client instance.
 *
 * Reducer split (architecture.md §7):
 *   - baseApi.reducer  → ALL server state (RTK Query cache)
 *   - feature slices   → client/UI state ONLY (e.g. auth session)
 */


export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
