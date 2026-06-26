import { NextResponse } from 'next/server';

const WASTE_API_URL = process.env.WASTE_API_URL || 'https://ion-back-production-495d.up.railway.app/'

export async function GET() {
    try {
        const response = await fetch(`${WASTE_API_URL}/points`, { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Error al obtener puntos' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error obteniendo puntos:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'No se pudo conectar con el servidor' },
            { status: 500 }
        );
    }
}
