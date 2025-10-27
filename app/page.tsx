'use client';

import { useEffect, useState } from 'react';

interface PortStatus {
  portId: string;
  name: string;
  emoji: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  timestamp?: string;
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ports, setPorts] = useState<PortStatus[]>([
    { portId: 'dunkerque', name: 'Dunkerque', emoji: '⚓', status: 'loading' },
    { portId: 'le-crouesty', name: 'Le Crouesty', emoji: '⛵', status: 'loading' },
    { portId: 'biarritz', name: 'Biarritz', emoji: '🏄', status: 'loading' },
  ]);

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les données des ports
  useEffect(() => {
    const fetchPortData = async (portId: string, index: number) => {
      try {
        const response = await fetch('/api/tides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        setPorts(prev => {
          const newPorts = [...prev];
          newPorts[index] = {
            ...newPorts[index],
            status: 'success',
            data,
            timestamp: new Date().toISOString(),
          };
          return newPorts;
        });
      } catch (error) {
        setPorts(prev => {
          const newPorts = [...prev];
          newPorts[index] = {
            ...newPorts[index],
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            timestamp: new Date().toISOString(),
          };
          return newPorts;
        });
      }
    };

    // Charger les 3 ports en parallèle
    ports.forEach((port, index) => {
      fetchPortData(port.portId, index);
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#333' }}>
            🌊 TideME API Monitor
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '1.1rem' }}>
            Dashboard de monitoring - API Marées & Surf
          </p>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Heure serveur</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                {currentTime.toLocaleTimeString('fr-FR')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Date</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                {currentTime.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Ports Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}>
          {ports.map((port) => (
            <div
              key={port.portId}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              {/* Port Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{port.emoji}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>
                      {port.name}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>
                      {port.portId}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: port.status === 'loading'
                    ? '#ffd93d'
                    : port.status === 'success'
                    ? '#6bcf7f'
                    : '#ff6b6b',
                  boxShadow: port.status === 'success'
                    ? '0 0 20px rgba(107, 207, 127, 0.6)'
                    : port.status === 'error'
                    ? '0 0 20px rgba(255, 107, 107, 0.6)'
                    : 'none',
                  animation: port.status === 'loading' ? 'pulse 1.5s infinite' : 'none',
                }} />
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '1rem',
                background: port.status === 'loading'
                  ? '#fff4d6'
                  : port.status === 'success'
                  ? '#d4f4dd'
                  : '#ffe0e0',
                color: port.status === 'loading'
                  ? '#d97706'
                  : port.status === 'success'
                  ? '#16a34a'
                  : '#dc2626',
              }}>
                {port.status === 'loading' && '⏳ Chargement...'}
                {port.status === 'success' && '✓ API OK'}
                {port.status === 'error' && '✗ Erreur API'}
              </div>

              {/* Timestamp */}
              {port.timestamp && (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#999',
                  marginBottom: '1rem',
                }}>
                  Dernière mise à jour: {new Date(port.timestamp).toLocaleTimeString('fr-FR')}
                </div>
              )}

              {/* Error Message */}
              {port.error && (
                <div style={{
                  padding: '1rem',
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  color: '#c00',
                  fontSize: '0.9rem',
                }}>
                  <strong>Erreur:</strong> {port.error}
                </div>
              )}

              {/* JSON Data */}
              {port.data && (
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{
                    cursor: 'pointer',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontWeight: '600',
                    color: '#555',
                    userSelect: 'none',
                  }}>
                    📊 Voir les données JSON
                  </summary>
                  <pre style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '0.75rem',
                    maxHeight: '400px',
                  }}>
                    {JSON.stringify(port.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginTop: '2rem',
          textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#333' }}>Configuration</h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            fontSize: '0.9rem',
            color: '#666',
          }}>
            <div>📍 <strong>3 ports</strong> en mode dev</div>
            <div>⏰ <strong>Refresh:</strong> toutes les 12h</div>
            <div>💾 <strong>Cache:</strong> 12h TTL</div>
            <div>🌐 <strong>API:</strong> StormGlass</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
