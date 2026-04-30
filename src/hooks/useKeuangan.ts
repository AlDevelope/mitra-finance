import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Keuangan } from '../types';

export const useKeuangan = () => {
  const [data, setData] = useState<Keuangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'keuangan', 'summary'), (doc) => {
      if (doc.exists()) {
        setData(doc.data() as Keuangan);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error (Keuangan):", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { data, loading, error };
};
