'use client';
import Link from 'next/link';
import Bookshelf from '../components/bookshelf/Bookshelf';
import BespokeOffer from '../components/static/BespokeOffer';
import { useLanguage } from '../components/LanguageProvider';
import { pricing } from '../config/pricing';
import { templates } from '../data/templates';
import { translateTemplate } from '../data/template-translations';

export default function HomePage() {
  const { language, t } = useLanguage();
  const priceLink = t('Xem bảng giá & ưu đãi', 'Pricing & offers (Vietnamese)');
  const steps = [
    [t('Chọn một mẫu', 'Find your story'), t('Lướt kệ sách, chọn một thiết kế hợp với dịp và người bạn thương.', 'Browse the shelf for a design that suits the occasion and your favourite person.')],
    [t('Kể câu chuyện của bạn', 'Make it personal'), t('Chuẩn bị lời nhắn, tên và ảnh nếu có. Cùng studio thống nhất nội dung, phạm vi và giá trước khi làm.', 'Bring your message, names and photos, if any. Agree on the content, scope and price with the studio before work begins.')],
    [t('Nhận link, gửi bất ngờ', 'Send a little surprise'), t('Xem nháp, chốt nội dung rồi gửi đường link dành riêng cho người ấy.', 'Review the draft, approve the content, then send them a link made just for them.')],
  ];
  const faqs = [
    [t('Mình cần chuẩn bị những gì?', 'What do I need to prepare?'), t('Tên, lời nhắn, ảnh nếu có và vài ý tưởng bạn muốn gửi gắm. Studio sẽ xác nhận phạm vi trước khi bắt đầu.', 'Names, a message, photos if you have them, and a few ideas you want to share. The studio confirms the scope before starting.')],
    [t('Có thể sửa lại nội dung không?', 'Can I request changes?'), t('Số lần chỉnh sửa nhỏ được nêu trong từng gói ở trang bảng giá. Nội dung cụ thể được thống nhất trước khi làm.', 'Each package lists its allowance for minor revisions on the Vietnamese pricing page. Specific changes are agreed before work starts.')],
    [t('Video mẫu và demo đã có chưa?', 'Are previews and demos ready?'), t('Chưa có video và demo đã xác minh. Các liên kết sẽ được bổ sung khi sẵn sàng; bìa sách hiện là hình minh họa.', 'Verified preview videos and independent demos are not available yet. Links will be added when ready; the book covers are illustrations.')],
    [t('Thời gian làm và duy trì link thế nào?', 'What about delivery and link availability?'), t('Thời gian thực hiện, thời hạn duy trì link và các chính sách liên quan cần được xác nhận trước khi đặt.', 'Delivery time, link availability and related policies need to be confirmed before you order.')],
  ];
  return <main>
    <section className="hero container" id="xem-mau" aria-labelledby="hero-title">
      <div className="shelf-intro"><h1 id="hero-title" className="eyebrow">{t('KỆ NHỮNG ĐIỀU MUỐN GỬI', 'A SHELF OF LITTLE STORIES')}</h1><span>{t('05 mẫu · một người đặc biệt', '05 designs · someone special')}</span></div>
      <Bookshelf books={templates.map(book => translateTemplate(book, language))} />
      <div className="hero-price"><p>{t('Một website quà tặng, mang câu chuyện của bạn.', 'A gift website with your story at heart.')} <span>{t('Giá niêm yết từ', 'Standard packages from')} <strong>{pricing.standard.priceVnd.toLocaleString('vi-VN')}đ</strong></span></p><Link href="/bang-gia/">{priceLink} ↗</Link></div>
    </section>
    <section className="section container" id="cach-dat" aria-labelledby="steps-title"><div className="section-heading"><p className="eyebrow">{t('TỪ CHỌN MẪU ĐẾN GỬI TẶNG', 'FROM THE SHELF TO THEIR SCREEN')}</p><h2 id="steps-title">{t('Ba bước, một món quà rất riêng.', 'Three steps. Something truly personal.')}</h2></div><div className="steps">{steps.map(([title, description], index) => <article key={index}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div><Link className="text-link" href="/bang-gia/">{priceLink} ↗</Link></section>
    <div className="container"><BespokeOffer /></div>
    <section className="section container faq-short" aria-labelledby="faq-title"><div className="section-heading"><p className="eyebrow">{t('TRƯỚC KHI BẮT ĐẦU', 'BEFORE WE BEGIN')}</p><h2 id="faq-title">{t('Vài điều bạn muốn biết.', 'A few things worth knowing.')}</h2></div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}<p className="faq-next"><Link href="/#xem-mau">{t('Trở lại kệ sách', 'Back to the shelf')} ↑</Link><Link href="/bang-gia/">{priceLink} ↗</Link></p></section>
  </main>;
}
