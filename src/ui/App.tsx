import { useEffect, useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clapperboard,
  Clock,
  Dices,
  Edit2,
  Film,
  FolderOpen,
  ImagePlus,
  LoaderCircle,
  Play,
  Plus,
  Settings2,
  Sparkles,
  Tag,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { ProjectFilm } from '../ProjectFilm';
import {
  calculateFilmTiming,
  generateLayout,
  hashStringToSeed,
  initialCategories,
  initialProject,
  type CategoryItem,
  type Project,
  type ProjectScreenshot,
} from '../types';
import { defaultConnections, type AIConnection } from '../aiProviders';
import { AISettings } from './AISettings';
import { SlideCaptionAssistant } from './SlideCaptionAssistant';
import { useLocalWorkspace } from '../useLocalWorkspace';
import { getTranslation, LANGUAGE_STORAGE_KEY, type Language, type TranslationKey } from '../i18n';
import './app-author.css';

type Page = 'studio' | 'portfolio' | 'settings';
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const MAX_SCREENSHOTS = 10;
const AI_SETTINGS_KEY = 'folio-motion-local-ai-v1';
const CONNECTIONS_KEY = 'folio-motion-ai-connections-v1';

function Logo() {
  return (
    <a className="brand-lockup" href="/" aria-label="Folio Motion home">
      <span className="brand-mark">f.</span>
      <span>
        folio<span className="brand-light">motion</span>
      </span>
    </a>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('studio');
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'th' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const t = (key: TranslationKey, params?: Record<string, string | number>) => getTranslation(lang, key, params);
  const [activeProjectId, setActiveProjectId] = useState('starter');
  const workspace = useLocalWorkspace();
  const { projects, setProjects, categories, setCategories } = workspace;
  useEffect(() => { if (!projects.some((p) => p.id === activeProjectId)) setActiveProjectId(projects[0]?.id ?? ''); }, [projects, activeProjectId]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const [hydrated, setHydrated] = useState(false);
  const project = projects.find((item) => item.id === activeProjectId)?.project ?? initialProject;
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [suggested, setSuggested] = useState(false);
  const [connections, setConnections] = useState<AIConnection[]>(defaultConnections);
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const projectConnection = connections.find((c) => c.id === (project.aiConnectionId ?? 'default-local'));
  function onSession(id: string, token?: string) {
    setSessions((current) => { const next = { ...current }; if (token) next[id] = token; else delete next[id]; return next; });
  }
  const [uploadBusy, setUploadBusy] = useState(false);

  const timing = useMemo(
    () => calculateFilmTiming(project.screenshots, FPS, project.category),
    [project.screenshots, project.category]
  );
  const totalDurationInFrames = timing.totalFrames;
  const totalDurationSeconds = timing.totalSeconds;


  useEffect(() => {
    try {
      const savedConnections = localStorage.getItem(CONNECTIONS_KEY);
      if (savedConnections) setConnections(JSON.parse(savedConnections));
      else {
        const legacy = localStorage.getItem(AI_SETTINGS_KEY);
        if (legacy) { const saved = JSON.parse(legacy); setConnections([{ ...defaultConnections[0], ...saved, id: 'default-local', name: saved.provider === 'ollama' ? 'Ollama' : 'LM Studio' }]); }
      }
    } catch { /* Keep the default connection if a saved configuration cannot be read. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  }, [connections, hydrated]);

  const update = (key: keyof Project, value: string) =>
    setProjects((current) =>
      current.map((item) => (item.id === activeProjectId ? { ...item, project: { ...item.project, [key]: value } } : item))
    );

  const updateScreenshot = (screenshotId: string, updates: Partial<ProjectScreenshot>) => {
    setProjects((current) =>
      current.map((item) => {
        if (item.id !== activeProjectId) return item;
        return {
          ...item,
          project: {
            ...item.project,
            screenshots: item.project.screenshots.map((shot) =>
              shot.id === screenshotId ? { ...shot, ...updates } : shot
            ),
          },
        };
      })
    );
  };

  const addCategory = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage('Enter a category name.');
      return null;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setMessage(t('categoryExists'));
      return null;
    }
    const newItem: CategoryItem = { id: crypto.randomUUID(), name: trimmed };
    setCategories((prev) => [...prev, newItem]);
    setNewCategoryName('');
    setMessage(t('categoryAdded', { name: trimmed }));
    return trimmed;
  };

  const renameCategory = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setMessage(lang === 'th' ? 'ชื่อหมวดหมู่ต้องไม่ว่างเปล่า' : 'Category name cannot be empty.');
      return;
    }
    const oldCat = categories.find((c) => c.id === id);
    if (!oldCat) return;
    const oldName = oldCat.name;
    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      setMessage(t('categoryExists'));
      return;
    }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
    setProjects((prev) =>
      prev.map((item) => ({
        ...item,
        project: {
          ...item.project,
          category: item.project.category === oldName ? trimmed : item.project.category,
          screenshots: item.project.screenshots.map((s) => ({
            ...s,
            category: s.category === oldName ? trimmed : s.category,
          })),
        },
      }))
    );
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setMessage(t('categoryRenamed', { name: trimmed }));
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) {
      setMessage(lang === 'th' ? 'คุณต้องเก็บหมวดหมู่ไว้อย่างน้อยหนึ่งหมวดหมู่ในข้อมูลหลัก' : 'You must keep at least one category in master data.');
      return;
    }
    const catToDelete = categories.find((c) => c.id === id);
    if (!catToDelete) return;
    const fallback = categories.find((c) => c.id !== id)?.name || 'Selected work';
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProjects((prev) =>
      prev.map((item) => ({
        ...item,
        project: {
          ...item.project,
          category: item.project.category === catToDelete.name ? fallback : item.project.category,
          screenshots: item.project.screenshots.map((s) => ({
            ...s,
            category: s.category === catToDelete.name ? '' : s.category,
          })),
        },
      }))
    );
    setMessage(t('categoryRemoved', { name: catToDelete.name }));
  };

  const resetCategories = () => {
    setCategories(initialCategories);
    setMessage(t('categoriesReset'));
  };

  const rerollScreenshotLayout = (screenshotId: string) => {
    const newSeed = Math.floor(Math.random() * 1000000);
    updateScreenshot(screenshotId, { layoutSeed: newSeed });
    setMessage(t('rerandomizedSlide'));
  };

  const randomizeAllLayouts = () => {
    if (project.screenshots.length === 0) return;
    setProjects((current) =>
      current.map((item) => {
        if (item.id !== activeProjectId) return item;
        return {
          ...item,
          project: {
            ...item.project,
            screenshots: item.project.screenshots.map((shot) => ({
              ...shot,
              layoutSeed: Math.floor(Math.random() * 1000000),
            })),
          },
        };
      })
    );
    setMessage(t('rerandomizedAll'));
  };

  const addProject = () => {
    const id = crypto.randomUUID();
    const defaultCat = categories[0]?.name || 'Selected work';
    setProjects((current) => [
      ...current,
      { id, project: { ...initialProject, category: defaultCat, name: lang === 'th' ? 'โปรเจกต์ใหม่' : 'Untitled work' } },
    ]);
    setActiveProjectId(id);
    setPage('studio');
    setSuggested(false);
    setMessage(t('newProjectDraftReady'));
  };

  const ready = Boolean(project.name.trim() && project.headline.trim());

  async function onUpload(selected: File | undefined) {
    if (!selected) return;
    if (uploadBusy) return;
    if (project.screenshots.length >= MAX_SCREENSHOTS) {
      setMessage(t('maxScreenshotsNote', { max: MAX_SCREENSHOTS }));
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      setMessage(t('chooseValidImage'));
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setMessage(t('fileTooLarge'));
      return;
    }
    const screenshotId = crypto.randomUUID();
    const randomSeed = Math.floor(Math.random() * 1000000);
    setUploadBusy(true);
    try {

      const src = URL.createObjectURL(selected);
      workspace.trackUrl(src);
      const screenshot: ProjectScreenshot = {
        id: screenshotId,
        name: selected.name,
        src,
        durationSeconds: 2.0,
        caption: '',
        summary: '',
        category: '',
        layoutSeed: randomSeed,
      };
      setProjects((current) =>
        current.map((item) =>
          item.id === activeProjectId
            ? { ...item, project: { ...item.project, screenshots: [...item.project.screenshots, screenshot] } }
            : item
        )
      );
      setMessage(t('screenshotAdded'));
    } catch {
      setMessage(t('cantSaveImage'));
    } finally {
      setUploadBusy(false);
    }
  }

  async function removeScreenshot(screenshot: ProjectScreenshot) {
    try {

      setProjects((current) =>
        current.map((item) =>
          item.id === activeProjectId
            ? {
                ...item,
                project: {
                  ...item.project,
                  screenshots: item.project.screenshots.filter((shot) => shot.id !== screenshot.id),
                },
              }
            : item
        )
      );
      setMessage(t('screenshotRemoved'));
    } catch {
      setMessage(t('cantRemoveImage'));
    }
  }

  function moveScreenshot(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= project.screenshots.length) return;
    setProjects((current) =>
      current.map((item) => {
        if (item.id !== activeProjectId) return item;
        const screenshots = [...item.project.screenshots];
        [screenshots[index], screenshots[target]] = [screenshots[target], screenshots[index]];
        return { ...item, project: { ...item.project, screenshots } };
      })
    );
  }

  async function exportVideo() {
    setMessage('');
    setRendering(true);
    setRenderProgress(0);
    try {
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import('@remotion/web-renderer');
      let chosenBitrate: 'very-high' | 'high' | undefined = 'very-high';
      let support = await canRenderMediaOnWeb({
        width: WIDTH,
        height: HEIGHT,
        container: 'mp4',
        videoCodec: 'h264',
        videoBitrate: chosenBitrate,
      });
      if (!support.canRender) {
        chosenBitrate = 'high';
        support = await canRenderMediaOnWeb({
          width: WIDTH,
          height: HEIGHT,
          container: 'mp4',
          videoCodec: 'h264',
          videoBitrate: chosenBitrate,
        });
      }
      if (!support.canRender) {
        chosenBitrate = undefined;
        support = await canRenderMediaOnWeb({ width: WIDTH, height: HEIGHT, container: 'mp4', videoCodec: 'h264' });
      }
      if (!support.canRender) {
        throw new Error(
          support.issues.map((item) => item.message).join(' ') ||
            (lang === 'th'
              ? 'เบราว์เซอร์นี้ไม่รองรับการส่งออก MP4 กรุณาลองใช้ Chrome เวอร์ชันล่าสุด'
              : 'This browser does not support MP4 export. Try a recent version of Chrome.')
        );
      }
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: 'PortfolioFilm',
          component: ProjectFilm,
          durationInFrames: totalDurationInFrames,
          fps: FPS,
          width: WIDTH,
          height: HEIGHT,
          calculateMetadata: null,
          defaultProps: { project },
        },
        inputProps: { project },
        container: 'mp4',
        videoCodec: 'h264',
        ...(chosenBitrate ? { videoBitrate: chosenBitrate } : {}),
        muted: true,
        onProgress: ({ progress }) => setRenderProgress(Math.round(progress * 100)),
      });
      const blob = await getBlob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${(project.name || 'portfolio-film')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${totalDurationSeconds.toFixed(1)}s.mp4`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setMessage(t('exportReady', { time: totalDurationSeconds.toFixed(1) }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('exportError'));
    } finally {
      setRendering(false);
    }
  }

  function draftCaptions() {
    if (!project.summary.trim()) {
      setMessage(t('addSummaryFirst'));
      return;
    }
    const cleanSummary = project.summary.trim().replace(/[.!?]+$/, '');
    const words = cleanSummary.split(/\s+/).slice(0, 8).join(' ');
    update('headline', words.length ? `${words}.` : (lang === 'th' ? 'อีกหนึ่งผลงานที่ใส่ใจทุกรายละเอียด' : 'A little more than a screenshot.'));
    setSuggested(true);
    setMessage(t('quickDraftFromNotes'));
  }

  function updateProjectAI(patch: Pick<Partial<Project>, 'aiEnabled' | 'aiConnectionId'>) {
    setProjects((current) => current.map((item) => item.id === activeProjectId ? { ...item, project: { ...item.project, ...patch } } : item));
  }


  return (
    <div className="app-shell">
      <aside className="sidebar" inert={!workspace.loaded}>
        <Logo />
        <div className="side-label">{t('workspace')}</div>
        <button className={`nav-item ${page === 'studio' ? 'selected' : ''}`} onClick={() => setPage('studio')}>
          <Clapperboard size={17} /> <span>{t('studio')}</span>
          <span className="nav-count">{String(projects.length).padStart(2, '0')}</span>
        </button>
        <button className={`nav-item ${page === 'portfolio' ? 'selected' : ''}`} onClick={() => setPage('portfolio')}>
          <FolderOpen size={17} /> <span>{t('portfolioPreview')}</span>
        </button>
        <button className={`nav-item ${page === 'settings' ? 'selected' : ''}`} onClick={() => setPage('settings')}>
          <Settings2 size={17} /><span>{t('aiSettings')}</span>
        </button>
        <button className="nav-item master-nav-btn" onClick={() => setShowCategoryModal(true)}>
          <Tags size={17} /> <span>{t('masterCategories')}</span>
          <span className="nav-count">{categories.length}</span>
        </button>
        <div className="side-label projects-label">
          {t('yourProjects')}{' '}
          <button aria-label={t('addProject')} onClick={addProject}>
            <Plus size={15} />
          </button>
        </div>
        {projects.map((item) => (
          <button
            key={item.id}
            className={`project-link ${item.id === activeProjectId ? 'project-current' : ''}`}
            onClick={() => {
              setActiveProjectId(item.id);
              setPage('studio');
              setSuggested(false);
              setMessage('');
            }}
          >
            <span className="project-dot" />
            {item.project.name || (lang === 'th' ? 'โปรเจกต์ไม่มีชื่อ' : 'Untitled project')}
            <span className="draft-pill">{t('draft')}</span>
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="plan-card">
            <span className="plan-icon">
              <Sparkles size={15} />
            </span>
            <div>
              <b>{t('brandTagline')}</b>
              <small>{t('brandSub')}</small>
            </div>
            <ArrowUpRight size={15} />
          </div>
          <div className="user-line">
            <span className="avatar">FM</span>
            <div>
              <b>{lang === 'th' ? 'พื้นที่ทำงานในเบราว์เซอร์' : 'Browser workspace'}</b>
              <small>{lang === 'th' ? 'บันทึกไว้ในอุปกรณ์นี้' : 'Saved on this device'}</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>{t('workspace')}</span>
            <b>/</b>
            <span>{page === 'studio' ? t('topStudio') : page === 'settings' ? t('topSettings') : t('topPortfolio')}</span>
          </div>
          <div className="top-actions" inert={!workspace.loaded}>
            <div className="lang-toggle" role="group" aria-label="Language selection">
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                title="Switch to English"
              >
                EN
              </button>
              <span className="lang-divider">/</span>
              <button
                type="button"
                className={`lang-btn ${lang === 'th' ? 'active' : ''}`}
                onClick={() => setLang('th')}
                aria-pressed={lang === 'th'}
                title="เปลี่ยนเป็นภาษาไทย"
              >
                TH
              </button>
            </div>
            <span className="saved-indicator">
              <i />
              {!workspace.loaded ? (lang === 'th' ? 'กำลังเปิด…' : 'Opening…') : workspace.error ? (lang === 'th' ? 'พื้นที่จัดเก็บมีปัญหา' : 'Storage issue') : workspace.saving ? (lang === 'th' ? 'กำลังบันทึก…' : 'Saving…') : workspace.dirty ? (lang === 'th' ? 'มีการเปลี่ยนแปลง' : 'Unsaved changes') : (lang === 'th' ? 'บันทึกในเบราว์เซอร์แล้ว' : 'Saved in browser')}
            </span>
            <button className="preview-btn" onClick={() => setPage(page === 'studio' ? 'portfolio' : 'studio')}>
              <ArrowUpRight size={14} />
              {page === 'studio' ? t('viewPortfolio') : t('backToStudio')}
            </button>
            <button className="primary-btn top-export" onClick={exportVideo} disabled={rendering}>
              {rendering ? <LoaderCircle className="spin" size={15} /> : <ArrowDownToLine size={15} />}
              {rendering ? `${t('renderingProgress')} ${renderProgress}%` : `${t('exportFilm')} (${totalDurationSeconds.toFixed(1)}${lang === 'th' ? 'วิ' : 's'})`}
            </button>
          </div>
        </header>

        {workspace.error && <div className="workspace-error" role="alert">{workspace.error}</div>}
        {!workspace.loaded && <div className="workspace-loading" role="status">{lang === 'th' ? 'กำลังเปิดพื้นที่ทำงานในเบราว์เซอร์…' : 'Opening your browser workspace…'}</div>}
        <div inert={!workspace.loaded} aria-busy={!workspace.loaded}>
        {page === 'settings' ? (
          <AISettings
            connections={connections}
            onChange={setConnections}
            sessions={sessions}
            onSession={onSession}
            lang={lang}
          />
        ) : page === 'studio' ? (
          <>
            <section className="intro-row">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> {t('videoWorkspace')}
                </div>
                <h1>
                  {t('heroTitleLine1')}
                  <br />
                  <span>{t('heroTitleLine2')}</span>
                </h1>
                <p>{t('heroSubtitle')}</p>
              </div>
              <div className="intro-mark">
                <span>{String(timing.scenes.length).padStart(2, '0')}</span>
                <div>
                  {t('dynamicFilm')}
                  <br />
                  <b>{totalDurationSeconds.toFixed(1)} {t('secRatio')}</b>
                  <br />
                  {project.screenshots.length} {t('imagesCount')}
                </div>
              </div>
            </section>

            <section className="editor-grid">
              <div className="preview-column">
                <div className="section-top">
                  <div>
                    <div className="eyebrow">
                      <span className="eyebrow-line" /> {t('livePreview')}
                    </div>
                    <h2>{project.name || t('yourProjectFilm')}</h2>
                  </div>
                  <div className="preview-meta">
                    <span>
                      <i /> {t('live')} · {totalDurationSeconds.toFixed(1)}{lang === 'th' ? 'วิ' : 's'}
                    </span>
                    <span>1920 × 1080</span>
                  </div>
                </div>
                <div className="player-wrap">
                  <Player
                    component={ProjectFilm}
                    inputProps={{ project }}
                    durationInFrames={totalDurationInFrames}
                    compositionWidth={WIDTH}
                    compositionHeight={HEIGHT}
                    fps={FPS}
                    controls
                    loop
                    clickToPlay
                    style={{ width: '100%' }}
                  />
                  {project.screenshots.length === 0 && (
                    <div className="sample-ribbon">
                      {lang === 'th' ? 'ตัวอย่างฉากจำลอง · เพิ่มภาพหน้าจอของคุณ' : 'SAMPLE SEQUENCE · ADD SCREENSHOTS'}
                    </div>
                  )}
                </div>
                <div className="timeline-card">
                  <div className="timeline-head">
                    <div>
                      <span className="eyebrow">{t('filmStructure')}</span>
                      <b>
                        {timing.scenes.length} {lang === 'th' ? 'ฉาก' : timing.scenes.length === 1 ? 'scene' : 'scenes'} <i>·</i> {totalDurationSeconds.toFixed(1)} {lang === 'th' ? 'วินาที' : 'seconds'}
                      </b>
                    </div>
                    <div className="timeline-actions">
                      {project.screenshots.length > 0 && (
                        <button className="text-btn" onClick={randomizeAllLayouts} title={t('rerandomizeAllLayouts')}>
                          <Dices size={14} /> {t('rerollLayouts')}
                        </button>
                      )}
                      <button className="text-btn" onClick={draftCaptions}>
                        <Sparkles size={14} /> {t('quickDraft')}
                      </button>
                    </div>
                  </div>
                  <div className="scene-list">
                    {timing.scenes.map((scene) => {
                      const startSec = (scene.startFrame / FPS).toFixed(1);
                      const endSec = ((scene.startFrame + scene.durationInFrames) / FPS).toFixed(1);
                      return (
                        <div key={scene.id} className="scene">
                          <span className="scene-no">{String(scene.index + 1).padStart(2, '0')}</span>
                          <div
                            className="scene-thumb"
                            style={scene.screenshot?.src ? { backgroundImage: `url(${scene.screenshot.src})` } : undefined}
                          >
                            {!scene.screenshot?.src && <Film size={15} />}
                          </div>
                          <div className="scene-copy">
                            <b>{scene.caption || (scene.index === 0 ? project.headline : (lang === 'th' ? `ภาพ 0${scene.index + 1}` : `Image 0${scene.index + 1}`))}</b>
                            <small>
                              {startSec}{lang === 'th' ? 'วิ' : 's'} – {endSec}{lang === 'th' ? 'วิ' : 's'} ({scene.durationSeconds.toFixed(1)}{lang === 'th' ? 'วิ' : 's'})
                            </small>
                            <span className="alignment-pill-mini">
                              {scene.category.toUpperCase()} · {scene.layout.label.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {message && (
                  <div className="notice" role="status">
                    <span>{message}</span>
                    <button aria-label={t('dismissNotice')} onClick={() => setMessage('')}>
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              <aside className="inspector">
                <div className="inspector-head">
                  <div>
                    <span className="eyebrow">{t('projectDetails')}</span>
                    <h3>{t('tellYourStory')}</h3>
                  </div>
                  <span className="step-count">
                    {timing.scenes.length} {lang === 'th' ? 'ฉาก' : timing.scenes.length === 1 ? 'SCENE' : 'SCENES'} · {totalDurationSeconds.toFixed(1)}{lang === 'th' ? 'วิ' : 'S'}
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="project-name">{t('projectName')}</label>
                  <input
                    id="project-name"
                    value={project.name}
                    onChange={(e) => update('name', e.target.value)}
                    maxLength={42}
                    placeholder={t('projectNamePlaceholder')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="project-headline">
                    {t('openingLineLabel')} <span>{t('theHook')}</span>
                  </label>
                  <textarea
                    id="project-headline"
                    value={project.headline}
                    onChange={(e) => update('headline', e.target.value)}
                    maxLength={84}
                    rows={2}
                    placeholder={t('openingLinePlaceholder')}
                  />
                  <div className="field-footer">
                    {t('openingLineHint')} <span>{project.headline.length}/84</span>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="project-summary">{t('whatDidYouMake')}</label>
                  <textarea
                    id="project-summary"
                    value={project.summary}
                    onChange={(e) => update('summary', e.target.value)}
                    maxLength={180}
                    rows={3}
                    placeholder={t('projectSummaryPlaceholder')}
                  />
                  <div className="field-footer">
                    {t('projectSummaryHint')} <span>{project.summary.length}/180</span>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="project-role">{t('yourContribution')}</label>
                  <input
                    id="project-role"
                    value={project.role}
                    onChange={(e) => update('role', e.target.value)}
                    maxLength={38}
                    placeholder={t('yourRolePlaceholder')}
                  />
                </div>

                {/* Project Category with Master Data */}
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="project-category">{t('projectCategory')}</label>
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={() => setShowCategoryModal(true)}
                      title={t('modalMasterDataTitle')}
                    >
                      <Settings2 size={12} /> {t('masterData')}
                    </button>
                  </div>
                  <div className="select-wrap">
                    <select
                      id="project-category"
                      value={project.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setShowCategoryModal(true);
                        } else {
                          update('category', e.target.value);
                        }
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__NEW__">{t('manageAddNew')}</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>

                <section className="project-ai-mode">
                  <label className="ai-mode-toggle"><input type="checkbox" checked={Boolean(project.aiEnabled)} onChange={(e) => updateProjectAI({ aiEnabled: e.target.checked })} /><span><b>{t('aiHeadlinesForProject')}</b><small>{t('aiHeadlinesSub')}</small></span></label>
                  {project.aiEnabled && <><div className="field"><label htmlFor="project-ai-provider">{t('aiProviderLabel')}</label><select id="project-ai-provider" value={project.aiConnectionId ?? 'default-local'} onChange={(e) => updateProjectAI({ aiConnectionId: e.target.value })}><option value="" disabled>{t('chooseConnection')}</option>{!projectConnection && <option value={project.aiConnectionId ?? 'default-local'} disabled>{t('providerUnavailable')}</option>}{connections.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.model || t('autoDetectModel')}</option>)}</select></div><p>{t('aiProjectDesc')}</p></>}
                  <button className="text-btn" onClick={() => setPage('settings')}>{t('manageProviderConnections')}</button>
                </section>

                {/* DYNAMIC SCREENSHOTS & SCENES SECTION */}
                <div className="field upload-field">
                  <div className="screenshot-heading">
                    <div className="screenshot-heading-title">
                      <span>{t('screenshotsHeading')}</span>
                      <small>
                        {project.screenshots.length} / {MAX_SCREENSHOTS} · {totalDurationSeconds.toFixed(1)}{lang === 'th' ? ' วิ' : 's total'}
                      </small>
                    </div>
                    {project.screenshots.length > 1 && (
                      <button
                        type="button"
                        className="shuffle-all-btn"
                        onClick={randomizeAllLayouts}
                        title={t('rerandomizeAllLayouts')}
                      >
                        <Dices size={15} /> {t('rerandomizeAllLayouts')}
                      </button>
                    )}
                  </div>
                  <p className="screenshot-help">
                    {t('screenshotsHelp')}
                  </p>

                  <div className="screenshot-list">
                    {project.screenshots.map((shot, index) => {
                      const dur = shot.durationSeconds ?? 2.0;
                      const sceneLayout =
                        timing.scenes.find((s) => s.id === shot.id)?.layout ??
                        generateLayout(shot.layoutSeed ?? hashStringToSeed(shot.id), index);

                      return (
                        <div className="screenshot-card" key={shot.id}>
                          <div className="screenshot-card-header">
                            <div className="screenshot-card-title">
                              <span className="screenshot-card-index">{String(index + 1).padStart(2, '0')}</span>
                              <span className="screenshot-card-filename">{shot.name}</span>
                            </div>
                            <div className="screenshot-card-actions">
                              <button
                                type="button"
                                aria-label={lang === 'th' ? `เลื่อน ${shot.name} ขึ้น` : `Move ${shot.name} earlier`}
                                title={t('moveEarlier')}
                                onClick={() => moveScreenshot(index, -1)}
                                disabled={index === 0}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                aria-label={lang === 'th' ? `เลื่อน ${shot.name} ลง` : `Move ${shot.name} later`}
                                title={t('moveLater')}
                                onClick={() => moveScreenshot(index, 1)}
                                disabled={index === project.screenshots.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                aria-label={lang === 'th' ? `ลบ ${shot.name}` : `Remove ${shot.name}`}
                                title={t('removeScreenshot')}
                                onClick={() => removeScreenshot(shot)}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="screenshot-card-body">
                            <div
                              className="screenshot-preview-thumb"
                              style={shot.src ? { backgroundImage: `url(${shot.src})` } : undefined}
                            >
                              {!shot.src && <ImagePlus size={20} />}
                            </div>

                            <div className="screenshot-card-controls">
                              {/* Duration Selector 0.5s - 3.0s */}
                              <div className="control-group">
                                <div className="control-label-row">
                                  <label>
                                    <Clock size={13} /> {t('duration')}: <b>{dur.toFixed(1)}{lang === 'th' ? 'วิ' : 's'}</b>
                                  </label>
                                  <div className="preset-buttons">
                                    {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((preset) => (
                                      <button
                                        type="button"
                                        key={preset}
                                        className={`preset-btn ${dur === preset ? 'active' : ''}`}
                                        onClick={() => updateScreenshot(shot.id, { durationSeconds: preset })}
                                      >
                                        {preset}{lang === 'th' ? 'วิ' : 's'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  className="duration-range-slider"
                                  min="0.5"
                                  max="3.0"
                                  step="0.1"
                                  value={dur}
                                  onChange={(e) =>
                                    updateScreenshot(shot.id, { durationSeconds: parseFloat(e.target.value) })
                                  }
                                />
                              </div>

                              {/* Slide Category from Master Data */}
                              <div className="control-group">
                                <div className="control-label-row">
                                  <label>
                                    <Tag size={12} /> {t('slideCategory')}
                                  </label>
                                  <button
                                    type="button"
                                    className="text-link-btn"
                                    onClick={() => setShowCategoryModal(true)}
                                    title={t('modalMasterDataTitle')}
                                  >
                                    <Settings2 size={11} /> {t('masterData')}
                                  </button>
                                </div>
                                <div className="select-wrap">
                                  <select
                                    value={shot.category || ''}
                                    onChange={(e) => {
                                      if (e.target.value === '__NEW__') {
                                        setShowCategoryModal(true);
                                      } else {
                                        updateScreenshot(shot.id, { category: e.target.value });
                                      }
                                    }}
                                  >
                                    <option value="">{t('defaultCategory')} ({project.category || (lang === 'th' ? 'งานที่เลือก' : 'Selected work')})</option>
                                    {categories.map((cat) => (
                                      <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                      </option>
                                    ))}
                                    <option value="__NEW__">{t('manageAddNew')}</option>
                                  </select>
                                  <ChevronDown size={14} />
                                </div>
                              </div>

                              {/* Per-image Headline */}
                              <div className="control-group">
                                <div className="control-label-row">
                                  <label htmlFor={`headline-${shot.id}`}>{t('slideHeadlineLabel')}</label>
                                  <span className="char-count">{(shot.caption || '').length}/84</span>
                                </div>
                                <input
                                  type="text"
                                  className="shot-caption-input"
                                  id={`headline-${shot.id}`}
                                  maxLength={84}
                                  placeholder={index === 0 ? project.headline : t('imageCaptionPlaceholder')}
                                  value={shot.caption || ''}
                                  onChange={(e) => updateScreenshot(shot.id, { caption: e.target.value })}
                                />
                              </div>

                              {/* Per-image What Did You Make / Summary */}
                              <div className="control-group">
                                <div className="control-label-row">
                                  <label htmlFor={`summary-${shot.id}`}>{t('slideSummaryLabel')}</label>
                                  <span className="char-count">{((shot.summary ?? shot.description) || '').length}/180</span>
                                </div>
                                <textarea
                                  className="shot-summary-input"
                                  id={`summary-${shot.id}`}
                                  rows={2}
                                  maxLength={180}
                                  placeholder={t('slideSummaryPlaceholder')}
                                  value={shot.summary ?? shot.description ?? ''}
                                  onChange={(e) => updateScreenshot(shot.id, { summary: e.target.value, description: e.target.value })}
                                />
                              </div>

                              <SlideCaptionAssistant
                                key={`${activeProjectId}:${shot.id}`}
                                slideId={shot.id}
                                description={shot.summary ?? shot.description ?? ''}
                                projectName={project.name}
                                role={project.role}
                                enabled={Boolean(project.aiEnabled)}
                                connection={projectConnection}
                                token={projectConnection ? sessions[projectConnection.id] : undefined}
                                lang={lang}
                                onDescription={(description) => updateScreenshot(shot.id, { description, summary: description })}
                                onAccept={(caption) => updateScreenshot(shot.id, { caption })}
                              />

                              {/* Automatic Procedural Layout Compose */}
                              <div className="control-group">
                                <div className="control-label-row">
                                  <label>{t('pageComposition')}</label>
                                  <button
                                    type="button"
                                    className="reroll-compose-btn"
                                    onClick={() => rerollScreenshotLayout(shot.id)}
                                    title={t('rerollLayout')}
                                  >
                                    <Dices size={13} /> {t('rerollLayout')}
                                  </button>
                                </div>
                                <div className="compose-status-card">
                                  <div className="compose-badge">
                                    <Sparkles size={13} />
                                    <b>{sceneLayout.label}</b>
                                    <span className="compose-rot">
                                      {sceneLayout.cardRotation > 0 ? `+${sceneLayout.cardRotation}°` : `${sceneLayout.cardRotation}°`}
                                    </span>
                                    {sceneLayout.hasBackingCard && <span className="compose-tag">{t('layered')}</span>}
                                  </div>
                                  <div className="compose-desc">{sceneLayout.description}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {project.screenshots.length < MAX_SCREENSHOTS && (
                    <label className="upload-box">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadBusy}
                        onChange={(e) => {
                          void onUpload(e.target.files?.[0]);
                          e.currentTarget.value = '';
                        }}
                      />
                      <span className="upload-icon">
                        {uploadBusy ? <LoaderCircle className="spin" size={19} /> : <ImagePlus size={19} />}
                      </span>
                      <span className="upload-copy">
                        <b>{uploadBusy ? t('savingScreenshot') : t('addScreenshotStep', { count: project.screenshots.length + 1 })}</b>
                        <small>{t('uploadFormatHint')}</small>
                      </span>
                    </label>
                  )}
                </div>

                {suggested && (
                  <div className="suggested-note">
                    <Check size={13} /> {t('suggestedNote')}
                  </div>
                )}

                <div className="inspector-footer">
                  <span>
                    <span className="complete-dot" /> {ready ? t('lookingGood') : t('addNameAndHook')}
                  </span>
                  <button className="primary-btn" onClick={exportVideo} disabled={rendering || !ready}>
                    {rendering ? <LoaderCircle className="spin" size={15} /> : <ArrowDownToLine size={15} />}
                    {rendering ? `${t('renderingProgress')} ${renderProgress}%` : t('makeMyFilm', { time: totalDurationSeconds.toFixed(1) })}
                  </button>
                </div>
                <p className="private-note">
                  {lang === 'th' ? 'ผลงานของคุณบันทึกไว้ในเบราว์เซอร์นี้ การส่งออกเบราว์เซอร์ส่ง telemetry ตามเอกสารของ Remotion' : 'Your projects stay in this browser. Browser export sends Remotion’s documented render telemetry.'}
                </p>
              </aside>
            </section>
          </>
        ) : (
          <section className="portfolio-page">
            <div className="portfolio-top">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> {t('portfolioDraftEyebrow')}
                </div>
                <h1>
                  {t('portfolioHeroTitle1')}
                  <br />
                  <span>{t('portfolioHeroTitle2')}</span>
                </h1>
                <p>
                  {t('portfolioHeroSub1')}
                  <br />
                  {t('portfolioHeroSub2')}
                </p>
              </div>
              <div className="portfolio-index">
                {lang === 'th' ? 'พอร์ตโฟลิโอ' : 'PORTFOLIO'}
                <br />
                <b>
                  {String(projects.length).padStart(2, '0')} {lang === 'th' ? 'โปรเจกต์' : projects.length === 1 ? 'PROJECT' : 'PROJECTS'}
                </b>
              </div>
            </div>
            <div className="portfolio-film">
              <div className="portfolio-film-label">
                <span>{t('featuredProject')}</span>
                <span>
                  {String(timing.scenes.length).padStart(2, '0')} {lang === 'th' ? 'ฉาก' : timing.scenes.length === 1 ? 'SCENE' : 'SCENES'} · {totalDurationSeconds.toFixed(1)}{lang === 'th' ? 'วิ' : 'S'}
                </span>
              </div>
              <div className="portfolio-player">
                <Player
                  component={ProjectFilm}
                  inputProps={{ project }}
                  durationInFrames={totalDurationInFrames}
                  compositionWidth={WIDTH}
                  compositionHeight={HEIGHT}
                  fps={FPS}
                  controls
                  loop
                  clickToPlay
                  style={{ width: '100%' }}
                />
              </div>
              <div className="portfolio-film-caption">
                <div>
                  <span className="eyebrow">{project.category.toUpperCase()}</span>
                  <h2>{project.name}</h2>
                  <p>{project.summary}</p>
                </div>
                <button className="outline-btn" onClick={() => setPage('studio')}>
                  {t('editThisProject')} <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
            <div className="work-index">
              <div className="work-index-head">
                <span className="eyebrow">{t('bodyOfWork')}</span>
                <span>
                  {String(projects.length).padStart(2, '0')} {lang === 'th' ? 'โปรเจกต์' : projects.length === 1 ? 'PROJECT' : 'PROJECTS'}
                </span>
              </div>
              <div className="work-grid">
                {projects.map((item, index) => {
                  const itemTiming = calculateFilmTiming(item.project.screenshots, FPS, item.project.category);
                  return (
                    <button
                      key={item.id}
                      className={`work-card ${item.id === activeProjectId ? 'work-card-active' : ''}`}
                      onClick={() => {
                        setActiveProjectId(item.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <span className="work-card-number">
                        0{index + 1} / {item.project.category.toUpperCase()}
                      </span>
                      <span
                        className="work-card-visual"
                        style={
                          item.project.screenshots[0]?.src
                            ? {
                                backgroundImage: `linear-gradient(0deg,#25272266,#25272200 68%),url(${item.project.screenshots[0].src})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      >
                        <span className="work-card-play">
                          <Play size={14} fill="currentColor" />
                        </span>
                        <span>{itemTiming.totalSeconds.toFixed(1)} {t('secFilm')}</span>
                      </span>
                      <span className="work-card-title">{item.project.name}</span>
                      <span className="work-card-summary">{item.project.summary}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="portfolio-bottom">
              <span>{t('portfolioBottomLine')}</span>
              <button className="text-btn" onClick={() => setPage('studio')}>
                {t('backToTheStudio')} <ArrowUpRight size={14} />
              </button>
            </div>
          </section>
        )}
        <footer className="page-footer">
          <span>
            {t('footerStudioNote')}
          </span>
          <span>{t('footerPrototypeNote')}</span>
          <span className="app-author-credit">Made by <a href="https://jorvor.net" target="_blank" rel="noreferrer">jorvor <ArrowUpRight size={12} /></a></span>
        </footer>
        </div>
      </main>

      {/* MASTER DATA CATEGORIES MODAL */}
      {showCategoryModal && (
        <div className="modal-backdrop" onClick={() => setShowCategoryModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-cat-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  <Tags size={12} /> {t('modalMasterDataEyebrow')}
                </span>
                <h3 id="modal-cat-title">{t('modalMasterDataTitle')}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowCategoryModal(false)}
                aria-label={t('dismissNotice')}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-desc">
              {t('modalMasterDataDesc')}
            </p>

            <form
              className="modal-add-form"
              onSubmit={(e) => {
                e.preventDefault();
                addCategory(newCategoryName);
              }}
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('modalAddPlaceholder')}
                maxLength={36}
              />
              <button type="submit" className="primary-btn">
                <Plus size={15} /> {t('modalAddButton')}
              </button>
            </form>

            <div className="modal-cat-list">
              {categories.map((cat) => (
                <div className="modal-cat-item" key={cat.id}>
                  {editingCategoryId === cat.id ? (
                    <div className="modal-cat-edit-row">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        maxLength={36}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="cat-icon-btn save"
                        onClick={() => renameCategory(cat.id, editingCategoryName)}
                        title={t('saveName')}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="cat-icon-btn"
                        onClick={() => setEditingCategoryId(null)}
                        title={t('cancel')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="modal-cat-badge">
                        <Tag size={13} />
                        <span>{cat.name}</span>
                      </div>
                      <div className="modal-cat-actions">
                        <button
                          type="button"
                          className="cat-action-btn"
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditingCategoryName(cat.name);
                          }}
                          title={t('modalRenameTitle')}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="cat-action-btn delete"
                          onClick={() => deleteCategory(cat.id)}
                          title={t('modalDeleteTitle')}
                          disabled={categories.length <= 1}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" className="text-btn" onClick={resetCategories}>
                {t('modalResetDefaults')}
              </button>
              <button type="button" className="primary-btn" onClick={() => setShowCategoryModal(false)}>
                {t('modalDone')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
