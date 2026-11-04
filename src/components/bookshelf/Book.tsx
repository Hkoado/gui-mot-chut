import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { TemplateRecord } from '../../data/templates';
import { useLanguage } from '../LanguageProvider';

export function CoverArt({ book }: { book: TemplateRecord }) {
  const { t } = useLanguage();
  const [imageFailed, setImageFailed] = useState(false);
  if (book.coverSrc && !imageFailed) return <img className="cover-image" src={book.coverSrc} alt="" draggable={false} onError={() => setImageFailed(true)} />;
  return <span className="cover-art">
    <span className="cover-label">GỬI MỘT CHÚT / {book.occasion}</span>
    <strong className="cover-title">{book.title}</strong>
    <svg className="cover-drawing" viewBox="0 0 180 180" fill="none" aria-hidden="true">
      {book.id === 'hen-cau-mot-ngay' && <><path d="M20 35h140v32a14 14 0 000 28v40H20V95a14 14 0 000-28Z"/><path d="M125 40v90" strokeDasharray="3 5"/><circle cx="65" cy="85" r="25"/><path d="m50 85 12 12 22-27"/></>}
      {book.id === 'hom-nay-la-ngay-cua-cau' && <><path d="M35 100h110v55H35zM27 87h126v13H27zM85 87v68M95 87v68M65 85c-55-45 30-45 25 0 0-45 70-45 10 0M90 27v25"/><path d="M90 13c-12 14-12 20 0 20s12-6 0-20Z"/></>}
      {book.id === 'tu-minh-den-hom-nay' && <><path d="m22 30 110-10 12 125-110 10ZM40 46l74-7 7 70-74 7ZM50 99l20-27 18 15 14-18 17 23M141 160q-30-55 20-105M140 116q-40-5-20-25 22 0 20 25M150 85q38-10 20-25-23 2-20 25"/></>}
      {book.id === 'ho-so-hoi-ban' && <><path d="M20 45h55l12 12h73v93H20ZM38 82h85M38 98h65M38 114h45"/><circle cx="131" cy="125" r="25"/><path d="m117 125 10 9 18-21"/></>}
      {book.id === 'co-dieu-muon-noi' && <><path d="M15 45h150v100H15ZM15 45l75 62 75-62M15 145l55-55M165 145l-55-55"/><circle cx="90" cy="106" r="10"/></>}
    </svg>
    <span className="cover-footer">{t('MỘT CÂU CHUYỆN NHỎ', 'A LITTLE STORY')}<br/>{t('DÀNH RIÊNG CHO MỘT NGƯỜI', 'FOR SOMEONE SPECIAL')}</span>
  </span>;
}

export default function Book({ book, offset, duplicate = false, onChoose }: { book: TemplateRecord; offset: number; duplicate?: boolean; onChoose: () => void }) {
  const { t } = useLanguage();
  const [spineFailed, setSpineFailed] = useState(false);
  return <button type="button" className={`book${offset === 0 ? ' is-active' : ''}`} data-book-theme={book.themeKey}
    style={{ '--offset': offset, '--side': Math.sign(offset) } as CSSProperties}
    aria-hidden={duplicate || undefined} tabIndex={duplicate ? -1 : undefined}
    aria-label={`${book.title} — ${offset === 0 ? t('Mở chi tiết mẫu', 'Open design details') : t('Chọn mẫu', 'Select design')}`} aria-pressed={!duplicate && offset === 0} onClick={onChoose}>
    <span className="book-spine">{book.spineSrc && !spineFailed ? <img className="spine-image" src={book.spineSrc} alt="" draggable={false} onError={() => setSpineFailed(true)} /> : <><span>{book.occasion}</span><strong>{book.title}</strong><span>GỬI MỘT CHÚT</span></>}</span>
    <span className="book-front"><CoverArt book={book} /></span>
    <span className="book-pages" aria-hidden="true" />
  </button>;
}