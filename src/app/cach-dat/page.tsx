import Link from 'next/link';

export default function OrderPage() {
  const steps = [
    ['Chọn mẫu', 'Mở album, chọn mẫu và xem chi tiết.'],
    ['Chuẩn bị nội dung', 'Chuẩn bị tên, lời nhắn và ảnh nếu có. Thống nhất nội dung, phạm vi và giá trước khi làm.'],
    ['Duyệt và nhận link', 'Xem bản nháp, chốt nội dung rồi nhận đường link để gửi tặng.'],
  ];
  return <main className="section container info-page"><div className="section-heading"><h1>Cách đặt</h1></div><div className="steps">{steps.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{description}</p></article>)}</div><Link className="text-link" href="/bang-gia/">Xem bảng giá ↗</Link></main>;
}