'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { packageCopy, pricing } from '../../config/pricing';
import { campaign } from '../../config/campaign';
import { site } from '../../config/site';
import { localizeTemplate, templates } from '../../data/templates';
import { useLocale, useMessages } from '../../i18n/LocaleProvider';
import { formatVnd } from '../../i18n/messages';

export default function PricingContent() {
  const locale = useLocale();
  const t = useMessages().pricing;
  const standard = packageCopy(pricing.standard, locale);
  const personal = packageCopy(pricing.personal, locale);
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
    <nav className="breadcrumb" aria-label={t.breadcrumb}><Link href="/">{t.home}</Link><span aria-hidden="true">/</span><span>{t.page}</span>{selectedTemplate && <span className="selected-note">{t.selected(localizeTemplate(selectedTemplate, locale).title)}</span>}</nav>
    <header className="page-intro"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="muted">{t.intro}</p></header>
    <section className="package-grid" aria-label={t.compare}>
      <article className="package-card"><p className="eyebrow">{t.standardEyebrow}</p><h2>{standard.name}</h2><p className="package-price">{formatVnd(pricing.standard.priceVnd, locale)}</p><p className="muted">{t.listPrice}</p><ul>{standard.features.map(item => <li key={item}>{item}</li>)}</ul>{standardHref ? <a className="button" href={standardHref}>{t.chooseStandard}</a> : <a className="button" href="#lien-he">{t.chooseStandard}</a>}</article>
      <article className="package-card package-card--featured"><p className="eyebrow">{t.personalEyebrow}</p><h2>{personal.name}</h2><p className="package-price">{formatVnd(pricing.personal.priceVnd, locale)}</p><p className="muted">{t.listPrice}</p><ul>{personal.features.map(item => <li key={item}>{item}</li>)}</ul>{personalHref ? <a className="button" href={personalHref}>{t.choosePersonal}</a> : <a className="button" href="#lien-he">{t.choosePersonal}</a>}</article>
    </section>
    <section className="campaign-box" id="uu-dai"><p className="eyebrow">{t.campaignEyebrow}</p><h2>{t.campaignTitle(campaign.freeCustomerLimit)}</h2><p>{t.campaignBefore}<strong>{formatVnd(campaign.laterFirstOrderPriceVnd, locale)}</strong>{t.campaignAfter}</p><p className="muted">{t.campaignNote(formatVnd(pricing.standard.priceVnd, locale))}</p>{site.contactUrl ? <a className="button" href={site.contactUrl}>{t.campaignAsk}</a> : <p className="unavailable">{t.campaignUnavailable}</p>}</section>
    <section className="faq section"><div className="section-heading"><p className="eyebrow">{t.faqEyebrow}</p><h2>{t.faqTitle}</h2></div>
      {t.faq.map(([question, answer], index) => <details key={index}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>
    <p className="back-link"><Link href="/#xem-mau">{t.back}</Link></p>
  </main>;
}