import { useEffect, useRef, useState } from 'react';
import type { TemplateRecord } from '../../data/templates';
import { pricing } from '../../config/pricing';
import { CoverArt } from './Book';
import { useLanguage } from '../LanguageProvider';

export default function TemplateDialog({ book, origin, onClose }: { book: TemplateRecord; origin: DOMRect; onClose: () => void }) {
  const { t } = useLanguage();
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
    <button type="button" className="dialog-close" onClick={close} autoFocus>{t('Đóng', 'Close')} ×</button>
    <div className="dialog-grid"><div className="dialog-preview" data-book-theme={book.themeKey}>
      {book.previewVideoUrl && !failed ? <video ref={video} controls playsInline preload="metadata" poster={book.previewPoster ?? undefined} src={book.previewVideoUrl} onError={() => setFailed(true)} /> : <><div className="dialog-poster"><CoverArt book={book} /></div><p className="muted">{failed ? t('Không tải được video. Vui lòng thử lại sau.', 'The video could not load. Please try again later.') : t('Video xem trước sẽ được bổ sung', 'Preview video coming when available')}</p></>}
    </div><div className="dialog-copy"><p className="eyebrow">{book.occasion}</p><h2 id="dialog-title">{book.title}</h2><p>{book.description}</p><h3>{t('Nội dung có thể cá nhân hóa', 'Make it your own')}</h3><ul>{book.features.map(feature => <li key={feature}>{feature}</li>)}</ul><p>{t('Giá niêm yết từ', 'Standard packages from')} <strong>{pricing.standard.priceVnd.toLocaleString('vi-VN')}đ</strong></p><a className="button" href={`/bang-gia/?templateId=${encodeURIComponent(book.id)}&packageId=standard`}>{t('Chọn mẫu này', 'Choose this design · pricing in Vietnamese')}</a><p>{book.demoUrl ? <a href={book.demoUrl} target="_blank" rel="noopener noreferrer">{t('Mở trang demo', 'Visit page')} ↗</a> : t('Demo độc lập sẽ được bổ sung.', 'An independent demo is not available yet.')}</p></div></div>
  </dialog>;
}