import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNasabah } from '../hooks/useNasabah';
import { formatRupiah } from '../lib/formulas';
import { HandCoins, Plus, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

// Catat Pembayaran Sebagian (cicilan tidak penuh).
// PENTING: fitur ini HANYA MENAMBAH dokumen baru ke koleksi 'pembayaran_sebagian'.
// Tidak pernah mengubah/menghapus data nasabah, saldo, atau sisa cicilan yang ada.
type Catatan = {
  id: string;
  nasabah_id: string;
  nasabah_nama: string;
  jumlah: number;
  tanggal: string;
  catatan: string;
  recorded_by: string;
};

const PembayaranSebagianPage: React.FC = () => {
  const { data: nasabahList } = useNasabah();
  const [nasabahId, setNasabahId] = useState('');
  const [jumlah, setJumlah] = useState<number>(0);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rows, setRows] = useState<Catatan[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'pembayaran_sebagian'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Catatan[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            nasabah_id: String(data.nasabah_id || ''),
            nasabah_nama: String(data.nasabah_nama || ''),
            jumlah: Number(data.jumlah || 0),
            tanggal: String(data.tanggal || ''),
            catatan: String(data.catatan || ''),
            recorded_by: String(data.recorded_by || ''),
          };
        });
        setRows(list);
      },
      () => {
        setRows([]);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nasabahId) {
      setError('Pilih nasabah dulu.');
      return;
    }
    if (!jumlah || jumlah <= 0) {
      setError('Jumlah pembayaran harus lebih dari 0.');
      return;
    }
    const n = nasabahList.find((x) => x.id === nasabahId);
    setSaving(true);
    try {
      await addDoc(collection(db, 'pembayaran_sebagian'), {
        nasabah_id: nasabahId,
        nasabah_nama: n ? n.nama : '',
        jumlah,
        tanggal,
        catatan,
        recorded_by: auth.currentUser ? (auth.currentUser.email || '') : '',
        created_at: serverTimestamp(),
      });
      setSuccess('Catatan pembayaran tersimpan.');
      setJumlah(0);
      setCatatan('');
    } catch (err) {
      setError('Gagal menyimpan. Pastikan aturan Firestore untuk koleksi pembayaran_sebagian sudah di-deploy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Pembayaran Sebagian</h2>
        <p className="text-gray-500">Catat pembayaran cicilan yang belum penuh.</p>
      </header>

      <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-50 text-amber-700 text-xs">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <p>Catatan ini bersifat <b>tambahan</b> dan tidak otomatis mengubah saldo / sisa cicilan nasabah. Penyesuaian saldo tetap dilakukan manual seperti biasa.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nasabah</label>
            <select
              value={nasabahId}
              onChange={(e) => setNasabahId(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">-- Pilih nasabah --</option>
              {nasabahList.map((n) => (
                <option key={n.id} value={n.id}>{n.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jumlah Bayar (Rp)</label>
            <input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value) || 0)}
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan (opsional)</label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="mis. bayar setengah angsuran ke-3"
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </form>

      <div className="glass p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <HandCoins className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Riwayat Pembayaran Sebagian</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada catatan.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                <div>
                  <p className="font-bold text-sm">{r.nasabah_nama || r.nasabah_id}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{r.tanggal}{r.catatan ? ' - ' + r.catatan : ''}
                  </p>
                </div>
                <p className="font-bold text-primary">{formatRupiah(r.jumlah)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PembayaranSebagianPage;
