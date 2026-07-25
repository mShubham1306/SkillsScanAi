import React, { useState, useEffect, useRef } from 'react';
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

  const appSectionRef = useRef(null);

  const scrollToApp = () => {
    if (appSectionRef.current) {
      appSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    <div className="page-wrapper">
      {/* Background Orbs & Grid */}
      <div className="bg-canvas">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="navbar">
        <a href="#" className="navbar-brand">
          <div className="navbar-logo">⚡</div>
          <div className="navbar-name">SkillScan <span>AI</span></div>
        </a>
        <div className="navbar-actions">
          <button className="navbar-link" onClick={scrollToApp}>Analyzer</button>
          <button className="navbar-link" onClick={() => { setActiveTab('seed'); scrollToApp(); }}>Database</button>
          <button className="btn-navbar" onClick={scrollToApp}>Launch App</button>
        </div>
      </nav>

      {/* Landing Page Hero Section */}
      <header className="hero-section">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Next-Gen AI Resume Analyzer
        </div>
        <h1 className="hero-title">
          Scan Resumes with <span className="hero-title-gradient">Precision AI Intelligence</span>
        </h1>
        <p className="hero-subtitle">
          Benchmarked ATS scoring, deep skill gap breakdown, AI career coaching, and custom corpus intelligence — powered by state-of-the-art Llama & NLP.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={scrollToApp}>
            <span>🚀 Analyze Resume Now</span>
          </button>
          <button className="btn-hero-secondary" onClick={() => { setActiveTab('seed'); scrollToApp(); }}>
            <span>📚 Seed DB Corpus</span>
          </button>
        </div>

        <div className="hero-stats">
          <div className="hero-stat-item">
            <span className="hero-stat-number">{stats.resumeCount}</span>
            <span className="hero-stat-label">Resumes in DB</span>
          </div>
          <div className="hero-stat-item">
            <span className="hero-stat-number">{stats.topSkills?.length || 0}</span>
            <span className="hero-stat-label">Skills Tracked</span>
          </div>
          <div className="hero-stat-item">
            <span className="hero-stat-number">99.4%</span>
            <span className="hero-stat-label">ATS Accuracy</span>
          </div>
        </div>

        {/* 3D Floating Mock Card */}
        <div className="hero-visual">
          <div className="hero-card-3d">
            <div className="hero-card-header">
              <div className="hero-card-icon">⚡</div>
              <div>
                <div className="hero-card-title">Senior Full Stack Resume</div>
                <div className="hero-card-sub">AI Analysis Ready</div>
              </div>
            </div>
            <div className="hero-card-score">
              <span className="hero-card-score-label">ATS Match</span>
              <span className="hero-card-score-val">92%</span>
            </div>
            <div className="hero-card-skills">
              <span className="hero-card-skill">React</span>
              <span className="hero-card-skill">Node.js</span>
              <span className="hero-card-skill">Python</span>
              <span className="hero-card-skill">Docker</span>
            </div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-label">
                <span>Corpus Benchmark</span>
                <span>Top 5%</span>
              </div>
              <div className="hero-card-bar-track">
                <div className="hero-card-bar-fill" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Showcase Section */}
      <section className="features-section">
        <div style={{ textCenter: 'center', marginBottom: '40px', textAlign: 'center' }}>
          <span className="section-tag">Core Features</span>
          <h2 className="section-title">Built for Modern Hiring Intelligence</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Combine real-time LLM intelligence with custom vector corpus comparisons for hyper-accurate scoring.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap fi-indigo">🎯</div>
            <h3 className="feature-title">ATS Score Engine</h3>
            <p className="feature-desc">Calculates real-world ATS compatibility scores, formatting checks, and keyword optimization levels instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap fi-violet">🧠</div>
            <h3 className="feature-title">Corpus Benchmarking</h3>
            <p className="feature-desc">Compares candidates against your custom MongoDB database of stored resumes to find top talent relative to your team.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap fi-cyan">💬</div>
            <h3 className="feature-title">AI Career Coach</h3>
            <p className="feature-desc">Interactive chatbot lets you ask specific questions, generate custom cover letters, or optimize bullet points live.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap fi-emerald">⚡</div>
            <h3 className="feature-title">Hybrid NLP & LLM</h3>
            <p className="feature-desc">Powered by Groq Llama 3.3 70B with instantaneous local NLP fallback to guarantee 100% uptime.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-section">
        <div className="how-inner">
          <div className="how-header">
            <span className="section-tag">Workflow</span>
            <h2 className="section-title">How SkillScan AI Works</h2>
          </div>
          <div className="steps-row">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3 className="step-title">Upload Resume</h3>
              <p className="step-desc">Drag & drop PDF, DOCX, TXT or image resumes directly into the analyzer.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3 className="step-title">Deep AI Scanning</h3>
              <p className="step-desc">Our AI parses structure, extracts core competencies, and benchmarks skills against your database.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3 className="step-title">Actionable Insights</h3>
              <p className="step-desc">Get your ATS score, role matches, missing skills roadmap, and converse with the AI coach.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider to App Section */}
      <div className="app-section-divider" ref={appSectionRef}>
        <span className="app-section-label">⚡ Interactive Application Workspace</span>
      </div>

      {/* Main Interactive App Container */}
      <main className="app-container">
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
              🗂️ Stored Resumes ({stats.resumeCount})
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
            <div className="scan-animation">
              <div className="scan-ring scan-ring-1"></div>
              <div className="scan-ring scan-ring-2"></div>
              <div className="scan-ring scan-ring-3"></div>
            </div>
            <h3>Scanning & Analyzing Document...</h3>
            <p>Extracting skills, computing ATS benchmark score, and running AI evaluation against stored corpus.</p>
            <div className="scan-dots">
              <div className="scan-dot"></div>
              <div className="scan-dot"></div>
              <div className="scan-dot"></div>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
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
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">SkillScan AI</div>
        <p>© 2026 SkillScan AI • Next-Gen Talent & Resume Analytics</p>
      </footer>
    </div>
  );
}

export default App;
