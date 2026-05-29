import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { movieAPI } from '../../utils/api';

export const fetchMovies = createAsyncThunk('movies/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await movieAPI.getAll(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch movies');
  }
});

export const fetchMovieById = createAsyncThunk('movies/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await movieAPI.getById(id);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch movie');
  }
});

const movieSlice = createSlice({
  name: 'movies',
  initialState: { list: [], currentMovie: null, loading: false, error: null },
  reducers: {
    clearCurrentMovie(state) { state.currentMovie = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => { state.loading = true; })
      .addCase(fetchMovies.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchMovies.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMovieById.pending, (state) => { state.loading = true; })
      .addCase(fetchMovieById.fulfilled, (state, action) => { state.loading = false; state.currentMovie = action.payload; })
      .addCase(fetchMovieById.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearCurrentMovie } = movieSlice.actions;
export default movieSlice.reducer;