import { Alerta, WastePoint } from '@/types';
import { assignWastePointsToDistrict, DistrictCentroid } from '@/lib/districtUtils';

const OEFA_BASE =
    'https://pifa.oefa.gob.pe/arcgis/rest/services/CiudadanoAmb/alertarrss_WebVisor/MapServer/0';

export interface AnalyzedPoint {
    source: 'oefa' | 'created';
    id: string | number;
    lat: number;
    lng: number;
    prediction: string;
    confidence: number;
    image_url?: string;
}

export interface AnalysisProgress {
    current: number;
    total: number;
    message: string;
}

async function fetchAlertImageUrl(objectId: number): Promise<string | null> {
    try {
        const res = await fetch(`${OEFA_BASE}/${objectId}/attachments?f=json`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.attachmentInfos?.length > 0) {
            return `${OEFA_BASE}/${objectId}/attachments/${data.attachmentInfos[0].id}`;
        }
    } catch {
        return null;
    }
    return null;
}
async function analyzeImageUrl(url: string) {
    try {
        // Descargar imagen desde el navegador (evita 403 en Railway)
        const imgResponse = await fetch(url);
        if (!imgResponse.ok) throw new Error('No se pudo descargar la imagen');
        const blob = await imgResponse.blob();

        // Enviar como archivo al backend
        const formData = new FormData();
        formData.append('image', blob, 'imagen.jpg');
        formData.append('lat', '0');
        formData.append('lng', '0');

        const response = await fetch(`https://ion-back-production-495d.up.railway.app/create-point`, {
            method: 'POST',
            body: formData,
        });
        // const response = await fetch(`http://127.0.0.1:5000/create-point`, {
        //     method: 'POST',
        //     body: formData,
        // });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.prediction as { class: string; confidence: number };
    } catch (error) {
        console.error('❌ Error en análisis de imagen:', error);
        throw error;
    }
}
export async function analyzeDistrictPoints(
    district: string,
    alerts: Alerta[],
    wastePoints: WastePoint[],
    centroids: Record<string, DistrictCentroid>,
    onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalyzedPoint[]> {
    const districtAlerts = alerts.filter(a => a.NOMBDIST === district);
    const districtWaste = assignWastePointsToDistrict(wastePoints, district, centroids);
    const results: AnalyzedPoint[] = [];

    const totalSteps = districtWaste.length + districtAlerts.length;
    let current = 0;

    for (const point of districtWaste) {
        current += 1;
        onProgress?.({
            current,
            total: totalSteps,
            message: `Punto registrado #${point.id}...`,
        });

        try {
            const prediction = await analyzeImageUrl(point.image_url);
            results.push({
                source: 'created',
                id: point.id,
                lat: point.lat,
                lng: point.lng,
                prediction: prediction.class,
                confidence: prediction.confidence,
                image_url: point.image_url,
            });
        } catch {
            results.push({
                source: 'created',
                id: point.id,
                lat: point.lat,
                lng: point.lng,
                prediction: point.prediction,
                confidence: point.confidence,
                image_url: point.image_url,
            });
        }
    }

    const alertsToAnalyze = districtAlerts.slice(0, 15);
    for (const alerta of alertsToAnalyze) {
        current += 1;
        onProgress?.({
            current,
            total: totalSteps,
            message: `Alerta OEFA #${alerta.OBJECTID}...`,
        });

        const imageUrl = await fetchAlertImageUrl(alerta.OBJECTID);
        if (!imageUrl) continue;

        try {
            const prediction = await analyzeImageUrl(imageUrl);
            results.push({
                source: 'oefa',
                id: alerta.OBJECTID,
                lat: alerta.LATITUD,
                lng: alerta.LONGITUD,
                prediction: prediction.class,
                confidence: prediction.confidence,
                image_url: imageUrl,
            });
        } catch {
            // omitir puntos que fallen
        }
    }

    return results;
}
