import { useState } from 'react';
import { aiError, connectProvider, disconnectProvider, isApiKeyProvider, providerDefaults, type AIConnection, type AIProviderKind } from '../aiProviders';
import { getTranslation, type Language, type TranslationKey } from '../i18n';

type Props = {
  connections: AIConnection[];
  onChange: (connections: AIConnection[]) => void;
  sessions: Record<string, string>;
  onSession: (id: string, token?: string) => void;
  lang?: Language;
};

export function AISettings({ connections, onChange, sessions, onSession, lang = 'en' }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const t = (key: TranslationKey, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  function edit(id: string, patch: Partial<AIConnection>) {
    void disconnectProvider(sessions[id]);
    onSession(id);
    setStatus((prev) => ({
      ...prev,
      [id]: lang === 'th' ? 'บันทึกการเปลี่ยนแปลงแล้ว เชื่อมต่อเพื่อตรวจสอบ' : 'Changes saved. Connect to verify.',
    }));
    onChange(connections.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function connect(connection: AIConnection) {
    setBusy(connection.id);
    setStatus((prev) => ({ ...prev, [connection.id]: t('connecting') }));
    try {
      const token = await connectProvider(connection, keys[connection.id] || '');
      await disconnectProvider(sessions[connection.id]);
      onSession(connection.id, token);
      setKeys((prev) => ({ ...prev, [connection.id]: '' }));
      setStatus((prev) => ({
        ...prev,
        [connection.id]:
          lang === 'th'
            ? 'เชื่อมต่อสำเร็จแล้ว เลือกผู้ให้บริการนี้บนโปรเจกต์เพื่อเริ่มใช้งาน'
            : 'Connected. Select this provider on a project to use it.',
      }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, [connection.id]: aiError(error) }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-title">
        <span className="eyebrow">{t('settingsEyebrow')}</span>
        <h1>{t('settingsTitle')}</h1>
        <p>{t('settingsSubtitle')}</p>
      </div>
      <div className="settings-explainer">{t('settingsExplainer')}</div>
      <div className="connection-list">
        {connections.map((connection) => (
          <section className="connection-card" key={connection.id}>
            <header>
              <h2>{connection.name || (lang === 'th' ? 'การเชื่อมต่อ AI' : 'AI connection')}</h2>
              <span className="connection-badge">
                {sessions[connection.id] ? t('connected') : t('notConnected')}
              </span>
            </header>
            <fieldset disabled={busy !== null}>
              <div className="connection-fields">
                <div className="field">
                  <label htmlFor={`name-${connection.id}`}>{t('connectionName')}</label>
                  <input
                    id={`name-${connection.id}`}
                    value={connection.name}
                    maxLength={60}
                    onChange={(e) => edit(connection.id, { name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`provider-${connection.id}`}>{t('provider')}</label>
                  <select
                    id={`provider-${connection.id}`}
                    value={connection.provider}
                    onChange={(e) => {
                      const provider = e.target.value as AIProviderKind;
                      edit(connection.id, { provider, ...providerDefaults[provider] });
                      setKeys((prev) => ({ ...prev, [connection.id]: '' }));
                    }}
                  >
                    <option value="lm-studio">LM Studio · local</option>
                    <option value="ollama">Ollama · local</option>
                    <option value="openai">OpenAI · API key</option>
                    <option value="gemini">Gemini · API key</option>
                    <option value="claude">Claude · API key</option>
                    <option value="grok">Grok (xAI) · API key</option>
                    <option value="openrouter">OpenRouter · API key (many models)</option>
                  </select>
                </div>
                {!isApiKeyProvider(connection.provider) && (
                  <div className="field">
                    <label htmlFor={`endpoint-${connection.id}`}>{t('localServerUrl')}</label>
                    <input
                      id={`endpoint-${connection.id}`}
                      value={connection.endpoint}
                      onChange={(e) => edit(connection.id, { endpoint: e.target.value })}
                    />
                  </div>
                )}
                <div className="field">
                  <label htmlFor={`model-${connection.id}`}>
                    {t('model')}{' '}
                    <span>
                      {isApiKeyProvider(connection.provider) ? t('modelRequired') : t('modelAutoDetect')}
                    </span>
                  </label>
                  <input
                    id={`model-${connection.id}`}
                    value={connection.model}
                    maxLength={200}
                    placeholder={
                      isApiKeyProvider(connection.provider)
                        ? connection.provider === 'openrouter' ? 'provider/model identifier' : 'Model ID from provider'
                        : lang === 'th'
                        ? 'โมเดลข้อความที่คุณติดตั้งไว้'
                        : 'Your installed text model'
                    }
                    onChange={(e) => edit(connection.id, { model: e.target.value })}
                  />
                </div>
                {isApiKeyProvider(connection.provider) && (
                  <div className="field">
                    <label htmlFor={`key-${connection.id}`}>{t('apiKey')}</label>
                    <input
                      id={`key-${connection.id}`}
                      type="password"
                      autoComplete="off"
                      value={keys[connection.id] || ''}
                      onChange={(e) => setKeys((prev) => ({ ...prev, [connection.id]: e.target.value }))}
                      placeholder={
                        sessions[connection.id] ? t('apiKeyPlaceholderConnected') : t('apiKeyPlaceholderInput')
                      }
                    />
                    <small className="settings-hint">{t('apiKeyHint')} {connection.provider === 'openrouter' ? 'OpenRouter can connect to many other model providers.' : 'Your key stays in the local AI gateway memory and is cleared when disconnected or the server restarts.'}</small>
                  </div>
                )}
              </div>
              <div className="connection-actions">
                <button type="button" className="primary-btn" onClick={() => void connect(connection)}>
                  {busy === connection.id ? t('connecting') : t('connectProvider')}
                </button>
                {sessions[connection.id] && (
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={() => {
                      void disconnectProvider(sessions[connection.id]);
                      onSession(connection.id);
                      setStatus((prev) => ({
                        ...prev,
                        [connection.id]: lang === 'th' ? 'ยกเลิกการเชื่อมต่อแล้ว' : 'Disconnected.',
                      }));
                    }}
                  >
                    {t('disconnect')}
                  </button>
                )}
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    void disconnectProvider(sessions[connection.id]);
                    onSession(connection.id);
                    onChange(connections.filter((c) => c.id !== connection.id));
                  }}
                >
                  {t('removeConnection')}
                </button>
              </div>
            </fieldset>
            {status[connection.id] && (
              <p className="ai-feedback" role="status">
                {status[connection.id]}
              </p>
            )}
          </section>
        ))}
      </div>
      <button
        type="button"
        className="outline-btn"
        onClick={() =>
          onChange([
            ...connections,
            { id: crypto.randomUUID(), provider: 'lm-studio', ...providerDefaults['lm-studio'] },
          ])
        }
      >
        {t('addProviderConnection')}
      </button>
    </section>
  );
}
