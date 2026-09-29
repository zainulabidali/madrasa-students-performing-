/* ==========================================================================
   RANKING SERVICE
   Sorting, ranking, tie-breaking, and best performer identification
   ========================================================================== */

export class RankingService {
  /**
   * Ranks an array of student performance items.
   * @param {Array} studentRows Array of { student, positivePoints, negativePoints, netPoints }
   * @param {String} tieBreakerMethod 'positive_points' | 'alphabetical' | 'admission'
   * @returns {Array} Array of ranked rows with `rank` field and `isJoint` flag
   */
  calculateRankings(studentRows = [], tieBreakerMethod = 'positive_points') {
    if (!studentRows || studentRows.length === 0) return [];

    // Clone and sort
    const sorted = [...studentRows].sort((a, b) => {
      // Primary sort: net points descending
      if (b.netPoints !== a.netPoints) {
        return b.netPoints - a.netPoints;
      }

      // Tie breaker 1: Higher positive points
      if (tieBreakerMethod === 'positive_points') {
        if (b.positivePoints !== a.positivePoints) {
          return b.positivePoints - a.positivePoints;
        }
      }

      // Tie breaker 2: Alphabetical by student name
      if (tieBreakerMethod === 'alphabetical') {
        return (a.student?.name || '').localeCompare(b.student?.name || '');
      }

      // Tie breaker 3: Admission number
      if (tieBreakerMethod === 'admission') {
        return (a.student?.admissionNumber || '').localeCompare(b.student?.admissionNumber || '');
      }

      // Default secondary tie breaker: positive points
      return b.positivePoints - a.positivePoints;
    });

    // Assign rank numbers handling ties
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        const isExactTie = (curr.netPoints === prev.netPoints && curr.positivePoints === prev.positivePoints);
        if (isExactTie && tieBreakerMethod !== 'alphabetical' && tieBreakerMethod !== 'admission') {
          curr.rank = prev.rank;
          curr.isJoint = true;
          prev.isJoint = true;
        } else {
          currentRank = i + 1;
          curr.rank = currentRank;
          curr.isJoint = false;
        }
      } else {
        sorted[0].rank = 1;
        sorted[0].isJoint = false;
      }
    }

    return sorted;
  }

  /**
   * Identifies best performer(s) from ranked rows.
   * @returns {Object} { bestPerformerNames, bestScore, isJoint, topPerformers }
   */
  getBestPerformer(rankedRows = []) {
    if (!rankedRows || rankedRows.length === 0) {
      return { bestPerformerNames: 'None', bestScore: 0, isJoint: false, topPerformers: [] };
    }

    const topRank = rankedRows[0].rank;
    const topPerformers = rankedRows.filter(r => r.rank === topRank && r.netPoints > 0);

    if (topPerformers.length === 0) {
      return { bestPerformerNames: 'None', bestScore: 0, isJoint: false, topPerformers: [] };
    }

    const isJoint = topPerformers.length > 1;
    const bestScore = topPerformers[0].netPoints;
    const names = topPerformers.map(r => r.student?.name || 'Student').join(' & ');

    return {
      bestPerformerNames: isJoint ? `Joint: ${names}` : names,
      bestScore,
      isJoint,
      topPerformers
    };
  }
}

export const rankingService = new RankingService();
