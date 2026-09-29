/* ==========================================================================
   REPORT TABLE COMPONENT
   Renders daily, weekly, or monthly report summary data in tabular view
   ========================================================================== */

export function renderReportTable(rows = [], criteria = []) {
  const container = document.createElement('div');
  container.className = 'report-table-wrapper';

  if (!rows || rows.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #64748b;">
        No report records found for the selected filter.
      </div>
    `;
    return container;
  }

  const hasCriteriaBreakdown = criteria && criteria.length > 0;

  let criteriaHeadersHTML = '';
  if (hasCriteriaBreakdown) {
    criteriaHeadersHTML = criteria.map(c => `<th>${c.icon} ${c.name}</th>`).join('');
  }

  let tableHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Student Name</th>
          <th>Admission No</th>
          ${criteriaHeadersHTML}
          <th>Positive</th>
          <th>Negative</th>
          <th>Net Score</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    const rankBadge = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`;
    const scoreColorClass = r.netPoints > 0 ? 'text-positive' : r.netPoints < 0 ? 'text-negative' : '';

    let criteriaCellsHTML = '';
    if (hasCriteriaBreakdown) {
      const recMap = new Map();
      (r.records || []).forEach(rec => recMap.set(rec.criterionId, rec));

      criteriaCellsHTML = criteria.map(crit => {
        const rec = recMap.get(crit.id);
        const icon = rec?.status === 'positive' ? '<span style="color:#10b981; font-weight:bold;">✓</span>' 
                   : rec?.status === 'negative' ? '<span style="color:#ef4444; font-weight:bold;">✕</span>' 
                   : '<span style="color:#94a3b8;">—</span>';
        return `<td style="text-align:center;">${icon}</td>`;
      }).join('');
    }

    tableHTML += `
      <tr>
        <td style="font-weight: 700; color: var(--color-primary-navy);">${rankBadge}</td>
        <td style="font-weight: 600;">${r.student.name}</td>
        <td style="color: var(--color-text-muted);">${r.student.admissionNumber || ''}</td>
        ${criteriaCellsHTML}
        <td style="color: #10b981; font-weight: 700;">+${r.positivePoints}</td>
        <td style="color: #ef4444; font-weight: 700;">-${r.negativePoints}</td>
        <td style="font-size: 1rem; font-weight: 800;" class="${scoreColorClass}">
          ${r.netPoints >= 0 ? '+' : ''}${r.netPoints}
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
  return container;
}
