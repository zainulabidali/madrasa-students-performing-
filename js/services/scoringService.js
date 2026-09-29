/* ==========================================================================
   SCORING SERVICE
   Single source of truth for score calculation rules
   ========================================================================== */

export class ScoringService {
  /**
   * Calculates scores for a list of performance records or criterion entries.
   * @param {Array} records Array of { status, points }
   * @returns {Object} { positivePoints, negativePoints, netPoints, percentage }
   */
  calculateScore(records = []) {
    let positivePoints = 0;
    let negativePoints = 0;

    records.forEach(rec => {
      if (rec.status === 'positive') {
        positivePoints += Math.abs(rec.points !== undefined ? rec.points : 1);
      } else if (rec.status === 'negative') {
        negativePoints += Math.abs(rec.points !== undefined ? rec.points : 1);
      }
    });

    const netPoints = positivePoints - negativePoints;
    const totalMaxPossible = records.length;
    const percentage = totalMaxPossible > 0 
      ? Math.max(0, Math.round((netPoints / totalMaxPossible) * 100))
      : 0;

    return {
      positivePoints,
      negativePoints,
      netPoints,
      percentage
    };
  }

  /**
   * Evaluates single criterion status change.
   * Toggle cycle: Neutral (0) -> Positive (+1) -> Negative (-1) -> Neutral (0)
   */
  getNextStatus(currentStatus) {
    if (currentStatus === 'neutral' || !currentStatus) return 'positive';
    if (currentStatus === 'positive') return 'negative';
    return 'neutral';
  }

  getStatusPoints(status, criterionConfig = {}) {
    const posVal = criterionConfig.positivePoints || 1;
    const negVal = criterionConfig.negativePoints || -1;
    if (status === 'positive') return posVal;
    if (status === 'negative') return negVal;
    return 0;
  }
}

export const scoringService = new ScoringService();
