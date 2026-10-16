import { headlineTimeoutMs } from '../aiProviders';
import { useEffect, useRef, useState } from 'react';
import { aiError, generateSlideHeadlines, isApiKeyProvider, type AIConnection } from '../aiProviders';
import { getTranslation, type Language, type TranslationKey } from '../i18n';
import { Sparkles } from 'lucide-react';

type Props = {
  slideId: string;
  description: string;
  projectName: string;
  role: string;
  enabled: boolean;
  connection?: AIConnection;
  token?: string;
  onAccept: (headline: string) => void;
  lang?: Language;
};

export function SlideCaptionAssistant(props: Props) {
  const { slideId, description, projectName, role, enabled, connection, token, onAccept, lang = 'en' } = props;
  const [ideas, setIdeas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [gatewayUnavailable, setGatewayUnavailable] = useState(false);
  const request = useRef<AbortController | null>(null);
  const source = JSON.stringify([slideId, description, projectName, role, enabled, connection, token]);
  const latestSource = useRef(source);
  latestSource.current = source;

  const t = (key: TranslationKey, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  useEffect(() => {
    request.current?.abort();
    setBusy(false);
    setIdeas([]);
    setFeedback('');
    setGatewayUnavailable(false);
    return () => {
      request.current?.abort();
    };
  }, [source]);

  if (!enabled) return null;

  async function generate() {
    if (!connection) {
      setFeedback(lang === 'th' ? 'กรุณาเลือกผู้ให้บริการสำหรับโปรเจกต์นี้ก่อน' : 'Choose a provider for this project first.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const snapshot = source;
    setBusy(true);
    setIdeas([]);
    setFeedback('');
    setGatewayUnavailable(false);
    try {
      let gateway: { available?: boolean } | null = null;
      try {
        const status = await fetch('/api/ai/status', {
          cache: 'no-store',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2500)]),
        });
        const contentType = status.headers.get('content-type') || '';
        gateway = status.ok && contentType.includes('application/json')
          ? await status.json() as { available?: boolean }
          : null;
      } catch {
        if (controller.signal.aborted) return;
      }
      if (!gateway || gateway.available !== true) {
        if (!controller.signal.aborted && latestSource.current === snapshot) setGatewayUnavailable(true);
        return;
      }
      const result = await generateSlideHeadlines(
        connection,
        token,
        { projectName, role, description },
        AbortSignal.any([controller.signal, AbortSignal.timeout(headlineTimeoutMs)])
      );
      if (controller.signal.aborted || latestSource.current !== snapshot) return;
      setIdeas(result);
      setFeedback(
        lang === 'th'
          ? 'ตรวจสอบหรือแก้ไขตัวเลือก จากนั้นกดใช้สำหรับสไลด์นี้ ตรวจสอบให้แน่ใจว่าตรงกับผลงานของคุณ'
          : 'Review or edit an option, then use it for this slide. Check that it matches your work.'
      );
    } catch (error) {
      if (!controller.signal.aborted && latestSource.current === snapshot) setFeedback(aiError(error));
    } finally {
      if (request.current === controller) setBusy(false);
    }
  }

  return (
    <div className="slide-caption-assistant">
      <div className="slide-ai-intro">
        <Sparkles size={18} aria-hidden="true" />
        <div>
          <strong>{t('slideAiTitle')}</strong>
          <p>{t('slideAiDescription')}</p>
        </div>
      </div>
      <div className="slide-ai-action-row">
        <button
          type="button"
          className="outline-btn"
          disabled={busy || !description.trim() || !connection}
          onClick={() => void generate()}
        >
          <Sparkles size={13} /> {busy ? t('writingHeadlines') : t('suggestHeadlines')}
        </button>
      </div>

      {gatewayUnavailable && (
        <aside className="ai-hosted-note slide-ai-hosted-note" role="status">
          <p>
            Want AI Headline Assistance or custom video layouts?{' '}
            <a href="https://github.com/zhephirothz/foliomotion" target="_blank" rel="noreferrer">Clone Folio Motion on GitHub</a>{' '}
            and run <code>bun run dev</code> locally to connect Ollama, LM Studio, or your own API keys.
          </p>
        </aside>
      )}

      <small className="settings-hint" style={{ marginTop: 4, display: 'block' }}>
        {!description.trim()
          ? t('slideAiNeedsDescription')
          : connection
          ? `${lang === 'th' ? 'ใช้งาน' : 'Using'} ${connection.name}${
              isApiKeyProvider(connection.provider)
                ? lang === 'th'
                  ? ` · ส่งคำอธิบายของสไลด์นี้ไปยัง ${connection.name}`
                  : ` · sends this slide’s description to ${connection.name}`
                : lang === 'th'
                ? ' · โมเดลในเครื่อง'
                : ' · local model'
            }`
          : (lang === 'th' ? 'เลือกผู้ให้บริการด้านบน หรือเพิ่มใหม่ในหน้าตั้งค่า' : 'Select a provider above, or add one in Settings.')}
      </small>

      {busy && (
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            request.current?.abort();
            setBusy(false);
          }}
        >
          {t('cancel')}
        </button>
      )}
      {feedback && (
        <p className="ai-feedback" role="status">
          {feedback}
        </p>
      )}
      {ideas.length > 0 && (
        <div className="slide-headline-ideas">
          {ideas.map((idea, index) => (
            <div className="slide-headline-option" key={index}>
              <label htmlFor={`idea-${slideId}-${index}`}>
                {t('headlineOption')} {index + 1} <span>{idea.length}/84</span>
              </label>
              <textarea
                id={`idea-${slideId}-${index}`}
                value={idea}
                maxLength={84}
                rows={2}
                onChange={(e) => setIdeas((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
              />
              <button
                type="button"
                className="primary-btn"
                disabled={!idea.trim()}
                onClick={() => {
                  onAccept(idea.trim());
                  setIdeas([]);
                  setFeedback(
                    lang === 'th'
                      ? 'นำไปใช้กับสไลด์นี้แล้ว คุณยังสามารถแก้ไขพาดหัวต่อได้'
                      : 'Applied to this slide. You can keep editing its headline.'
                  );
                }}
              >
                {t('useThisHeadline')}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setIdeas([]);
              setFeedback(
                lang === 'th'
                  ? 'เก็บไว้หรือเขียนพาดหัวด้วยตนเองด้านล่าง'
                  : 'Keep or write your own headline below.'
              );
            }}
          >
            {t('dismissSuggestions')}
          </button>
        </div>
      )}
    </div>
  );
}
