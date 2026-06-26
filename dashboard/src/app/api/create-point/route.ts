import { NextRequest, NextResponse } from 'next/server';

const WASTE_API_URL = process.env.WASTE_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const lat = formData.get('lat');
        const lng = formData.get('lng');
        const image = formData.get('image');

        if (!lat || !lng || !image) {
            return NextResponse.json(
                { error: 'Se requieren lat, lng e imagen' },
                { status: 400 }
            );
        }

        const response = await fetch(`${WASTE_API_URL}/create-point`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Error al crear el punto' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creando punto:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'No se pudo conectar con el servidor' },
            { status: 500 }
        );
    }
}
