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
  onDescription: (description: string) => void;
  onAccept: (headline: string) => void;
  lang?: Language;
};

export function SlideCaptionAssistant(props: Props) {
  const { slideId, description, projectName, role, enabled, connection, token, onDescription, onAccept, lang = 'en' } = props;
  const [ideas, setIdeas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showCustomNotes, setShowCustomNotes] = useState(false);
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
    try {
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
      <div className="slide-ai-action-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          className="outline-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          disabled={busy || !description.trim() || !connection}
          onClick={() => void generate()}
        >
          <Sparkles size={13} /> {busy ? t('writingHeadlines') : t('suggestHeadlines')}
        </button>
        <button
          type="button"
          className="text-link-btn"
          style={{ fontSize: 11, color: '#68785e', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          onClick={() => setShowCustomNotes(!showCustomNotes)}
        >
          {showCustomNotes ? (lang === 'th' ? 'ซ่อนโน้ต AI' : 'Hide AI notes') : (lang === 'th' ? 'โน้ตแยกสำหรับ AI' : 'Custom AI notes')}
        </button>
      </div>

      {showCustomNotes && (
        <div style={{ marginTop: 8 }}>
          <label htmlFor={`description-${slideId}`} style={{ fontSize: 11, fontWeight: 600, color: '#56644d' }}>
            {t('assistantLabel')}
          </label>
          <textarea
            id={`description-${slideId}`}
            rows={2}
            maxLength={2000}
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            placeholder={t('assistantPlaceholder')}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>
      )}

      <small className="settings-hint" style={{ marginTop: 4, display: 'block' }}>
        {!description.trim()
          ? (lang === 'th' ? 'กรอกสิ่งที่สร้างสรรค์ในสไลด์นี้ด้านบน เพื่อให้ AI ช่วยแนะนำพาดหัว' : 'Describe what you made on this slide above to suggest AI headlines.')
          : connection
          ? `${lang === 'th' ? 'ใช้งาน' : 'Using'} ${connection.name}${
              isApiKeyProvider(connection.provider)
                ? lang === 'th'
                  ? ` · ส่งคำอธิบายของสไลด์นี้ไปยัง ${connection.name}`
                  : ` · sends this slide’s notes to ${connection.name}`
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
