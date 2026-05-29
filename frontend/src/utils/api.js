import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const token = userInfo?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login:      (data) => API.post('/auth/login', data),
  register:   (data) => API.post('/auth/register', data),
  getProfile: ()     => API.get('/auth/profile'),
  getAllUsers: ()     => API.get('/auth/users'),
  deleteUser: (id)   => API.delete(`/auth/users/${id}`),
};

export const movieAPI = {
  getAll:         (params)   => API.get('/movies', { params }),
  getById:        (id)       => API.get(`/movies/${id}`),
  create:         (data)     => API.post('/movies', data),
  update:         (id, data) => API.put(`/movies/${id}`, data),
  delete:         (id)       => API.delete(`/movies/${id}`),
  searchTMDB:     (query)    => API.get(`/movies/tmdb/search?query=${encodeURIComponent(query)}`),
  getTMDBDetails: (tmdbId)   => API.get(`/movies/tmdb/details/${tmdbId}`),
};

export const theatreAPI = {
  getAll:  (params)   => API.get('/theatres', { params }),
  getById: (id)       => API.get(`/theatres/${id}`),
  create:  (data)     => API.post('/theatres', data),
  update:  (id, data) => API.put(`/theatres/${id}`, data),
  delete:  (id)       => API.delete(`/theatres/${id}`),
};

export const showAPI = {
  getAll:         (params)   => API.get('/shows', { params }),
  getById:        (id)       => API.get(`/shows/${id}`),
  create:         (data)     => API.post('/shows', data),
  update:         (id, data) => API.put(`/shows/${id}`, data),
  delete:         (id)       => API.delete(`/shows/${id}`),
  // ✅ New seat layout APIs
  updateSeatLayout: (id, data) => API.put(`/shows/${id}/seat-layout`, data),
  toggleSeat:       (id, data) => API.put(`/shows/${id}/toggle-seat`, data),
};

export const bookingAPI = {
  create:        (data) => API.post('/bookings', data),
  getMyBookings: ()     => API.get('/bookings/my'),
  getAllBookings: ()     => API.get('/bookings/all'),
  getById:       (id)   => API.get(`/bookings/${id}`),
  cancel:        (id)   => API.put(`/bookings/${id}/cancel`),
  resendEmail:   (id)   => API.post(`/bookings/${id}/resend-email`),
};

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
};

export const paymentAPI = {
  createStripeSession: (data)      => API.post('/payment/stripe/create-session', data),
  verifyStripeSession: (sessionId) => API.get(`/payment/stripe/success?session_id=${sessionId}`),
  createRazorpayOrder: (data)      => API.post('/payment/razorpay/create-order', data),
  verifyRazorpay:      (data)      => API.post('/payment/razorpay/verify', data),
};

export default API;