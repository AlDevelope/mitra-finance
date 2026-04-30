import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { formatRupiah, formatDisplayDate } from '../lib/formulas';
import { Nasabah, Angsuran } from '../types';
import { Building2, CheckCircle2, Share2, MessageCircle, X as XIcon } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { generateWhatsAppMessage } from '../lib/formulas';

interface NasabahShareCardProps {
  nasabah: Nasabah;
  history?: Angsuran[];
  onClose: () => void;
}

export const NasabahShareCard: React.FC<NasabahShareCardProps> = ({ nasabah, history = [], onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  
  // Theme state: default to dark if document has 'dark' class, but let's make it smarter
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    checkTheme();
  }, []);

  const shareToWA = async () => {
    if (cardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      
      // Convert dataUrl to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Status-${nasabah.nama}.png`, { type: 'image/png' });

      const text = `Halo ${nasabah.nama}, berikut adalah update status angsuran Anda di Mitra Finance 99.`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Status Angsuran',
          text: text
        });
      } else {
        // Fallback: Open WA with text and let them attach the downloaded image
        const waLink = generateWhatsAppMessage(nasabah, nasabah.angsuran_terbayar);
        window.open(waLink, '_blank');
        
        // Also trigger download as fallback for the image
        const link = document.createElement('a');
        link.download = `Status-MitraFinance-${nasabah.nama.replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
        
        alert('Browser Anda tidak mendukung share gambar langsung. Gambar telah diunduh, silakan lampirkan di WhatsApp.');
      }
    } catch (err) {
      console.error('Failed to share/generate image', err);
      alert('Gagal memproses gambar untuk dibagikan.');
    }
  };

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
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} 
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-danger active:scale-90"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-200/50">
          {/* The Card to Capture */}
          <div ref={cardRef} className={`${isDarkMode ? 'bg-[#0A1628]' : 'bg-white'} p-10 ${isDarkMode ? 'text-white' : 'text-gray-900'} w-[450px] mx-auto rounded-[48px] flex flex-col relative overflow-hidden shadow-2xl`}>
            {/* Subtle Background Elements */}
            <div className={`absolute top-[-50px] right-[-100px] w-80 h-80 ${isDarkMode ? 'bg-primary/10' : 'bg-primary/5'} rounded-full blur-[100px]`} />
            <div className={`absolute bottom-[-50px] left-[-100px] w-80 h-80 ${isDarkMode ? 'bg-accent/10' : 'bg-accent/5'} rounded-full blur-[100px]`} />
            
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
                  <h1 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-primary'} leading-none`}>Mitra Finance 99</h1>
                  <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium italic mt-1.5`}>Berkembang, Bertumbuh, Berinovasi</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 ${nasabah.status === 'LUNAS' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-primary/20 text-primary border-primary/30'} rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm`}>
                {nasabah.status}
              </div>
            </div>

            {/* Main Info Box */}
            <div className={`${isDarkMode ? 'bg-[#15233D]' : 'bg-gray-50'} rounded-[40px] p-8 relative z-10 border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} shadow-xl mb-6`}>
               <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-4 bg-accent rounded-full" />
                    <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight uppercase leading-none`}>{nasabah.nama}</h2>
                  </div>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-[0.2em] mt-2`}>{nasabah.barang}</p>
               </div>

               <div className="flex items-center gap-8 mb-8">
                  {/* Gauge */}
                  <div className="relative w-32 h-32 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={isDarkMode ? "#1F2937" : "#E5E7EB"}
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={isDarkMode ? "#F43F5E" : "#F43F5E"}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-1">
                      <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-none`}>{lunasPercentage}%</span>
                      <span className={`text-[10px] font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mt-1`}>LUNAS</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-1.5`}>Sisa Hutang</p>
                    <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-danger'} leading-none tracking-tighter`}>{formatRupiah(nasabah.sisa_hutang)}</p>
                  </div>
               </div>
 
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`${isDarkMode ? 'bg-[#0A1628]/50' : 'bg-white'} p-5 rounded-3xl border border-white/5`}>
                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest mb-1`}>MGU Lagi</p>
                    <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-widest leading-none`}>{sisaMinggu}</p>
                  </div>
                  <div className={`${isDarkMode ? 'bg-[#0A1628]/50' : 'bg-white'} p-5 rounded-3xl border border-white/5`}>
                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest mb-1`}>Per MGU</p>
                    <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tighter leading-none`}>{formatRupiah(nasabah.rp_per_angsuran)}</p>
                  </div>
               </div>

               <div className={`${isDarkMode ? 'bg-[#0A1628]/30' : 'bg-white'} px-6 py-4 rounded-2xl border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} flex justify-between`}>
                  <div className="text-center">
                    <p className={`text-[9px] font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest`}>Sudah Bayar</p>
                    <p className="text-lg font-black text-green-500 mt-1">{angsuranTerbayar} <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-bold tracking-normal`}>/ {totalAngsuran}</span></p>
                  </div>
                  <div className={`w-px ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`} />
                  <div className="text-center">
                    <p className={`text-[9px] font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest`}>Belum Bayar</p>
                    <p className="text-lg font-black text-accent mt-1">{sisaMinggu} <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-bold tracking-normal`}>MGU</span></p>
                  </div>
               </div>
            </div>

            {/* Timeline */}
            <div className="mb-0 relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                <p className={`text-[10px] font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-[0.2em]`}>Timeline Angsuran</p>
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
                          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-6 h-6 text-white" /> : <div className={`w-2 h-2 rounded-full ${isNext ? 'bg-accent' : isDarkMode ? 'bg-white/20' : 'bg-gray-300'}`} />}
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <span className={`text-[9px] font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase leading-none`}>MGU {stepNum}</span>
                          {payDate && (
                            <span className={`text-[7px] font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'} mt-1.5 leading-none ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'} px-1.5 py-1 rounded-sm whitespace-nowrap shadow-sm`}>
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
            <div className={`mt-12 text-center border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'} pt-8 relative z-10`}>
              <p className={`text-[10px] ${isDarkMode ? 'text-white' : 'text-primary'} font-black tracking-widest uppercase`}>Mitra Finance 99</p>
              <p className={`text-[8px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2 uppercase tracking-[0.4em]`}>Official Digital Statement</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-8 bg-white border-t shrink-0 flex flex-col gap-3">
          <button 
            onClick={shareToWA}
            className="w-full bg-green-500 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-green-500/30"
          >
            <MessageCircle className="w-6 h-6" />
            Bagikan ke WhatsApp
          </button>
          <button 
            onClick={downloadImage}
            className="w-full bg-gray-100 text-gray-500 py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Simpan Gambar ke Galeri
          </button>
        </div>
      </div>
    </div>
  );
};
