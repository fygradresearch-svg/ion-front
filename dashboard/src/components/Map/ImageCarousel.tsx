'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react';

interface AttachmentInfo {
  id: number;
  contentType: string;
  size: number;
  name: string;
}

export default function ImageCarousel({ objectId }: { objectId: number }) {
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const BASE_URL = "https://pifa.oefa.gob.pe/arcgis/rest/services/CiudadanoAmb/alertarrss_WebVisor/MapServer/0";

  useEffect(() => {
    let isMounted = true;
    const fetchAttachments = async () => {
      setLoading(true);
      setError(false);
      try {
        const url = BASE_URL + "/" + objectId + "/attachments?f=json";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        
        if (isMounted) {
          if (data.attachmentInfos && data.attachmentInfos.length > 0) {
            setAttachments(data.attachmentInfos);
          } else {
            setAttachments([]);
          }
        }
      } catch (err) {
        console.error("Error fetching attachments for " + objectId, err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAttachments();
    return () => { isMounted = false; };
  }, [objectId]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#10b981' }} />
        <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>Buscando fotos...</p>
      </div>
    );
  }

  if (error || attachments.length === 0) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
        <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Sin evidencias fotográficas</p>
      </div>
    );
  }

  const currentAttachment = attachments[currentIndex];
  const imageUrl = BASE_URL + "/" + objectId + "/attachments/" + currentAttachment.id;

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
        <img
          src={imageUrl}
          alt={"Evidencia " + (currentIndex + 1)}
          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/400x300?text=Error+Carga+Imagen";
          }}
        />
        
        {attachments.length > 1 && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length); }}
              style={{ pointerEvents: 'auto', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % attachments.length); }}
              style={{ pointerEvents: 'auto', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '4px' }}>
          {currentIndex + 1} / {attachments.length}
        </div>
      </div>

      <div style={{ marginTop: '8px', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '6px' }}>
        <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Links Directos:</p>
        <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
          {attachments.map((att, idx) => (
            <a
              key={att.id}
              href={BASE_URL + "/" + objectId + "/attachments/" + att.id}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                fontSize: '10px',
                color: idx === currentIndex ? '#10b981' : '#6366f1',
                textDecoration: 'none',
                marginBottom: '2px'
              }}
            >
              {idx + 1}. Ver Foto Original ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
