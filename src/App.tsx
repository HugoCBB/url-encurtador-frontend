import { useState, useEffect, useCallback } from 'react';
import './index.css';
import {
  shortenUrl,
  getBaseUrl,
  setBaseUrl,
} from './services/api';
import type { UrlRecordOutput } from './services/api';

interface HistoryItem {
  shortUrl: string;
  originalUrl: string;
  exp: string;
  createdAt: string;
}

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), timeout);
    });
  }, [timeout]);
  return { copied, copy };
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlRecordOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('url_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [baseUrl, setBaseUrlState] = useState(getBaseUrl);
  const [tempUrl, setTempUrl] = useState(getBaseUrl);

  const { copied, copy } = useClipboard();

  useEffect(() => {
    localStorage.setItem('url_history', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await shortenUrl(url.trim());
      setResult(data);

      setHistory(prev => [
        {
          shortUrl: data.url_converted,
          originalUrl: url.trim(),
          exp: data.exp,
          createdAt: new Date().toLocaleString('pt-BR'),
        },
        ...prev.slice(0, 19),
      ]);

      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao encurtar URL. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setBaseUrl(tempUrl);
    setBaseUrlState(tempUrl);
    setConfigOpen(false);
  };

  const clearHistory = () => setHistory([]);

  const totalLinks = history.length;
  const todayLinks = history.filter(h => {
    const today = new Date().toLocaleDateString('pt-BR');
    return h.createdAt.startsWith(today) || h.createdAt.startsWith(today.split('/').reverse().join('-'));
  }).length;

  return (
    <div className="app">
      <div className="container">
        {/* ── Header ── */}
        <header className="header">
          <div className="header__logo">
            <div className="header__icon">🔗</div>
            <span className="header__brand">URLCut</span>
          </div>
          <h1 className="header__title">
            Encurtador de <span>URLs</span>
          </h1>
          <p className="header__subtitle">
            Transforme links longos em URLs curtos e memoráveis em segundos.
          </p>
        </header>

        {/* ── Stats ── */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-item__value">{totalLinks}</div>
            <div className="stat-item__label">Total</div>
          </div>
          <div className="stat-item">
            <div className="stat-item__value">{todayLinks}</div>
            <div className="stat-item__label">Hoje</div>
          </div>
          <div className="stat-item">
            <div className="stat-item__value">{baseUrl.includes('localhost') ? '🟡' : '🟢'}</div>
            <div className="stat-item__label">API</div>
          </div>
        </div>

        {/* ── Shorten Card ── */}
        <div className="card">
          <form className="shorten-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  id="url-input"
                  type="url"
                  className="url-input"
                  placeholder="https://exemplo.com/link-muito-longo..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="input-icon">🔗</span>
              </div>
              <button
                id="shorten-btn"
                type="submit"
                className="btn-primary"
                disabled={loading || !url.trim()}
              >
                {loading ? <span className="btn-spinner" /> : 'Encurtar'}
              </button>
            </div>
            <div className="base-url-hint">
              <span>API:</span> {baseUrl}
            </div>
          </form>

          {/* ── Error ── */}
          {error && (
            <div className="error-alert" role="alert">
              <span className="error-alert__icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Result ── */}
          {result && (
            <div className="result-card">
              <div className="result-card__label">URL encurtada com sucesso</div>
              <div className="result-url-row">
                <a
                  href={result.url_converted}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-url"
                  id="result-url"
                >
                  {result.url_converted}
                </a>
                <button
                  id="copy-result-btn"
                  className={`btn-copy ${copied === 'result' ? 'copied' : ''}`}
                  onClick={() => copy(result.url_converted, 'result')}
                >
                  {copied === 'result' ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
              <div className="result-meta">
                {result.exp && (
                  <span className="meta-chip">
                    <span className="meta-chip__icon">⏱️</span>
                    Expira em: {result.exp}
                  </span>
                )}
                <span className="meta-chip">
                  <span className="meta-chip__icon">📅</span>
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── History ── */}
        <div className="history-section">
          <div className="section-header">
            <div className="section-title">Histórico</div>
            {history.length > 0 && (
              <button id="clear-history-btn" className="btn-clear" onClick={clearHistory}>
                Limpar
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🕳️</div>
              <p>Nenhuma URL encurtada ainda. Comece agora!</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div
                  key={`${item.shortUrl}-${index}`}
                  className="history-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="history-item__top">
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="history-item__short"
                    >
                      {item.shortUrl}
                    </a>
                    <button
                      className="history-item__copy"
                      title="Copiar URL curta"
                      onClick={() => copy(item.shortUrl, `hist-${index}`)}
                    >
                      {copied === `hist-${index}` ? '✅' : '📋'}
                    </button>
                  </div>
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="history-item__original"
                    title={item.originalUrl}
                  >
                    {item.originalUrl}
                  </a>
                  <div className="history-item__bottom">
                    <span className="badge badge--active">Ativo</span>
                    {item.exp && (
                      <span className="history-item__exp">
                        ⏱️ {item.exp}
                      </span>
                    )}
                    <span className="history-item__exp">📅 {item.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Config button ── */}
      <button
        id="config-btn"
        className="config-btn"
        title="Configurar API"
        onClick={() => { setTempUrl(baseUrl); setConfigOpen(true); }}
      >
        ⚙️
      </button>

      {/* ── Config Modal ── */}
      {configOpen && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setConfigOpen(false); }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__title">⚙️ Configurações da API</div>
            <div className="form-field">
              <label className="form-label" htmlFor="api-url-input">URL base da API</label>
              <input
                id="api-url-input"
                type="url"
                className="form-input"
                placeholder="http://localhost:8080"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfigOpen(false)}>Cancelar</button>
              <button id="save-config-btn" className="btn-save" onClick={handleSaveConfig}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
