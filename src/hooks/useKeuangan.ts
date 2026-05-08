import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Keuangan } from '../types';
import { useKosan } from './useKosan';
import { useAngsuran } from './useAngsuran';

export const useKeuangan = () => {
  const [data, setData] = useState<Keuangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use kosan hook to always get the latest kosan totals
  const { totals: kosanTotals, loading: kosanLoading } = useKosan();
  
  // Use angsuran hook to always get the latest angsuran totals
  const { totals: angsuranTotals, loading: angsuranLoading } = useAngsuran();

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
      handleFirestoreError(err, OperationType.GET, 'keuangan/summary');
    });

    return () => unsub();
  }, []);

  // Merge the dynamically computed uang_renov (which is sisa modal from kosanku)
  // and uang_cash (which is sisa saldo from angsuran_logs)
  const computedData = useMemo(() => {
    return data ? {
      ...data,
      uang_renov: kosanTotals.sisa, // Override uang_renov with sisa_modal
      uang_cash: angsuranTotals.saldo // Override uang_cash with sisa_saldo from angsuran
    } : null;
  }, [data, kosanTotals.sisa, angsuranTotals.saldo]);

  return { 
    data: computedData, 
    loading: loading || kosanLoading || angsuranLoading, 
    error 
  };
};
