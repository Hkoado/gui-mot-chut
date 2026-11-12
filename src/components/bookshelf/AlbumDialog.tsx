import { useEffect, useId, useRef } from 'react';
import type { TopicRecord } from '../../data/topics';
import type { TemplateRecord } from '../../data/templates';
import { CoverArt } from './Book';
import BrandWordmark from '../BrandWordmark';
import { site } from '../../config/site';

const blots = [[150, 330, 0], [340, 600, 120], [250, 120, 220], [90, 760, 300], [400, 250, 360], [260, 860, 420], [230, 470, 180]];
const fullSheet = 'inset(0px 0px 0px 0px round 0px)';
function milliseconds(style: CSSStyleDeclaration, name: string) {
  const value = style.getPropertyValue(name).trim();
  return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
}
function coverClip(rect: DOMRect) {
  return `inset(${Math.max(0, rect.top)}px ${Math.max(0, innerWidth - rect.right)}px ${Math.max(0, innerHeight - rect.bottom)}px ${Math.max(0, rect.left)}px round 3px)`;
}

export default function AlbumDialog({ album, origin, getCoverRect, templates, onChoose, onClose }: { album: TopicRecord; origin: DOMRect; getCoverRect: () => DOMRect | null; templates: TemplateRecord[]; onChoose: (template: TemplateRecord, origin: DOMRect) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const stopInk = useRef<() => void>(() => {});
  const closeFrame = useRef(0);
  const closing = useRef(false);
  const id = useId().replace(/:/g, '');
  const items = templates.filter(item => album.templateIds.includes(item.id) && item.enabled);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    closing.current = false;
    dialog.style.removeProperty('opacity');
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const style = getComputedStyle(dialog);
    const number = (name: string) => milliseconds(style, name);
    dialog.style.transformOrigin = `${origin.left + origin.width / 2}px ${origin.top + origin.height / 2}px`;
    const animations = [dialog.animate([
      { clipPath: coverClip(origin), transform: 'rotate(-4.5deg)' },
      { clipPath: fullSheet, transform: 'rotate(0deg)' },
    ], { duration: number('--duration-sheet-open'), easing: style.getPropertyValue('--ease-paper').trim(), fill: 'both' })];
    dialog.querySelectorAll<HTMLElement>('.detail-line > *').forEach((line, index) => {
      animations.push(line.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], {
        duration: number('--duration-sheet-text'), delay: reduced.matches ? 0 : number('--delay-sheet-text') + index * number('--delay-sheet-line'),
        easing: style.getPropertyValue('--ease-editorial').trim(), fill: 'both',
      }));
    });
    const circles = [...dialog.querySelectorAll<SVGCircleElement>('.ink-blob')];
    const inkDelay = number('--delay-sheet-ink');
    const inkDuration = number('--duration-sheet-ink');
    const loopDuration = number('--duration-sheet-loop');
    const start = performance.now();
    let frame = 0;
    const revealAll = () => circles.forEach(circle => circle.setAttribute('r', '720'));
    const tick = (now: number) => {
      const elapsed = now - start;
      circles.forEach((circle, index) => {
        const p = Math.min(1, Math.max(0, (elapsed - inkDelay - blots[index][2]) / inkDuration));
        circle.setAttribute('r', String(720 * (1 - (1 - p) ** 3)));
      });
      if (elapsed < loopDuration) frame = requestAnimationFrame(tick);
      else revealAll();
    };
    stopInk.current = () => cancelAnimationFrame(frame);
    if (reduced.matches) revealAll(); else frame = requestAnimationFrame(tick);
    const motionChanged = () => { if (reduced.matches) { stopInk.current(); revealAll(); animations.forEach(animation => animation.finish()); } };
    reduced.addEventListener('change', motionChanged);
    return () => {
      cancelAnimationFrame(closeFrame.current);
      stopInk.current(); reduced.removeEventListener('change', motionChanged);
      // Hide before cancelling fill effects: cancellation must never expose a
      // full-screen sheet during the native modal/focus teardown.
      dialog.style.opacity = '0';
      dialog.close();
      dialog.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
      document.body.style.overflow = overflow; previous?.focus({ preventScroll: true });
    };
  }, [origin]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    stopInk.current();
    const dialog = ref.current!;
    const rect = getCoverRect() ?? origin;
    const style = getComputedStyle(dialog);
    const current = { clipPath: style.clipPath, transform: style.transform, opacity: style.opacity };
    const duration = milliseconds(style, '--duration-sheet-close');
    const easing = style.getPropertyValue('--ease-paper').trim();
    // Persist the sampled opening pose before cancelling it (also handles an
    // immediate close). Keep its transform origin to avoid a mid-open jump.
    Object.assign(dialog.style, current);
    dialog.getAnimations().forEach(animation => animation.cancel());
    dialog.dataset.closing = 'true';
    // getBoundingClientRect already includes the cover's rotation/perspective.
    // Do not rotate that screen-space bounding box a second time. Reveal the
    // actual 3D book beneath the sheet before removing the modal, rather than
    // abruptly replacing cropped album text with a different cover image.
    const animation = dialog.animate([
      { ...current, offset: 0 },
      { clipPath: coverClip(rect), transform: 'none', opacity: 0, offset: 1 },
    ], { duration, easing, fill: 'both' });
    animation.finished.then(() => {
      dialog.style.opacity = '0';
      // Present the transparent final frame before React/native-dialog cleanup.
      closeFrame.current = requestAnimationFrame(() => {
        closeFrame.current = requestAnimationFrame(onClose);
      });
    }, () => {});
  };
  return <dialog ref={ref} className="detail album-dialog" aria-labelledby="album-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="detail-brand" aria-hidden="true"><BrandWordmark /></div>
    <button className="dialog-close detail-close" type="button" onClick={close} autoFocus>{'ĐÓNG / ALBUM'} ×</button>
    <div className="detail-grid"><div className="detail-copy">
      <div className="detail-line"><p className="eyebrow">{'ALBUM / BỘ SƯU TẬP'}</p></div>
      <div className="detail-line"><h2 id="album-title">{album.title}</h2></div>
      <div className="detail-line"><p className="detail-meta">{items.length} {'MẪU / CÁ NHÂN HÓA NỘI DUNG'}</p></div>
      <div className="detail-line"><p className="detail-description">{items.length ? 'Chọn một mẫu để xem nội dung và các lựa chọn cá nhân hóa.' : 'Album này chưa có mẫu. Video và demo sẽ được bổ sung khi sẵn sàng.'}</p></div>
      <div className="detail-line"><p className="detail-credit">{'Bìa minh họa'} · {site.brand}</p></div>
      <div className="topic-templates">{items.map(item => <div className="detail-line" key={item.id}><article><div><h3>{item.title}</h3><p>{item.description}</p></div><button className="button button--quiet" type="button" onClick={event => onChoose(item, event.currentTarget.getBoundingClientRect())}>{'Xem chi tiết'} ↗</button></article></div>)}</div>
    </div><div className="detail-poster" data-book-theme={album.themeKey} aria-hidden="true">
      <svg viewBox="0 0 474 900" className="ink-poster">
        <defs><filter id={`${id}-ink`} x="-200" y="-200" width="874" height="1300" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="7" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="120" xChannelSelector="R" yChannelSelector="G" /></filter>
          <mask id={`${id}-mask`} x="-200" y="-200" width="874" height="1300" maskUnits="userSpaceOnUse"><g filter={`url(#${id}-ink)`} fill="white">{blots.map(([cx, cy], index) => <circle key={index} className="ink-blob" cx={cx} cy={cy} r="0" />)}</g></mask>
          <clipPath id={`${id}-crop`}><rect width="474" height="900" /></clipPath>
        </defs>
        <g clipPath={`url(#${id}-crop)`} mask={`url(#${id}-mask)`}><foreignObject width="474" height="900"><div className="detail-cover"><CoverArt book={album} /></div></foreignObject></g>
      </svg>
    </div></div>
  </dialog>;
}