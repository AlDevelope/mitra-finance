import React, { useState } from 'react';
import { ShieldAlert, X, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const email = auth.currentUser?.email;
      if (!email) throw new Error('Sesi admin tidak ditemukan');
      
      // Re-authenticate to verify password
      await signInWithEmailAndPassword(auth, email, password);
      
      onConfirm();
      onClose();
      setPassword('');
    } catch (err: any) {
      console.error('Password verification failed:', err);
      setError('Password salah atau terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors leading-none font-bold">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Konfirmasi Password Admin</label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-0 transition-all outline-none"
              />
              {error && <p className="text-red-500 text-[10px] mt-2 font-bold px-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Konfirmasi & Hapus'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
            >
              Batalkan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
