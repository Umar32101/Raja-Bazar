import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useChat } from './useChat';
import '../styles/global.css';

const OpenChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();
  const { sendGlobalMessage, subscribeToGlobalChat, getChatId } = useChat();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalChat((msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!auth.currentUser) {
      window.showToast('Please sign in to chat', 'error');
      navigate('/login');
      return;
    }

    try {
      await sendGlobalMessage(auth.currentUser.uid, auth.currentUser.displayName || 'Anonymous', newMessage);
      setNewMessage('');
    } catch (error) {
      window.showToast('Error sending message', 'error');
    }
  };

  const startPrivateChat = (senderId) => {
    if (!auth.currentUser) {
      window.showToast('Please sign in to chat', 'error');
      navigate('/login');
      return;
    }
    const chatId = getChatId(auth.currentUser.uid, senderId);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="open-chat-container">
      <div className="open-chat-header">
        <h3>Community Chat</h3>
        <span className="online-status">● Live</span>
      </div>
      <div className="open-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="open-chat-msg">
            <div className="msg-user-info">
              <span className="msg-user-name">{msg.senderName}</span>
              <button
                className="msg-chat-btn"
                onClick={() => startPrivateChat(msg.senderId)}
              >
                Chat
              </button>
            </div>
            <div className="msg-content">{msg.text}</div>
            <div className="msg-time">{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="open-chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Say something to the community..."
        />
        <button type="submit" disabled={!newMessage.trim()}>Send</button>
      </form>

      <style>{`
        .open-chat-container {
          margin: 2rem auto;
          max-width: 800px;
          background: #111;
          border: 2px solid #333;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          height: 500px;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
        }
        .open-chat-header {
          padding: 1rem;
          background: #1a1a1a;
          border-bottom: 2px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 12px 12px 0 0;
        }
        .online-status {
          color: #00ff00;
          font-size: 0.8rem;
        }
        .open-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .open-chat-msg {
          background: #222;
          padding: 0.8rem;
          border-radius: 8px;
          border-left: 4px solid #005cff;
        }
        .msg-user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .msg-user-name {
          font-weight: bold;
          color: #aaa;
        }
        .msg-chat-btn {
          background: #005cff;
          color: white;
          border: none;
          padding: 2px 8px;
          font-size: 0.7rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .msg-content {
          font-size: 1rem;
          line-height: 1.4;
        }
        .msg-time {
          font-size: 0.7rem;
          opacity: 0.5;
          text-align: right;
          margin-top: 0.3rem;
        }
        .open-chat-input {
          display: flex;
          padding: 1rem;
          background: #1a1a1a;
          border-top: 2px solid #333;
          gap: 0.5rem;
          border-radius: 0 0 12px 12px;
        }
        .open-chat-input input {
          flex: 1;
          background: #000;
          border: 1px solid #444;
          color: white;
          padding: 0.8rem;
          border-radius: 4px;
          outline: none;
        }
        .open-chat-input button {
          background: #005cff;
          color: white;
          border: none;
          padding: 0 1.5rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .open-chat-input button:disabled {
          background: #444;
        }
      `}</style>
    </div>
  );
};

export default OpenChat;
