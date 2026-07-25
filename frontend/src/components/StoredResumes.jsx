import React from 'react';
import { API_BASE_URL } from '../config';

const StoredResumes = ({ resumes, onRefresh }) => {
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/resumes/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  if (!resumes || resumes.length === 0) {
    return (
      <div className="glass-panel stored-empty">
        <div className="empty-icon">🗄️</div>
        <h3>No Resumes in Database</h3>
        <p>Switch to the "Seed Database" tab to upload resumes for the system to learn from.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel stored-panel">
      <div className="panel-header">
        <div className="icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>🗂️</div>
        <h2 style={{ color: '#d8b4fe' }}>Stored Resumes ({resumes.length})</h2>
      </div>

      <div className="stored-list">
        {resumes.map((resume) => (
          <div key={resume._id} className="glass-card stored-item">
            <div className="stored-item-info">
              <div className="stored-name">📄 {resume.fileName}</div>
              <div className="stored-meta">
                <span>{new Date(resume.uploadedAt).toLocaleDateString()}</span>
                <span className="stored-skill-count">{resume.skills?.length || 0} skills</span>
              </div>
              {resume.skills && resume.skills.length > 0 && (
                <div className="stored-skills">
                  {resume.skills.slice(0, 6).map((skill, i) => (
                    <span key={i} className="badge badge-mini">{skill}</span>
                  ))}
                  {resume.skills.length > 6 && (
                    <span className="badge badge-mini badge-more">+{resume.skills.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
            <button className="btn-delete" onClick={() => handleDelete(resume._id)} title="Remove from database">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoredResumes;
