export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🌊 TideME API</h1>
      <p>Backend API pour l'application TideME - Marées et surf en temps réel</p>

      <h2>Endpoints</h2>

      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>POST /api/tides</h3>
        <p>Récupère les données de marées, météo et surf pour un port</p>
        <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "portId": "le-crouesty"
}`}
        </pre>
      </div>

      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>GET /api/ports</h3>
        <p>Liste tous les ports disponibles</p>
      </div>

      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>GET /api/cron/refresh</h3>
        <p>Cronjob interne - Pré-charge les ports populaires (nécessite authentification)</p>
      </div>

      <h2>Features</h2>
      <ul>
        <li>✅ Cache intelligent Redis (6h TTL)</li>
        <li>✅ Calculs temps réel (interpolation sinusoïdale)</li>
        <li>✅ Pré-chargement automatique (cronjob 4×/jour)</li>
        <li>✅ Support 30+ ports français</li>
        <li>✅ Données: marées, météo, surf, astronomie</li>
      </ul>

      <h2>Tech Stack</h2>
      <ul>
        <li>Next.js 16 (App Router)</li>
        <li>Upstash Redis (cache)</li>
        <li>StormGlass API (données)</li>
        <li>TypeScript</li>
        <li>Vercel (hosting + cron)</li>
      </ul>

      <p style={{ marginTop: '2rem', color: '#666' }}>
        Made with ❤️ for surfers and sailors
      </p>
    </div>
  );
}
