import type { Metadata } from 'next';
import Cart from '../../modules/cart/Cart';
import { site } from '../../config/site';

export const metadata: Metadata = {
  title: `Giỏ hàng — ${site.brand}`,
  description: 'Các mẫu thiệp đã chọn và tóm tắt chi phí theo gói.',
};

export default function CartPage() {
  return <Cart />;
}