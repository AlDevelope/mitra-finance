import React, { useState } from 'react';
import { useNasabah } from '../hooks/useNasabah';
import { formatRupiah } from '../lib/formulas';
import { NasabahStatus } from '../types';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AlertTriangle, MessageCircle, Eye, Users, Wallet, Clock, Search } from 'lucide-react';

// Halaman admin untuk memantau tagihan & mengirim pengingat (reminder) via WhatsApp.
// 100% read-only: hanya membaca daftar nasabah, tidak menulis/menghapus apa pun ke database.
const RemindersPage: React.FC = () => {
  const { data: nasabahList, loading } = useNasabah();
  const [searchTerm, setSearchTerm] = useState('');

  const belumLunas = nasabahList.filter(n => n.status !== NasabahStatus.LUNAS);
  const menunggak = belumLunas.filter(n => n.status === NasabahStatus.MENUNGGAK);
  const totalTunggakan = menunggak.reduce((t, n) => t + (n.sisa_hutang || 0), 0);
  const totalPiutangAktif = belumLunas.reduce((t, n) => t + (n.sisa_hutang || 0), 0);

  // Urutkan: menunggak dulu, lalu sisa cicilan terbesar.
  const sorted = [...belumLunas]
    .filter(n =>
      n.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.barang.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const am = a.status === NasabahStatus.MENUNGGAK ? 1 : 0;
      const bm = b.status === NasabahStatus.MENUNGGAK ? 1 : 0;
      if (am !== bm) return bm - am;
      return (b.sisa_hutang || 0) - (a.sisa_hutang || 0);
    });

  const buildReminderLink = (n: any): string => {
    const satuan = n.satuan || 'MGU';
    const msg =
      'Halo ' + n.nama + ',\n\n' +
      'Mengingatkan pembayaran angsuran untuk ' + n.barang + ':\n' +
      '- Sisa cicilan: ' + formatRupiah(n.sisa_hutang || 0) + '\n' +
      '- Sisa: ' + (n.sisa_angsuran || 0) + ' ' + satuan + ' lagi\n' +
      '- Per angsuran: ' + formatRupiah(n.rp_per_angsuran || 0) + '\n\n' +
      'Mohon segera melakukan pembayaran. Terima kasih.\n' +
      'Mitra Finance 99';
    const phone = (n.whatsapp_number || '').toString().replace(/[^0-9]/g, '');
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-400">Memuat data tagihan...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Tagihan &amp; Reminder</h2>
        <p className="text-gray-500">Pantau tunggakan dan kirim pengingat ke nasabah</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl"><Users className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum Lunas</p>
          </div>
          <p className="text-2xl font-bold">{belumLunas.length} <span className="text-sm text-gray-400">nasabah</span></p>
        </div>
        <div className="glass p-6 rounded-3xl border-2 border-red-50/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menunggak</p>
          </div>
          <p className="text-2xl font-bold text-danger">{menunggak.length} <span className="text-sm text-gray-400">nasabah</span></p>
          <p className="text-xs font-bold text-gray-400 mt-1">{formatRupiah(totalTunggakan)}</p>
        </div>
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 text-accent rounded-xl"><Wallet className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Piutang Aktif</p>
          </div>
          <p className="text-2xl font-bold">{formatRupiah(totalPiutangAktif)}</p>
        </div>
      </div>

      <div className="glass p-3 md:p-4 rounded-2xl">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Cari nama nasabah atau barang..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((nasabah) => (
          <div key={nasabah.id} className="glass p-4 md:p-5 rounded-3xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                {nasabah.nama.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate">{nasabah.nama}</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold inline-block shrink-0",
                    nasabah.status === NasabahStatus.MENUNGGAK ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
                  )}>
                    {nasabah.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">{nasabah.barang}</p>
                <p className="text-[11px] font-bold text-gray-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {formatRupiah(nasabah.sisa_hutang)} · sisa {nasabah.sisa_angsuran} {nasabah.satuan || 'MGU'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={buildReminderLink(nasabah)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-green-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-green-600 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Reminder</span>
              </a>
              <Link
                to={'/nasabah/' + nasabah.id}
                className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="bg-gray-50 p-10 rounded-3xl text-center text-gray-400 font-medium">
            Tidak ada tagihan yang cocok. Semua nasabah sudah lunas atau tidak ada hasil pencarian.
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;
