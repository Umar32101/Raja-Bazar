import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export const useChat = () => {
  /**
   * Generates a unique, deterministic ID for a 1-on-1 chat between two users.
   * @param {string} uid1
   * @param {string} uid2
   * @returns {string}
   */
  const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  /**
   * Sends a message in a private 1-on-1 chat.
   * @param {string} chatId
   * @param {string} senderId
   * @param {string} text
   */
  const sendPrivateMessage = async (chatId, senderId, text) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);

      await addDoc(messagesRef, {
        text,
        senderId,
        timestamp: serverTimestamp(),
      });

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending private message:", error);
      throw error;
    }
  };

  /**
   * Sends a message to the global community chat.
   * @param {string} senderId
   * @param {string} senderName
   * @param {string} text
   */
  const sendGlobalMessage = async (senderId, senderName, text) => {
    try {
      const globalChatRef = collection(db, 'global_chat');
      await addDoc(globalChatRef, {
        text,
        senderId,
        senderName,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending global message:", error);
      throw error;
    }
  };

  /**
   * Sets up a real-time listener for messages in a private chat.
   * @param {string} chatId
   * @param {Function} callback - Callback function to update state with messages
   * @returns {Function} Unsubscribe function
   */
  const subscribeToPrivateChat = (chatId, callback) => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  };

  /**
   * Sets up a real-time listener for the global community chat.
   * @param {Function} callback - Callback function to update state with messages
   * @returns {Function} Unsubscribe function
   */
  const subscribeToGlobalChat = (callback) => {
    const q = query(
      collection(db, 'global_chat'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  };

  return {
    getChatId,
    sendPrivateMessage,
    sendGlobalMessage,
    subscribeToPrivateChat,
    subscribeToGlobalChat
  };
};
