import React, { useRef, useState } from 'react';
import { API_BASE_URL } from '../config';

const SeedUpload = ({ onSeeded }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append('resumes', file);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/seed`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to seed resumes');
      }

      const data = await response.json();
      setResult(data);
      if (onSeeded) onSeeded();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="seed-container">
      <div className="glass-panel seed-panel">
        <div className="seed-header">
          <div className="seed-icon">📚</div>
          <h2>Seed Resume Database</h2>
          <p>Upload multiple resumes to build your comparison corpus. The more resumes you add, the smarter the analysis becomes.</p>
        </div>

        <div
          className="glass-card seed-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          {isUploading ? (
            <>
              <div className="spinner"></div>
              <h3>Processing Resumes...</h3>
              <p>Extracting text and parsing skills</p>
            </>
          ) : (
            <>
              <div className="seed-drop-icon">📂</div>
              <h3>Drop Multiple Resumes Here</h3>
              <p>or click to browse (PDF, DOCX, TXT)</p>
              <div className="file-info">Select up to 50 files at once</div>
            </>
          )}
        </div>

        {result && (
          <div className="seed-result">
            <div className="seed-result-item seed-success">
              <span className="seed-result-number">{result.stored}</span>
              <span>Resumes Stored Successfully</span>
            </div>
            {result.failed > 0 && (
              <div className="seed-result-item seed-failed">
                <span className="seed-result-number">{result.failed}</span>
                <span>Failed to Process</span>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="seed-errors">
                {result.errors.map((err, i) => (
                  <div key={i} className="seed-error-line">⚠️ {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeedUpload;
