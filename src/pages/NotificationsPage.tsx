import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification, NotificationType } from '../types';
import { Bell, Trash2, CheckCircle2, AlertCircle, Info, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'));
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

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { is_read: true });
    } catch (err) {
      console.error('Failed to mark read:', err);
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
      case NotificationType.SUCCESS: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case NotificationType.WARNING: return <AlertCircle className="w-5 h-5 text-accent" />;
      case NotificationType.ERROR: return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pemberitahuan</h1>
            <p className="text-gray-500 font-medium">Log kejadian sistem dan pengingat</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Memuat data...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-200" />
             </div>
             <p className="text-gray-400 font-bold">Tidak ada pemberitahuan baru</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
             {notifications.map((notif) => (
               <div 
                 key={notif.id} 
                 className={`p-6 flex gap-6 hover:bg-gray-50/50 transition-colors group ${!notif.is_read ? 'bg-primary/5' : ''}`}
               >
                 <div className="shrink-0 mt-1">
                   {getIcon(notif.type)}
                 </div>
                 <div className="flex-1 space-y-1">
                   <div className="flex justify-between items-start gap-4">
                     <h4 className={`font-bold text-gray-900 ${!notif.is_read ? 'text-primary' : ''}`}>{notif.title}</h4>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         {format(notif.created_at?.toDate() || new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}
                       </span>
                     </div>
                   </div>
                   <p className="text-gray-600 text-sm leading-relaxed">{notif.message}</p>
                   <div className="pt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     {!notif.is_read && (
                       <button 
                         onClick={() => markAsRead(notif.id)}
                         className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                       >
                         <Check className="w-3 h-3" /> Tandai Dibaca
                       </button>
                     )}
                     <button 
                       onClick={() => deleteNotification(notif.id)}
                       className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 hover:text-red-600"
                     >
                       <Trash2 className="w-3 h-3" /> Hapus
                     </button>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
