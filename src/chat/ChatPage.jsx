import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useChat } from './useChat';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import '../styles/global.css';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = auth.currentUser ? { currentUser: auth.currentUser } : {};
  // Note: In a real app, we'd use a useAuth hook here.
  // For now, we'll rely on auth.currentUser.

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { sendPrivateMessage, subscribeToPrivateChat } = useChat();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const unsubscribe = subscribeToPrivateChat(chatId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendPrivateMessage(chatId, auth.currentUser.uid, newMessage);
      setNewMessage('');
    } catch (error) {
      window.showToast('Error sending message', 'error');
    }
  };

  const handleNotifyAdmin = async () => {
    try {
      // The admin deal logic: create a notification in deal_notifications
      // We need the other participant's ID.
      const participants = chatId.split('_');
      const otherUserId = participants.find(id => id !== auth.currentUser.uid);

      await addDoc(collection(db, 'deal_notifications'), {
        buyerId: auth.currentUser.uid,
        sellerId: otherUserId,
        chatId: chatId,
        dealType: 'admin',
        timestamp: new Date(),
        status: 'pending'
      });

      window.showToast('Admin has been notified about this deal!', 'success');
    } catch (error) {
      console.error(error);
      window.showToast('Error notifying admin', 'error');
    }
  };

  if (!auth.currentUser) return null;

  return (
    <div className="chat-page-container">
      <div className="chat-header">
        <button onClick={() => navigate(-1)} className="back-button">← Back</button>
        <h2>Private Chat</h2>
        <button onClick={handleNotifyAdmin} className="notify-admin-button">Notify Admin</button>
      </div>

      <div className="chat-messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}>
            <div className="message-text">{msg.text}</div>
            <div className="message-time">
              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!newMessage.trim()}>Send</button>
      </form>

      <style>{`
        .chat-page-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #0a0a0a;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
        }
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #1a1a1a;
          border-bottom: 2px solid #333;
        }
        .back-button, .notify-admin-button {
          background: #333;
          color: #fff;
          border: 1px solid #555;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 4px;
        }
        .notify-admin-button {
          background: #b10000;
          border-color: #ff0000;
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message-bubble {
          max-width: 70%;
          padding: 0.8rem;
          border-radius: 12px;
          position: relative;
        }
        .message-bubble.sent {
          align-self: flex-end;
          background: #005cff;
          color: white;
          border-bottom-right-radius: 2px;
        }
        .message-bubble.received {
          align-self: flex-start;
          background: #333;
          color: white;
          border-bottom-left-radius: 2px;
        }
        .message-text {
          word-break: break-word;
        }
        .message-time {
          font-size: 0.7rem;
          opacity: 0.7;
          text-align: right;
          margin-top: 0.3rem;
        }
        .chat-input-area {
          display: flex;
          padding: 1rem;
          background: #1a1a1a;
          border-top: 2px solid #333;
          gap: 0.5rem;
        }
        .chat-input-area input {
          flex: 1;
          background: #000;
          border: 1px solid #444;
          color: white;
          padding: 0.8rem;
          border-radius: 4px;
          outline: none;
        }
        .chat-input-area button {
          background: #005cff;
          color: white;
          border: none;
          padding: 0 1.5rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .chat-input-area button:disabled {
          background: #444;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
