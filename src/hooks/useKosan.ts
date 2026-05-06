import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KosanRecord } from '../types';
import { useSettings } from './useSettings';

export function useKosan() {
  const [records, setRecords] = useState<KosanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const q = query(collection(db, 'kosanku'), orderBy('created_at', 'asc'));
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
            jumlah: runningTotal
          } as KosanRecord;
        });
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching kosan records:', err);
        setError('Gagal memuat data kosan');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totals = useMemo(() => {
    const terkumpul = records.reduce((acc, curr) => acc + (curr.masuk || 0), 0);
    const pengeluaran = records.reduce((acc, curr) => acc + (curr.keluar || 0), 0);
    const modalRenov = settings?.kosan_modal || 15000000;
    const uangBersih = terkumpul - pengeluaran;
    return { 
      terkumpul, 
      pengeluaran, 
      modalRenov, 
      uangBersih, 
      sisa: modalRenov - uangBersih 
    };
  }, [records, settings?.kosan_modal]);

  return { records, totals, loading, error };
}
