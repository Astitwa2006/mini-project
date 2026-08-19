import StrictMode from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { GameProvider } from './context/GameContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
