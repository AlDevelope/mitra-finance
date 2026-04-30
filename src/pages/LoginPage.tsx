import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, Eye, EyeOff, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { Role } from '../types';
import { seedDatabase } from '../lib/seed';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLoginSuccess = async (user: any) => {
    const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
    if (!profileSnap.exists()) {
      await setDoc(doc(db, 'profiles', user.uid), {
        full_name: user.displayName || 'Admin Mitra Finance',
        role: Role.ADMIN, // Default to admin for first login in this demo
        created_at: new Date().toISOString()
      });
    }
    
    navigate('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Try standard Firebase Auth first (for admins/real users)
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleLoginSuccess(userCredential.user);
        return;
      } catch (err: any) {
        // If standard auth fails, check for custom profile account (Imported Nasabah)
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
           // Fallback to custom profile check
           const { collection, getDocs, query, where } = await import('firebase/firestore');
           const profQuery = query(collection(db, 'profiles'), where('email', '==', email), where('password', '==', password));
           const profSnap = await getDocs(profQuery);
           
           if (!profSnap.empty) {
              const profData = profSnap.docs[0].data();
              // For security, we'll sign in anonymously to have a valid session
              if (!auth.currentUser) {
                await signInAnonymously(auth);
              }
              
              if (profData.role === Role.CUSTOMER && profData.nasabah_id) {
                // Link official UID to this profile data for security rules
                const user = auth.currentUser;
                if (user) {
                  const { setDoc, doc } = await import('firebase/firestore');
                  await setDoc(doc(db, 'profiles', user.uid), {
                    ...profData,
                    is_session_linked: true
                  });
                }
                navigate(`/portal/${profData.nasabah_id}`);
              } else {
                navigate('/dashboard');
              }
              return;
           }
        }
        throw err; // Re-throw if no custom profile found either
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Metode login ini saat ini tidak diizinkan. Silahkan hubungi administrator.');
      } else if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        setError('Akun tidak ditemukan. Periksa kembali email yang Anda masukkan.');
      } else if (err.code === 'auth/wrong-password' || err.message?.includes('wrong-password')) {
        setError('Password salah. Periksa kembali email dan password Anda.');
      } else {
        setError('Gagal masuk. Silahkan coba lagi atau hubungi IT support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleLoginSuccess(result.user);
    } catch (err: any) {
      console.error(err);
      setError('Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0A1628] via-primary to-[#0A1628] animate-gradient bg-[length:400%_400%]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-[420px] p-8 rounded-[40px] shadow-glass flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mb-6 shadow-lg rotate-3">
          <Building2 className="w-10 h-10 text-white -rotate-3" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">Mitra Finance 99</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium italic transition-colors">Berkembang, Bertumbuh, Berinovasi</p>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-gray-700 py-3.5 rounded-2xl font-bold border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all mb-6 active:scale-95 shadow-sm"
        >
          <Chrome className="w-5 h-5 text-primary" />
          Masuk dengan Google
        </button>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atau Email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form className="w-full space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                required
                placeholder="admin@mitrafinance99.com"
                className="w-full pl-12 pr-4 py-4 bg-white/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-white/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-danger text-[10px] font-bold text-center px-4 bg-danger/5 py-3 rounded-xl leading-relaxed">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
