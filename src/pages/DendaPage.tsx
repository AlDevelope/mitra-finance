import React, { useMemo, useState } from 'react';
import { useNasabah } from '../hooks/useNasabah';
import { formatRupiah } from '../lib/formulas';
import { Percent, Calculator, AlertTriangle } from 'lucide-react';

// Kalkulator Denda Keterlambatan.
// 100% read-only: hanya membaca daftar nasabah untuk autofill nominal.
// Tidak menyimpan apa pun ke database (murni alat hitung di layar).
type Mode = 'persen_sisa' | 'nominal_minggu' | 'flat';

const DendaPage: React.FC = () => {
  const { data: nasabahList } = useNasabah();
  const [mode, setMode] = useState<Mode>('persen_sisa');
  const [sisa, setSisa] = useState<number>(0);
  const [mingguTelat, setMingguTelat] = useState<number>(1);
  const [persen, setPersen] = useState<number>(1);
  const [nominal, setNominal] = useState<number>(10000);
  const [selectedId, setSelectedId] = useState<string>('');

  const handlePickNasabah = (id: string) => {
    setSelectedId(id);
    const n = nasabahList.find(x => x.id === id);
    if (n) setSisa(n.sisa_hutang || 0);
  };

  const denda = useMemo(() => {
    if (mode === 'persen_sisa') return Math.round((persen / 100) * sisa * mingguTelat);
    if (mode === 'nominal_minggu') return Math.round(nominal * mingguTelat);
    return Math.round(nominal);
  }, [mode, sisa, mingguTelat, persen, nominal]);

  const totalTagihan = sisa + denda;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Kalkulator Denda</h2>
        <p className="text-gray-500">Hitung perkiraan denda keterlambatan. Tidak tersimpan ke database.</p>
      </header>

      <div className="glass p-6 rounded-3xl space-y-5">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ambil dari Nasabah (opsional)</label>
          <select
            value={selectedId}
            onChange={(e) => handlePickNasabah(e.target.value)}
            className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Pilih nasabah untuk isi otomatis sisa cicilan --</option>
            {nasabahList.map(n => (
              <option key={n.id} value={n.id}>{n.nama} - {formatRupiah(n.sisa_hutang || 0)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metode Denda</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setMode('persen_sisa')}
              className={'px-3 py-2.5 rounded-xl text-xs font-bold transition-all ' + (mode === 'persen_sisa' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500')}
            >
              % sisa / minggu
            </button>
            <button
              onClick={() => setMode('nominal_minggu')}
              className={'px-3 py-2.5 rounded-xl text-xs font-bold transition-all ' + (mode === 'nominal_minggu' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500')}
            >
              Nominal / minggu
            </button>
            <button
              onClick={() => setMode('flat')}
              className={'px-3 py-2.5 rounded-xl text-xs font-bold transition-all ' + (mode === 'flat' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500')}
            >
              Flat (sekali)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sisa Cicilan (Rp)</label>
            <input
              type="number"
              value={sisa}
              onChange={(e) => setSisa(Number(e.target.value) || 0)}
              className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {mode !== 'flat' && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Minggu Telat</label>
              <input
                type="number"
                value={mingguTelat}
                onChange={(e) => setMingguTelat(Number(e.target.value) || 0)}
                className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
          {mode === 'persen_sisa' && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Persen / minggu (%)</label>
              <input
                type="number"
                value={persen}
                onChange={(e) => setPersen(Number(e.target.value) || 0)}
                className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
          {(mode === 'nominal_minggu' || mode === 'flat') && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal Denda (Rp)</label>
              <input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(Number(e.target.value) || 0)}
                className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-2 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-xs font-bold uppercase tracking-widest">Denda</p>
          </div>
          <p className="text-3xl font-bold text-danger">{formatRupiah(denda)}</p>
        </div>
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Calculator className="w-5 h-5" />
            <p className="text-xs font-bold uppercase tracking-widest">Total (Sisa + Denda)</p>
          </div>
          <p className="text-3xl font-bold">{formatRupiah(totalTagihan)}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-400 px-2">
        <Percent className="w-4 h-4 mt-0.5 shrink-0" />
        <p>Alat ini hanya menghitung di layar dan tidak menyimpan/mengubah data nasabah apa pun.</p>
      </div>
    </div>
  );
};

export default DendaPage;
