import { NextRequest, NextResponse } from 'next/server';

const WASTE_API_URL = process.env.WASTE_API_URL || 'https://ion-back-production-495d.up.railway.app';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'Se requiere la URL de la imagen' },
                { status: 400 }
            );
        }

        const response = await fetch(`${WASTE_API_URL}/analyze-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(url),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Error en el análisis' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en análisis:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'No se pudo conectar con el servidor de IA' },
            { status: 500 }
        );
    }
}
