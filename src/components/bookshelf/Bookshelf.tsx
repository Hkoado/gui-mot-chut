'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { TemplateRecord } from '../../data/templates';
import Book from './Book';
import TemplateDialog from './TemplateDialog';
import { useLanguage } from '../LanguageProvider';
import './bookshelf.css';

export default function Bookshelf({ books }: { books: TemplateRecord[] }) {
  const { language, t } = useLanguage();
  const cycleLength = Math.max(1, books.length);
  const [position, setPosition] = useState({ active: Math.min(2, Math.max(0, books.length - 1)), activeIndex: Math.min(2, Math.max(0, books.length - 1)) });
  const { active, activeIndex } = position;
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const shelf = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const suppressClick = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; lastX: number; moved: boolean } | null>(null);
  const select = (index: number) => {
    const nextIndex = ((index % cycleLength) + cycleLength) % cycleLength;
    direction.current = nextIndex === activeIndex ? (index >= active ? 1 : -1) : ((nextIndex - activeIndex + cycleLength) % cycleLength <= cycleLength / 2 ? 1 : -1);
    setPosition({ active: index, activeIndex: nextIndex });
  };
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
    const cover = shelf.current?.querySelector('.is-active .book-front');
    if (cover) setOrigin(cover.getBoundingClientRect());
  };
  const close = useCallback(() => setOrigin(null), []);
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
  const bookInstances = books.flatMap((item, index) => {
    const activeCopy = Math.round((active - index) / cycleLength);
    return [-1, 0, 1].map(lap => ({
      item,
      sequenceIndex: index + lap * cycleLength,
      offset: index + lap * cycleLength - active,
      duplicate: lap !== activeCopy,
    }));
  });
  return <div className="bookshelf-wrap">
    <div className="shelf-category" aria-hidden="true">{t('CÂU CHUYỆN SỐ', 'STORY NO.')} {String(activeIndex + 1).padStart(2, '0')} / {book.occasion}</div>
    <div className="bookshelf" ref={shelf} tabIndex={0} role="group" aria-label={t('Kệ 5 mẫu. Phím trái phải để chọn, Enter để mở.', 'Five designs. Use left and right arrows to choose, Enter to open.')}
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
    <div className="shelf-controls"><button type="button" onClick={() => select(active - 1)} aria-label={t('Mẫu trước', 'Previous design')}>←</button><span>{String(activeIndex + 1).padStart(2, '0')} / {String(books.length).padStart(2, '0')}</span><button type="button" onClick={() => select(active + 1)} aria-label={t('Mẫu sau', 'Next design')}>→</button></div>
    <div ref={caption} className="shelf-caption" aria-live="polite" aria-atomic="true"><div className="caption-line"><p className="eyebrow">{book.occasion}</p></div><div className="caption-line"><h2>{book.title}</h2></div><div className="caption-line"><p>{book.description}</p></div></div>
    <div className="caption-actions"><button type="button" className="button" onClick={open}>{t('Xem mẫu & chi tiết', 'Preview & details')} ↗</button>{book.demoUrl ? <a className="button button--quiet" href={book.demoUrl} target="_blank" rel="noopener noreferrer">{t('Mở trang demo', 'Visit page')} ↗</a> : <span className="muted">{t('Video & demo đang được chuẩn bị', 'Video & demo not available yet')}</span>}</div>
    <p className="drag-hint">{t('Kéo để chọn · Chạm bìa để mở', 'Drag to browse · Tap the cover to open')}</p>
    {origin && <TemplateDialog book={book} origin={origin} onClose={close} />}
  </div>;
}