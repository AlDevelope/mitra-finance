import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings } from '../types';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      } else {
        // Initialize default settings if not exists
        const defaultSettings: Settings = {
          category_labels: {
            uang_tanah_lama: 'Uang Tanah Lama',
            uang_tanah_baru: 'Uang Tanah Baru'
          },
          custom_categories: []
        };
        setDoc(doc(db, 'settings', 'app'), defaultSettings);
        setSettings(defaultSettings);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching settings:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    try {
      await setDoc(doc(db, 'settings', 'app'), newSettings);
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  };

  return { settings, loading, error, updateSettings };
};
