'use client';
import Bookshelf from '../components/bookshelf/Bookshelf';
import { templates } from '../data/templates';
import { getTopics } from '../data/topics';

export default function HomePage() {
  return <main className="album-page">
    <section className="hero" id="xem-mau" aria-label="Bộ sưu tập">
      <Bookshelf books={getTopics()} templates={templates} />
    </section>
  </main>;
}
