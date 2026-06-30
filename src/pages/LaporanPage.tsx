import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useNasabah } from '../hooks/useNasabah';
import { formatRupiah } from '../lib/formulas';
import { NasabahStatus } from '../types';
import { BarChart3, Users, Wallet, TrendingUp, AlertTriangle, Download, CheckCircle2, Calendar } from 'lucide-react';

// Halaman Laporan & Analitik untuk admin.
// 100% read-only: hanya membaca daftar nasabah, tidak menulis/menghapus apa pun ke database.
const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (typeof v?.toDate === 'function') return v.toDate();
  if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const monthKey = (v: any): string => {
  const d = toDate(v);
  if (!d) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

const monthLabel = (key: string): string => {
  if (!key) return 'Tidak diketahui';
  const [y, m] = key.split('-');
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return (bulan[parseInt(m) - 1] || m) + ' ' + y;
};

const LaporanPage: React.FC = () => {
  const { data: nasabahList, loading } = useNasabah();
  const [periode, setPeriode] = useState('all');

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    nasabahList.forEach(n => {
      const k = monthKey((n as any).created_at);
      if (k) set.add(k);
    });
    return Array.from(set).sort().reverse();
  }, [nasabahList]);

  const filtered = useMemo(() => {
    if (periode === 'all') return nasabahList;
    return nasabahList.filter(n => monthKey((n as any).created_at) === periode);
  }, [nasabahList, periode]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const aktif = filtered.filter(n => n.status === NasabahStatus.AKTIF).length;
    const lunas = filtered.filter(n => n.status === NasabahStatus.LUNAS).length;
    const menunggak = filtered.filter(n => n.status === NasabahStatus.MENUNGGAK).length;
    const belumLunas = filtered.filter(n => n.status !== NasabahStatus.LUNAS);
    const piutangAktif = belumLunas.reduce((t, n) => t + (n.sisa_hutang || 0), 0);
    const nilaiPembiayaan = filtered.reduce((t, n) => t + (n.total_hutang || 0), 0);
    const sudahTertagih = filtered.reduce((t, n) => t + ((n.total_hutang || 0) - (n.sisa_hutang || 0)), 0);
    const rasioMenunggak = belumLunas.length > 0 ? Math.round((menunggak / belumLunas.length) * 100) : 0;
    const rataProgress = total > 0 ? Math.round(filtered.reduce((t, n) => t + (n.progress_persen || 0), 0) / total) : 0;
    return { total, aktif, lunas, menunggak, piutangAktif, nilaiPembiayaan, sudahTertagih, rasioMenunggak, rataProgress };
  }, [filtered]);

  const handleExport = () => {
    const ringkasan = [
      { Metrik: 'Periode', Nilai: periode === 'all' ? 'Semua' : monthLabel(periode) },
      { Metrik: 'Total Nasabah', Nilai: stats.total },
      { Metrik: 'Aktif', Nilai: stats.aktif },
      { Metrik: 'Lunas', Nilai: stats.lunas },
      { Metrik: 'Menunggak', Nilai: stats.menunggak },
      { Metrik: 'Rasio Menunggak (%)', Nilai: stats.rasioMenunggak },
      { Metrik: 'Total Piutang Aktif', Nilai: stats.piutangAktif },
      { Metrik: 'Total Nilai Pembiayaan', Nilai: stats.nilaiPembiayaan },
      { Metrik: 'Sudah Tertagih', Nilai: stats.sudahTertagih },
      { Metrik: 'Rata-rata Progress (%)', Nilai: stats.rataProgress },
    ];
    const detail = filtered.map(n => ({
      Nama: n.nama,
      Barang: n.barang,
      Status: n.status,
      'Total Hutang': n.total_hutang,
      'Sisa Cicilan': n.sisa_hutang,
      'Sisa Angsuran': n.sisa_angsuran,
      'Progress (%)': n.progress_persen,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ringkasan), 'Ringkasan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), 'Detail Nasabah');
    const label = periode === 'all' ? 'semua' : periode;
    XLSX.writeFile(wb, 'laporan-mitra-finance-' + label + '.xlsx');
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-400">Memuat laporan...</div>;

  const statusBars = [
    { label: 'Aktif', value: stats.aktif, color: 'bg-primary' },
    { label: 'Lunas', value: stats.lunas, color: 'bg-green-500' },
    { label: 'Menunggak', value: stats.menunggak, color: 'bg-red-500' },
  ];
  const maxBar = Math.max(1, stats.aktif, stats.lunas, stats.menunggak);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan &amp; Analitik</h2>
          <p className="text-gray-500">Angka kunci dan laporan periode</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua Periode</option>
              {monthOptions.map(k => (
                <option key={k} value={k}>{monthLabel(k)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-3xl">
          <div className="p-2 bg-primary/10 text-primary rounded-xl w-fit mb-3"><Wallet className="w-5 h-5" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Piutang Aktif</p>
          <p className="text-xl font-bold mt-1">{formatRupiah(stats.piutangAktif)}</p>
        </div>
        <div className="glass p-5 rounded-3xl">
          <div className="p-2 bg-green-100 text-green-600 rounded-xl w-fit mb-3"><CheckCircle2 className="w-5 h-5" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sudah Tertagih</p>
          <p className="text-xl font-bold mt-1">{formatRupiah(stats.sudahTertagih)}</p>
        </div>
        <div className="glass p-5 rounded-3xl">
          <div className="p-2 bg-accent/10 text-accent rounded-xl w-fit mb-3"><TrendingUp className="w-5 h-5" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nilai Pembiayaan</p>
          <p className="text-xl font-bold mt-1">{formatRupiah(stats.nilaiPembiayaan)}</p>
        </div>
        <div className="glass p-5 rounded-3xl">
          <div className="p-2 bg-red-100 text-red-600 rounded-xl w-fit mb-3"><AlertTriangle className="w-5 h-5" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rasio Menunggak</p>
          <p className="text-xl font-bold mt-1 text-danger">{stats.rasioMenunggak}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass p-6 rounded-3xl">
          <h3 className="font-bold mb-5 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Komposisi Status</h3>
          <div className="space-y-4">
            {statusBars.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-500">{b.label}</span>
                  <span>{b.value} nasabah</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={b.color + ' h-full rounded-full transition-all'} style={ { width: ((b.value / maxBar) * 100) + '%' } } />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl flex flex-col justify-center">
          <h3 className="font-bold mb-5 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent" /> Ringkasan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Total Nasabah</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Rata-rata Progress</p>
              <p className="text-2xl font-bold">{stats.rataProgress}%</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Aktif</p>
              <p className="text-2xl font-bold text-primary">{stats.aktif}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Menunggak</p>
              <p className="text-2xl font-bold text-danger">{stats.menunggak}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPage;
