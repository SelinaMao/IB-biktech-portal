import { combineReducers, UnknownAction } from '@reduxjs/toolkit';

import authReducer from './../features/auth/auth.slice';
import globalReducer from './global/global.slice';
import accountReducer from './../features/account/account.slice';
import { baseApi } from './baseApi';

// 1. Combine the reducers first so TypeScript can automatically infer the exact types
const combinedReducers = combineReducers({
    auth: authReducer,
    global: globalReducer,
    account: accountReducer,

    [baseApi.reducerPath]: baseApi.reducer,
});

// 2. Infer the state type directly from the combined reducers
export type RootReducerState = ReturnType<typeof combinedReducers>;

export const USER_LOGOUT_ACTION = 'USER_LOGOUT_ACTION';

/** Drops every slice back to its initial state. Pair with `baseApi.util.resetApiState()`. */
export const resetStore = (): UnknownAction => ({ type: USER_LOGOUT_ACTION });

// 3. Use the inferred type and proper Redux action type for your logout clear
const rootReducer = (state: RootReducerState | undefined, action: UnknownAction) => {
    if (action.type === USER_LOGOUT_ACTION) {
        // Passing undefined resets the entire state tree (including RTK Query cache)
        return combinedReducers(undefined, action);
    }

    return combinedReducers(state, action);
};

export default rootReducer;
