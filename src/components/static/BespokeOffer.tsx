'use client';
import { bespoke, getInstagramUrl } from '../../config/bespoke';
import { site } from '../../config/site';

export default function BespokeOffer() {
  const details = bespoke.details;
  const instagramUrl = getInstagramUrl(bespoke.instagramUrl);
  return <section className="bespoke-offer" id="doc-ban" aria-labelledby="bespoke-title">
    <div className="bespoke-art" aria-hidden="true"><span>01 / 01</span><span className="inscription">{'Chỉ một.'}<br />{'Chỉ của bạn.'}</span><svg viewBox="0 0 200 100" fill="none"><path d="M15 75C50 5 110 10 90 55S20 90 55 50s100-55 125-10M35 88q60-30 140-10" stroke="currentColor" strokeWidth="1.5" /></svg><span>{site.brand.toUpperCase()} · {'BẢN RIÊNG'}</span></div>
    <div><p className="eyebrow">{'CHO MỘT Ý TƯỞNG KHÔNG CÓ TRÊN KỆ'}</p><h2 id="bespoke-title">{bespoke.title}</h2><p>{bespoke.description}</p><ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul><p className="eyebrow">{'Báo giá riêng · Bắt đầu bằng một cuộc trò chuyện'}</p>
      {instagramUrl ? <a className="button" href={instagramUrl} target="_blank" rel="noopener noreferrer">{'Kể ý tưởng qua Instagram'} ↗</a> : <p className="unavailable">{'Instagram liên hệ sẽ được bổ sung. Hiện chưa thể gửi yêu cầu tại đây.'}</p>}
      <p className="muted note">{bespoke.note}</p>
    </div>
  </section>;
}