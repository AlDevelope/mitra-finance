import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification, NotificationType } from '../types';
import { Bell, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Info, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { AdminConfirmModal } from '../components/AdminConfirmModal';
import { logNotification } from '../lib/notifications';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const notif of unread) {
      await updateDoc(doc(db, 'notifications', notif.id), { is_read: true });
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, 'notifications'));
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      setShowDeleteAllModal(false);
      alert('Seluruh pemberitahuan telah dihapus.');
    } catch (err: any) {
      alert(`Gagal menghapus pemberitahuan: ${err.message}`);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS: 
        return <div className="p-3 bg-green-500/10 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>;
      case NotificationType.WARNING: 
        return <div className="p-3 bg-amber-500/10 rounded-2xl"><AlertCircle className="w-6 h-6 text-amber-500" /></div>;
      case NotificationType.ERROR: 
        return <div className="p-3 bg-red-500/10 rounded-2xl"><AlertTriangle className="w-6 h-6 text-red-500" /></div>;
      default: 
        return <div className="p-3 bg-primary/10 rounded-2xl"><Info className="w-6 h-6 text-primary" /></div>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <AdminConfirmModal 
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={deleteAllNotifications}
        title="Hapus Seluruh Pemberitahuan"
        message="Tindakan ini akan menghapus semua riwayat pemberitahuan secara permanen."
      />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-[30px] flex items-center justify-center shadow-inner">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Pemberitahuan</h1>
            <p className="text-gray-500 font-medium italic">Log kejadian sistem & aktivitas keuangan</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {notifications.length > 0 && (
            <button 
              onClick={() => setShowDeleteAllModal(true)}
              className="px-6 py-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Hapus Semua
            </button>
          )}
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={markAllAsRead}
              className="px-6 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Tandai Semua Dibaca
            </button>
          )}
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="glass p-20 rounded-[40px] flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Sinkronisasi data...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass p-20 rounded-[40px] flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[40px] flex items-center justify-center mb-6">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-700" />
             </div>
             <h3 className="text-xl font-bold text-gray-400">Belum Ada Aktivitas</h3>
             <p className="text-gray-500 mt-2 max-w-xs">Semua log aktivitas akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={notif.id} 
                className={cn(
                  "glass p-4 rounded-3xl flex items-start gap-4 group transition-all duration-300 border-l-4",
                  !notif.is_read ? "border-l-primary bg-primary/5" : "border-l-transparent",
                  notif.type === NotificationType.SUCCESS && !notif.is_read ? "border-l-success" : "",
                  notif.type === NotificationType.ERROR && !notif.is_read ? "border-l-danger" : ""
                )}
              >
                <div className="shrink-0 scale-75 md:scale-100 origin-top-left">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className={cn(
                        "font-black text-sm md:text-lg tracking-tight truncate",
                        !notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                      )}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-tighter bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          {format(notif.created_at?.toDate() || new Date(), 'dd MMM HH:mm', { locale: id })}
                        </span>
                        {!notif.is_read && (
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                  <p className={cn(
                    "text-xs md:text-sm leading-relaxed mt-2 line-clamp-2 md:line-clamp-none",
                    !notif.is_read ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {notif.message}
                  </p>
                  
                  {!notif.is_read && (
                    <div className="pt-2">
                      <button 
                        onClick={() => updateDoc(doc(db, 'notifications', notif.id), { is_read: true })}
                        className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline group-hover:translate-x-1 transition-transform"
                      >
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3" /> Tandai Selesai
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
