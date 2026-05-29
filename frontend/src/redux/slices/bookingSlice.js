import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    selectedShow: null,
    selectedSeats: [],
    selectedTheatre: null,
    bookingDetails: null,
  },
  reducers: {
    setSelectedShow(state, action) { state.selectedShow = action.payload; },
    setSelectedSeats(state, action) { state.selectedSeats = action.payload; },
    setSelectedTheatre(state, action) { state.selectedTheatre = action.payload; },
    setBookingDetails(state, action) { state.bookingDetails = action.payload; },
    clearBooking(state) {
      state.selectedShow = null;
      state.selectedSeats = [];
      state.selectedTheatre = null;
      state.bookingDetails = null;
    },
  },
});

export const { setSelectedShow, setSelectedSeats, setSelectedTheatre, setBookingDetails, clearBooking } = bookingSlice.actions;
export default bookingSlice.reducer;