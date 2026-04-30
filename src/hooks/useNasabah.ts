import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Nasabah } from '../types';

export const useNasabah = () => {
  const [data, setData] = useState<Nasabah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'nasabah'), orderBy('nama', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Nasabah)));
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error (Nasabah):", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { data, loading, error };
};
