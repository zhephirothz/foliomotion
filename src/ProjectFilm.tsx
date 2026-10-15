import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { calculateFilmTiming, type Project } from './types';

const ink = '#1e211e';
const lime = '#d6ff61';

function DemoInterface() {
  return (
    <div
      style={{
        background: '#f8f8f5',
        height: '100%',
        width: '100%',
        padding: '5.5% 6%',
        color: '#1f2822',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid #dedfd8',
          paddingBottom: '3%',
          fontSize: 19,
          letterSpacing: '.02em',
        }}
      >
        <b>STUDIO / 08</b>
        <span>INDEX　 ABOUT　 ↗</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', alignItems: 'end', gap: '8%', height: '78%' }}>
        <div>
          <div style={{ color: '#758075', fontSize: 16, letterSpacing: '.14em', marginBottom: 22 }}>
            A QUIETER WAY TO GET THERE
          </div>
          <div style={{ fontSize: 'clamp(38px, 5vw, 94px)', lineHeight: 0.94, letterSpacing: '-.065em', fontWeight: 600 }}>
            Make room<br />for the good<br />part.
          </div>
          <div style={{ marginTop: 28, fontSize: 17, color: '#667067' }}>Find a little more space in your day.</div>
        </div>
        <div
          style={{
            height: '78%',
            borderRadius: 4,
            background: 'linear-gradient(150deg,#ced9c5,#879781 58%,#485e50)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: '16% 14%', border: '1px solid #f4f5ee99', transform: 'rotate(-8deg)' }} />
          <div
            style={{
              position: 'absolute',
              width: '46%',
              height: '68%',
              left: '27%',
              top: '19%',
              borderRadius: '48% 48% 6px 6px',
              background: 'linear-gradient(110deg,#d6c6a9,#738571 49%,#354b40)',
              boxShadow: '20px 24px 42px #20302744',
            }}
          />
          <div style={{ position: 'absolute', bottom: 18, left: 20, color: 'white', fontSize: 13, letterSpacing: '.12em' }}>
            SAMPLE LAYOUT
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectFilm({ project }: { project: Project }) {
  const frame = useCurrentFrame();
  const timing = calculateFilmTiming(project.screenshots, 30, project.category);
  const { scenes, totalFrames } = timing;

  let currentScene = scenes[0];
  for (let i = 0; i < scenes.length; i++) {
    if (frame >= scenes[i].startFrame && (i === scenes.length - 1 || frame < scenes[i + 1].startFrame)) {
      currentScene = scenes[i];
      break;
    }
  }

  const sceneFrame = frame - currentScene.startFrame;
  const progress = interpolate(frame, [0, Math.max(1, totalFrames - 1)], [0, 100]);
  const enter = interpolate(sceneFrame, [0, Math.min(10, Math.floor(currentScene.durationInFrames * 0.4))], [14, 0], {
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(sceneFrame, [0, Math.min(6, Math.floor(currentScene.durationInFrames * 0.25))], [0.4, 1], {
    extrapolateRight: 'clamp',
  });

  const projectName = project.name.trim() || 'Your next project';
  const role = project.role.trim() || 'Your role';
  const isFinalScene = currentScene.index === scenes.length - 1;

  const isDemo = !project.screenshots || project.screenshots.length === 0;

  const caption =
    currentScene.caption?.trim() ||
    (isDemo
      ? (currentScene.index === 0
          ? project.headline.trim() || 'A little more than a screenshot.'
          : currentScene.index === 1
          ? 'A point of view, made real.'
          : `Scene 0${currentScene.index + 1}`)
      : (currentScene.index === 0 ? project.headline.trim() : ''));

  const subcaption =
    currentScene.summary?.trim() ||
    (isDemo
      ? (isFinalScene
          ? 'Let’s make the next one matter.'
          : project.summary.trim() || 'A closer look at the thinking behind the interface.')
      : '');

  const badgeLabel = isFinalScene ? 'GET IN TOUCH ↗' : role.toUpperCase();
  const screenshotSrc = currentScene.screenshot?.src;
  const layout = currentScene.layout;

  const renderMedia = (extraStyle?: React.CSSProperties, innerAspectRatio = '16/10') => {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          transform: `translate(${layout.cardOffsetX}px, ${layout.cardOffsetY}px) rotate(${layout.cardRotation}deg) scale(${layout.cardScale})`,
          transformOrigin: 'center center',
          ...extraStyle,
        }}
      >
        {layout.hasBackingCard && (
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #e4eadb, #ced8c4)',
              transform: `rotate(${layout.backingRotation}deg)`,
              zIndex: 0,
              border: '1px solid #c2ceb8',
              boxShadow: '0 8px 24px rgba(37,41,34,0.06)',
            }}
          />
        )}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            aspectRatio: innerAspectRatio,
            background: 'white',
            padding: 12,
            borderRadius: 14,
            boxShadow: layout.cardShadow,
            overflow: 'hidden',
            boxSizing: 'border-box',
            border: '1px solid #dce4d5',
          }}
        >
          {screenshotSrc ? (
            <Img
              key={screenshotSrc || `scene-${currentScene.id}`}
              src={screenshotSrc}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            />
          ) : (
            <DemoInterface />
          )}

          {layout.badgePosition === 'top-card' && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: '#22281fee',
                color: '#d6ff61',
                fontSize: 10,
                letterSpacing: '.14em',
                padding: '5px 9px',
                borderRadius: 6,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              0{currentScene.index + 1} · {currentScene.category.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderText = (align: 'left' | 'center' = 'left') => (
    <div style={{ textAlign: align }}>
      <div style={{ color: '#81877a', fontSize: 17, letterSpacing: '.16em', marginBottom: caption || subcaption ? 25 : 0 }}>
        0{currentScene.index + 1} / 0{scenes.length}　·　{projectName.toUpperCase()}
      </div>
      {caption ? (
        <div
          style={{
            fontSize: 'clamp(44px, 6.5vw, 114px)',
            fontWeight: 600,
            letterSpacing: '-.07em',
            lineHeight: 0.95,
            maxWidth: align === 'center' ? 1200 : 850,
            margin: align === 'center' ? '0 auto' : undefined,
          }}
        >
          {caption}
        </div>
      ) : null}
      {subcaption ? (
        <div
          style={{
            marginTop: caption ? 26 : 0,
            maxWidth: align === 'center' ? 800 : 640,
            marginInline: align === 'center' ? 'auto' : undefined,
            fontSize: 22,
            lineHeight: 1.35,
            color: '#72766e',
          }}
        >
          {subcaption}
        </div>
      ) : null}
      <div
        style={{
          marginTop: caption || subcaption ? 40 : 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 13,
          background: lime,
          borderRadius: 30,
          padding: '13px 20px',
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {badgeLabel}
      </div>
    </div>
  );

  const renderLayout = () => {
    switch (layout.variant) {
      case 'editorial-left':
        return (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1.05fr 0.95fr',
              gap: '6%',
              alignItems: 'center',
              opacity: fade,
              transform: `translateY(${enter}px)`,
            }}
          >
            <div>{renderMedia()}</div>
            <div>{renderText('left')}</div>
          </div>
        );
      case 'hero-center':
        return (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: fade,
              transform: `translateY(${enter}px)`,
              padding: '1.5% 0',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>{renderText('center')}</div>
            <div style={{ width: '78%', maxHeight: '54vh' }}>{renderMedia({}, '16/9')}</div>
          </div>
        );
      case 'magazine-spread':
        return (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '0.95fr 1.05fr',
              gap: '6%',
              alignItems: 'center',
              opacity: fade,
              transform: `translateY(${enter}px)`,
            }}
          >
            <div>{renderText('left')}</div>
            <div>{renderMedia()}</div>
          </div>
        );
      case 'staggered-focus':
        return (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1.05fr 0.95fr',
              gap: '6%',
              alignItems: 'center',
              opacity: fade,
              transform: `translateY(${enter}px)`,
            }}
          >
            <div>{renderMedia()}</div>
            <div>{renderText('left')}</div>
          </div>
        );
      case 'editorial-right':
      default:
        return (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '0.95fr 1.05fr',
              gap: '6%',
              alignItems: 'center',
              opacity: fade,
              transform: `translateY(${enter}px)`,
            }}
          >
            <div>{renderText('left')}</div>
            <div>{renderMedia()}</div>
          </div>
        );
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#f3f1ed', color: ink, overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ position: 'absolute', inset: '6.5%', display: 'flex', flexDirection: 'column' }}>
        {renderLayout()}
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: `${progress}%`, height: 6, background: lime }} />
    </AbsoluteFill>
  );
}
