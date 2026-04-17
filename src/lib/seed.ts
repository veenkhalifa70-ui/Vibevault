import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firestore-errors';

const DEMO_SONGS = [
  { 
    title: 'Neon Nights', 
    artist: 'Vanguard', 
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://picsum.photos/seed/dance/400/400',
    duration: 372
  },
  { 
    title: 'Ghost in the Machine', 
    artist: 'Elena Rossi', 
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://picsum.photos/seed/hero/400/400',
    duration: 425
  },
  { 
    title: 'Late Hour Jazz', 
    artist: 'The Quartz', 
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://picsum.photos/seed/shark/400/400',
    duration: 512
  },
  { 
    title: 'Solaris Transit', 
    artist: 'M-Theory', 
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://picsum.photos/seed/abc/400/400',
    duration: 298
  },
  { 
    title: 'After Midnight', 
    artist: 'Urban Echo', 
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverUrl: 'https://picsum.photos/seed/jazz/400/400',
    duration: 480
  }
];

export async function seedSongs() {
  // Wait for auth to initialize
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!auth.currentUser) {
    console.log('Skipping seed: User not authenticated');
    return;
  }

  const songsRef = collection(db, 'songs');
  let snapshot;
  try {
    snapshot = await getDocs(query(songsRef, limit(1)));
  } catch (error) {
    // If we can't even read, we probably aren't admin or authenticated properly
    console.log('Skipping seed: No read access to songs');
    return;
  }
  
  if (snapshot.empty) {
    console.log('Seeding demo songs...');
    for (const song of DEMO_SONGS) {
      try {
        await addDoc(songsRef, song);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'songs');
      }
    }
    console.log('Seeding complete!');
  }
}
