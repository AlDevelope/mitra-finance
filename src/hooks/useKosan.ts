import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KosanRecord } from '../types';
import { useSettings } from './useSettings';

export function useKosan(kost?: 'D1' | 'D2') {
  const [allRecords, setAllRecords] = useState<KosanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const q = query(collection(db, 'kosanku'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Saldo berjalan dihitung terpisah per Den Kost (D1 & D2)
        const running: { D1: number; D2: number } = { D1: 0, D2: 0 };
        const data = snapshot.docs.map((doc) => {
          const d = doc.data() as any;
          const recKost: 'D1' | 'D2' = d.kost === 'D2' ? 'D2' : 'D1';
          running[recKost] += (Number(d.masuk) || 0) - (Number(d.keluar) || 0);
          return {
            id: doc.id,
            ...d,
            kost: recKost,
            jumlah: running[recKost]
          } as KosanRecord;
        });
        setAllRecords(data);
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

  // Jika kost diberikan -> hanya record kost tsb. Jika tidak -> semua (dipakai halaman Keuangan).
  const records = useMemo(
    () => (kost ? allRecords.filter((r) => (r.kost || 'D1') === kost) : allRecords),
    [allRecords, kost]
  );

  const totals = useMemo(() => {
    const modalD1 = settings?.kosan_modal || 15000000;
    // D2 mengambil modal_renov dari settings.kosan_modal_baru (Uang Renovasi Baru di Keuangan)
    const modalD2 = settings?.kosan_modal_baru !== undefined 
      ? settings.kosan_modal_baru 
      : (settings?.kosan_modal || 15000000);

    if (kost) {
      const terkumpul = records.reduce((acc, curr) => acc + (curr.masuk || 0), 0);
      const pengeluaran = records.reduce((acc, curr) => acc + (curr.keluar || 0), 0);
      const modalRenov = kost === 'D2' ? modalD2 : modalD1;
      const uangBersih = terkumpul - pengeluaran;
      return { terkumpul, pengeluaran, modalRenov, uangBersih, sisa: modalRenov - uangBersih };
    }

    // Gabungan: D1 memotong renov lama, D2 memotong renov baru
    const terkumpul = allRecords.reduce((acc, curr) => acc + (curr.masuk || 0), 0);
    const pengeluaran = allRecords.reduce((acc, curr) => acc + (curr.keluar || 0), 0);
    const uangBersih = terkumpul - pengeluaran;
    const d1Bersih = allRecords
      .filter((r) => (r.kost || 'D1') === 'D1')
      .reduce((acc, curr) => acc + ((curr.masuk || 0) - (curr.keluar || 0)), 0);
    const d2Bersih = allRecords
      .filter((r) => r.kost === 'D2')
      .reduce((acc, curr) => acc + ((curr.masuk || 0) - (curr.keluar || 0)), 0);
    const modalRenov = modalD1 + modalD2;
    const sisa = (modalD1 - d1Bersih) + (modalD2 - d2Bersih);

    return { terkumpul, pengeluaran, modalRenov, uangBersih, sisa };
  }, [records, allRecords, kost, settings?.kosan_modal, settings?.kosan_modal_baru]);

  return { records, totals, loading, error };
}
