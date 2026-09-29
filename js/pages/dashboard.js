/* ==========================================================================
   DASHBOARD PAGE
   Overview of classes, student counts, today's completion rates, and stats
   ========================================================================== */

import { classRepository } from '../repositories/classRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { performanceRepository } from '../repositories/performanceRepository.js';
import { reportService } from '../services/reportService.js';
import { rankingService } from '../services/rankingService.js';

export async function renderDashboard(container) {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateDisplay = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const classes = await classRepository.getClasses();
  const students = await studentRepository.getStudents();
  const dailySummaries = await performanceRepository.getDailySummaries(null, todayStr);

  const completedStudentIds = new Set(dailySummaries.map(s => s.studentId));
  const completedCount = completedStudentIds.size;
  const pendingCount = Math.max(0, students.length - completedCount);

  let totalPositive = 0;
  let totalNegative = 0;

  dailySummaries.forEach(s => {
    totalPositive += (s.positivePoints || 0);
    totalNegative += (s.negativePoints || 0);
  });

  const netPoints = totalPositive - totalNegative;

  // Best Performer Today across all classes
  const overallReport = await reportService.getDailyReportData(null, todayStr);
  const bestPerformerName = overallReport.bestPerformer?.bestPerformerNames || 'None yet';

  // Calculate Class Statuses
  const classStatuses = await Promise.all(classes.map(async c => {
    const classStudents = await studentRepository.getStudentsByClass(c.id);
    const classSummaries = await performanceRepository.getDailySummaries(c.id, todayStr);
    const classDoneCount = classSummaries.length;
    const totalClassStudents = classStudents.length;
    const pct = totalClassStudents > 0 ? Math.round((classDoneCount / totalClassStudents) * 100) : 0;

    let classNet = 0;
    classSummaries.forEach(cs => classNet += cs.netPoints);
    const classAvg = classDoneCount > 0 ? (classNet / classDoneCount).toFixed(1) : '0.0';

    return {
      class: c,
      totalStudents: totalClassStudents,
      completedStudents: classDoneCount,
      percentage: pct,
      avgScore: classAvg,
      netScore: classNet
    };
  }));

  // Best Performing Class
  let bestClass = 'None';
  let highestClassAvg = -999;
  classStatuses.forEach(cs => {
    if (cs.completedStudents > 0 && parseFloat(cs.avgScore) > highestClassAvg) {
      highestClassAvg = parseFloat(cs.avgScore);
      bestClass = cs.class.name;
    }
  });

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>Dashboard</h2>
        <p>TODAY • ${dateDisplay}</p>
      </div>
      <div>
        <a href="#/daily" class="btn btn-primary">
          ⚡ Take Today's Performance
        </a>
      </div>
    </div>

    <!-- Main Stat Cards Grid -->
    <div class="grid-4" style="margin-bottom: 1.5rem;">
      <div class="stat-card">
        <div class="stat-header">
          <span>Students</span>
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat-value">${students.length}</div>
        <div class="stat-footer">${classes.length} Total Classes</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Entries</span>
          <span class="stat-icon">📝</span>
        </div>
        <div class="stat-value">${completedCount} <span style="font-size: 1rem; color: #94a3b8; font-weight: normal;">/ ${students.length}</span></div>
        <div class="stat-footer" style="color: #10b981; font-weight: 600;">
          ${pendingCount} Pending Entries
        </div>
      </div>

      <div class="stat-card stat-positive">
        <div class="stat-header">
          <span>Positive Points</span>
          <span class="stat-icon">👍</span>
        </div>
        <div class="stat-value" style="color: #10b981;">+${totalPositive}</div>
        <div class="stat-footer" style="color: #ef4444;">Negative: -${totalNegative}</div>
      </div>

      <div class="stat-card stat-gold">
        <div class="stat-header">
          <span>Best Performer</span>
          <span class="stat-icon">🏆</span>
        </div>
        <div class="stat-value" style="font-size: 1.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${bestPerformerName}
        </div>
        <div class="stat-footer">Top Class: <strong>${bestClass}</strong></div>
      </div>
    </div>

    <!-- Today's Class Status -->
    <div class="card">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 1rem;">
        Today's Class Completion Status
      </h3>
      <div class="grid-3">
        ${classStatuses.map(cs => `
          <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong style="font-size: 1.05rem; color: var(--color-primary-navy);">${cs.class.name}</strong>
              <span class="badge ${cs.percentage === 100 ? 'badge-positive' : 'badge-neutral'}">${cs.percentage}% Done</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">
              ${cs.completedStudents} / ${cs.totalStudents} Students Completed • Avg: ${cs.avgScore}
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${cs.percentage}%;"></div>
            </div>
            <div style="margin-top: 0.75rem; display: flex; justify-content: flex-end;">
              <a href="#/daily?classId=${cs.class.id}" class="btn btn-sm btn-secondary">
                Take Performance
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
