/* ==========================================================================
   SCORE BUTTON COMPONENT
   3-state interactive toggle button (+1, -1, 0)
   ========================================================================== */

export function renderScoreButton({ criterion, status = 'neutral', points = 0, onClick }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `score-btn is-${status}`;

  const iconMap = {
    positive: '✓',
    negative: '✕',
    neutral: '—'
  };

  btn.innerHTML = `
    <span class="btn-label">${criterion.icon} ${criterion.name}</span>
    <span class="btn-status-icon">${iconMap[status]}</span>
  `;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onClick) onClick(criterion, status);
  });

  return btn;
}
