'use client';
import Link from 'next/link';
import { site } from '../../config/site';
import BrandWordmark from '../BrandWordmark';

export default function Footer() {
  return <footer className="site-footer" id="lien-he"><div className="container footer-inner">
    <Link className="brand" href="/"><BrandWordmark /></Link><p>{'Một câu chuyện nhỏ, gửi đến người thật đặc biệt.'}</p>
    <p className="muted">{site.contactUrl ? <a href={site.contactUrl}>{'Nhắn mình'}</a> : site.contactLabel}</p>
    <small>© {new Date().getFullYear()} {site.brand}</small>
  </div></footer>;
}