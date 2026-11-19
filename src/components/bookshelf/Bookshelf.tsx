'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import type { TopicRecord } from '../../data/topics';
import Book from './Book';
import EyeButton from './EyeButton';
import { fitShelfHeight } from './shelf-geometry';
import './bookshelf.css';

const AlbumDialog = dynamic(() => import('./AlbumDialog'), { ssr: false });

export default function Bookshelf({ books }: { books: TopicRecord[] }) {
  const cycleLength = Math.max(1, books.length);
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number | null>(null);
  const [radius, setRadius] = useState(1);
  const [lite, setLite] = useState(false);
  const instanceCount = cycleLength * (radius * 2 + 1);
  const loopOffset = (value: number) => ((value + instanceCount / 2) % instanceCount + instanceCount) % instanceCount - instanceCount / 2;
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumOrigin, setAlbumOrigin] = useState<DOMRect | null>(null);
  const activeIndex = ((active % cycleLength) + cycleLength) % cycleLength;
  const shelf = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const suppressClick = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; lastX: number; target: number; moved: boolean } | null>(null);
  const motion = useRef({ target: 0, position: 0, mx: 0, my: 0, pointer: false, tiltX: 0, tiltY: 0 });
  const restoredTopic = useRef(false);
  const pendingRestore = useRef(false);
  const detailOpen = useRef(false);
  const wakeMotion = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    if (restoredTopic.current) return;
    restoredTopic.current = true;
    try {
      const savedId = sessionStorage.getItem('trao:bookshelf-topic');
      const savedIndex = books.findIndex(item => item.id === savedId);
      if (savedIndex >= 0) {
        pendingRestore.current = true;
        motion.current.target = savedIndex;
        motion.current.position = savedIndex;
        setActive(savedIndex);
      }
    } catch {
      // Keep the shelf usable when browser storage is unavailable.
    }
  }, [books]);
  useEffect(() => {
    if (!restoredTopic.current) return;
    if (pendingRestore.current) {
      pendingRestore.current = false;
      return;
    }
    try {
      sessionStorage.setItem('trao:bookshelf-topic', books[activeIndex]?.id ?? '');
    } catch {
      // Shelf selection remains available without browser storage.
    }
  }, [activeIndex, books]);
  detailOpen.current = albumOpen;
  const select = (index: number) => {
    direction.current = index >= active ? 1 : -1;
    const next = index;
    motion.current.target = next;
    wakeMotion.current();
    setActive(next);
  };
  useEffect(() => {
    const forced = new URLSearchParams(location.search).get('perf');
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const limited = (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
      || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
      || !!device.connection?.saveData || /^(slow-2g|2g|3g)$/.test(device.connection?.effectiveType ?? '');
    const apply = (value: boolean) => {
      document.documentElement.dataset.perf = value ? 'lite' : 'full';
      setLite(value);
    };
    apply(forced === 'lite' || (forced !== 'full' && limited));
    // Sample the shared shelf loop, not a second rAF. Hidden/offscreen time
    // cannot classify the device; explicit query overrides always win.
    const sample = (event: Event) => {
      if (forced !== 'full' && forced !== 'lite' && (event as CustomEvent<number>).detail < 40) apply(true);
    };
    window.addEventListener('trao:shelf-fps', sample);
    return () => window.removeEventListener('trao:shelf-fps', sample);
  }, []);
  useEffect(() => {
    const element = shelf.current;
    if (!element) return;
    const style = getComputedStyle(element);
    // Resolve live CSS tokens once before any frame writes. Reading the live
    // declaration inside the cuboid loop otherwise forces repeated style work.
    const values = new Map<string, number>();
    const names = ['--book-spine-ratio', '--book-gap-ratio', '--book-cover-ratio',
      '--shelf-wheel-delay', '--shelf-drag-rate', '--shelf-spring-rate',
      '--shelf-tilt-rate', '--shelf-lift-rate', '--shelf-lift-ratio'];
    const readTokens = () => names.forEach(name => values.set(name, parseFloat(style.getPropertyValue(name))));
    readTokens();
    const number = (name: string) => values.get(name) ?? 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const nodes = [...element.querySelectorAll<HTMLElement>('.book')];
    const tiltNodes = nodes.map(node => node.querySelector<HTMLElement>('.book-tilt'));
    const lifts = nodes.map(() => 0);
    let hovered = -1, frame = 0, previous = 0;
    let sampleStart = 0, sampleFrames = 0, sampled = lite;
    let visible = true;
    let bounds = element.getBoundingClientRect();
    const wake = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    wakeMotion.current = wake;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    const handlers = nodes.map((node, index) => {
      const enter = (event: globalThis.PointerEvent) => { if (!lite && fine.matches && event.pointerType === 'mouse') { hovered = index; wake(); } };
      const leave = () => { if (hovered === index) { hovered = -1; wake(); } };
      node.addEventListener('pointerenter', enter); node.addEventListener('pointerleave', leave);
      return () => { node.removeEventListener('pointerenter', enter); node.removeEventListener('pointerleave', leave); };
    });
    const track = (event: globalThis.PointerEvent) => {
      if (lite || !fine.matches || event.pointerType !== 'mouse') return;
      const state = motion.current;
      state.mx = event.clientX; state.my = event.clientY;
      state.pointer = !lite && fine.matches && event.pointerType === 'mouse';
      wake();
    };
    const leave = () => { motion.current.pointer = false; wake(); };
    const step = () => (height ?? 1) * (number('--book-spine-ratio') + number('--book-gap-ratio'));
    const snap = () => {
      const state = motion.current;
      state.target = Math.round(state.target);
      setActive(state.target);
      wake();
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
      wake();
      setActive(Math.round(next));
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(snap, number('--shelf-wheel-delay'));
    };
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) { previous = 0; return; }
      readTokens();
      if (!sampled) {
        if (!sampleStart) sampleStart = now;
        sampleFrames++;
        if (now - sampleStart >= 2000) {
          sampled = true;
          window.dispatchEvent(new CustomEvent('trao:shelf-fps', { detail: (sampleFrames - 1) * 1000 / (now - sampleStart) }));
        }
      }
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 1 / 60;
      previous = now;
      const ease = (rate: number) => reduced.matches ? 1 : 1 - Math.exp(-rate * dt);
      const state = motion.current;
      state.position += (state.target - state.position) * ease(number(drag.current?.moved ? '--shelf-drag-rate' : '--shelf-spring-rate'));
      // Stop subpixel drift once settled instead of repainting stationary text forever.
      if (Math.abs(state.target - state.position) < .001) state.position = state.target;
      const h = height ?? 0, d = h * number('--book-cover-ratio');
      const ws = h * number('--book-spine-ratio'), gap = h * number('--book-gap-ratio');
      const cy = bounds.top + bounds.height * .5;
      const available = !lite && state.pointer && !detailOpen.current && !drag.current?.moved;
      const onCover = available && Math.abs(state.mx - innerWidth / 2) < .55 * d
        && Math.abs(state.my - cy) < .55 * h && Math.abs(state.target - state.position) < .3;
      const cursorOpen = String(onCover);
      if (element.dataset.cursorOpen !== cursorOpen) element.dataset.cursorOpen = cursorOpen;
      const ty = !reduced.matches && available ? onCover ? (state.mx - innerWidth / 2) / (.55 * d) * 9 : (state.mx - innerWidth / 2) / innerWidth * 5 : 0;
      const tx = !reduced.matches && onCover ? -(state.my - cy) / (h / 2) * 6 : 0;
      state.tiltX += (tx - state.tiltX) * ease(number('--shelf-tilt-rate'));
      state.tiltY += (ty - state.tiltY) * ease(number('--shelf-tilt-rate'));
      if (Math.abs(tx - state.tiltX) < .001) state.tiltX = tx;
      if (Math.abs(ty - state.tiltY) < .001) state.tiltY = ty;
      let unsettled = Math.abs(state.target - state.position) > .001
        || Math.abs(tx - state.tiltX) > .001 || Math.abs(ty - state.tiltY) > .001;
      nodes.forEach((node, index) => {
        const sequence = Number(node.dataset.sequence);
        const r = ((sequence - state.position + instanceCount / 2) % instanceCount + instanceCount) % instanceCount - instanceCount / 2, a = Math.abs(r);
        const o = Math.max(0, 1 - a);
        const pose = o < .02 ? 'spine' : o > .98 ? 'cover' : 'turning';
        if (node.dataset.pose !== pose) node.dataset.pose = pose;
        const blend = a < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) / 2;
        const x = r * (ws + gap) + (d - ws + gap * 1.6) * blend;
        // Keep stable loop keys and accessible originals, but do not paint
        // cuboids outside the viewport plus a complete cover-width buffer.
        const hidden = Math.abs(x) > bounds.width / 2 + d;
        if (node.hidden !== hidden) node.hidden = hidden;
        if (hidden) { lifts[index] = 0; return; }
        // Tilt belongs to the single 2D pivot, not an inherited variable on
        // the whole shelf (which invalidated every cuboid and print descendant).
        const tilt = tiltNodes[index];
        const tiltTransform = node.classList.contains('is-active')
          ? `rotateX(${state.tiltX}deg) rotateY(${state.tiltY}deg)`
          : 'rotateX(0deg) rotateY(0deg)';
        if (tilt && tilt.style.transform !== tiltTransform) tilt.style.transform = tiltTransform;
        // A small CSS-controlled left yaw fades out into the central cover turn.
        const leftTurn = Math.min(1, Math.max(0, -r));
        const lift = available && hovered === index && a > .5 ? 1 : 0;
        lifts[index] += (lift - lifts[index]) * ease(number('--shelf-lift-rate'));
        if (Math.abs(lift - lifts[index]) < .001) lifts[index] = lift;
        else unsettled = true;
        const transform = `translate3d(${x}px,${-o * .025 * h - lifts[index] * number('--shelf-lift-ratio') * h}px,${o * .2 * h}px) rotateZ(${-o * 4.5}deg) rotateY(calc(var(--book-left-yaw) * ${leftTurn} - ${o * 90}deg))`;
        if (node.style.transform !== transform) node.style.transform = transform;
      });
      if (unsettled || !sampled) wake();
      else previous = 0;
    };
    const refreshBounds = () => { bounds = element.getBoundingClientRect(); wake(); };
    const resize = new ResizeObserver(refreshBounds);
    resize.observe(element);
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) refreshBounds();
      else { cancelAnimationFrame(frame); frame = 0; previous = 0; sampleStart = 0; sampleFrames = 0; }
    });
    intersection.observe(element);
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; sampleStart = 0; sampleFrames = 0; }
      else refreshBounds();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('scroll', refreshBounds, { passive: true });
    window.addEventListener('resize', refreshBounds, { passive: true });
    reduced.addEventListener('change', wake);
    fine.addEventListener('change', leave);
    element.dataset.motion = 'continuous';
    element.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('blur', leave);
    const out = (event: globalThis.PointerEvent) => { if (!event.relatedTarget) leave(); };
    window.addEventListener('pointerout', out);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); clearTimeout(wheelTimer); handlers.forEach(cleanup => cleanup());
      resize.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('scroll', refreshBounds); window.removeEventListener('resize', refreshBounds);
      reduced.removeEventListener('change', wake); fine.removeEventListener('change', leave);
      wakeMotion.current = () => {};
      element.removeEventListener('wheel', wheel); window.removeEventListener('pointermove', track);
      window.removeEventListener('blur', leave); window.removeEventListener('pointerout', out);
      delete element.dataset.cursorOpen; delete element.dataset.motion;
    };
  }, [cycleLength, height, instanceCount, books.length, lite]);
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
      setRadius(Math.max(1, Math.ceil(element.clientWidth / (2 * step * cycleLength))));
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
  const closeAlbum = useCallback(() => {
    setAlbumOpen(false); setAlbumOrigin(null);
    if (location.hash.startsWith('#album/')) history.replaceState(history.state, '', `${location.pathname}${location.search}#xem-mau`);
  }, []);
  useEffect(() => {
    let frame = 0;
    const navigateAlbum = () => {
      cancelAnimationFrame(frame);
      const id = location.hash.startsWith('#album/') ? location.hash.slice(7) : '';
      const index = books.findIndex(item => item.id === id);
      setAlbumOpen(false); setAlbumOrigin(null);
      if (index < 0) return;
      // Snap the actual shelf to the deep-linked topic before measuring its cover.
      motion.current.target = index;
      motion.current.position = index;
      setActive(index);
      wakeMotion.current();
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const cover = shelf.current?.querySelector('.book.is-active .book-front');
          if (!cover) return;
          (cover.closest('button') as HTMLButtonElement)?.focus({ preventScroll: true });
          setAlbumOrigin(cover.getBoundingClientRect());
          setAlbumOpen(true);
        });
      });
    };
    navigateAlbum();
    window.addEventListener('hashchange', navigateAlbum);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', navigateAlbum); };
    // Topic records are immutable; the homepage recreates the array on render.
  }, [books.length]);
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
        wakeMotion.current();
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
      wakeMotion.current();
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
    <EyeButton className="shelf-primary" onClick={open} aria-label={`Xem album ${book.title}`}>Xem</EyeButton>
    <div className="shelf-controls"><button type="button" onClick={() => select(active - 1)} aria-label={'Chủ đề trước'}>←</button><span>{String(activeIndex + 1).padStart(2, '0')} / {String(books.length).padStart(2, '0')}</span><button type="button" onClick={() => select(active + 1)} aria-label={'Chủ đề sau'}>→</button></div>
    <p className="drag-hint">{'Kéo để chọn · Bấm để mở'}</p>
    {albumOpen && albumOrigin && <AlbumDialog album={book} origin={albumOrigin} getCoverRect={getCoverRect} onClose={closeAlbum} />}
  </div>;
}