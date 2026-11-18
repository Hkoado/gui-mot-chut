'use client';
import { useMessages } from '../../i18n/LocaleProvider';

export default function FaqPage() {
  const t = useMessages();
  return <main className="section container faq info-page"><div className="section-heading"><h1>{t.faq.title}</h1></div>{t.faq.questions.map(([question, answer], index) => <details key={index}><summary>{question}</summary><p>{answer}</p></details>)}</main>;
}
