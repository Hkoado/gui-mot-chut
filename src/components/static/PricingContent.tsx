'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { pricing } from '../../config/pricing';
import { campaign } from '../../config/campaign';
import { site } from '../../config/site';
import { templates } from '../../data/templates';

export default function PricingContent() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get('templateId');
    setSelectedTemplateId(templates.find(template => template.id === requestedId)?.id ?? null);
  }, []);
  const selectedTemplate = templates.find(template => template.id === selectedTemplateId);
  const packageHref = (packageId: string) => {
    if (!site.contactUrl) return null;
    try {
      const url = new URL(site.contactUrl);
      if (selectedTemplate) url.searchParams.set('templateId', selectedTemplate.id);
      url.searchParams.set('packageId', packageId);
      return url.href;
    } catch { return null; }
  };
  const standardHref = packageHref(pricing.standard.id);
  const personalHref = packageHref(pricing.personal.id);

  return <main className="container pricing-page">
    <nav className="breadcrumb" aria-label="Đường dẫn"><Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span>Bảng giá</span>{selectedTemplate && <span className="selected-note">Bạn đang chọn mẫu: {selectedTemplate.title}</span>}</nav>
    <header className="page-intro"><p className="eyebrow">RÕ RÀNG TRƯỚC KHI BẮT ĐẦU</p><h1>Chọn gói vừa với câu chuyện của bạn.</h1><p className="muted">Giá dưới đây là giá niêm yết. Các chính sách chưa chốt sẽ được xác nhận trước khi đặt.</p></header>
    <section className="package-grid" aria-label="So sánh gói dịch vụ">
      <article className="package-card"><p className="eyebrow">GỌN GÀNG VỪA ĐỦ</p><h2>{pricing.standard.name}</h2><p className="package-price">{pricing.standard.priceVnd.toLocaleString('vi-VN')}đ</p><p className="muted">Giá niêm yết</p><ul>{pricing.standard.features.map(item => <li key={item}>{item}</li>)}</ul>{standardHref ? <a className="button" href={standardHref}>Chọn mẫu Theo mẫu</a> : <a className="button" href="#lien-he">Chọn mẫu Theo mẫu</a>}</article>
      <article className="package-card package-card--featured"><p className="eyebrow">THÊM CHẤT RIÊNG</p><h2>{pricing.personal.name}</h2><p className="package-price">{pricing.personal.priceVnd.toLocaleString('vi-VN')}đ</p><p className="muted">Giá niêm yết</p><ul>{pricing.personal.features.map(item => <li key={item}>{item}</li>)}</ul>{personalHref ? <a className="button" href={personalHref}>Mình muốn làm riêng hơn</a> : <a className="button" href="#lien-he">Mình muốn làm riêng hơn</a>}</article>
    </section>
    <section className="campaign-box" id="uu-dai"><p className="eyebrow">CHIẾN DỊCH ĐƠN ĐẦU · GÓI THEO MẪU</p><h2>{campaign.freeCustomerLimit} khách hàng đầu tiên đủ điều kiện được miễn phí gói Theo mẫu.</h2><p>Tiếp theo, khách hàng lần đầu đủ điều kiện được đặt gói Theo mẫu với giá <strong>{campaign.laterFirstOrderPriceVnd.toLocaleString('vi-VN')}đ</strong>. Đây là tổng số khách của chiến dịch, không phải số lượt miễn phí cho mỗi người. Studio xác nhận thủ công điều kiện và thứ tự áp dụng. Không áp dụng mức giá chiến dịch cho gói nâng cấp hoặc ý tưởng riêng; phạm vi ưu đãi là giả định cần chủ dự án xác nhận trước khi mở bán.</p><p className="muted">Giá chiến dịch khác với giá niêm yết {pricing.standard.priceVnd.toLocaleString('vi-VN')}đ. Không có hiển thị số suất còn lại hay ngày hết hạn.</p>{site.contactUrl ? <a className="button" href={site.contactUrl}>Hỏi ưu đãi lần đầu</a> : <p className="unavailable">Chưa có kênh hỏi ưu đãi được cấu hình.</p>}</section>
    <section className="faq section"><div className="section-heading"><p className="eyebrow">CÂU HỎI THƯỜNG GẶP</p><h2>Điều gì đã rõ, điều gì cần xác nhận?</h2></div>
      <details><summary>Mình cần chuẩn bị gì?</summary><p>Tên, nội dung muốn gửi, ảnh nếu có và ý tưởng về các chi tiết bạn muốn. Studio xác nhận nội dung, quyền sử dụng ảnh và phạm vi trước khi làm.</p></details>
      <details><summary>Sửa nội dung thế nào?</summary><p>Số lần chỉnh sửa nhỏ theo từng gói. Những thay đổi ngoài phạm vi sẽ được trao đổi và xác nhận trước khi thực hiện.</p></details>
      <details><summary>Hai gói khác nhau ra sao?</summary><p>Gói Theo mẫu tập trung thay nội dung cơ bản. Gói Câu chuyện riêng có giới hạn ảnh, lựa chọn màu/font và hỗ trợ biên tập như mô tả ở trên; chi tiết có sẵn còn tùy khả năng hỗ trợ của mẫu được chọn.</p></details>
      <details><summary>Đường link tồn tại bao lâu?</summary><p>Thời hạn duy trì link và việc gia hạn chưa chốt. Xác nhận trước khi đặt.</p></details>
      <details><summary>Ai có link thì xem được không?</summary><p>Chính sách chia sẻ và quyền riêng tư chưa chốt. Xác nhận trước khi đặt.</p></details>
      <details><summary>Có thể làm ý tưởng ngoài mẫu không?</summary><p>Có thể trao đổi để thống nhất thiết kế và phạm vi. Giá được báo riêng trước khi bắt đầu.</p></details>
      <details><summary>Ai đủ điều kiện nhận ưu đãi?</summary><p>Ưu đãi dành cho khách lần đầu đủ điều kiện của chiến dịch áp dụng gói Theo mẫu. Studio xác nhận thủ công; tiêu chí chi tiết cần xác nhận trước khi đặt.</p></details>
    </section>
    <p className="back-link"><Link href="/#xem-mau">← Quay về xem mẫu</Link></p>
  </main>;
}