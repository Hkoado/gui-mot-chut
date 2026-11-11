'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { TemplateRecord } from '../../data/templates';
import type { TopicRecord } from '../../data/topics';
import Book from './Book';
import TemplateDialog from './TemplateDialog';
import AlbumDialog from './AlbumDialog';
import { fitShelfHeight } from './shelf-geometry';
import './bookshelf.css';

export default function Bookshelf({ books, templates }: { books: TopicRecord[]; templates: TemplateRecord[] }) {
  const cycleLength = Math.max(1, books.length);
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number | null>(null);
  const [radius, setRadius] = useState(2);
  const instanceCount = cycleLength * (radius * 2 + 1);
  const loopOffset = (value: number) => ((value + instanceCount / 2) % instanceCount + instanceCount) % instanceCount - instanceCount / 2;
  const [selected, setSelected] = useState<TemplateRecord | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumOrigin, setAlbumOrigin] = useState<DOMRect | null>(null);
  const activeIndex = ((active % cycleLength) + cycleLength) % cycleLength;
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const shelf = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const suppressClick = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; lastX: number; target: number; moved: boolean } | null>(null);
  const motion = useRef({ target: 0, position: 0, mx: 0, my: 0, pointer: false, tiltX: 0, tiltY: 0 });
  const detailOpen = useRef(false);
  detailOpen.current = albumOpen || !!selected;
  const select = (index: number) => {
    direction.current = index >= active ? 1 : -1;
    const next = index;
    motion.current.target = next;
    setActive(next);
  };
  useEffect(() => {
    const element = shelf.current;
    if (!element) return;
    const style = getComputedStyle(element);
    const number = (name: string) => parseFloat(style.getPropertyValue(name));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(pointer: fine)');
    const nodes = [...element.querySelectorAll<HTMLElement>('.book')];
    const lifts = nodes.map(() => 0);
    let hovered = -1, frame = 0, previous = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    const handlers = nodes.map((node, index) => {
      const enter = (event: globalThis.PointerEvent) => { if (event.pointerType === 'mouse') hovered = index; };
      const leave = () => { if (hovered === index) hovered = -1; };
      node.addEventListener('pointerenter', enter); node.addEventListener('pointerleave', leave);
      return () => { node.removeEventListener('pointerenter', enter); node.removeEventListener('pointerleave', leave); };
    });
    const track = (event: globalThis.PointerEvent) => {
      const state = motion.current;
      state.mx = event.clientX; state.my = event.clientY;
      state.pointer = fine.matches && event.pointerType === 'mouse';
    };
    const leave = () => { motion.current.pointer = false; };
    const step = () => (height ?? 1) * (number('--book-spine-ratio') + number('--book-gap-ratio'));
    const snap = () => {
      const state = motion.current;
      state.target = Math.round(state.target);
      setActive(state.target);
    };
    const wheel = (event: WheelEvent) => {
      if (detailOpen.current || event.ctrlKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
      const state = motion.current;
      const next = state.target + delta * unit / step() * .5;
      if (delta === 0 || books.length < 2) return;
      event.preventDefault();
      direction.current = next >= state.target ? 1 : -1;
      state.target = next;
      setActive(Math.round(next));
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(snap, number('--shelf-wheel-delay'));
    };
    const tick = (now: number) => {
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 1 / 60;
      previous = now;
      const ease = (rate: number) => reduced.matches ? 1 : 1 - Math.exp(-rate * dt);
      const state = motion.current;
      state.position += (state.target - state.position) * ease(number(drag.current?.moved ? '--shelf-drag-rate' : '--shelf-spring-rate'));
      // Stop subpixel drift once settled instead of repainting stationary text forever.
      if (Math.abs(state.target - state.position) < .001) state.position = state.target;
      const h = height ?? 0, d = h * number('--book-cover-ratio');
      const ws = h * number('--book-spine-ratio'), gap = h * number('--book-gap-ratio');
      const bounds = element.getBoundingClientRect();
      const cy = bounds.top + bounds.height * .5;
      const available = state.pointer && !detailOpen.current && !drag.current?.moved;
      const onCover = available && Math.abs(state.mx - innerWidth / 2) < .55 * d
        && Math.abs(state.my - cy) < .55 * h && Math.abs(state.target - state.position) < .3;
      element.dataset.cursorOpen = String(onCover);
      const ty = !reduced.matches && available ? onCover ? (state.mx - innerWidth / 2) / (.55 * d) * 9 : (state.mx - innerWidth / 2) / innerWidth * 5 : 0;
      const tx = !reduced.matches && onCover ? -(state.my - cy) / (h / 2) * 6 : 0;
      state.tiltX += (tx - state.tiltX) * ease(number('--shelf-tilt-rate'));
      state.tiltY += (ty - state.tiltY) * ease(number('--shelf-tilt-rate'));
      element.style.setProperty('--tilt-x', `${state.tiltX}deg`);
      element.style.setProperty('--tilt-y', `${state.tiltY}deg`);
      nodes.forEach((node, index) => {
        const sequence = Number(node.dataset.sequence);
        const r = ((sequence - state.position + instanceCount / 2) % instanceCount + instanceCount) % instanceCount - instanceCount / 2, a = Math.abs(r);
        const o = Math.max(0, 1 - a);
        const pose = o < .02 ? 'spine' : o > .98 ? 'cover' : 'turning';
        if (node.dataset.pose !== pose) node.dataset.pose = pose;
        const blend = a < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) / 2;
        const x = r * (ws + gap) + (d - ws + gap * 1.6) * blend;
        // A small CSS-controlled left yaw fades out into the central cover turn.
        const leftTurn = Math.min(1, Math.max(0, -r));
        const lift = available && hovered === index && a > .5 ? 1 : 0;
        lifts[index] += (lift - lifts[index]) * ease(number('--shelf-lift-rate'));
        node.style.transform = `translate3d(${x}px,${-o * .025 * h - lifts[index] * number('--shelf-lift-ratio') * h}px,${o * .2 * h}px) rotateZ(${-o * 4.5}deg) rotateY(calc(var(--book-left-yaw) * ${leftTurn} - ${o * 90}deg))`;
      });
      frame = requestAnimationFrame(tick);
    };
    element.dataset.motion = 'continuous';
    element.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('blur', leave);
    const out = (event: globalThis.PointerEvent) => { if (!event.relatedTarget) leave(); };
    window.addEventListener('pointerout', out);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); clearTimeout(wheelTimer); handlers.forEach(cleanup => cleanup());
      element.removeEventListener('wheel', wheel); window.removeEventListener('pointermove', track);
      window.removeEventListener('blur', leave); window.removeEventListener('pointerout', out);
      delete element.dataset.cursorOpen; delete element.dataset.motion;
    };
  }, [cycleLength, height, instanceCount, books.length]);
  useEffect(() => {
    const element = shelf.current;
    if (!element) return;
    const measure = document.createElement('span');
    measure.className = 'shelf-measure';
    measure.setAttribute('aria-hidden', 'true');
    element.appendChild(measure);
    const resize = () => {
      const style = getComputedStyle(element);
      // Resolve the responsive CSS length without duplicating viewport tokens in JS.
      const base = measure.getBoundingClientRect().height;
      const number = (name: string) => parseFloat(style.getPropertyValue(name));
      const fitted = fitShelfHeight({
        width: element.clientWidth, baseHeight: base, count: books.length,
        coverRatio: number('--book-cover-ratio'), spineRatio: number('--book-spine-ratio'),
        gapRatio: number('--book-gap-ratio'), clearance: number('--shelf-fit-clearance'),
        minScale: number('--shelf-min-scale'),
      });
      setHeight(fitted);
      const step = fitted * (number('--book-spine-ratio') + number('--book-gap-ratio'));
      setRadius(Math.max(2, Math.ceil(element.clientWidth / (2 * step * cycleLength)) + 1));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      measure.remove();
    };
  }, [books.length]);
  useEffect(() => {
    if (!caption.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const style = getComputedStyle(caption.current);
    const animations = [...caption.current.querySelectorAll('.caption-line > *')].map(line => line.animate(
      [{ transform: `translateY(${direction.current * 110}%)` }, { transform: 'translateY(0)' }],
      { duration: parseFloat(style.getPropertyValue('--duration-caption')), easing: style.getPropertyValue('--ease-editorial').trim() },
    ));
    return () => animations.forEach(animation => animation.cancel());
  }, [active]);
  const open = () => {
    const cover = shelf.current?.querySelector('.book.is-active .book-front');
    if (!cover) return;
    (cover.closest('button') as HTMLButtonElement)?.focus({ preventScroll: true });
    setAlbumOrigin(cover.getBoundingClientRect());
    setAlbumOpen(true);
  };
  const getCoverRect = useCallback(() => shelf.current?.querySelector('.book.is-active .book-front')?.getBoundingClientRect() ?? null, []);
  const closeAlbum = useCallback(() => { setAlbumOpen(false); setAlbumOrigin(null); }, []);
  const close = useCallback(() => { setOrigin(null); setSelected(null); }, []);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (current && current.id === event.pointerId) {
      current.lastX = event.clientX;
      if (Math.abs(event.clientX - current.x) > 5 && (event.pointerType === 'mouse' || Math.abs(event.clientX - current.x) > Math.abs(event.clientY - current.y) * 1.3)) {
        current.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (current.moved) {
        const style = getComputedStyle(event.currentTarget);
        const step = (height ?? 1) * (parseFloat(style.getPropertyValue('--book-spine-ratio')) + parseFloat(style.getPropertyValue('--book-gap-ratio')));
      motion.current.target = current.target - (event.clientX - current.x) / step;
        setActive(Math.round(motion.current.target));
      }
      return;
    }
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (current.moved) {
      motion.current.target = Math.round(cancelled ? current.target : motion.current.target);
      setActive(motion.current.target);
    }
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const book = books[activeIndex] ?? books[0];
  if (!book) return null;
  return <div className="bookshelf-wrap" style={height === null ? undefined : { '--shelf-fitted-height': `${height}px` } as CSSProperties}>
    <div className="bookshelf" ref={shelf} tabIndex={0} role="group" aria-label={'Album. Phím trái phải để chọn, Enter để mở.'}
      onClickCapture={event => {
        // Native 3D hit testing can miss the projected face outside its narrow
        // button pivot. Resolve pointer clicks against the visible cover instead.
        // Keyboard activation (detail=0) must never inherit drag suppression.
        if (event.detail === 0) return;
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault(); event.stopPropagation();
          return;
        }
        const rect = getCoverRect();
        if (rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
          event.preventDefault(); event.stopPropagation(); open();
        }
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); select(active + (event.key === 'ArrowRight' ? 1 : -1)); }
        if ((event.key === 'Enter' || event.key === ' ') && (event.target === event.currentTarget || (event.target as HTMLElement).closest('.book.is-active'))) {
          event.preventDefault(); suppressClick.current = false; open();
        }
      }}
      onPointerDown={event => { if (!event.isPrimary || event.button !== 0 || detailOpen.current) return; suppressClick.current = false; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, target: motion.current.target, moved: false }; }}
      onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
      onLostPointerCapture={event => finish(event, true)}>
      <div className="bookshelf-stage">{Array.from({ length: radius * 2 + 1 }, (_, lap) => lap - radius).flatMap(lap => books.map((item, index) => {
        const sequence = index + lap * cycleLength;
        const offset = loopOffset(sequence - active);
        const nearest = index - activeIndex;
        const accessibleOffset = nearest > cycleLength / 2 ? nearest - cycleLength : nearest < -cycleLength / 2 ? nearest + cycleLength : nearest;
        return <Book key={`${item.id}:${lap}`} book={item} sequence={sequence} offset={offset} duplicate={offset !== accessibleOffset} onChoose={() => {
          offset === 0 ? open() : select(active + offset);
        }} />;
      }))}</div>
    </div>
    <div ref={caption} className="shelf-caption" aria-live="polite" aria-atomic="true"><div className="caption-line"><h1>{book.title}</h1></div></div>
    <button type="button" className="button shelf-primary" onClick={open} aria-label={`Xem album ${book.title}`}>Xem album</button>
    <div className="shelf-controls"><button type="button" onClick={() => select(active - 1)} aria-label={'Chủ đề trước'}>←</button><span>{String(activeIndex + 1).padStart(2, '0')} / {String(books.length).padStart(2, '0')}</span><button type="button" onClick={() => select(active + 1)} aria-label={'Chủ đề sau'}>→</button></div>
    <p className="drag-hint">{'Kéo để chọn · Bấm để mở'}</p>
    {albumOpen && albumOrigin && <AlbumDialog album={book} origin={albumOrigin} getCoverRect={getCoverRect} templates={templates} onClose={closeAlbum} onChoose={(item, rect) => { setSelected(item); setOrigin(rect); }} />}
    {origin && selected && <TemplateDialog book={selected} origin={origin} onClose={close} />}
  </div>;
}