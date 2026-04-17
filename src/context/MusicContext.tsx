import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song, PlayerState } from '@/src/types';

interface MusicContextType {
  state: PlayerState;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  queue: Song[];
  setQueue: (songs: Song[]) => void;
  shuffleQueue: () => void;
  removeFromQueue: (songId: string) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 0.7,
    progress: 0,
  });
  const [queue, setQueue] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = state.volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setState(prev => ({ ...prev, progress: (audio.currentTime / audio.duration) * 100 }));
      }
    };

    const handleEnded = () => {
      nextSong();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  const playSong = (song: Song) => {
    if (audioRef.current) {
      if (state.currentSong?.id === song.id) {
        togglePlay();
        return;
      }
      audioRef.current.src = song.url;
      audioRef.current.play();
      setState(prev => ({ ...prev, currentSong: song, isPlaying: true, progress: 0 }));
    }
  };

  const togglePlay = () => {
    if (audioRef.current && state.currentSong) {
      if (state.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const nextSong = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(s => s.id === state.currentSong?.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    playSong(queue[nextIndex]);
  };

  const prevSong = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(s => s.id === state.currentSong?.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playSong(queue[prevIndex]);
  };

  const setVolume = (volume: number) => {
    setState(prev => ({ ...prev, volume }));
  };

  const setProgress = (progress: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (progress / 100) * audioRef.current.duration;
      setState(prev => ({ ...prev, progress }));
    }
  };

  const shuffleQueue = () => {
    if (queue.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playSong(shuffled[0]);
  };

  const removeFromQueue = (songId: string) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  };

  const reorderQueue = (startIndex: number, endIndex: number) => {
    const result = Array.from(queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setQueue(result);
  };

  return (
    <MusicContext.Provider value={{ 
      state, 
      playSong, 
      togglePlay, 
      nextSong, 
      prevSong, 
      setVolume, 
      setProgress,
      queue,
      setQueue,
      shuffleQueue,
      removeFromQueue,
      reorderQueue
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
