/* ==========================================================================
   REPORT SERVICE
   Aggregates metrics for Daily, Weekly, and Monthly view reports
   ========================================================================== */

import { reportRepository } from '../repositories/reportRepository.js';
import { rankingService } from './rankingService.js';
import { settingsRepository } from '../repositories/settingsRepository.js';

export class ReportService {
  async getDailyReportData(classId, dateStr) {
    const reportData = await reportRepository.getDailyReport(classId, dateStr);
    const tieBreaker = await settingsRepository.getSetting('tieBreaker', 'positive_points');
    
    const rankedRows = rankingService.calculateRankings(reportData.rows, tieBreaker);
    const bestPerformer = rankingService.getBestPerformer(rankedRows);

    let totalPositive = 0;
    let totalNegative = 0;
    rankedRows.forEach(r => {
      totalPositive += r.positivePoints;
      totalNegative += r.negativePoints;
    });

    const netScore = totalPositive - totalNegative;
    const classAvg = rankedRows.length > 0 ? (netScore / rankedRows.length).toFixed(1) : '0.0';

    return {
      ...reportData,
      rows: rankedRows,
      bestPerformer,
      totalPositive,
      totalNegative,
      netScore,
      classAvg
    };
  }

  async getPeriodReportData(classId, startDateStr, endDateStr) {
    const reportData = await reportRepository.getPeriodReport(classId, startDateStr, endDateStr);
    const tieBreaker = await settingsRepository.getSetting('tieBreaker', 'positive_points');

    const rankedRows = rankingService.calculateRankings(reportData.rows, tieBreaker);
    const bestPerformer = rankingService.getBestPerformer(rankedRows);

    let totalPositive = 0;
    let totalNegative = 0;
    rankedRows.forEach(r => {
      totalPositive += r.positivePoints;
      totalNegative += r.negativePoints;
    });

    const netScore = totalPositive - totalNegative;
    const classAvg = rankedRows.length > 0 ? (netScore / rankedRows.length).toFixed(1) : '0.0';

    return {
      ...reportData,
      rows: rankedRows,
      bestPerformer,
      totalPositive,
      totalNegative,
      netScore,
      classAvg
    };
  }
}

export const reportService = new ReportService();
