import { site } from '../config/site';

/** All logo placements inherit their typography and color from theme.css. */
export default function BrandWordmark() {
  return <span className="brand-wordmark">{site.brand}</span>;
}