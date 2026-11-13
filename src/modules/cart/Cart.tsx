'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { templates, type TemplateRecord } from '../../data/templates';
import { CoverArt } from '../../components/bookshelf/Book';
import { cartPackages, cartStorageKey, formatCartPrice, parseCart, type CartItem } from './cart-data';
import './cart.css';

function Artwork({ template }: { template: TemplateRecord }) {
  return <div className="cart-artwork" data-book-theme={template.themeKey} aria-hidden="true"><CoverArt book={template} /></div>;
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('');
  const [storageError, setStorageError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try { setItems(parseCart(localStorage.getItem(cartStorageKey))); }
    catch { setStorageError(true); }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === cartStorageKey || event.key === null) setItems(parseCart(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const update = (next: CartItem[]) => {
    setItems(next);
    try { localStorage.setItem(cartStorageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  };
  const total = items.reduce((sum, item) => sum + (cartPackages.find(pack => pack.id === item.packageId)?.priceVnd ?? 0), 0);

  return <main className="container cart-page" aria-busy={!ready}>
    <div className="cart-layout">
      <section className="cart-products" aria-labelledby="cart-title">
        <header className="cart-heading"><h1 id="cart-title" ref={headingRef} tabIndex={-1}>Giỏ hàng</h1><span>({items.length} mẫu)</span></header>
        <div className="cart-items">
          {!ready ? <div className="cart-empty"><p>Đang tải giỏ hàng…</p></div> : items.length === 0 ? <div className="cart-empty"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" aria-hidden="true"><path d="M9 15h30l-3 26H12ZM17 17V12a7 7 0 0 1 14 0v5" /></svg><h2>Giỏ hàng đang trống</h2><Link className="button button--quiet" href="/#xem-mau">Khám phá bộ sưu tập <span aria-hidden="true">↗</span></Link></div> : items.map(item => {
            const template = templates.find(template => template.id === item.templateId)!;
            const pack = cartPackages.find(pack => pack.id === item.packageId)!;
            return <article className="cart-item" key={item.templateId} aria-label={template.title}>
              <Artwork template={template} />
              <div className="cart-item__copy"><p className="cart-occasion">{template.occasion}</p><h2>{template.title}</h2><p className="cart-item__description">{template.description}</p>
                <div className="cart-item__bottom"><label>Gói thiệp<select value={item.packageId} onChange={event => {
                  const selected = cartPackages.find(pack => pack.id === event.target.value);
                  if (selected) update(items.map(current => current.templateId === item.templateId ? { ...current, packageId: selected.id } : current));
                }}>{cartPackages.map(pack => <option value={pack.id} key={pack.id}>{pack.name}</option>)}</select></label><strong>{formatCartPrice(pack.priceVnd)}</strong></div>
              </div>
              <button className="cart-remove" type="button" aria-label={`Xóa ${template.title} khỏi giỏ hàng`} onClick={() => {
                update(items.filter(current => current.templateId !== item.templateId));
                setStatus(`Đã xóa ${template.title} khỏi giỏ hàng.`);
                headingRef.current?.focus();
              }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v8m4-8v8" /></svg></button>
            </article>;
          })}
        </div>
        {storageError && <p className="cart-notice" role="status">Không thể lưu giỏ hàng trên trình duyệt. Lựa chọn chỉ được giữ khi trang này đang mở.</p>}
        <section className="cart-catalog" aria-labelledby="cart-catalog-title"><h2 id="cart-catalog-title">Một chiếc thiệp dành cho bạn</h2><div className="cart-catalog__grid">{templates.filter(template => template.enabled).map(template => {
          const added = items.some(item => item.templateId === template.id);
          return <article className="cart-suggestion" key={template.id}><Artwork template={template} /><p className="cart-occasion">{template.occasion}</p><h3>{template.title}</h3><p>{formatCartPrice(cartPackages[0].priceVnd)} <span className="muted">/ {cartPackages[0].name}</span></p><button className="button button--quiet" type="button" disabled={!ready || added} onClick={() => {
            update([...items, { templateId: template.id, packageId: 'standard' }]);
            setStatus(`Đã thêm ${template.title} vào giỏ hàng.`);
          }}>{added ? 'Đã trong giỏ' : 'Thêm vào giỏ'}<span aria-hidden="true">{added ? '✓' : '+'}</span></button></article>;
        })}</div></section>
      </section>
      <aside className="cart-summary" aria-labelledby="cart-summary-title"><h2 id="cart-summary-title">Tóm tắt đơn hàng</h2><dl><div><dt>{items.length} mẫu thiệp</dt><dd>{formatCartPrice(total)}</dd></div><div><dt>Ưu đãi</dt><dd>Chưa áp dụng</dd></div><div className="cart-summary__total"><dt>Tổng tạm tính</dt><dd>{formatCartPrice(total)}</dd></div></dl><Link className="cart-campaign" href="/bang-gia/#uu-dai">Ưu đãi đơn đầu <span aria-hidden="true">↗</span></Link><button className="button cart-checkout" type="button" disabled aria-describedby="cart-checkout-status">Thanh toán <span aria-hidden="true">→</span></button><p className="cart-notice" id="cart-checkout-status">Thanh toán trực tuyến chưa khả dụng.</p><Link className="cart-continue" href="/#xem-mau">← Tiếp tục chọn thiệp</Link></aside>
    </div>
    <p className="cart-live" role="status">{status}</p>
  </main>;
}