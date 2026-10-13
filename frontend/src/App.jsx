import React, { useState, useRef } from 'react';
import { useTheme } from './ThemeContext';
import './App.css';

const API_URL = 'http://127.0.0.1:8000/predict';

function App() {
  const { theme, toggleTheme } = useTheme();

  // Navigation state
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Analysis state
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [wordFrequencies, setWordFrequencies] = useState([]);
  const [filterStopWords, setFilterStopWords] = useState(false);

  // History page state
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // all | REAL | FAKE
  const [historySort, setHistorySort] = useState('newest');  // newest | oldest
  const [historyDetail, setHistoryDetail] = useState(null);  // item to show in modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const textareaRef = useRef(null);

  // Common English stop words for keyword-only mode
  const STOP_WORDS = new Set([
    'a','about','above','after','again','against','all','am','an','and','any',
    'are','as','at','be','because','been','before','being','below','between',
    'both','but','by','can','could','did','do','does','doing','down','during',
    'each','few','for','from','further','get','got','had','has','have','having',
    'he','her','here','hers','herself','him','himself','his','how','i','if',
    'in','into','is','it','its','itself','just','know','let','like','make',
    'me','might','more','most','must','my','myself','no','nor','not','now',
    'of','off','on','once','only','or','other','our','ours','ourselves','out',
    'over','own','said','same','say','says','she','should','so','some','such',
    'than','that','the','their','theirs','them','themselves','then','there',
    'these','they','this','those','through','to','too','under','until','up',
    'upon','us','very','was','we','were','what','when','where','which','while',
    'who','whom','why','will','with','won','would','you','your','yours',
    'yourself','yourselves','also','been','being','having','doing','does',
  ]);

  const computeWordFrequencies = (inputText, excludeStopWords) => {
    if (!inputText || !inputText.trim()) {
      return [];
    }
    // Lowercase, keep only letters and spaces
    const cleaned = inputText.toLowerCase().replace(/[^a-z\s]/g, '');
    const words = cleaned.split(/\s+/).filter((w) => w.length > 1);

    const freq = {};
    for (const word of words) {
      if (excludeStopWords && STOP_WORDS.has(word)) continue;
      freq[word] = (freq[word] || 0) + 1;
    }

    // Sort descending by count, take top 20
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  };

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    if (page === 'analyze' && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 100);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
    setWordFrequencies([]);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter a news article or statement to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setWordFrequencies(computeWordFrequencies(text.trim(), filterStopWords));

      // Add to history (keep last 50)
      setHistory((prev) =>
        [
          {
            text: text.trim(),
            prediction: data.prediction,
            confidence: data.confidence,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 50)
      );
    } catch (err) {
      setError(
        'Unable to connect to the backend. Please ensure the FastAPI server is running at http://127.0.0.1:8000'
      );
    } finally {
      setLoading(false);
    }
  };

  const confidencePercent = result ? (result.confidence * 100).toFixed(2) : 0;

  // Page titles for the header
  const pageTitles = {
    dashboard: 'Fake News Detection Dashboard',
    analyze: 'Analyze News Article',
    model: 'Model Information',
    history: 'Analysis History',
    settings: 'Settings',
  };

  // ---- Word Frequency panel ----
  const handleToggleStopWords = () => {
    const next = !filterStopWords;
    setFilterStopWords(next);
    // Recalculate with the last analysed text (use the most recent history entry)
    if (history.length > 0) {
      setWordFrequencies(computeWordFrequencies(history[0].text, next));
    }
  };

  const renderWordFrequency = () => {
    if (wordFrequencies.length === 0) {
      return (
        <div className="card">
          <h3>📊 Word Frequency Analysis</h3>
          <p className="history-empty">
            Analyze a news article to see word frequency data here.
          </p>
        </div>
      );
    }

    const maxCount = wordFrequencies[0]?.count || 1;

    return (
      <div className="card">
        <div className="section-header">
          <h3>📊 Word Frequency Analysis</h3>
          <div className="wf-toggle">
            <button
              className={`btn btn-sm ${!filterStopWords ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { if (filterStopWords) handleToggleStopWords(); }}
            >
              All Words
            </button>
            <button
              className={`btn btn-sm ${filterStopWords ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { if (!filterStopWords) handleToggleStopWords(); }}
            >
              Keywords Only
            </button>
          </div>
        </div>

        {/* Bar chart */}
        <div className="wf-chart">
          {wordFrequencies.slice(0, 10).map((item) => (
            <div className="wf-bar-row" key={item.word}>
              <span className="wf-bar-label">{item.word}</span>
              <div className="wf-bar-track">
                <div
                  className="wf-bar-fill"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="wf-bar-count">{item.count}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="wf-table-wrapper">
          <table className="wf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Word</th>
                <th>Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {wordFrequencies.map((item, idx) => (
                <tr key={item.word}>
                  <td>{idx + 1}</td>
                  <td>{item.word}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="disclaimer" style={{ marginTop: '12px' }}>
          {filterStopWords
            ? 'Common English stop words have been excluded.'
            : 'Showing all words. Switch to "Keywords Only" to exclude common stop words.'}
        </p>
      </div>
    );
  };

  // ---- Shared analyze + result panel (used by dashboard & analyze pages) ----
  const renderAnalyzePanel = () => (
    <div className="analyze-grid">
      {/* Input card */}
      <div className="card">
        <h3>📝 Analyze News Article</h3>
        <textarea
          ref={textareaRef}
          className="article-input"
          placeholder="Paste your news article or statement here for analysis..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />
        <div className="input-footer">
          <span className="char-count">{text.length} characters</span>
          <div className="btn-group">
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={loading || (!text && !result)}
            >
              Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Analyzing...' : 'Analyze News'}
            </button>
          </div>
        </div>
        {error && (
          <div className="error-msg" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* Result card */}
      <div className="card">
        <h3>📊 Prediction Result</h3>
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner" />
            <span>Analyzing article...</span>
          </div>
        ) : result ? (
          <div className="result-content">
            <span
              className={`prediction-badge ${
                result.prediction === 'REAL' ? 'real' : 'fake'
              }`}
            >
              {result.prediction}
            </span>
            <div className="confidence-section">
              <p className="confidence-label">Model Confidence</p>
              <p className="confidence-value">{confidencePercent}%</p>
              <div className="confidence-bar">
                <div
                  className={`confidence-fill ${
                    result.prediction === 'REAL' ? 'real' : 'fake'
                  }`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>
            <p className="disclaimer">
              Model confidence reflects patterns learned from training data
              and does not independently verify factual truth.
            </p>
          </div>
        ) : (
          <div className="result-placeholder">
            Enter a news article and click &quot;Analyze News&quot; to see the prediction.
          </div>
        )}
      </div>
    </div>
  );

  // ---- History list (compact, used on dashboard) ----
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const renderHistoryList = () => (
    <>
      {history.length === 0 ? (
        <p className="history-empty">
          No analyses performed yet. Analyze a news article to see results here.
        </p>
      ) : (
        <div className="history-list">
          {history.slice(0, 5).map((item, idx) => (
            <div className="history-item" key={idx}>
              <span className="history-text">
                {item.text.length > 80
                  ? item.text.slice(0, 80) + '...'
                  : item.text}
              </span>
              <div className="history-result">
                <span className="history-time">{formatTime(item.timestamp)}</span>
                <span
                  className={`history-badge ${
                    item.prediction === 'REAL' ? 'real' : 'fake'
                  }`}
                >
                  {item.prediction}
                </span>
                <span className="history-confidence">
                  {(item.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ---- Page renderers ----

  const renderDashboard = () => (
    <div className="page-content">
      {renderAnalyzePanel()}

      {/* Word frequency analysis */}
      {renderWordFrequency()}

      {/* Quick model summary */}
      <div className="card">
        <h3>🤖 How the Model Works</h3>
        <div className="model-info-grid">
          <div className="info-item">
            <h4><span className="step-number">1</span> Text Preprocessing</h4>
            <p>Input text is cleaned by converting to lowercase, removing punctuation, and filtering out common stop words using NLTK.</p>
          </div>
          <div className="info-item">
            <h4><span className="step-number">2</span> TF-IDF Feature Extraction</h4>
            <p>Processed text is converted into numerical feature vectors using Term Frequency–Inverse Document Frequency weighting.</p>
          </div>
          <div className="info-item">
            <h4><span className="step-number">3</span> Naive Bayes Classification</h4>
            <p>A trained Multinomial Naive Bayes classifier predicts whether the article is REAL or FAKE based on the TF-IDF features.</p>
          </div>
        </div>
      </div>

      {/* Recent history */}
      <div className="card">
        <h3>📋 Recent Analyses</h3>
        {renderHistoryList()}
      </div>
    </div>
  );

  const renderAnalyzePage = () => (
    <div className="page-content">
      {renderAnalyzePanel()}
      {renderWordFrequency()}
    </div>
  );

  const renderModelPage = () => (
    <div className="page-content">
      <div className="card">
        <h3>🤖 Model Overview</h3>
        <div className="model-detail-grid">
          <div className="detail-row">
            <span className="detail-label">Model</span>
            <span className="detail-value">Multinomial Naive Bayes</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Feature Extraction</span>
            <span className="detail-value">TF-IDF (Term Frequency–Inverse Document Frequency)</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Task</span>
            <span className="detail-value">Binary Text Classification</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Output Classes</span>
            <span className="detail-value">REAL, FAKE</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Dataset</span>
            <span className="detail-value">IFND (Indian Fake News Dataset) — 56,714 records</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Train / Test Split</span>
            <span className="detail-value">80% training, 20% testing (stratified, random_state=42)</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Text Preprocessing</span>
            <span className="detail-value">Lowercase, punctuation removal, stop-word filtering (NLTK)</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Backend</span>
            <span className="detail-value">FastAPI (Python)</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Frontend</span>
            <span className="detail-value">React + Vite</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📐 Processing Pipeline</h3>
        <div className="model-info-grid">
          <div className="info-item">
            <h4><span className="step-number">1</span> Text Preprocessing</h4>
            <p>The input text is converted to lowercase. Punctuation, numbers, and special characters are removed. Common English stop words are filtered out using the NLTK library.</p>
          </div>
          <div className="info-item">
            <h4><span className="step-number">2</span> TF-IDF Vectorisation</h4>
            <p>The cleaned text is transformed into a numerical feature vector. TF-IDF weights words by how important they are to a document relative to the entire corpus.</p>
          </div>
          <div className="info-item">
            <h4><span className="step-number">3</span> Classification</h4>
            <p>The Multinomial Naive Bayes classifier uses the TF-IDF features to compute the probability that the text belongs to the REAL or FAKE class, and returns the class with the highest probability.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📈 Model Performance (Test Set)</h3>
        <div className="metrics-grid">
          <div className="metric-card metric-accent">
            <div className="metric-value">93.56%</div>
            <div className="metric-label">Accuracy</div>
            <p className="metric-desc">Proportion of all predictions that were correct.</p>
          </div>
          <div className="metric-card metric-real">
            <div className="metric-value">95.18%</div>
            <div className="metric-label">Precision (FAKE)</div>
            <p className="metric-desc">Of all articles predicted FAKE, how many were actually FAKE.</p>
          </div>
          <div className="metric-card metric-fake">
            <div className="metric-value">85.01%</div>
            <div className="metric-label">Recall (FAKE)</div>
            <p className="metric-desc">Of all actually FAKE articles, how many were correctly detected.</p>
          </div>
          <div className="metric-card metric-f1">
            <div className="metric-value">89.81%</div>
            <div className="metric-label">F1-Score (FAKE)</div>
            <p className="metric-desc">Harmonic mean of Precision and Recall — balances both measures.</p>
          </div>
        </div>
        <div className="model-detail-grid" style={{ marginTop: '16px' }}>
          <div className="detail-row">
            <span className="detail-label">Test Samples</span>
            <span className="detail-value">11,343</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Split</span>
            <span className="detail-value">80% train / 20% test, stratified, random_state=42</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🔢 Confusion Matrix</h3>
        <p className="cm-intro">
          The confusion matrix shows how the model&apos;s predictions compare to the actual labels on the 11,343-sample test set.
          Diagonal cells (highlighted) are <strong>correct</strong> predictions; off-diagonal cells are <strong>errors</strong>.
        </p>
        <div className="cm-wrapper">
          <table className="cm-table">
            <thead>
              <tr>
                <th className="cm-corner"></th>
                <th className="cm-corner"></th>
                <th colSpan="2" className="cm-pred-header">Predicted</th>
              </tr>
              <tr>
                <th className="cm-corner"></th>
                <th className="cm-corner"></th>
                <th className="cm-col-header">REAL</th>
                <th className="cm-col-header">FAKE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th rowSpan="2" className="cm-actual-header">Actual</th>
                <th className="cm-row-label">REAL</th>
                <td className="cm-cell cm-correct cm-correct-real">
                  <span className="cm-number">7,397</span>
                  <span className="cm-tag">True Negative</span>
                </td>
                <td className="cm-cell cm-error">
                  <span className="cm-number">163</span>
                  <span className="cm-tag">False Positive</span>
                </td>
              </tr>
              <tr>
                <th className="cm-row-label">FAKE</th>
                <td className="cm-cell cm-error">
                  <span className="cm-number">567</span>
                  <span className="cm-tag">False Negative</span>
                </td>
                <td className="cm-cell cm-correct cm-correct-fake">
                  <span className="cm-number">3,216</span>
                  <span className="cm-tag">True Positive</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="cm-legend">
          <span className="cm-legend-item"><span className="cm-dot cm-dot-correct"></span> Correct prediction</span>
          <span className="cm-legend-item"><span className="cm-dot cm-dot-error"></span> Incorrect prediction</span>
        </div>
      </div>

      <div className="card">
        <h3>📖 Understanding the Metrics</h3>
        <div className="model-info-grid">
          <div className="info-item">
            <h4><span className="step-number">A</span> Accuracy</h4>
            <p>The percentage of all test articles (both REAL and FAKE) that the model classified correctly. 93.56% means the model got 10,613 out of 11,343 predictions right.</p>
          </div>
          <div className="info-item">
            <h4><span className="step-number">P</span> Precision</h4>
            <p>When the model says an article is FAKE, how often is it right? 95.18% precision means very few REAL articles are wrongly flagged as FAKE.</p>
          </div>
          <div className="info-item">
            <h4><span className="step-number">R</span> Recall</h4>
            <p>Of all the truly FAKE articles in the test set, what fraction did the model catch? 85.01% recall means most FAKE articles are detected, but some are missed.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>⚠️ Important Disclaimer</h3>
        <p className="disclaimer-block">
          This model classifies text based on statistical patterns learned during training.
          It does <strong>not</strong> independently verify facts, check external sources,
          or access any database of known misinformation. Model confidence reflects the
          classifier&apos;s certainty about its own prediction, not the factual accuracy of
          the article. Always verify important claims through trusted news sources.
        </p>
        <p className="disclaimer-block" style={{ marginTop: '12px' }}>
          The evaluation metrics above were measured on the held-out test dataset
          (20% of IFND.csv, stratified split) and may not represent performance
          on every real-world news article.
        </p>
      </div>
    </div>
  );

  const renderHistoryPage = () => {
    // Filter, search, sort
    let filtered = [...history];
    if (historyFilter !== 'all') {
      filtered = filtered.filter((h) => h.prediction === historyFilter);
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      filtered = filtered.filter((h) => h.text.toLowerCase().includes(q));
    }
    if (historySort === 'oldest') {
      filtered = filtered.reverse();
    }

    const handleConfirmClear = () => {
      setHistory([]);
      setShowClearConfirm(false);
    };

    return (
      <div className="page-content">
        {/* Controls */}
        <div className="card">
          <div className="section-header">
            <h3>📋 Analysis History ({history.length})</h3>
            {history.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowClearConfirm(true)}
              >
                🗑️ Clear History
              </button>
            )}
          </div>

          {history.length > 0 && (
            <div className="history-controls">
              <input
                type="text"
                className="history-search"
                placeholder="Search by keywords..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                aria-label="Search analysis history"
              />
              <div className="history-filters">
                {['all', 'REAL', 'FAKE'].map((f) => (
                  <button
                    key={f}
                    className={`btn btn-sm ${historyFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setHistoryFilter(f)}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
              <select
                className="history-sort"
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value)}
                aria-label="Sort order"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          )}

          {/* Table */}
          {filtered.length === 0 ? (
            <p className="history-empty">
              {history.length === 0
                ? 'No analyses performed yet. Analyze a news article to get started.'
                : 'No results match your search or filter.'}
            </p>
          ) : (
            <div className="wf-table-wrapper">
              <table className="wf-table history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>News Text</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Date &amp; Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="history-cell-text">
                        {item.text.length > 60
                          ? item.text.slice(0, 60) + '...'
                          : item.text}
                      </td>
                      <td>
                        <span className={`history-badge ${item.prediction === 'REAL' ? 'real' : 'fake'}`}>
                          {item.prediction}
                        </span>
                      </td>
                      <td>{(item.confidence * 100).toFixed(2)}%</td>
                      <td className="history-cell-time">{formatDateTime(item.timestamp)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setHistoryDetail(item)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="disclaimer" style={{ marginTop: '16px' }}>
            History is stored in your current browser session only and is not saved permanently.
          </p>
        </div>

        {/* Clear confirmation dialog */}
        {showClearConfirm && (
          <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>Clear Analysis History?</h3>
              <p>This will remove all {history.length} analyses from your current session. This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ background: 'var(--fake-color)' }} onClick={handleConfirmClear}>Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail modal */}
        {historyDetail && (
          <div className="modal-overlay" onClick={() => setHistoryDetail(null)}>
            <div className="modal-box modal-detail" onClick={(e) => e.stopPropagation()}>
              <div className="section-header">
                <h3>Analysis Details</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => setHistoryDetail(null)}>✕ Close</button>
              </div>
              <div className="detail-result-row">
                <span className={`prediction-badge ${historyDetail.prediction === 'REAL' ? 'real' : 'fake'}`}>
                  {historyDetail.prediction}
                </span>
                <span className="confidence-value" style={{ fontSize: '20px' }}>
                  {(historyDetail.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="model-detail-grid" style={{ marginBottom: '16px' }}>
                <div className="detail-row">
                  <span className="detail-label">Confidence</span>
                  <span className="detail-value">{(historyDetail.confidence * 100).toFixed(2)}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date &amp; Time</span>
                  <span className="detail-value">{formatDateTime(historyDetail.timestamp)}</span>
                </div>
              </div>
              <div className="detail-fulltext-label">Submitted Text</div>
              <div className="detail-fulltext">{historyDetail.text}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettingsPage = () => (
    <div className="page-content">
      <div className="card">
        <h3>🎨 Appearance</h3>
        <div className="settings-row">
          <div className="settings-info">
            <p className="settings-label">Theme</p>
            <p className="settings-desc">Switch between dark and light mode. Your preference is saved in the browser.</p>
          </div>
          <button className="btn btn-primary" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>🗑️ Data Management</h3>
        <div className="settings-row">
          <div className="settings-info">
            <p className="settings-label">Clear Analysis History</p>
            <p className="settings-desc">Remove all analyses from the current session.</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setHistory([])}
            disabled={history.length === 0}
          >
            Clear History ({history.length})
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <p className="settings-label">Clear Current Input</p>
            <p className="settings-desc">Clear the news article text and prediction result.</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={!text && !result}
          >
            Clear Input
          </button>
        </div>
      </div>

      <div className="card">
        <h3>ℹ️ About</h3>
        <div className="model-detail-grid">
          <div className="detail-row">
            <span className="detail-label">Project</span>
            <span className="detail-value">Fake News Detection System</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Technology</span>
            <span className="detail-value">Machine Learning &amp; NLP</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Version</span>
            <span className="detail-value">1.0.0</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Backend API</span>
            <span className="detail-value">http://127.0.0.1:8000</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case 'analyze': return renderAnalyzePage();
      case 'model':   return renderModelPage();
      case 'history': return renderHistoryPage();
      case 'settings': return renderSettingsPage();
      default:        return renderDashboard();
    }
  };

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'analyze',   icon: '🔍', label: 'Analyze News' },
    { id: 'model',     icon: '🤖', label: 'Model Information' },
    { id: 'history',   icon: '📋', label: 'Analysis History' },
    { id: 'settings',  icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <h1>
            <span className="logo-icon">🛡️</span> FND System
          </h1>
        </div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li
                key={item.id}
                className={activePage === item.id ? 'active' : ''}
                onClick={() => navigate(item.id)}
              >
                {item.icon} {item.label}
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <p>Fake News Detection v1.0</p>
          <p>ML + NLP Project</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar menu"
            >
              ☰
            </button>
            <h2>{pageTitles[activePage]}</h2>
          </div>
          <div className="header-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle light or dark theme"
            >
              <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        {renderPage()}
      </div>
    </div>
  );
}

export default App;
