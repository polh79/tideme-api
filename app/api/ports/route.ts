import { NextResponse } from 'next/server';
import portsData from '@/data/ports.json';

/**
 * GET /api/ports - Retourne la liste de tous les ports disponibles
 */
export async function GET() {
  return NextResponse.json({
    ports: portsData.ports,
    count: portsData.ports.length,
  });
}
