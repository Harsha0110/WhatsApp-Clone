import React from 'react';
import { FaPlus, FaComments, FaPhoneAlt, FaCog, FaUserFriends } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <button className="sidebar-btn" aria-label="New chat"><FaPlus /></button>
      </div>
      <div className="sidebar-middle">
        <button className="sidebar-btn" aria-label="Communities"><FaUserFriends /></button>
        <button className="sidebar-btn" aria-label="Chats"><FaComments /></button>
        <button className="sidebar-btn" aria-label="Calls"><FaPhoneAlt /></button>
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-btn" aria-label="Settings"><FaCog /></button>
      </div>
    </div>
  );
};

export default Sidebar;


