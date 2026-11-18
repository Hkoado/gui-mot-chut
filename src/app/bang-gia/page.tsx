import type { Metadata } from 'next';
import PricingContent from '../../components/static/PricingContent';
import { site } from '../../config/site';

export const metadata: Metadata = {
  title: `Bảng giá — ${site.brand}`,
  description: `Các gói website quà tặng, giá niêm yết và chính sách ưu đãi lần đầu của ${site.brand}.`,
};

export default function PricingPage() {
  return <PricingContent />;
}