import { MessageBoard } from "@/components/message-board";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Docker + CI/CD learning project</p>
          <h1 id="page-title">Realtime Messages Lab</h1>
          <p className="hero-copy">
            The frontend talks to one HTTP service for stored messages and one
            WebSocket service for live updates.
          </p>
        </div>

        <div className="architecture" aria-label="Application architecture">
          <span>Next.js</span>
          <b aria-hidden="true">→</b>
          <span>HTTP + WebSocket</span>
          <b aria-hidden="true">→</b>
          <span>PostgreSQL</span>
        </div>
      </section>

      <MessageBoard />
    </main>
  );
}
