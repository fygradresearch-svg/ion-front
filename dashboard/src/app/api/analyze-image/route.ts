// src/app/api/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

// const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

const FLASK_API_URL = process.env.FLASK_API_URL || 'https://ion-backend-production.up.railway.app';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Reenviar la petición al servidor Flask
        const response = await fetch(`${FLASK_API_URL}/analyze`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.error || 'Error en el análisis' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error en análisis:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}