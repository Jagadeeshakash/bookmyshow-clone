import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './redux/store';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import SelectShow from './pages/SelectShow';
import SeatSelection from './pages/SeatSelection';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import StripeSuccess from './pages/StripeSuccess';
import ForgotPassword from './pages/ForgotPassword';

// Admin
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminMovies from './admin/AdminMovies';
import AdminTheatres from './admin/AdminTheatres';
import AdminShows from './admin/AdminShows';
import AdminBookings from './admin/AdminBookings';
import AdminUsers from './admin/AdminUsers';
import AdminReports from './admin/AdminReports';
import AdminOffers from './admin/AdminOffers';
import AdminSettings from './admin/AdminSettings';
import AdminLogin from './pages/AdminLogin';
import AdminPaymentHistory from './admin/AdminPaymentHistory';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <Routes>
          {/* ── Public Routes ── */}
          <Route path="/"                    element={<Home />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/register"            element={<Register />} />
          <Route path="/forgot-password"     element={<ForgotPassword />} />

          {/* Movie details & show selection — public (viewing only) */}
          <Route path="/movie/:id"           element={<MovieDetails />} />
          <Route path="/movie/:id/shows"     element={<SelectShow />} />

          {/* ── Protected User Routes (must be logged in) ── */}
          <Route path="/show/:showId/seats" element={
            <ProtectedRoute><SeatSelection /></ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute><Payment /></ProtectedRoute>
          } />
          <Route path="/payment/stripe/success" element={
            <ProtectedRoute><StripeSuccess /></ProtectedRoute>
          } />
          <Route path="/booking-confirmation/:bookingId" element={
            <ProtectedRoute><BookingConfirmation /></ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute><MyBookings /></ProtectedRoute>
          } />

          {/* ── Admin Routes ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>
          }>
            <Route index                    element={<AdminDashboard />} />
            <Route path="movies"            element={<AdminMovies />} />
            <Route path="theatres"          element={<AdminTheatres />} />
            <Route path="shows"             element={<AdminShows />} />
            <Route path="bookings"          element={<AdminBookings />} />
            <Route path="users"             element={<AdminUsers />} />
            <Route path="reports"           element={<AdminReports />} />
            <Route path="offers"            element={<AdminOffers />} />
            <Route path="settings"          element={<AdminSettings />} />
            <Route path="payment-history"   element={<AdminPaymentHistory />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;