import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FaUser, FaCheck, FaCheckDouble, FaPaperPlane, FaArrowLeft, FaMicrophone, FaVideo, FaPhone, FaEllipsisV, FaPaperclip, FaCamera, FaSmile } from 'react-icons/fa';
import './ChatWindow.css';

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

interface ChatWindowProps {
  selectedChat: string | null;
  messages: Message[];
  conversation: Conversation | undefined;
  onSendMessage: (text: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  conversation,
  onSendMessage,
  onBack,
  showBackButton
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChat]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(target)) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'text':
        return message.text?.body || '';
      case 'audio':
        return '[Audio]';
      case 'image':
        return '[Image]';
      case 'video':
        return '[Video]';
      case 'document':
        return '[Document]';
      default:
        return '[Message]';
    }
  };

  // Audio recording controls (local-only persistence)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        // Save locally in localStorage (store metadata + blob URL)
        const key = `audio-${Date.now()}`;
        const existing = JSON.parse(localStorage.getItem('local-audios') || '[]');
        existing.push({ key, url, createdAt: Date.now() });
        localStorage.setItem('local-audios', JSON.stringify(existing));
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Mic permission / recording error', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setIsEmojiOpen(false);
    inputRef.current?.focus();
  };

  if (!selectedChat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <FaUser className="empty-icon" />
          <h2>Welcome to WhatsApp Clone</h2>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        {showBackButton && (
          <button className="back-btn" onClick={onBack} aria-label="Back to chat list">
            <FaArrowLeft />
          </button>
        )}
        <div className="chat-user-info">
          <div className="user-avatar">
            <FaUser />
          </div>
          <div className="user-details">
            <h3>{conversation?.user_name || conversation?.user_number || selectedChat}</h3>
            <span className="user-status">online</span>
          </div>
        </div>
        <div className="chat-actions" ref={menuRef}>
          <button className="action-btn" aria-label="Video call"><FaVideo /></button>
          <button className="action-btn" aria-label="Voice call"><FaPhone /></button>
          <button className="action-btn" aria-haspopup="menu" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((v) => !v)}>
            <FaEllipsisV />
          </button>
          {isMenuOpen && (
            <div className="menu-dropdown" role="menu">
              <button className="menu-item" role="menuitem">View contact</button>
              <button className="menu-item" role="menuitem">Search</button>
              <button className="menu-item" role="menuitem">Mute notifications</button>
              <button className="menu-item" role="menuitem">Send call link</button>
              <button className="menu-item" role="menuitem">Schedule call</button>
              <button className="menu-item" role="menuitem">More</button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet</p>
            <small>Start the conversation by sending a message</small>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOutbound = message.direction === 'outbound';
            const showDate = index === 0 || 
              new Date(message.timestamp).getDate() !== 
              new Date(messages[index - 1].timestamp).getDate();

            return (
              <div key={message._id}>
                {showDate && (
                  <div className="date-separator">
                    {format(new Date(message.timestamp), 'EEEE, MMMM d, yyyy')}
                  </div>
                )}
                
                <div className={`message ${isOutbound ? 'outbound' : 'inbound'}`}>
                  <div className="message-content">
                    <div className="message-bubble">
                      <p>{renderMessageContent(message)}</p>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isOutbound && (
                          <span className="message-status">
                            {getStatusIcon(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <div className="emoji-wrapper" ref={emojiRef}>
            <button
              className="emoji-button"
              aria-label="Emoji"
              onClick={() => setIsEmojiOpen((v) => !v)}
            >
              <FaSmile />
            </button>
            {isEmojiOpen && (
              <div className="emoji-dropdown">
                <div className="emoji-grid">
                  {['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','😐','😢','😭','😡','👍','👎','🙏','👏','🎉','🔥','❤️','✨','💯','👌','🙌','🤝'].map((e) => (
                    <button key={e} className="emoji-btn" onClick={() => addEmoji(e)}>{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="message-input"
          />
          <button className="attach-button" aria-label="Attach">
            <FaPaperclip />
          </button>
          <button className="camera-button" aria-label="Camera">
            <FaCamera />
          </button>
          {newMessage.trim().length === 0 ? (
            <button
              className={`mic-button ${isRecording ? 'recording' : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              aria-label="Hold to record audio"
            >
              <FaMicrophone />
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              className="send-button"
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 