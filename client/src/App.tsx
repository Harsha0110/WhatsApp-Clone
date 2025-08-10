import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import './App.css';

interface Message {
  _id: string;
  id: string;
  meta_msg_id: string;
  wa_id: string;
  from: string;
  to: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: any;
  video?: any;
  audio?: any;
  document?: any;
  status: 'sent' | 'delivered' | 'read';
  direction: 'inbound' | 'outbound';
  user_name: string;
  user_number: string;
}

interface Conversation {
  _id: string;
  lastMessage: Message;
  messageCount: number;
  user_name: string;
  user_number: string;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Load initial conversations
    fetchConversations();

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        fetchConversations(); // Refresh conversation list
      });

      // Listen for status updates
      socket.on('message-status-updated', ({ messageId, status }) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId || msg.meta_msg_id === messageId 
              ? { ...msg, status } 
              : msg
          )
        );
      });

      return () => {
        socket.off('new-message');
        socket.off('message-status-updated');
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      const data = await response.json();
      setConversations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (wa_id: string) => {
    try {
      const response = await fetch(`/api/messages/conversation/${wa_id}`);
      const data = await response.json();
      setMessages(data);
      
      // Join the chat room for real-time updates
      if (socket) {
        socket.emit('join-chat', wa_id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleChatSelect = (wa_id: string) => {
    setSelectedChat(wa_id);
    fetchMessages(wa_id);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChat || !text.trim()) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wa_id: selectedChat,
          text: text.trim(),
          user_name: 'Demo User',
          user_number: selectedChat
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const selectedConversation = conversations.find(conv => conv._id === selectedChat);

  return (
    <div className="app">
      <div className="whatsapp-container">
        {!isMobile && <Sidebar />}
        {isMobile ? (
          selectedChat ? (
            <ChatWindow
              selectedChat={selectedChat}
              messages={messages}
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
              onBack={() => setSelectedChat(null)}
              showBackButton
            />
          ) : (
            <ChatList
              conversations={conversations}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              loading={loading}
            />
          )
        ) : (
          <>
            <ChatList
              conversations={conversations}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              loading={loading}
            />
            <ChatWindow
              selectedChat={selectedChat}
              messages={messages}
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App; 