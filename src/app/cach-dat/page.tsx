'use client';
import Link from 'next/link';
import { useMessages } from '../../i18n/LocaleProvider';

export default function OrderPage() {
  const t = useMessages();
  return <main className="section container info-page"><div className="section-heading"><h1>{t.order.title}</h1></div><div className="steps">{t.order.steps.map(([title, description], index) => <article key={index}><span>0{index + 1}</span><h2>{title}</h2><p>{description}</p></article>)}</div><Link className="text-link" href="/bang-gia/">{t.order.pricingLink} ↗</Link></main>;
}
