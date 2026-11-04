'use client';
import { bespoke, getInstagramUrl } from '../../config/bespoke';
import { useLanguage } from '../LanguageProvider';

export default function BespokeOffer() {
  const { t, language } = useLanguage();
  const details = language === 'vi' ? bespoke.details : ['An original concept and design around your story', 'Content, interface and interactions agreed before work starts', 'Price and timeline quoted for the agreed scope'];
  const instagramUrl = getInstagramUrl(bespoke.instagramUrl);
  return <section className="bespoke-offer" id="doc-ban" aria-labelledby="bespoke-title">
    <div className="bespoke-art" aria-hidden="true"><span>01 / 01</span><span className="inscription">{t('Chỉ một.', 'One of a kind.')}<br />{t('Chỉ của bạn.', 'Only yours.')}</span><svg viewBox="0 0 200 100" fill="none"><path d="M15 75C50 5 110 10 90 55S20 90 55 50s100-55 125-10M35 88q60-30 140-10" stroke="currentColor" strokeWidth="1.5" /></svg><span>GỬI MỘT CHÚT · {t('BẢN RIÊNG', 'BESPOKE')}</span></div>
    <div><p className="eyebrow">{t('CHO MỘT Ý TƯỞNG KHÔNG CÓ TRÊN KỆ', 'FOR AN IDEA BEYOND THE SHELF')}</p><h2 id="bespoke-title">{t(bespoke.title, 'Entirely yours, from scratch.')}</h2><p>{t(bespoke.description, 'Not a ready-made template. Together we create a little website around your story, your style and the things only they would understand.')}</p><ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul><p className="eyebrow">{t('Báo giá riêng · Bắt đầu bằng một cuộc trò chuyện', 'Quoted separately · It starts with a conversation')}</p>
      {instagramUrl ? <a className="button" href={instagramUrl} target="_blank" rel="noopener noreferrer">{t('Kể ý tưởng qua Instagram', 'Share your idea on Instagram')} ↗</a> : <p className="unavailable">{t('Instagram liên hệ sẽ được bổ sung. Hiện chưa thể gửi yêu cầu tại đây.', 'Contact Instagram is not configured yet. Requests cannot be sent here at the moment.')}</p>}
      <p className="muted note">{t(bespoke.note, 'Separate from the 214,000 VND package and standard-template offers. Delivery terms and usage rights are confirmed before ordering.')}</p>
    </div>
  </section>;
}