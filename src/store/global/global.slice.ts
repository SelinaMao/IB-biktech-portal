import { createSlice } from "@reduxjs/toolkit";

interface Globalstate {
    hideAmount: boolean;
}

const initialState: Globalstate = {
    hideAmount: false,
};

export const uiSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        toggleHideAmount: (state) => {
            state.hideAmount = !state.hideAmount;
        },
        setHideAmount: (state, action) => {
            state.hideAmount = action.payload;
        },
    },
});

export const { toggleHideAmount, setHideAmount } = uiSlice.actions;
export default uiSlice.reducer;