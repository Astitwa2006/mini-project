import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage     from './pages/LandingPage.jsx';
import LoginPage       from './pages/LoginPage.jsx';
import LobbyPage       from './pages/LobbyPage.jsx';
import WaitingRoomPage from './pages/WaitingRoomPage.jsx';
import GamePage        from './pages/GamePage.jsx';
import ResultsPage     from './pages/ResultsPage.jsx';
import JoinPage        from './pages/JoinPage.jsx';
import Loader          from './components/ui/Loader.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/join"     element={<JoinPage />} />
      <Route path="/join/:code" element={<JoinPage />} />

      <Route path="/lobby"   element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/room/:id" element={<ProtectedRoute><WaitingRoomPage /></ProtectedRoute>} />
      <Route path="/game/:id" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />

      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}
