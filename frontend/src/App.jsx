import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Interventions from './pages/Interventions';
import Attendance from './pages/Attendance';
import MyProgress from './pages/MyProgress';
import Profile from './pages/Profile';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';

const STAFF = ['faculty', 'admin', 'mentor'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<ProtectedRoute roles={STAFF}><Dashboard /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute roles={STAFF}><Students /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute roles={STAFF}><StudentDetail /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute roles={STAFF}><Attendance /></ProtectedRoute>} />
      <Route path="/interventions" element={<ProtectedRoute roles={STAFF}><Interventions /></ProtectedRoute>} />

      <Route path="/my-progress" element={<ProtectedRoute roles={['student']}><MyProgress /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
