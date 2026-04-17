import React, { useEffect, useState } from 'react';
import { auth, db, googleProvider } from '@/src/lib/firebase';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '@/src/types';
import { Music, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-errors';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Subscribe to profile changes
        const profileRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              isPremium: false,
            };
            setDoc(profileRef, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });
        setLoading(false);
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {loading ? (
        <div className="min-h-screen bg-[#0a0502] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Music className="w-12 h-12 text-[#ff4e00]" />
          </motion.div>
        </div>
      ) : !user ? (
        <LoginScreen signIn={signIn} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

function LoginScreen({ signIn }: { signIn: () => void }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="font-serif italic text-5xl tracking-tighter mb-12">VibeVault</div>
        
        <span className="meta-tag">Exclusive Access</span>
        <h1 className="hero-title text-6xl mb-12">Your Sonic<br />Sanctuary</h1>

        <button
          onClick={signIn}
          className="w-full bg-fg text-bg py-5 rounded-none font-bold text-[11px] uppercase tracking-[2px] hover:opacity-90 transition-all active:scale-[0.98]"
        >
          Sign in with Google
        </button>

        <p className="mt-12 text-[10px] text-muted uppercase tracking-[3px] font-semibold">
          Premium Experience • Volume No. 04
        </p>
      </motion.div>
    </div>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
