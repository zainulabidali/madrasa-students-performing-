/* ==========================================================================
   WHATSAPP SERVICE
   Generates clean markdown summaries and invokes native share or WhatsApp Web
   ========================================================================== */

import { settingsRepository } from '../repositories/settingsRepository.js';

export class WhatsAppService {
  /**
   * Generates a clean WhatsApp message string for Daily Performance
   */
  async formatDailyReport(reportData) {
    const madrasaName = await settingsRepository.getSetting('madrasaName', 'Darul Uloom Madrasa');
    const className = reportData.class?.name || 'All Classes';
    const dateFormatted = new Date(reportData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let msg = `*${madrasaName.toUpperCase()}*\n`;
    msg += `*DAILY PERFORMANCE REPORT*\n\n`;
    msg += `📁 *Class:* ${className}\n`;
    msg += `📅 *Date:* ${dateFormatted}\n\n`;

    if (reportData.bestPerformer && reportData.bestPerformer.bestPerformerNames !== 'None') {
      msg += `🏆 *Best Performer:* ${reportData.bestPerformer.bestPerformerNames} (Points: +${reportData.bestPerformer.bestScore})\n\n`;
    }

    msg += `*STUDENT PERFORMANCE RANKINGS:*\n`;
    reportData.rows.slice(0, 15).forEach((r, idx) => {
      const rankBadge = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}.`;
      const scoreSign = r.netPoints >= 0 ? `+${r.netPoints}` : `${r.netPoints}`;
      msg += `${rankBadge} ${r.student.name} — ${scoreSign} pts (Pos: +${r.positivePoints}, Neg: -${r.negativePoints})\n`;
    });

    if (reportData.rows.length > 15) {
      msg += `...and ${reportData.rows.length - 15} more students.\n`;
    }

    msg += `\n*SUMMARY STATISTICS:*\n`;
    msg += `• Total Students: ${reportData.totalStudents}\n`;
    msg += `• Total Positive Points: +${reportData.totalPositive}\n`;
    msg += `• Total Negative Points: -${reportData.totalNegative}\n`;
    msg += `• Class Net Score: ${reportData.netScore >= 0 ? '+' : ''}${reportData.netScore}\n`;
    msg += `• Class Average: ${reportData.classAvg}\n\n`;
    msg += `_Sent via Madrasa Performance Manager_`;

    return msg;
  }

  /**
   * Triggers native Web Share API or fallbacks to WhatsApp URL
   */
  async shareText(text, title = 'Madrasa Performance Report') {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text
        });
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to WhatsApp Web:', err);
        } else {
          return false; // User cancelled share
        }
      }
    }

    // Fallback: Open WhatsApp Web / App share URL
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank');
    return true;
  }
}

export const whatsappService = new WhatsAppService();
