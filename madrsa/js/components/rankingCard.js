/* ==========================================================================
   RANKING CARD COMPONENT
   Podium header for top 3 & ranking list items
   ========================================================================== */

export function renderRankingsView(rankedRows = []) {
  const container = document.createElement('div');
  container.className = 'rankings-view';

  if (!rankedRows || rankedRows.length === 0) {
    container.innerHTML = `
      <div style="padding: 3rem; text-align: center; color: #64748b;">
        No performance records available for ranking calculation.
      </div>
    `;
    return container;
  }

  // Top 3 Podium
  const rank1 = rankedRows.find(r => r.rank === 1);
  const rank2 = rankedRows.find(r => r.rank === 2);
  const rank3 = rankedRows.find(r => r.rank === 3);

  let podiumHTML = '';
  if (rank1 || rank2 || rank3) {
    podiumHTML = `
      <div class="podium-container">
        <!-- Rank 2 -->
        <div class="podium-place podium-rank-2">
          ${rank2 ? `
            <div class="podium-avatar">
              <span class="podium-badge">🥈</span>
              ${rank2.student.name.charAt(0)}
            </div>
            <div class="podium-block">
              <div style="font-size: 0.8rem;">${rank2.student.name}</div>
              <div style="font-size: 1.1rem; font-weight: 800;">+${rank2.netPoints}</div>
            </div>
          ` : ''}
        </div>

        <!-- Rank 1 -->
        <div class="podium-place podium-rank-1">
          ${rank1 ? `
            <div class="podium-avatar">
              <span class="podium-badge">🥇</span>
              ${rank1.student.name.charAt(0)}
            </div>
            <div class="podium-block">
              <div style="font-size: 0.85rem;">${rank1.student.name}</div>
              <div style="font-size: 1.25rem; font-weight: 800;">+${rank1.netPoints}</div>
            </div>
          ` : ''}
        </div>

        <!-- Rank 3 -->
        <div class="podium-place podium-rank-3">
          ${rank3 ? `
            <div class="podium-avatar">
              <span class="podium-badge">🥉</span>
              ${rank3.student.name.charAt(0)}
            </div>
            <div class="podium-block">
              <div style="font-size: 0.8rem;">${rank3.student.name}</div>
              <div style="font-size: 1rem; font-weight: 800;">+${rank3.netPoints}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Full Ranking List
  let listHTML = '<div class="ranking-list">';
  rankedRows.forEach(r => {
    const topClass = r.rank === 1 ? 'top-1' : r.rank === 2 ? 'top-2' : r.rank === 3 ? 'top-3' : '';
    const badgeText = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}`;

    listHTML += `
      <div class="ranking-item">
        <div class="ranking-left">
          <div class="rank-number ${topClass}">${badgeText}</div>
          <div>
            <div style="font-weight: 700; color: var(--color-primary-navy);">${r.student.name}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">${r.student.admissionNumber || ''}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.1rem; font-weight: 800; color: ${r.netPoints >= 0 ? '#10b981' : '#ef4444'};">
            ${r.netPoints >= 0 ? '+' : ''}${r.netPoints} pts
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">
            Pos: +${r.positivePoints} | Neg: -${r.negativePoints}
          </div>
        </div>
      </div>
    `;
  });
  listHTML += '</div>';

  container.innerHTML = podiumHTML + listHTML;
  return container;
}
