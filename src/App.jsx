import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './pages/Routes_Config';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoutesPage from './pages/Routes';
import Community from './pages/Community';
import Garage from './pages/Garage';
import HazardMap from './pages/HazardMap';
import HelmetHealth from './pages/HelmetHealth';
import { useAuth } from './hooks/useAuth';

function AppLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // Landing page gets its own nav — suppress app chrome there
  const isLanding = pathname === '/';

  return (
    <>
      {user && !isLanding && <Navbar />}
      {user && !isLanding && <BottomNav />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/garage" element={<ProtectedRoute><Garage /></ProtectedRoute>} />
        <Route path="/hazard-map" element={<ProtectedRoute><HazardMap /></ProtectedRoute>} />
        <Route path="/helmet-health" element={<ProtectedRoute><HelmetHealth /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
