/* ==========================================================================
   IMAGE REPORT SERVICE
   Pure client-side HTML5 Canvas card renderer for shareable report graphics
   ========================================================================== */

import { settingsRepository } from '../repositories/settingsRepository.js';

export class ImageReportService {
  async generateDailyReportImage(reportData) {
    const madrasaName = await settingsRepository.getSetting('madrasaName', 'Darul Uloom Madrasa');
    const className = reportData.class?.name || 'Class 5';
    const dateFormatted = new Date(reportData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 950;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Header Card
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.roundRect(40, 40, width - 80, 140, 16);
    ctx.fill();

    // Madrasa Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(madrasaName.toUpperCase(), width / 2, 90);

    ctx.fillStyle = '#818cf8';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`DAILY PERFORMANCE REPORT • ${className.toUpperCase()}`, width / 2, 125);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Date: ${dateFormatted}`, width / 2, 155);

    // Best Performer Section
    let startY = 210;
    if (reportData.bestPerformer && reportData.bestPerformer.bestPerformerNames !== 'None') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(40, startY, width - 80, 90, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 BEST PERFORMER OF THE DAY', width / 2, startY + 35);

      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(`${reportData.bestPerformer.bestPerformerNames} (+${reportData.bestPerformer.bestScore} Pts)`, width / 2, startY + 68);

      startY += 110;
    }

    // Top Students Table Container
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, startY, width - 80, 450, 16);
    ctx.fill();

    // Table Header
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Rank', 70, startY + 40);
    ctx.fillText('Student Name', 160, startY + 40);
    ctx.textAlign = 'right';
    ctx.fillText('Points', width - 70, startY + 40);

    // Divider Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, startY + 55);
    ctx.lineTo(width - 60, startY + 55);
    ctx.stroke();

    // Top Rows
    const rowsToDraw = reportData.rows.slice(0, 8);
    let rowY = startY + 95;

    rowsToDraw.forEach((r, idx) => {
      // Rank circle
      ctx.fillStyle = r.rank === 1 ? '#f59e0b' : r.rank === 2 ? '#94a3b8' : r.rank === 3 ? '#d97706' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(85, rowY - 6, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = r.rank <= 3 ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${r.rank}`, 85, rowY - 1);

      // Name
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.student.name, 160, rowY);

      // Score
      ctx.fillStyle = r.netPoints >= 0 ? '#10b981' : '#ef4444';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${r.netPoints >= 0 ? '+' : ''}${r.netPoints} pts`, width - 70, rowY);

      rowY += 44;
    });

    // Summary Stat Pills Footer
    const footerY = height - 120;

    // Stat 1: Positive
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.roundRect(40, footerY, 220, 70, 12);
    ctx.fill();
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POSITIVE POINTS', 150, footerY + 28);
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`+${reportData.totalPositive}`, 150, footerY + 55);

    // Stat 2: Negative
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath();
    ctx.roundRect(290, footerY, 220, 70, 12);
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('NEGATIVE POINTS', 400, footerY + 28);
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`-${reportData.totalNegative}`, 400, footerY + 55);

    // Stat 3: Net Score
    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    ctx.roundRect(540, footerY, 220, 70, 12);
    ctx.fill();
    ctx.fillStyle = '#312e81';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('CLASS NET SCORE', 650, footerY + 28);
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`${reportData.netScore >= 0 ? '+' : ''}${reportData.netScore}`, 650, footerY + 55);

    // Convert to Image Download
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Madrasa_Report_${className.replace(/\s+/g, '_')}_${reportData.date}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve(true);
      }, 'image/png');
    });
  }
}

export const imageReportService = new ImageReportService();
