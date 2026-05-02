import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { NotificationType } from '../types';

export const logNotification = async (
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      type,
      is_read: false,
      created_at: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log notification:', err);
  }
};
