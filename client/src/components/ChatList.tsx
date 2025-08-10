import React from 'react';
import { format } from 'date-fns';
import { FaUser, FaCheck, FaCheckDouble } from 'react-icons/fa';
import './ChatList.css';

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

interface ChatListProps {
  conversations: Conversation[];
  selectedChat: string | null;
  onChatSelect: (wa_id: string) => void;
  loading: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedChat,
  onChatSelect,
  loading
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <FaCheck className="status-icon sent" />;
      case 'delivered':
        return <FaCheckDouble className="status-icon delivered" />;
      case 'read':
        return <FaCheckDouble className="status-icon read" />;
      default:
        return null;
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Chats</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <div className="header-actions">
          <button className="new-chat-btn">New Chat</button>
        </div>
      </div>
      
      <div className="chat-list-content">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <FaUser className="empty-icon" />
            <p>No conversations yet</p>
            <small>Start a conversation to see it here</small>
          </div>
        ) : (
          conversations.map((conversation) => {
            const lastMessage = conversation.lastMessage;
            const isSelected = selectedChat === conversation._id;
            
            return (
              <div
                key={conversation._id}
                className={`chat-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onChatSelect(conversation._id)}
              >
                <div className="chat-avatar">
                  <FaUser />
                </div>
                
                <div className="chat-info">
                  <div className="chat-header">
                    <h3 className="chat-name">
                      {conversation.user_name || conversation.user_number}
                    </h3>
                    <span className="chat-time">
                      {formatLastMessageTime(lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  <div className="chat-preview">
                    <div className="last-message">
                      {lastMessage.direction === 'outbound' && getStatusIcon(lastMessage.status)}
                      <span className="message-text">
                        {lastMessage.type === 'text' && lastMessage.text
                          ? truncateText(lastMessage.text.body)
                          : `[${lastMessage.type}]`
                        }
                      </span>
                    </div>
                    
                    {conversation.messageCount > 1 && (
                      <div className="message-count">
                        {conversation.messageCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList; 