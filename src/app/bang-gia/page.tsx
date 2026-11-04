import type { Metadata } from 'next';
import BespokeOffer from '../../components/static/BespokeOffer';
import PricingContent from '../../components/static/PricingContent';

export const metadata: Metadata = {
  title: 'Bảng giá — Gửi Một Chút',
  description: 'Các gói website quà tặng, giá niêm yết và chính sách ưu đãi lần đầu của Gửi Một Chút.',
};

export default function PricingPage() {
  return <><PricingContent /><div className="container"><BespokeOffer /></div></>;
}