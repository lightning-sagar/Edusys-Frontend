import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';
import { io } from "socket.io-client";
import Sidebar from '../Sidebar/Sidebar';
import { useRecoilState, useRecoilValue } from 'recoil';
import { chatMessagesState } from '../../atom/chatAtom.js';  
import { useParams } from 'react-router-dom';
import userAtom from '../../atom/UserAtom.js';
import Navbar2 from '../Navbar2/Navbar2.jsx';

const Chat = () => {
  const [messages, setMessages] = useRecoilState(chatMessagesState);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const {id: subjectId } = useParams();
  const user = useRecoilValue(userAtom);
  const userId = user?._id;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socketInstance = io("https://edusys-backend-h8x1l3plh-lightning-sagars-projects.vercel.app/", {
      query: { userId, subjectId },
      withCredentials: true,
    });
    setSocket(socketInstance);

    socketInstance.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [subjectId, userId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/c/${subjectId}/messages`,{
          credentials:'include',
          method:"GET"
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        console.log(data);
        setMessages(data.messages || []);
        setSubjectName(data.subjectName || '');
      } catch (error) {
        console.error('Error fetching messages:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [subjectId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit("newMessage", { subjectId, message: newMessage, sender: userId });
      setNewMessage('');  
    }
  };

  const handleCreateClick = () => {
    console.log("Create button clicked");
  };

  const handleShareClick = () => {
    const shareableLink = `${window.location.origin}/join/${subjectId}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
    <>
      <div className="app-container">
        <Sidebar className="sidebar-chat" />
        <div className="chat-container">

          <div className="main-chat-container">

            <div className="chat-header">
              Chat with Group - {subjectName} 
            </div>

            <div className="chat-messages">
              {loading ? (
                <div>Loading messages...</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`message ${msg.sender._id === userId ? 'message-self' : 'message-other'}`}
                  >
                    <div className="message-content">
                      {msg.sender.image ? (
                        <img
                          src={msg.sender.image}
                          alt="User"
                          className="message-icon"
                        />
                      ) : (
                        <div className="message-placeholder">
                          {msg.sender.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="message-info">
                        <span className="message-username">{msg.sender.username}</span>
                        <p className="message-text">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} /> 
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
