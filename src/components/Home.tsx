import React, { useEffect, useState } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, limit, doc, updateDoc } from 'firebase/firestore';
import { Song } from '@/src/types';
import { useMusic } from '@/src/context/MusicContext';
import { useAuth } from '@/src/components/AuthGuard';
import { Play, Crown, Search, Heart, Clock, Music2, Home as HomeIcon, Library, ListMusic, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-errors';

export function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<'discovery' | 'library'>('discovery');
  const [searchQuery, setSearchQuery] = useState('');
  const { playSong, state, setQueue } = useMusic();
  const { profile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'songs'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      setSongs(songsData);
      if (currentView === 'discovery') {
        setQueue(songsData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'songs');
    });

    return () => unsubscribe();
  }, [setQueue, currentView]);

  useEffect(() => {
    if (!profile) return;
    const likesRef = collection(db, 'users', profile.uid, 'likes');
    const unsubscribe = onSnapshot(likesRef, async (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.id));
      setLikedSongIds(ids);
      
      // Fetch song data for any liked songs not in the current list
      const missingIds = Array.from(ids).filter(id => !songs.find(s => s.id === id));
      if (missingIds.length > 0) {
        const { getDoc, doc } = await import('firebase/firestore');
        const newSongs = [...songs];
        for (const id of missingIds) {
          try {
            const songDoc = await getDoc(doc(db, 'songs', id));
            if (songDoc.exists()) {
              newSongs.push({ id: songDoc.id, ...songDoc.data() } as Song);
            }
          } catch (err) {
            console.error('Error fetching liked song:', id, err);
          }
        }
        setSongs(newSongs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${profile.uid}/likes`);
    });

    return () => unsubscribe();
  }, [profile, songs]);

  useEffect(() => {
    const baseSongs = currentView === 'discovery' ? songs : songs.filter(s => likedSongIds.has(s.id));
    const filtered = baseSongs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setQueue(filtered);
  }, [currentView, songs, likedSongIds, searchQuery, setQueue]);

  const toggleLike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!profile) return;
    const likeRef = doc(db, 'users', profile.uid, 'likes', songId);
    try {
      if (likedSongIds.has(songId)) {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(likeRef);
      } else {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(likeRef, {
          userId: profile.uid,
          songId: songId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}/likes/${songId}`);
    }
  };

  const handleSubscribe = async () => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        isPremium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert('Premium activated! Enjoy unlimited music.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const displaySongs = (currentView === 'discovery' ? songs : songs.filter(s => likedSongIds.has(s.id)))
    .filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Sidebar */}
      <aside className="w-80 border-r border-line p-10 flex flex-col fixed h-screen">
        <div className="font-serif italic text-3xl tracking-tighter mb-16">VibeVault</div>
        
        <nav className="flex-1">
          <ul className="space-y-6">
            <li>
              <button 
                onClick={() => setCurrentView('discovery')}
                className={cn(
                  "flex items-center gap-3 text-[11px] uppercase tracking-[2px] font-semibold transition-colors",
                  currentView === 'discovery' ? "text-fg" : "text-muted hover:text-fg"
                )}
              >
                {currentView === 'discovery' && <div className="w-1.5 h-1.5 bg-accent rounded-full" />}
                Discovery
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('library')}
                className={cn(
                  "flex items-center gap-3 text-[11px] uppercase tracking-[2px] font-semibold transition-colors",
                  currentView === 'library' ? "text-fg" : "text-muted hover:text-fg"
                )}
              >
                {currentView === 'library' && <div className="w-1.5 h-1.5 bg-accent rounded-full" />}
                Library
              </button>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 text-[11px] uppercase tracking-[2px] font-semibold text-muted hover:text-fg transition-colors">
                Playlists
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 text-[11px] uppercase tracking-[2px] font-semibold text-muted hover:text-fg transition-colors">
                Artists
              </a>
            </li>
          </ul>
        </nav>

        {!profile?.isPremium && (
          <div className="bg-fg text-bg p-8 rounded-none mt-auto">
            <span className="text-[10px] uppercase tracking-[2px] font-bold mb-2 block opacity-60">Upgrade</span>
            <h4 className="font-serif text-2xl mb-2 leading-tight">Limited Access</h4>
            <p className="text-[11px] leading-relaxed mb-5 opacity-80">Unlock the full catalog and high-fidelity masters for $9.99/mo.</p>
            <button 
              onClick={handleSubscribe}
              className="bg-bg text-fg border-none px-5 py-3 text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
            >
              Go Premium
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-80 p-16 pb-32">
        <header className="flex items-center justify-between mb-16">
          <div className="relative w-96 group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search by title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none pl-8 py-2 text-sm focus:outline-none placeholder:text-muted/50 font-medium"
            />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-line group-focus-within:bg-accent transition-colors" />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[2px] font-bold text-muted mb-1">Authenticated as</div>
              <div className="text-sm font-serif italic">{profile?.displayName || profile?.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-line overflow-hidden border border-line">
              {profile?.photoURL && <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
            </div>
          </div>
        </header>

        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="meta-tag">{currentView === 'discovery' ? 'Curated Collection' : 'Your Library'}</span>
            <h1 className="hero-title">
              {currentView === 'discovery' ? (
                <>Volume<br />No. 04</>
              ) : (
                <>Liked<br />Tracks</>
              )}
            </h1>
          </div>
          <div className="text-right">
            <span className="meta-tag">{currentView === 'discovery' ? 'Total Runtime' : 'Collection Size'}</span>
            <div className="font-serif text-2xl italic">
              {currentView === 'discovery' ? '42:15' : `${displaySongs.length} Tracks`}
            </div>
          </div>
        </div>

        <div className="mt-10">
          {/* Header Row */}
          <div className="grid grid-cols-[40px_1fr_200px_80px] py-4 border-b border-line text-[11px] uppercase tracking-widest text-muted font-bold">
            <div>#</div>
            <div>Title</div>
            <div>Artist</div>
            <div className="text-right">Time</div>
          </div>

          {/* Songs */}
          <div className="divide-y divide-line">
            {displaySongs.length === 0 ? (
              <div className="py-20 text-center text-muted">
                <Music2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{currentView === 'discovery' ? 'No songs available yet.' : 'Your library is empty. Like some songs to see them here!'}</p>
              </div>
            ) : (
              displaySongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (!profile?.isPremium && index > 2 && currentView === 'discovery') {
                      alert('Subscribe to Premium to listen to more songs!');
                      return;
                    }
                    playSong(song);
                  }}
                  className={cn(
                    "grid grid-cols-[40px_1fr_200px_80px] py-6 items-center cursor-pointer hover:bg-white/[0.02] transition-colors group",
                    state.currentSong?.id === song.id && "bg-white/[0.03]",
                    !profile?.isPremium && index > 2 && currentView === 'discovery' && "opacity-30 grayscale"
                  )}
                >
                  <div className="font-serif italic text-sm text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-line rounded-sm overflow-hidden flex-shrink-0">
                      {song.coverUrl && <img src={song.coverUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-sm group-hover:text-accent transition-colors truncate">{song.title}</h4>
                        <button 
                          onClick={(e) => toggleLike(e, song.id)}
                          className={cn(
                            "transition-colors flex-shrink-0",
                            likedSongIds.has(song.id) ? "text-highlight" : "text-muted group-hover:text-fg"
                          )}
                        >
                          <Heart className={cn("w-3.5 h-3.5", likedSongIds.has(song.id) && "fill-current")} />
                        </button>
                      </div>
                      {!profile?.isPremium && index > 2 && currentView === 'discovery' && (
                        <span className="text-[9px] uppercase tracking-widest text-highlight font-bold">Premium</span>
                      )}
                    </div>
                  </div>
                  <div className="text-muted text-sm">{song.artist}</div>
                  <div className="text-right text-muted font-mono text-xs">
                    {song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : '--:--'}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
