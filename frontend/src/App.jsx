import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import ResultsDashboard from './components/ResultsDashboard';
import SeedUpload from './components/SeedUpload';
import StoredResumes from './components/StoredResumes';
import ApiKeyConfig from './components/ApiKeyConfig';
import { API_BASE_URL } from './config';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  const [stats, setStats] = useState({ resumeCount: 0, topSkills: [] });
  const [storedResumes, setStoredResumes] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isBackendKeyAvailable, setIsBackendKeyAvailable] = useState(false);
  const [aiProvider, setAiProvider] = useState('Local NLP');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        const data = await res.json();
        setIsBackendKeyAvailable(!!data.isBackendKeyAvailable);
        if (data.aiProvider) setAiProvider(data.aiProvider);
      } catch (err) {
        console.error('Failed to check backend health:', err);
      }
    };
    checkBackendHealth();
  }, []);

  const handleKeyChange = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('gemini_api_key', newKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/resumes`);
      const data = await res.json();
      setStoredResumes(data);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchResumes();
  }, []);

  const handleRefresh = () => {
    fetchStats();
    fetchResumes();
  };

  const handleUpload = async (file) => {
    setIsScanning(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const headers = {};
      if (apiKey) {
        headers['X-Gemini-Key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const result = await response.json();
      setAnalysisResult(result);
      handleRefresh(); // Refresh stats since the new resume was stored
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>SkillScan AI</h1>
        <p>
          Self-learning resume analyzer — powered by local NLP. Upload resumes to build the knowledge base, then analyze new ones against the corpus.
        </p>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{stats.resumeCount}</span>
            <span className="stat-label">Resumes in Database</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.topSkills?.length || 0}</span>
            <span className="stat-label">Unique Skills Tracked</span>
          </div>
          <ApiKeyConfig
            apiKey={apiKey}
            onKeyChange={handleKeyChange}
            isBackendKeyAvailable={isBackendKeyAvailable}
            aiProvider={aiProvider}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      {!analysisResult && !isScanning && (
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'analyze' ? 'active' : ''}`}
            onClick={() => setActiveTab('analyze')}
          >
            🔍 Analyze Resume
          </button>
          <button
            className={`tab-btn ${activeTab === 'seed' ? 'active' : ''}`}
            onClick={() => setActiveTab('seed')}
          >
            📚 Seed Database
          </button>
          <button
            className={`tab-btn ${activeTab === 'stored' ? 'active' : ''}`}
            onClick={() => setActiveTab('stored')}
          >
            🗂️ Stored ({stats.resumeCount})
          </button>
        </div>
      )}

      {/* Analyze Tab */}
      {activeTab === 'analyze' && !analysisResult && !isScanning && (
        <UploadZone onUpload={handleUpload} error={error} />
      )}

      {/* Seed Tab */}
      {activeTab === 'seed' && !analysisResult && !isScanning && (
        <SeedUpload onSeeded={handleRefresh} />
      )}

      {/* Stored Tab */}
      {activeTab === 'stored' && !analysisResult && !isScanning && (
        <StoredResumes resumes={storedResumes} onRefresh={handleRefresh} />
      )}

      {/* Scanning State */}
      {isScanning && (
        <div className="glass-panel scanning-state">
          <div className="spinner"></div>
          <h3>Analyzing Document...</h3>
          <p>Extracting skills, comparing against {stats.resumeCount} stored resumes, and computing matches.</p>
        </div>
      )}

      {/* Results */}
      {analysisResult && !isScanning && (
        <ResultsDashboard
          data={analysisResult}
          apiKey={apiKey}
          onReset={() => {
            setAnalysisResult(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default App;
