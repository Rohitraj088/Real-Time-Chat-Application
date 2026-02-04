import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, uploadAPI } from '../../services/api';
import { FiX, FiCamera, FiUser, FiMail, FiEdit2 } from 'react-icons/fi';
import './ProfileModal.css';

const ProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const response = await uploadAPI.uploadAvatar(file);
      setAvatar(response.data.url);
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const response = await usersAPI.updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar
      });
      
      updateUser(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Avatar */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <div className="avatar-preview">
                {avatar ? (
                  <img src={avatar} alt="Avatar" />
                ) : (
                  <span>{username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label className="avatar-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="upload-spinner" />
                ) : (
                  <FiCamera />
                )}
              </label>
            </div>
            <p className="avatar-hint">Click to change photo</p>
          </div>

          {/* Username */}
          <div className="form-group">
            <label>
              <FiUser />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              maxLength={30}
            />
          </div>

          {/* Email (read-only) */}
          <div className="form-group">
            <label>
              <FiMail />
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="disabled"
            />
          </div>

          {/* Bio */}
          <div className="form-group">
            <label>
              <FiEdit2 />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{bio.length}/200</span>
          </div>

          {/* Save Button */}
          <button 
            className="save-btn"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
