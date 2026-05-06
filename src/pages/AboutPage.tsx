import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, PieChart, Users, Smartphone, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const AboutPage: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: "Manajemen Nasabah",
      description: "Kelola data nasabah, riwayat cicilan, dan sisa angsuran dengan mudah dan terstruktur.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: PieChart,
      title: "Laporan Keuangan",
      description: "Pantau arus kas, laba, estimasi sisa uang, serta status nilai properti secara real-time.",
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      icon: ShieldCheck,
      title: "Keamanan Data",
      description: "Data tersimpan secara aman di sistem cloud dengan akses otentikasi terenkripsi.",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: Zap,
      title: "Kinerja Cepat",
      description: "Dibangun dengan teknologi terkini memastikan pengalaman penggunaan yang responsif.",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 selection:bg-accent/30 selection:text-accent font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Login
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black">M</div>
            <span className="font-bold text-lg tracking-tight">Mitra Finance 99</span>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 max-w-6xl mx-auto space-y-24">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent/20 text-accent font-bold text-xs uppercase tracking-widest mb-4"
          >
            <Smartphone className="w-4 h-4" />
            Sistem Digital
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight"
          >
            Sistem Informasi <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Angsuran & Keuangan</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Mitra Finance 99 adalah platform inovatif untuk mengelola data angsuran nasabah, piutang, dan pencatatan kas. Solusi terbaik untuk bisnis pembiayaan yang lebih modern dan transparan.
          </motion.p>
        </section>

        {/* Feature Image & Intro */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[3rem] blur-2xl -z-10" />
            <img 
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80" 
              alt="Dashboard Finance" 
              className="rounded-[2.5rem] shadow-2xl object-cover aspect-[4/3] border border-white/10"
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">Mempermudah Segalanya.</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Selamat tinggal pada pencatatan manual di buku! Dengan sistem kami, Anda bisa mengetahui langsung siapa saja yang sudah lunas, sisa tagihan berjalan, dan total profit/estimasi uang secara real-time. 
            </p>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Didesain secara khusus agar ramah pengguna, siapa saja dapat menggunakannya tanpa harus memahami teknis pembukuan yang rumit. Semuanya tersaji pada satu visual yang elegan.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1">
              Masuk Sekarang
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black tracking-tight">Fitur Unggulan</h2>
            <p className="text-gray-500 font-medium">Kenapa memilih Mitra Finance 99?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-8 rounded-3xl space-y-4 hover:-translate-y-2 transition-transform duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feature.bg} ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-8 text-center text-gray-500 font-medium text-sm">
        <p>&copy; {new Date().getFullYear()} Mitra Finance 99. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
