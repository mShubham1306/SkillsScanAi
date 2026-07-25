import React, { useState, useRef } from 'react';
import UploadZone from './components/UploadZone';
import ResultsDashboard from './components/ResultsDashboard';
import { API_BASE_URL } from './config';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  const appSectionRef = useRef(null);

  const scrollToApp = () => {
    if (appSectionRef.current) {
      appSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpload = async (file) => {
    setIsScanning(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume. Please try again.');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Ambient Background Glow & Tech Grid */}
      <div className="bg-canvas">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Sleek Navigation Bar */}
      <nav className="navbar">
        <a href="#" className="navbar-brand">
          <div className="navbar-logo">✨</div>
          <div className="navbar-name">SkillScan <span>Pro</span></div>
        </a>
        <div className="navbar-actions">
          <button className="navbar-link" onClick={scrollToApp}>Overview</button>
          <button className="navbar-link" onClick={scrollToApp}>Features</button>
          <button className="btn-navbar" onClick={scrollToApp}>Start Analysis</button>
        </div>
      </nav>

      {/* High-End Enterprise Hero Section */}
      <header className="hero-section">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Autonomous AI Talent Intelligence
        </div>
        <h1 className="hero-title">
          Transform Resumes into <span className="hero-title-gradient">Career Breakthroughs</span>
        </h1>
        <p className="hero-subtitle">
          Instant ATS compatibility scoring, high-impact skill extraction, executive evaluations, and interactive career coaching — built for top-tier professionals.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={scrollToApp}>
            <span>⚡ Analyze Your Resume</span>
          </button>
          <button className="btn-hero-secondary" onClick={scrollToApp}>
            <span>✨ View AI Capabilities</span>
          </button>
        </div>

        {/* Executive Metrics Bar */}
        <div className="hero-stats">
          <div className="hero-stat-item">
            <span className="hero-stat-number">99.8%</span>
            <span className="hero-stat-label">ATS Accuracy</span>
          </div>
          <div className="hero-stat-item">
            <span className="hero-stat-number">&lt; 3s</span>
            <span className="hero-stat-label">Analysis Speed</span>
          </div>
          <div className="hero-stat-item">
            <span className="hero-stat-number">50+</span>
            <span className="hero-stat-label">Skill Domains</span>
          </div>
        </div>

        {/* 3D Floating Mock Card */}
        <div className="hero-visual">
          <div className="hero-card-3d">
            <div className="hero-card-header">
              <div className="hero-card-icon">🎯</div>
              <div>
                <div className="hero-card-title">Executive Profile Evaluation</div>
                <div className="hero-card-sub">AI Optimization Engine</div>
              </div>
            </div>
            <div className="hero-card-score">
              <span className="hero-card-score-label">ATS Compatibility</span>
              <span className="hero-card-score-val">94%</span>
            </div>
            <div className="hero-card-skills">
              <span className="hero-card-skill">Strategic Leadership</span>
              <span className="hero-card-skill">Full-Stack Tech</span>
              <span className="hero-card-skill">System Architecture</span>
            </div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-label">
                <span>Industry Benchmark</span>
                <span>Top 3%</span>
              </div>
              <div className="hero-card-bar-track">
                <div className="hero-card-bar-fill" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Showcase Section */}
      <section className="features-section">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-tag">Enterprise Features</span>
          <h2 className="section-title">Designed for Next-Level Performance</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Powered by advanced neural parsing and multi-dimensional talent benchmarking.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap fi-indigo">🎯</div>
            <h3 className="feature-title">Precision ATS Scoring</h3>
            <p className="feature-desc">Evaluate your resume against complex corporate recruitment filters, layout rules, and keyword density requirements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap fi-violet">🧠</div>
            <h3 className="feature-title">Skill Gap Analysis</h3>
            <p className="feature-desc">Uncover critical missing competencies and get actionable step-by-step pathways to boost your market fit.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap fi-cyan">💬</div>
            <h3 className="feature-title">Interactive AI Coach</h3>
            <p className="feature-desc">Converse with your dedicated AI Career Strategist to rewrite bullet points, tailor for roles, and refine achievements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap fi-emerald">✨</div>
            <h3 className="feature-title">Executive Summaries</h3>
            <p className="feature-desc">Receive concise 3-4 sentence leadership write-ups highlighting your core strengths and unique value proposition.</p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="how-section">
        <div className="how-inner">
          <div className="how-header">
            <span className="section-tag">Simple Process</span>
            <h2 className="section-title">Three Steps to Optimization</h2>
          </div>
          <div className="steps-row">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3 className="step-title">Upload Document</h3>
              <p className="step-desc">Drop your PDF, DOCX, or TXT resume into our secure analyzer.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3 className="step-title">Deep AI Evaluation</h3>
              <p className="step-desc">Our neural engine analyzes structure, skills, and industry benchmarks.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3 className="step-title">Unlock Growth</h3>
              <p className="step-desc">Review your ATS scorecard, role matches, and chat with your AI coach.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Workspace Divider */}
      <div className="app-section-divider" ref={appSectionRef}>
        <span className="app-section-label">✨ Resume Intelligence Workspace</span>
      </div>

      {/* Main Analysis Workspace */}
      <main className="app-container">
        {/* Upload Zone */}
        {!analysisResult && !isScanning && (
          <UploadZone onUpload={handleUpload} error={error} />
        )}

        {/* Scanning Animation */}
        {isScanning && (
          <div className="glass-panel scanning-state">
            <div className="scan-animation">
              <div className="scan-ring scan-ring-1"></div>
              <div className="scan-ring scan-ring-2"></div>
              <div className="scan-ring scan-ring-3"></div>
            </div>
            <h3>Analyzing Profile & Skill Architecture...</h3>
            <p>Running neural ATS evaluation, extracting core competencies, and computing target role alignment.</p>
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
            onReset={() => {
              setAnalysisResult(null);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">SkillScan Pro</div>
        <p>© 2026 SkillScan AI • Enterprise Talent & Career Intelligence Platform</p>
      </footer>
    </div>
  );
}

export default App;
