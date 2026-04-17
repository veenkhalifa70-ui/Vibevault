import React from 'react';
import { AuthProvider } from '@/src/components/AuthGuard';
import { MusicProvider } from '@/src/context/MusicContext';
import { Home } from '@/src/components/Home';
import { MusicPlayer } from '@/src/components/MusicPlayer';

export default function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <div className="min-h-screen bg-[#0a0502] selection:bg-[#ff4e00] selection:text-white">
          <Home />
          <MusicPlayer />
        </div>
      </MusicProvider>
    </AuthProvider>
  );
}
