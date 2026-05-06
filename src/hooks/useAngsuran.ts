import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AngsuranLog } from '../types';

export function useAngsuran() {
  const [logs, setLogs] = useState<AngsuranLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'angsuran_logs'), orderBy('tanggal', 'asc'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let runningTotal = 0;
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          runningTotal += (Number(d.masuk) || 0) - (Number(d.keluar) || 0);
          return {
            id: doc.id,
            ...d,
            total: runningTotal
          } as AngsuranLog;
        });
        setLogs([...data].reverse());
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching angsuran logs:', err);
        setError('Gagal memuat histori log');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totals = useMemo(() => {
    const masuk = logs.reduce((acc, curr) => acc + (Number(curr.masuk) || 0), 0);
    const keluar = logs.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);
    return { masuk, keluar, saldo: masuk - keluar };
  }, [logs]);

  return { logs, totals, loading, error };
}
