import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { formatRupiah, formatDisplayDate } from '../lib/formulas';
import { Nasabah, Angsuran } from '../types';
import { Building2, CheckCircle2, Share2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface NasabahShareCardProps {
  nasabah: Nasabah;
  history?: Angsuran[];
  onClose: () => void;
}

export const NasabahShareCard: React.FC<NasabahShareCardProps> = ({ nasabah, history = [], onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  const downloadImage = async () => {
    if (cardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Status-MitraFinance-${nasabah.nama.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const lunasPercentage = nasabah.progress_persen || 0;
  const sisaMinggu = nasabah.sisa_angsuran || 0;
  const angsuranTerbayar = nasabah.angsuran_terbayar || 0;
  const totalAngsuran = nasabah.jumlah_angsuran || 0;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (lunasPercentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Preview Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight">Status Cicilan</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Preview Gambar Bagikan</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors text-2xl font-bold leading-none text-gray-400">×</button>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-200/50">
          {/* The Card to Capture */}
          <div ref={cardRef} className="bg-[#0A1628] p-10 text-white w-[450px] mx-auto rounded-[48px] flex flex-col relative overflow-hidden shadow-2xl">
            {/* Subtle Background Elements */}
            <div className="absolute top-[-50px] right-[-100px] w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-50px] left-[-100px] w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
            
            {/* Logo & Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-2xl" />
                ) : (
                  <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain rounded-2xl" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.querySelector('.share-logo-placeholder')?.classList.remove('hidden');
                    }} />
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 share-logo-placeholder hidden">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-white leading-none">Mitra Finance 99</h1>
                  <p className="text-[10px] text-gray-400 font-medium italic mt-1.5">Berkembang, Bertumbuh, Berinovasi</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 ${nasabah.status === 'LUNAS' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-primary/20 text-primary border-primary/30'} rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm`}>
                {nasabah.status}
              </div>
            </div>

            {/* Main Info Box */}
            <div className="bg-[#15233D] rounded-[40px] p-8 relative z-10 border border-white/5 shadow-xl mb-6">
               <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-4 bg-accent rounded-full" />
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">{nasabah.nama}</h2>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">{nasabah.barang}</p>
               </div>

               <div className="flex items-center gap-8 mb-8">
                  {/* Gauge */}
                  <div className="relative w-32 h-32 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#1F2937"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#F43F5E"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-1">
                      <span className="text-3xl font-black text-white leading-none">{lunasPercentage}%</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">LUNAS</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sisa Hutang</p>
                    <p className="text-3xl font-black text-white leading-none tracking-tighter">{formatRupiah(nasabah.sisa_hutang)}</p>
                  </div>
               </div>
 
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#0A1628]/50 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">MGU Lagi</p>
                    <p className="text-2xl font-black text-white tracking-widest leading-none">{sisaMinggu}</p>
                  </div>
                  <div className="bg-[#0A1628]/50 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Per MGU</p>
                    <p className="text-xl font-black text-white tracking-tighter leading-none">{formatRupiah(nasabah.rp_per_angsuran)}</p>
                  </div>
               </div>

               <div className="bg-[#0A1628]/30 px-6 py-4 rounded-2xl border border-white/5 flex justify-between">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sudah Bayar</p>
                    <p className="text-lg font-black text-green-500 mt-1">{angsuranTerbayar} <span className="text-xs text-gray-400 font-bold tracking-normal">/ {totalAngsuran}</span></p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Belum Bayar</p>
                    <p className="text-lg font-black text-accent mt-1">{sisaMinggu} <span className="text-xs text-gray-400 font-bold tracking-normal">MGU</span></p>
                  </div>
               </div>
            </div>

            {/* Timeline */}
            <div className="mb-0 relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timeline Angsuran</p>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-6">
                 {Array.from({ length: totalAngsuran }).map((_, i) => {
                    const stepNum = i + 1;
                    const isPaid = stepNum <= angsuranTerbayar;
                    const isNext = stepNum === angsuranTerbayar + 1;
                    
                    const payment = history.find(h => h.angsuran_ke === stepNum);
                    const payDate = payment ? payment.tanggal_bayar : null;

                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isPaid ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/20' : 
                          isNext ? 'bg-accent/20 border-accent animate-pulse' : 
                          'bg-white/5 border-white/10'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-6 h-6 text-white" /> : <div className={`w-2 h-2 rounded-full ${isNext ? 'bg-accent' : 'bg-white/20'}`} />}
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase leading-none">MGU {stepNum}</span>
                          {payDate && (
                            <span className="text-[7px] font-bold text-green-400 mt-1.5 leading-none bg-green-500/10 px-1.5 py-1 rounded-sm whitespace-nowrap shadow-sm">
                              {formatDisplayDate(payDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                 })}
              </div>
            </div>

            {/* Footer Copy */}
            <div className="mt-12 text-center border-t border-white/5 pt-8 relative z-10">
              <p className="text-[10px] text-white font-black tracking-widest uppercase">Mitra Finance 99</p>
              <p className="text-[8px] text-gray-500 mt-2 uppercase tracking-[0.4em]">Official Digital Statement</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 bg-white border-t shrink-0">
          <button 
            onClick={downloadImage}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30"
          >
            <Share2 className="w-5 h-5" />
            Unduh Gambar Angsuran
          </button>
        </div>
      </div>
    </div>
  );
};
