import { useEffect, useRef, useState } from 'react';
import type { TemplateRecord } from '../../data/templates';
import { pricing } from '../../config/pricing';
import CloseButton from '../CloseButton';
import { CoverArt } from './Book';

export default function TemplateDialog({ book, origin, onClose }: { book: TemplateRecord; origin: DOMRect; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const closing = useRef(false);
  const [failed, setFailed] = useState(false);
  const transform = useRef('');
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const rect = dialog.getBoundingClientRect();
    transform.current = `translate(${origin.x + origin.width / 2 - rect.x - rect.width / 2}px, ${origin.y + origin.height / 2 - rect.y - rect.height / 2}px) rotate(-4.5deg) scale(${origin.width / rect.width}, ${origin.height / rect.height})`;
    const style = getComputedStyle(dialog);
    const animation = dialog.animate([{ transform: transform.current }, { transform: 'none' }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : parseFloat(style.getPropertyValue('--duration-dialog')), easing: style.getPropertyValue('--ease-paper').trim() });
    return () => { animation.cancel(); dialog.close(); document.body.style.overflow = overflow; requestAnimationFrame(() => previous?.focus()); };
  }, [origin]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    video.current?.pause();
    const dialog = ref.current!;
    const style = getComputedStyle(dialog);
    const animation = dialog.animate([{ transform: 'none' }, { transform: transform.current }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : parseFloat(style.getPropertyValue('--duration-dialog')), easing: style.getPropertyValue('--ease-paper').trim(), fill: 'forwards' });
    animation.finished.then(onClose, onClose);
  };
  return <dialog ref={ref} className="template-dialog" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); close(); }}>
    <CloseButton className="dialog-close" label="Đóng chi tiết mẫu" onClick={close} autoFocus />
    <div className="dialog-grid"><div className="dialog-preview" data-book-theme={book.themeKey}>
      {book.previewVideoUrl && !failed ? <video ref={video} controls playsInline preload="metadata" poster={book.previewPoster ?? undefined} src={book.previewVideoUrl} onError={() => setFailed(true)} /> : <><div className="dialog-poster"><CoverArt book={book} /></div><p className="muted">{failed ? 'Không tải được video. Vui lòng thử lại sau.' : 'Video xem trước sẽ được bổ sung'}</p></>}
    </div><div className="dialog-copy"><p className="eyebrow">{book.occasion}</p><h2 id="dialog-title">{book.title}</h2><p>{book.description}</p><h3>{'Nội dung có thể cá nhân hóa'}</h3><ul>{book.features.map(feature => <li key={feature}>{feature}</li>)}</ul><p>{'Giá niêm yết từ'} <strong>{pricing.standard.priceVnd.toLocaleString('vi-VN')}đ</strong></p><a className="button" href={`/bang-gia/?templateId=${encodeURIComponent(book.id)}&packageId=standard`}>{'Chọn mẫu này'}</a><p>{book.demoUrl ? <a href={book.demoUrl} target="_blank" rel="noopener noreferrer">{'Mở trang demo'} ↗</a> : 'Demo độc lập sẽ được bổ sung.'}</p></div></div>
  </dialog>;
}