'use client';

import { useState, useEffect } from 'react';

type PortId = 'dunkerque' | 'le-crouesty' | 'biarritz';

export default function Home() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PortId>('dunkerque');
  const [portData, setPortData] = useState<Record<PortId, any>>({
    'dunkerque': null,
    'le-crouesty': null,
    'biarritz': null,
  });

  useEffect(() => {
    // Charger le statut au démarrage
    loadStatus();
    loadAllPorts();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      loadStatus();
      loadAllPorts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/debug/cache?portId=le-crouesty');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPorts = async () => {
    const ports: PortId[] = ['dunkerque', 'le-crouesty', 'biarritz'];

    for (const portId of ports) {
      try {
        const response = await fetch('/api/tides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portId }),
        });
        const data = await response.json();
        setPortData(prev => ({ ...prev, [portId]: data }));
      } catch (error) {
        console.error(`Error loading ${portId}:`, error);
      }
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
  };

  const getNextSlack = () => {
    if (!status || !status.tides) return null;
    const now = new Date();
    const nextTide = status.tides.find((t: any) => new Date(t.time) > now);
    return nextTide;
  };

  const nextSlack = getNextSlack();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e0e0e0',
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#fff' }}>
            🌊 TideME API Dashboard
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#b0b0b0', fontSize: '1.1rem' }}>
            Powered by WorldTides · Auto-refresh every 12h
          </p>
        </div>

        {/* Status Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {/* Statut */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
              Statut API
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#4ade80' }}>
              ✅ Opérationnel
            </div>
          </div>

          {/* Dernier refresh */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
              Dernier Refresh
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff' }}>
              {loading ? '...' : status?.fetchedAt ? formatTime(status.fetchedAt) : 'N/A'}
            </div>
          </div>

          {/* Prochaine étale */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
              Prochaine Étale
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#60a5fa' }}>
              {nextSlack ? (
                <>
                  {formatTime(nextSlack.time)}
                  <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                    ({nextSlack.type === 'high' ? 'PM ⬆️' : 'BM ⬇️'})
                  </span>
                </>
              ) : '...'}
            </div>
          </div>

          {/* Crédits WorldTides */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
              Crédits WorldTides
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fbbf24' }}>
              ~19,996 / 20,000
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '2rem',
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.5rem' }}>
            📡 API Endpoints
          </h2>

          <div style={{
            display: 'grid',
            gap: '1rem',
          }}>
            {/* POST /api/tides */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981',
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  background: '#10b981',
                  color: '#000',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>POST</span>
                <code style={{ color: '#a5f3fc', fontSize: '1.1rem' }}>/api/tides</code>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Récupère les données de marées pour un port
              </div>
              <code style={{
                display: 'block',
                background: '#1e1e1e',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                color: '#d4d4d4',
                overflowX: 'auto',
              }}>
                {`{ "portId": "le-crouesty" }`}
              </code>
            </div>

            {/* GET /api/ports */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #3b82f6',
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  background: '#3b82f6',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>GET</span>
                <code style={{ color: '#a5f3fc', fontSize: '1.1rem' }}>/api/ports</code>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                Liste tous les ports disponibles
              </div>
            </div>

            {/* GET /api/debug/cache */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #f59e0b',
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  background: '#f59e0b',
                  color: '#000',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>GET</span>
                <code style={{ color: '#a5f3fc', fontSize: '1.1rem' }}>/api/debug/cache?portId=biarritz</code>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                Debug : Voir le contenu du cache pour un port
              </div>
            </div>

            {/* GET /api/cron/refresh */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #ef4444',
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>GET</span>
                <code style={{ color: '#a5f3fc', fontSize: '1.1rem' }}>/api/cron/refresh</code>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                🔒 Refresh cache (3 ports) - Nécessite Authorization header
              </div>
              <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                ⚠️ Automatique toutes les 12h · Ne pas appeler manuellement
              </div>
            </div>
          </div>
        </div>

        {/* Tabs des ports avec JSON */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '2rem',
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.5rem' }}>
            📊 Port Data (JSON)
          </h2>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '0.5rem',
          }}>
            {(['dunkerque', 'le-crouesty', 'biarritz'] as PortId[]).map((portId) => (
              <button
                key={portId}
                onClick={() => setActiveTab(portId)}
                style={{
                  background: activeTab === portId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.05)',
                  border: activeTab === portId ? '1px solid #3b82f6' : '1px solid transparent',
                  color: activeTab === portId ? '#fff' : '#9ca3af',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: activeTab === portId ? '600' : '400',
                  transition: 'all 0.2s',
                }}
              >
                {portId === 'dunkerque' && '⚓ Dunkerque'}
                {portId === 'le-crouesty' && '⛵ Le Crouesty'}
                {portId === 'biarritz' && '🏄 Biarritz'}
              </button>
            ))}
          </div>

          {/* JSON Content */}
          <div style={{
            background: '#1e1e1e',
            borderRadius: '8px',
            padding: '1.5rem',
            maxHeight: '500px',
            overflowY: 'auto',
            fontFamily: 'monospace',
          }}>
            <pre style={{
              margin: 0,
              color: '#d4d4d4',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {portData[activeTab] ? JSON.stringify(portData[activeTab], null, 2) : 'Chargement...'}
            </pre>
          </div>
        </div>

        {/* Ports & Config */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}>
          {/* Ports actifs */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ margin: '0 0 1rem', color: '#fff' }}>Ports Actifs</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div>⚓ <strong>Dunkerque</strong> · Hauts-de-France</div>
              <div>⛵ <strong>Le Crouesty</strong> · Bretagne</div>
              <div>🏄 <strong>Biarritz</strong> · Pays Basque</div>
            </div>
          </div>

          {/* Configuration */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ margin: '0 0 1rem', color: '#fff' }}>Configuration</h3>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div><strong>Cache TTL :</strong> 12 heures</div>
              <div><strong>Cron :</strong> Toutes les 12h (auto)</div>
              <div><strong>API :</strong> WorldTides v3</div>
              <div><strong>Endpoint :</strong> <code style={{ color: '#a5f3fc' }}>api.worldtides.info/v3</code></div>
              <div><strong>Coût :</strong> ~$2/an</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.85rem',
        }}>
          Fait avec ❤️ · Vercel + WorldTides + Upstash Redis
        </div>
      </div>
    </div>
  );
}
