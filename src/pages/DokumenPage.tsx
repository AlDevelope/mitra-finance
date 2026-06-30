import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNasabah } from '../hooks/useNasabah';
import { NasabahStatus } from '../types';
import { Camera, Trash2, Upload, AlertTriangle, CheckCircle2, ImageOff } from 'lucide-react';

// Dokumen Nasabah (penyimpanan SEMENTARA).
// - Foto dikompres kecil lalu disimpan sebagai base64 di koleksi baru 'dokumen_nasabah'.
// - Tidak memakai Firebase Storage.
// - Bersifat additive: tidak pernah mengubah/menghapus data nasabah yang ada.
// - Otomatis dihapus ketika nasabah berstatus LUNAS (hanya menghapus dokumen di koleksi ini).
type Dok = {
  id: string;
  nasabah_id: string;
  nasabah_nama: string;
  label: string;
  image: string;
};

const MAX_DIM = 800;
const QUALITY = 0.5;
const MAX_BASE64 = 900000; // ~0.9 MB, di bawah batas 1 MB per dokumen Firestore

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas tidak didukung'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

const DokumenPage: React.FC = () => {
  const { data: nasabahList } = useNasabah();
  const [nasabahId, setNasabahId] = useState('');
  const [label, setLabel] = useState('');
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rows, setRows] = useState<Dok[]>([]);

  // Set id nasabah yang sudah LUNAS untuk auto-bersih.
  const lunasIds = useMemo(() => {
    const s = new Set<string>();
    nasabahList.forEach((n) => {
      if (n.status === NasabahStatus.LUNAS) s.add(n.id);
    });
    return s;
  }, [nasabahList]);

  useEffect(() => {
    const q = query(collection(db, 'dokumen_nasabah'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Dok[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            nasabah_id: String(data.nasabah_id || ''),
            nasabah_nama: String(data.nasabah_nama || ''),
            label: String(data.label || ''),
            image: String(data.image || ''),
          };
        });
        setRows(list);
        // Auto-hapus dokumen milik nasabah yang sudah LUNAS.
        list.forEach((r) => {
          if (lunasIds.has(r.nasabah_id)) {
            deleteDoc(doc(db, 'dokumen_nasabah', r.id)).catch(() => {});
          }
        });
      },
      () => setRows([])
    );
    return () => unsub();
  }, [lunasIds]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file);
      if (base64.length > MAX_BASE64) {
        setError('Foto masih terlalu besar setelah dikompres. Coba foto dengan resolusi lebih kecil.');
        setPreview('');
        return;
      }
      setPreview(base64);
    } catch (err) {
      setError('Gagal memproses gambar.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nasabahId) {
      setError('Pilih nasabah dulu.');
      return;
    }
    if (!preview) {
      setError('Pilih atau ambil foto dulu.');
      return;
    }
    const n = nasabahList.find((x) => x.id === nasabahId);
    if (n && n.status === NasabahStatus.LUNAS) {
      setError('Nasabah ini sudah LUNAS, dokumen tidak disimpan (penyimpanan hanya sementara).');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'dokumen_nasabah'), {
        nasabah_id: nasabahId,
        nasabah_nama: n ? n.nama : '',
        label: label || 'Dokumen',
        image: preview,
        recorded_by: auth.currentUser ? (auth.currentUser.email || '') : '',
        created_at: serverTimestamp(),
      });
      setSuccess('Dokumen tersimpan sementara.');
      setPreview('');
      setLabel('');
    } catch (err) {
      setError('Gagal menyimpan. Pastikan aturan Firestore untuk koleksi dokumen_nasabah sudah di-deploy.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'dokumen_nasabah', id));
    } catch (err) {
      setError('Gagal menghapus dokumen.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Dokumen Nasabah</h2>
        <p className="text-gray-500">Penyimpanan foto sementara (opsional). Otomatis terhapus saat nasabah lunas.</p>
      </header>

      <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-50 text-amber-700 text-xs">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <p>Foto dikompres seminimal mungkin dan hanya disimpan <b>sementara</b>. Begitu status nasabah menjadi <b>LUNAS</b>, dokumennya otomatis dihapus. Fitur ini bersifat opsional.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nasabah</label>
            <select
              value={nasabahId}
              onChange={(e) => setNasabahId(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">-- Pilih nasabah --</option>
              {nasabahList.filter((n) => n.status !== NasabahStatus.LUNAS).map((n) => (
                <option key={n.id} value={n.id}>{n.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Label (opsional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="mis. Foto jaminan"
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100">
            <Camera className="w-4 h-4" />
            Ambil / Pilih Foto
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        </div>

        {preview && (
          <div className="relative inline-block">
            <img src={preview} alt="preview" className="max-h-48 rounded-2xl border border-gray-100" />
          </div>
        )}

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
          <Upload className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Dokumen'}
        </button>
      </form>

      <div className="glass p-6 rounded-3xl">
        <h3 className="font-bold mb-4">Dokumen Tersimpan</h3>
        {rows.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ImageOff className="w-4 h-4" />
            <p>Belum ada dokumen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {rows.map((r) => (
              <div key={r.id} className="relative group rounded-2xl overflow-hidden border border-gray-100">
                <img src={r.image} alt={r.label} className="w-full h-32 object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-2 py-1">
                  <p className="font-bold truncate">{r.nasabah_nama}</p>
                  <p className="truncate">{r.label}</p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DokumenPage;
