import { Alerta } from '@/types';

export async function exportDashboardToPdf(
    stats: { total: number; atendidos: number; noAtendidos: number },
    selectedDept: string | null,
    selectedProv: string | null,
    alerts: Alerta[]
) {
    // Temporary style element to override oklch/lab colors with standard hex colors for html2canvas compatibility
    const style = document.createElement('style');
    style.innerHTML = `
        #pdf-chart-classification, #pdf-chart-classification *,
        #pdf-chart-distritos, #pdf-chart-distritos *,
        #pdf-chart-atencion, #pdf-chart-atencion * {
            border-color: #e2e8f0 !important;
        }
        .text-slate-400 { color: #94a3b8 !important; }
        .text-slate-500 { color: #64748b !important; }
        .text-slate-600 { color: #475569 !important; }
        .text-slate-800 { color: #1e293b !important; }
        .text-slate-900 { color: #0f172a !important; }
        .text-emerald-500 { color: #10b981 !important; }
        .text-emerald-600 { color: #059669 !important; }
        .text-amber-500 { color: #f59e0b !important; }
        .text-amber-600 { color: #d97706 !important; }
        .text-red-500 { color: #ef4444 !important; }
        .text-red-600 { color: #dc2626 !important; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .bg-slate-100 { background-color: #f1f5f9 !important; }
        .bg-emerald-500 { background-color: #10b981 !important; }
        .bg-amber-500 { background-color: #f59e0b !important; }
        .bg-red-500 { background-color: #ef4444 !important; }
        .bg-white { background-color: #ffffff !important; }
    `;

    try {
        document.head.appendChild(style);

        // Dynamic imports to avoid Next.js SSR build errors
        const jsPDF = (await import('jspdf')).default;
        const html2canvas = (await import('html2canvas')).default;

        // Helper function to capture HTML element while cleaning oklch/oklab/lab colors
        const captureElement = async (el: HTMLElement) => {
            return await html2canvas(el, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                onclone: (clonedDoc: Document) => {
                    // 1. Clean Style Sheets
                    try {
                        for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
                            const sheet = clonedDoc.styleSheets[i];
                            try {
                                const rules = sheet.cssRules || sheet.rules;
                                if (!rules) continue;
                                for (let j = 0; j < rules.length; j++) {
                                    const rule = rules[j] as CSSStyleRule;
                                    if (rule.style) {
                                        for (let k = 0; k < rule.style.length; k++) {
                                            const propName = rule.style[k];
                                            const val = rule.style.getPropertyValue(propName);
                                            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('lab'))) {
                                                rule.style.setProperty(propName, '#888888', rule.style.getPropertyPriority(propName));
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore CORS stylesheet security errors
                            }
                        }
                    } catch (e) {
                        console.error('Error cleaning stylesheets', e);
                    }

                    // 2. Clean Style Tags
                    try {
                        const styleTags = clonedDoc.getElementsByTagName('style');
                        for (let i = 0; i < styleTags.length; i++) {
                            let css = styleTags[i].innerHTML;
                            if (css.includes('oklch') || css.includes('oklab') || css.includes('lab')) {
                                css = css.replace(/oklch\([^)]*\)/g, '#888888');
                                css = css.replace(/oklab\([^)]*\)/g, '#888888');
                                css = css.replace(/lab\([^)]*\)/g, '#888888');
                                styleTags[i].innerHTML = css;
                            }
                        }
                    } catch (e) {
                        console.error('Error cleaning style tags', e);
                    }

                    // 3. Clean Inline Styles
                    try {
                        const elements = clonedDoc.querySelectorAll('*');
                        elements.forEach((el: any) => {
                            const styleAttr = el.getAttribute('style');
                            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('lab'))) {
                                let cleaned = styleAttr;
                                cleaned = cleaned.replace(/oklch\([^)]*\)/g, '#888888');
                                cleaned = cleaned.replace(/oklab\([^)]*\)/g, '#888888');
                                cleaned = cleaned.replace(/lab\([^)]*\)/g, '#888888');
                                el.setAttribute('style', cleaned);
                            }
                        });
                    } catch (e) {
                        console.error('Error cleaning inline styles', e);
                    }
                }
            });
        };

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Group and count points by district for page 3
        const distritosMap: Record<string, { district: string; total: number; atendidos: number; noAtendidos: number }> = {};
        alerts.forEach((curr) => {
            const key = curr.NOMBDIST || 'Sin distrito';
            if (!distritosMap[key]) {
                distritosMap[key] = {
                    district: key,
                    total: 0,
                    atendidos: 0,
                    noAtendidos: 0,
                };
            }
            const estado = curr.ESTADO_DESC || '';
            const isAtendido = estado.toLowerCase().includes('atendido') && !estado.toLowerCase().includes('no atendido');
            distritosMap[key].total += 1;
            if (isAtendido) {
                distritosMap[key].atendidos += 1;
            } else {
                distritosMap[key].noAtendidos += 1;
            }
        });

        const distritosList = Object.values(distritosMap).sort((a, b) => b.total - a.total);

        // ================================================================
        // PAGE 1: HEADER & KPIs & CLASSIFICATION DONUT
        // ================================================================

        // Header Banner (Emerald Green #10b981)
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('REPORTE ECOWATCH DASH', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('EcoWatch - Detección de Residuos por Inteligencia Artificial', 14, 25);

        // Date
        // and Metadata
        const dateStr = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
        doc.setFontSize(9);
        doc.text(`Generado: ${dateStr}`, pageWidth - 14, 15, { align: 'right' });
        doc.text(`Filtro: Dept. ${selectedDept || 'TODOS'} / Prov. ${selectedProv || 'TODAS'}`, pageWidth - 14, 21, { align: 'right' });

        // Reset text color to slate-800
        doc.setTextColor(30, 41, 59);

        // KPI Summary Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Resumen de Puntos Críticos', 14, 52);

        // Draw 3 KPI Cards
        const cardWidth = (pageWidth - 36) / 3;
        const cardY = 58;
        const cardHeight = 22;

        // KPI Card 1: Total
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.rect(14, cardY, cardWidth, cardHeight, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text(String(stats.total), 14 + cardWidth / 2, cardY + 10, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('TOTAL PUNTOS', 14 + cardWidth / 2, cardY + 16, { align: 'center' });

        // KPI Card 2: Atendidos
        doc.setFillColor(240, 253, 250); // emerald-50
        doc.setDrawColor(204, 251, 241); // emerald-100
        doc.rect(14 + cardWidth + 4, cardY, cardWidth, cardHeight, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(5, 150, 105);
        doc.text(String(stats.atendidos), 14 + cardWidth + 4 + cardWidth / 2, cardY + 10, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text('ATENDIDOS', 14 + cardWidth + 4 + cardWidth / 2, cardY + 16, { align: 'center' });

        // KPI Card 3: Pendientes
        doc.setFillColor(254, 242, 242); // red-50
        doc.setDrawColor(254, 226, 226); // red-100
        doc.rect(14 + (cardWidth + 4) * 2, cardY, cardWidth, cardHeight, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(220, 38, 38);
        doc.text(String(stats.noAtendidos), 14 + (cardWidth + 4) * 2 + cardWidth / 2, cardY + 10, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(239, 68, 68);
        doc.text('PENDIENTES', 14 + (cardWidth + 4) * 2 + cardWidth / 2, cardY + 16, { align: 'center' });

        // Reset Text Color
        doc.setTextColor(30, 41, 59);

        // Chart 1: Clasificación de Residuos
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('1. Clasificación Municipal de Residuos (IA)', 14, 92);

        const classEl = document.getElementById('pdf-chart-classification');
        if (classEl) {
            const canvas = await captureElement(classEl);
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 28;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            doc.addImage(imgData, 'PNG', 14, 98, imgWidth, imgHeight);
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.text('Gráfico no disponible.', 14, 98);
        }

        // Page Footer Page 1
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('EcoWatch Dash - Sistema de Vigilancia Ambiental con IA', 14, pageHeight - 10);
        doc.text('Página 1 de 3', pageWidth - 14, pageHeight - 10, { align: 'right' });

        // ================================================================
        // PAGE 2: CHART 2 - CATEGORÍAS POR DISTRITO
        // ================================================================
        doc.addPage();

        // Page 2 Header Banner
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('INDICADORES GENERALES - ECOWATCH REPORT', 14, 10);

        doc.setTextColor(30, 41, 59);

        // Chart 2: Categorías por Distrito
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('2. Categorías IA por Distrito', 14, 28);

        const distritosEl = document.getElementById('pdf-chart-distritos');
        if (distritosEl) {
            const canvas = await captureElement(distritosEl);
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 28;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            doc.addImage(imgData, 'PNG', 14, 34, imgWidth, Math.min(imgHeight, 95));
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.text('Gráfico no disponible.', 14, 34);
        }

        // Page Footer Page 2
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('EcoWatch Dash - Sistema de Vigilancia Ambiental con IA', 14, pageHeight - 10);
        doc.text('Página 2 de 3', pageWidth - 14, pageHeight - 10, { align: 'right' });

        // ================================================================
        // PAGE 3: DETALLE DE PUNTOS CRÍTICOS POR DISTRITO
        // ================================================================
        doc.addPage();

        // Page 3 Header Banner
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DETALLE POR DISTRITO - ECOWATCH REPORT', 14, 10);

        doc.setTextColor(30, 41, 59);

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('3. Detalle de Puntos Críticos por Distrito', 14, 28);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('A continuación se detalla la cantidad de puntos críticos detectados, atendidos y pendientes para cada distrito.', 14, 33);

        // Table headers
        let currentY = 42;
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(14, currentY, pageWidth - 28, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text('Distrito', 18, currentY + 5.5);
        doc.text('Atendidos', pageWidth - 85, currentY + 5.5, { align: 'right' });
        doc.text('Pendientes', pageWidth - 50, currentY + 5.5, { align: 'right' });
        doc.text('Total', pageWidth - 18, currentY + 5.5, { align: 'right' });

        currentY += 8;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);

        distritosList.forEach((d, idx) => {
            // Check if we need to add a new page (if table overflows A4 height)
            if (currentY > pageHeight - 25) {
                // Footer for the page we are leaving
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('EcoWatch Dash - Sistema de Vigilancia Ambiental con IA', 14, pageHeight - 10);
                doc.text('Página 3 (Cont.)', pageWidth - 14, pageHeight - 10, { align: 'right' });

                doc.addPage();

                // New page header banner
                doc.setFillColor(16, 185, 129);
                doc.rect(0, 0, pageWidth, 15, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('DETALLE POR DISTRITO - ECOWATCH REPORT', 14, 10);

                currentY = 25;

                // Re-draw headers on new page
                doc.setFillColor(241, 245, 249); // slate-100
                doc.rect(14, currentY, pageWidth - 28, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(51, 65, 85);
                doc.text('Distrito', 18, currentY + 5.5);
                doc.text('Atendidos', pageWidth - 85, currentY + 5.5, { align: 'right' });
                doc.text('Pendientes', pageWidth - 50, currentY + 5.5, { align: 'right' });
                doc.text('Total', pageWidth - 18, currentY + 5.5, { align: 'right' });

                currentY += 8;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(30, 41, 59);
            }

            // Zebra striping background
            if (idx % 2 === 0) {
                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(14, currentY, pageWidth - 28, 7, 'F');
            }

            doc.text(d.district, 18, currentY + 4.5);
            doc.text(String(d.atendidos), pageWidth - 85, currentY + 4.5, { align: 'right' });
            doc.text(String(d.noAtendidos), pageWidth - 50, currentY + 4.5, { align: 'right' });
            doc.text(String(d.total), pageWidth - 18, currentY + 4.5, { align: 'right' });

            currentY += 7;
        });

        // Page Footer for the final page
        const finalPageNum = doc.internal.pages.length - 1;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('EcoWatch Dash - Sistema de Vigilancia Ambiental con IA', 14, pageHeight - 10);
        doc.text(`Página ${finalPageNum} de ${finalPageNum}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

        const filename = `reporte-ambiental-${selectedDept || 'general'}-${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
    } catch (error) {
        console.error('Error generando el reporte PDF:', error);
        alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }
}