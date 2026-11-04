'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { TemplateRecord } from '../../data/templates';
import type { TopicRecord } from '../../data/topics';
import Book from './Book';
import TemplateDialog from './TemplateDialog';
import { useLanguage } from '../LanguageProvider';
import './bookshelf.css';

export default function Bookshelf({ books, templates }: { books: TopicRecord[]; templates: TemplateRecord[] }) {
  const { language, t } = useLanguage();
  const cycleLength = Math.max(1, books.length);
  const [active, setActive] = useState(0);
  const [radius, setRadius] = useState(2);
  const [selected, setSelected] = useState<TemplateRecord | null>(null);
  const collection = useRef<HTMLDivElement>(null);
  const activeIndex = ((active % cycleLength) + cycleLength) % cycleLength;
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const shelf = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const suppressClick = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; lastX: number; moved: boolean } | null>(null);
  const select = (index: number) => {
    direction.current = index >= active ? 1 : -1;
    setActive(index);
  };
  useEffect(() => {
    const element = shelf.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const sample = element.querySelector('.book');
      if (!sample) return;
      const width = parseFloat(getComputedStyle(sample).width);
      setRadius(Math.max(2, Math.ceil(element.clientWidth / (2 * width * cycleLength)) + 1));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [cycleLength]);
  useEffect(() => {
    if (!caption.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const style = getComputedStyle(caption.current);
    const animations = [...caption.current.querySelectorAll('.caption-line > *')].map(line => line.animate(
      [{ transform: `translateY(${direction.current * 110}%)` }, { transform: 'translateY(0)' }],
      { duration: parseFloat(style.getPropertyValue('--duration-caption')), easing: style.getPropertyValue('--ease-editorial').trim() },
    ));
    return () => animations.forEach(animation => animation.cancel());
  }, [active, language]);
  const open = () => {
    collection.current?.focus({ preventScroll: true });
    collection.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const close = useCallback(() => { setOrigin(null); setSelected(null); }, []);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (current && current.id === event.pointerId) {
      current.lastX = event.clientX;
      if (Math.abs(event.clientX - current.x) > 8 && Math.abs(event.clientX - current.x) > Math.abs(event.clientY - current.y) * 1.3) {
        current.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - .5) * 8}deg`);
    event.currentTarget.style.setProperty('--tilt-x', `${((event.clientY - bounds.top) / bounds.height - .5) * -6}deg`);
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (!cancelled && current.moved && Math.abs(current.lastX - current.x) > 35) select(active + (current.lastX < current.x ? 1 : -1));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  };
  const book = books[activeIndex] ?? books[0];
  const cycle = Math.floor(active / cycleLength);
  const bookInstances = books.flatMap((item, index) => {
    const activeCopy = Math.round((active - index) / cycleLength);
    // Recycle only the distant cycle. Visible books retain their DOM identity
    // and move one slot, including across the first/last design boundary.
    return Array.from({ length: radius * 2 + 1 }, (_, i) => cycle - radius + i).map(lap => ({
      item,
      sequenceIndex: index + lap * cycleLength,
      offset: index + lap * cycleLength - active,
      duplicate: lap !== activeCopy,
    }));
  });
  if (!book) return null;
  return <div className="bookshelf-wrap">
    <div className="bookshelf" ref={shelf} tabIndex={0} role="group" aria-label={t('Kệ chủ đề. Phím trái phải để chọn, Enter để xem các mẫu.', 'Topic shelf. Use arrow keys to choose, Enter to browse templates.')}
      onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); select(active + (event.key === 'ArrowRight' ? 1 : -1)); }
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open(); }
      }}
      onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; suppressClick.current = false; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, moved: false }; }}
      onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
      onPointerLeave={event => { event.currentTarget.style.setProperty('--tilt-x', '0deg'); event.currentTarget.style.setProperty('--tilt-y', '0deg'); }}>
      <div className="bookshelf-stage">{bookInstances.map(({ item, sequenceIndex, offset, duplicate }) => <Book key={sequenceIndex} book={item} offset={offset} duplicate={duplicate} onChoose={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        offset === 0 ? open() : select(sequenceIndex);
      }} />)}</div>
    </div>
    <div ref={caption} className="shelf-caption" aria-live="polite" aria-atomic="true"><div className="caption-line"><p className="eyebrow">{book.occasion}</p></div><div className="caption-line"><h2>{book.title}</h2></div></div>
    <div className="shelf-controls"><button type="button" onClick={() => select(active - 1)} aria-label={t('Chủ đề trước', 'Previous topic')}>←</button><span>{String(activeIndex + 1).padStart(2, '0')} / {String(books.length).padStart(2, '0')}</span><button type="button" onClick={() => select(active + 1)} aria-label={t('Chủ đề sau', 'Next topic')}>→</button></div>
    <p className="drag-hint">{t('Kéo để chọn · Chạm bìa để mở', 'Drag to browse · Tap the cover to open')}</p>
    <div className="topic-templates" ref={collection} tabIndex={-1} aria-label={book.title}>
      <h3>{t('Các mẫu trong chủ đề', 'Templates in this collection')}</h3>
      {templates.filter(item => book.templateIds.includes(item.id) && item.enabled).map(item => <article key={item.id}>
        <div><h4>{item.title}</h4><p>{item.description}</p></div>
        <button className="button" type="button" onClick={event => { setSelected(item); setOrigin(event.currentTarget.getBoundingClientRect()); }}>{t('Xem mẫu & chi tiết', 'Preview & details')} ↗</button>
      </article>)}
      {!templates.some(item => book.templateIds.includes(item.id) && item.enabled) && <p className="muted">{t('Các mẫu thuộc chủ đề này đang được chuẩn bị. Chưa có video hoặc demo để xem.', 'Templates in this collection are being prepared. No preview video or demo is available yet.')}</p>}
    </div>
    {origin && selected && <TemplateDialog book={selected} origin={origin} onClose={close} />}
  </div>;
}