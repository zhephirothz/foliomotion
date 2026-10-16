import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { calculateFilmTiming, projectVideoOrientation, type Project } from './types';
import { readableTextOn } from './slidePalette';

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
  const orientation = projectVideoOrientation(project);
  const portrait = orientation === '9:16';
  const square = orientation === '1:1';
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
  const denseSquareCopy = square && caption.length + subcaption.length > 180;

  const badgeLabel = isFinalScene ? 'GET IN TOUCH ↗' : role.toUpperCase();
  const screenshotSrc = currentScene.screenshot?.src;
  const layout = currentScene.layout;
  const { canvas, text, accent, frame: frameColor } = currentScene.palette;
  const onAccent = readableTextOn(accent);
  const onText = readableTextOn(text);

  const renderMedia = (extraStyle?: React.CSSProperties, innerAspectRatio = '16/10') => {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          transform: `translate(${portrait || square ? layout.cardOffsetX * 0.4 : layout.cardOffsetX}px, ${portrait || square ? layout.cardOffsetY * 0.4 : layout.cardOffsetY}px) rotate(${portrait || square ? layout.cardRotation * 0.5 : layout.cardRotation}deg) scale(${portrait || square ? 1 : layout.cardScale})`,
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
              background: `linear-gradient(135deg, ${frameColor}, ${canvas})`,
              transform: `rotate(${layout.backingRotation}deg)`,
              zIndex: 0,
              border: `1px solid ${text}33`,
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
            background: frameColor,
            padding: 12,
            borderRadius: 14,
            boxShadow: layout.cardShadow,
            overflow: 'hidden',
            boxSizing: 'border-box',
            border: `1px solid ${text}22`,
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
                background: text,
                color: onText,
                fontSize: 10,
                letterSpacing: '.14em',
                padding: '5px 9px',
                borderRadius: 6,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              0{currentScene.index + 1}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderText = (align: 'left' | 'center' = 'left') => (
    <div style={{ textAlign: align }}>
      {currentScene.showCategory && (
        <div style={{ marginBottom: portrait ? 22 : square ? 12 : 20 }}>
          <span style={{
            display: 'inline-block',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: portrait ? '11px 19px' : square ? '7px 13px' : '9px 17px',
            borderRadius: 8,
            background: text,
            color: onText,
            fontSize: portrait ? 26 : square ? 20 : 22,
            fontWeight: 700,
            letterSpacing: '.06em',
            lineHeight: 1.25,
            overflowWrap: 'anywhere',
          }}>
            {currentScene.category.toUpperCase()}
          </span>
        </div>
      )}
      <div style={{ color: text, opacity: 0.68, fontSize: portrait ? 22 : denseSquareCopy ? 16 : square ? 19 : 17, letterSpacing: '.12em', marginBottom: caption || subcaption ? (denseSquareCopy ? 10 : portrait || square ? 16 : 25) : 0, overflowWrap: 'anywhere' }}>
        0{currentScene.index + 1} / 0{scenes.length}　·　{projectName.toUpperCase()}
      </div>
      {caption ? (
        <div
          style={{
            fontSize: portrait ? (caption.length > 55 ? 54 : caption.length > 34 ? 64 : 78) : square ? (denseSquareCopy ? 40 : caption.length > 55 ? 46 : caption.length > 34 ? 54 : 66) : 'clamp(44px, 6.5vw, 114px)',
            fontWeight: 600,
            letterSpacing: portrait || square ? '-.035em' : '-.07em',
            lineHeight: portrait || square ? 1.08 : 0.95,
            maxWidth: portrait || square ? '100%' : align === 'center' ? 1200 : 850,
            margin: align === 'center' ? '0 auto' : undefined,
            overflowWrap: 'anywhere',
          }}
        >
          {caption}
        </div>
      ) : null}
      {subcaption ? (
        <div
          style={{
            marginTop: caption ? (denseSquareCopy ? 10 : portrait || square ? 16 : 26) : 0,
            maxWidth: portrait || square ? '100%' : align === 'center' ? 800 : 640,
            marginInline: align === 'center' ? 'auto' : undefined,
            fontSize: portrait ? 27 : denseSquareCopy ? 19 : square ? 22 : 22,
            lineHeight: 1.35,
            color: text,
            opacity: 0.75,
            overflowWrap: 'anywhere',
          }}
        >
          {subcaption}
        </div>
      ) : null}
      <div
        style={{
          marginTop: caption || subcaption ? (denseSquareCopy ? 14 : portrait || square ? 24 : 40) : 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 13,
          background: accent,
          color: onAccent,
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
    if (portrait || square) {
      const mediaFirst = square && (layout.variant === 'editorial-left' || layout.variant === 'staggered-focus');
      const media = <div style={{ width: portrait ? '94%' : denseSquareCopy ? '65%' : '78%', marginInline: 'auto', flexShrink: 0 }}>{renderMedia({}, '16/10')}</div>;
      const text = <div style={{ width: '100%', flexShrink: 0 }}>{renderText(layout.textAlign)}</div>;
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: portrait ? 70 : 30, minHeight: 0, opacity: fade, transform: `translateY(${enter}px)` }}>
          {mediaFirst ? <>{media}{text}</> : <>{text}{media}</>}
        </div>
      );
    }
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
    <AbsoluteFill style={{ backgroundColor: canvas, color: text, overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ position: 'absolute', inset: '6.5%', display: 'flex', flexDirection: 'column' }}>
        {renderLayout()}
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: `${progress}%`, height: 6, background: accent }} />
    </AbsoluteFill>
  );
}
