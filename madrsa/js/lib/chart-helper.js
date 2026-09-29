/* ==========================================================================
   OFFLINE CHART HELPER
   Pure HTML5 Canvas & SVG Chart generator (No external CDN dependencies needed)
   ========================================================================== */

export class ChartHelper {
  /**
   * Renders a responsive Bar Chart into a canvas container
   * @param {HTMLCanvasElement} canvas
   * @param {Array} labels e.g. ['Mon', 'Tue', 'Wed']
   * @param {Array} positiveData e.g. [12, 14, 10]
   * @param {Array} negativeData e.g. [2, 1, 3]
   */
  static renderBarChart(canvas, labels, positiveData, negativeData) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 400;
    const height = canvas.height = 240;

    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 40;
    const paddingBottom = 30;
    const paddingTop = 20;
    const paddingRight = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Determine Y Max
    let maxVal = 5;
    for (let i = 0; i < labels.length; i++) {
      const p = positiveData[i] || 0;
      const n = Math.abs(negativeData[i] || 0);
      if (p > maxVal) maxVal = p;
      if (n > maxVal) maxVal = n;
    }
    maxVal = Math.ceil(maxVal * 1.2);

    // Draw Grid Lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = paddingTop + (chartHeight / steps) * i;
      const val = Math.round(maxVal - (maxVal / steps) * i);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, paddingLeft - 6, y + 3);
    }

    // Draw Bars
    const groupCount = labels.length;
    const groupWidth = chartWidth / groupCount;
    const barWidth = Math.min(18, (groupWidth - 12) / 2);

    for (let i = 0; i < groupCount; i++) {
      const groupX = paddingLeft + i * groupWidth + groupWidth / 2;

      // Positive Bar
      const posVal = positiveData[i] || 0;
      const posHeight = (posVal / maxVal) * chartHeight;
      const posBarX = groupX - barWidth - 2;
      const posBarY = paddingTop + (chartHeight - posHeight);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(posBarX, posBarY, barWidth, posHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Negative Bar
      const negVal = Math.abs(negativeData[i] || 0);
      const negHeight = (negVal / maxVal) * chartHeight;
      const negBarX = groupX + 2;
      const negBarY = paddingTop + (chartHeight - negHeight);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(negBarX, negBarY, barWidth, negHeight, [4, 4, 0, 0]);
      ctx.fill();

      // X Axis Label
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], groupX, height - 8);
    }
  }

  /**
   * Renders a Donut Chart into canvas
   */
  static renderDonutChart(canvas, positiveTotal, negativeTotal) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 300;
    const height = canvas.height = 200;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    const total = positiveTotal + negativeTotal;
    if (total === 0) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', centerX, centerY);
      return;
    }

    const posAngle = (positiveTotal / total) * Math.PI * 2;
    const negAngle = (negativeTotal / total) * Math.PI * 2;

    // Positive Slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, posAngle);
    ctx.fillStyle = '#10b981';
    ctx.fill();

    // Negative Slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, posAngle, posAngle + negAngle);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Inner Hole (Donut)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Center Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round((positiveTotal / total) * 100)}%`, centerX, centerY + 5);
  }
}
