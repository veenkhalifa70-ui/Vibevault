import React, { useState } from 'react';
import { useMusic } from '@/src/context/MusicContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, ListMusic, Shuffle, X, GripVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function MusicPlayer() {
  const { state, togglePlay, nextSong, prevSong, setVolume, setProgress, shuffleQueue, queue, removeFromQueue, reorderQueue, playSong } = useMusic();
  const { currentSong, isPlaying, volume, progress } = state;
  const [showQueue, setShowQueue] = useState(false);

  if (!currentSong) return null;

  return (
    <>
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[110px] right-10 w-[400px] max-h-[500px] bg-bg border border-line shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-line flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-serif italic text-xl">Up Next</h3>
              <button onClick={() => setShowQueue(false)} className="text-muted hover:text-fg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {queue.map((song, index) => (
                <div 
                  key={`${song.id}-${index}`}
                  className={cn(
                    "group flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors rounded-sm",
                    currentSong.id === song.id && "bg-white/[0.05]"
                  )}
                >
                  <div className="text-[10px] font-mono text-muted w-4">{index + 1}</div>
                  <div className="w-10 h-10 bg-line rounded-xs overflow-hidden flex-shrink-0">
                    {song.coverUrl && <img src={song.coverUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => playSong(song)}>
                    <div className={cn("text-sm font-medium truncate cursor-pointer", currentSong.id === song.id ? "text-highlight" : "text-fg")}>
                      {song.title}
                    </div>
                    <div className="text-xs text-muted truncate">{song.artist}</div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => index > 0 && reorderQueue(index, index - 1)}
                      className="p-1.5 text-muted hover:text-fg hover:bg-white/10 rounded-full transition-all"
                      disabled={index === 0}
                    >
                      <GripVertical className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <button 
                      onClick={() => removeFromQueue(song.id)}
                      className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.footer 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 h-[100px] bg-white/[0.03] backdrop-blur-[20px] border-t border-line px-10 flex items-center justify-between"
      >
        {/* Now Playing */}
        <div className="flex items-center gap-5 w-[30%]">
          <div className="w-[50px] h-[50px] bg-accent rounded-sm overflow-hidden flex-shrink-0">
            {currentSong.coverUrl && (
              <img src={currentSong.coverUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            )}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm truncate">{currentSong.title}</div>
            <div className="text-xs text-muted truncate">{currentSong.artist}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={shuffleQueue}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
            title="Shuffle Queue"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button 
            onClick={prevSong} 
            className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-fg opacity-60 hover:opacity-100 hover:bg-white/[0.05] transition-all cursor-pointer active:scale-90"
            title="Previous Song"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-[60px] h-[60px] rounded-full bg-fg text-bg flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>

          <button 
            onClick={nextSong} 
            className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-fg opacity-60 hover:opacity-100 hover:bg-white/[0.05] transition-all cursor-pointer active:scale-90"
            title="Next Song"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <div className="flex items-center gap-4 ml-6">
            <div 
              className="w-[400px] h-[2px] bg-line relative cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setProgress((x / rect.width) * 100);
              }}
            >
              <div 
                className="absolute h-full bg-fg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[12px] font-mono text-muted w-24">
              {progress > 0 ? `${Math.floor((progress / 100) * (currentSong.duration || 0) / 60)}:${String(Math.floor((progress / 100) * (currentSong.duration || 0) % 60)).padStart(2, '0')}` : '00:00'} / {currentSong.duration ? `${Math.floor(currentSong.duration / 60)}:${String(currentSong.duration % 60).padStart(2, '0')}` : '--:--'}
            </span>
          </div>
        </div>

        {/* Volume & Queue Toggle */}
        <div className="flex items-center gap-6 w-[30%] justify-end">
          <button 
            onClick={() => setShowQueue(!showQueue)}
            className={cn(
              "p-2 rounded-full transition-colors",
              showQueue ? "text-highlight bg-highlight/10" : "text-muted hover:text-fg"
            )}
            title="Show Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <Volume2 className="w-4 h-4 opacity-60" />
            <div 
              className="w-[100px] h-[2px] bg-line relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setVolume(Math.max(0, Math.min(1, x / rect.width)));
              }}
            >
              <div 
                className="absolute h-full bg-fg"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.footer>
    </>
  );
}
