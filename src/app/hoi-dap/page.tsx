export default function FaqPage() {
  const questions = [
    ['Cần chuẩn bị những gì?', 'Tên, lời nhắn, ảnh nếu có và ý tưởng bạn muốn thực hiện. Phạm vi được xác nhận trước khi bắt đầu.'],
    ['Có thể sửa nội dung không?', 'Số lần chỉnh sửa nhỏ được nêu trong từng gói ở trang bảng giá. Nội dung cụ thể được thống nhất trước khi làm.'],
    ['Có video và demo để xem không?', 'Hiện chưa có video và demo đã xác minh. Liên kết sẽ được bổ sung khi sẵn sàng; bìa album là hình minh họa.'],
    ['Thời gian làm và duy trì link thế nào?', 'Thời gian thực hiện, thời hạn duy trì link và các chính sách liên quan cần được xác nhận trước khi đặt.'],
  ];
  return <main className="section container faq info-page"><div className="section-heading"><h1>Hỏi đáp</h1></div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</main>;
}