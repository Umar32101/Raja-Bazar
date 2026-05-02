import React, { createContext, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const listenForMessages = (user) => {
    if (!user) return null;

    // Listen for updates to any chat where the current user is a participant
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          // Trigger a toast when any chat is updated.
          window.showToast(`New message in a chat!`, 'info');
        }
      });
    });
  };

  useEffect(() => {
    let unsubscribe = null;
    const handleAuthStateChanged = (user) => {
      if (unsubscribe) unsubscribe();
      unsubscribe = listenForMessages(user);
    };

    const authUnsubscribe = auth.onAuthStateChanged(handleAuthStateChanged);
    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
