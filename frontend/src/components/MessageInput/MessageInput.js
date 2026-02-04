import React, { useState, useRef, useEffect } from 'react';
import { uploadAPI } from '../../services/api';
import EmojiPicker from 'emoji-picker-react';
import { FiSend, FiPaperclip, FiSmile, FiImage, FiX } from 'react-icons/fi';
import './MessageInput.css';

const MessageInput = ({ onSend, onTyping, roomId }) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Reset state when room changes
  useEffect(() => {
    setMessage('');
    setAttachment(null);
    setPreview(null);
    setShowEmoji(false);
  }, [roomId]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Typing indicator
    onTyping?.(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !attachment) return;

    onTyping?.(false);
    
    if (attachment) {
      onSend(message || '', attachment.mimetype.startsWith('image/') ? 'image' : 'file', attachment);
    } else {
      onSend(message, 'text');
    }
    
    setMessage('');
    setAttachment(null);
    setPreview(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      }

      // Upload file
      const response = await uploadAPI.uploadFile(file);
      setAttachment(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setPreview(null);
  };

  return (
    <div className="message-input-container">
      {/* Attachment Preview */}
      {attachment && (
        <div className="attachment-preview">
          {preview ? (
            <img src={preview} alt="Preview" className="image-preview" />
          ) : (
            <div className="file-preview">
              <FiPaperclip />
              <span>{attachment.originalName}</span>
            </div>
          )}
          <button className="remove-attachment" onClick={removeAttachment}>
            <FiX />
          </button>
        </div>
      )}

      <form className="message-input-form" onSubmit={handleSubmit}>
        {/* Attachment Button */}
        <button 
          type="button" 
          className="input-action-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="mini-spinner" />
          ) : (
            <FiPaperclip />
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          hidden
        />

        {/* Image Button */}
        <button 
          type="button" 
          className="input-action-btn"
          onClick={() => {
            fileInputRef.current.accept = 'image/*';
            fileInputRef.current?.click();
          }}
          disabled={uploading}
        >
          <FiImage />
        </button>

        {/* Message Input */}
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={uploading}
          />
        </div>

        {/* Emoji Picker */}
        <div className="emoji-container">
          <button 
            type="button" 
            className="input-action-btn"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <FiSmile />
          </button>
          
          {showEmoji && (
            <div className="emoji-picker-wrapper">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
              />
            </div>
          )}
        </div>

        {/* Send Button */}
        <button 
          type="submit" 
          className="send-btn"
          disabled={(!message.trim() && !attachment) || uploading}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
