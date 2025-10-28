'use client';

import { useState } from 'react';

export default function Home() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  // Fonction pour déclencher le refresh manuel du cache
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);

    try {
      const secret = prompt('Entrez le CRON_SECRET (tideme-cron-secret-2025):');
      if (!secret) {
        setIsRefreshing(false);
        return;
      }

      const response = await fetch('/api/cron/refresh', {
        headers: {
          'Authorization': `Bearer ${secret}`,
        },
      });

      const data = await response.json();
      setRefreshResult(data);
    } catch (error) {
      setRefreshResult({ error: error instanceof Error ? error.message : 'Erreur' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#333' }}>
            🌊 TideME API - Contrôle Manuel
          </h1>
          <p style={{ margin: '1rem 0', color: '#666', fontSize: '1.1rem' }}>
            Clique sur le bouton pour fetcher les 3 ports et remplir le cache
          </p>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              padding: '1rem 2rem',
              background: isRefreshing ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              marginTop: '1rem',
            }}
          >
            {isRefreshing ? '⏳ Fetching 3 ports...' : '🚀 FETCH 3 PORTS & FILL CACHE'}
          </button>

          {refreshResult && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: refreshResult.success ? '#d4f4dd' : '#ffe0e0',
              borderRadius: '12px',
              textAlign: 'left',
            }}>
              <h3 style={{
                margin: '0 0 1rem',
                color: refreshResult.success ? '#16a34a' : '#dc2626',
              }}>
                {refreshResult.success ? '✅ SUCCESS' : '❌ ERREUR'}
              </h3>
              <pre style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '1rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.85rem',
              }}>
                {JSON.stringify(refreshResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '16px',
          padding: '2rem',
        }}>
          <h2 style={{ margin: '0 0 1rem', color: '#333' }}>📋 Comment ça marche ?</h2>
          <ol style={{ color: '#666', lineHeight: '1.8' }}>
            <li><strong>Clique sur le bouton</strong> → Appelle <code>/api/cron/refresh</code></li>
            <li><strong>Fetche les 3 ports</strong> depuis StormGlass (3 API calls)</li>
            <li><strong>Remplit le cache</strong> avec TTL 12h</li>
            <li><strong>L'app mobile</strong> lit ensuite le cache (0 calls supplémentaires)</li>
          </ol>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#fff4d6',
            borderRadius: '8px',
            color: '#d97706',
          }}>
            <strong>⚠️ IMPORTANT :</strong> Chaque clic = 3 calls StormGlass. Quota gratuit = 10 calls/jour.
            <br/>
            Utilise ce bouton max 3 fois par jour !
          </div>

          <div style={{
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            fontSize: '0.9rem',
            color: '#666',
          }}>
            <div>
              <strong>Ports :</strong> Dunkerque ⚓, Le Crouesty ⛵, Biarritz 🏄
            </div>
            <div>
              <strong>Cache TTL :</strong> 12 heures
            </div>
            <div>
              <strong>API :</strong> StormGlass (marées uniquement)
            </div>
            <div>
              <strong>Quota :</strong> 10 calls/jour (gratuit)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
