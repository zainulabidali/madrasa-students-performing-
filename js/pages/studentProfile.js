/* ==========================================================================
   STUDENT PROFILE PAGE
   Individual student performance overview, criterion totals, and trend chart
   ========================================================================== */

import { studentRepository } from '../repositories/studentRepository.js';
import { classRepository } from '../repositories/classRepository.js';
import { performanceRepository } from '../repositories/performanceRepository.js';
import { settingsRepository } from '../repositories/settingsRepository.js';
import { ChartHelper } from '../lib/chart-helper.js';

export async function renderStudentProfile(container, studentId) {
  const student = await studentRepository.getStudent(studentId);
  if (!student) {
    container.innerHTML = `<div class="card"><p>Student not found.</p></div>`;
    return;
  }

  const cls = await classRepository.getClass(student.classId);
  const perfRecords = await performanceRepository.getStudentPerformance(studentId);
  const criteria = await settingsRepository.getCriteria();

  // Aggregate stats
  let totalPositive = 0;
  let totalNegative = 0;
  const criterionStatsMap = new Map();

  criteria.forEach(c => {
    criterionStatsMap.set(c.id, { criterion: c, positive: 0, negative: 0, neutral: 0 });
  });

  perfRecords.forEach(rec => {
    if (rec.status === 'positive') {
      totalPositive += Math.abs(rec.points || 1);
      if (criterionStatsMap.has(rec.criterionId)) criterionStatsMap.get(rec.criterionId).positive++;
    } else if (rec.status === 'negative') {
      totalNegative += Math.abs(rec.points || 1);
      if (criterionStatsMap.has(rec.criterionId)) criterionStatsMap.get(rec.criterionId).negative++;
    } else {
      if (criterionStatsMap.has(rec.criterionId)) criterionStatsMap.get(rec.criterionId).neutral++;
    }
  });

  const netPoints = totalPositive - totalNegative;
  const uniqueDatesCount = new Set(perfRecords.map(r => r.date)).size;
  const avgDailyScore = uniqueDatesCount > 0 ? (netPoints / uniqueDatesCount).toFixed(1) : '0.0';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>${student.name}</h2>
        <p>Class: <strong>${cls?.name || 'Unassigned'}</strong> • Adm: ${student.admissionNumber || 'N/A'}</p>
      </div>
      <div>
        <a href="#/students?classId=${student.classId}" class="btn btn-secondary btn-sm">
          ← Back to Students
        </a>
      </div>
    </div>

    <!-- Student Stats Summary Cards -->
    <div class="grid-4" style="margin-bottom: 1.5rem;">
      <div class="stat-card">
        <div class="stat-header"><span>Total Net Score</span><span>⭐</span></div>
        <div class="stat-value" style="color: ${netPoints >= 0 ? '#10b981' : '#ef4444'};">
          ${netPoints >= 0 ? '+' : ''}${netPoints}
        </div>
        <div class="stat-footer">${uniqueDatesCount} Days Recorded</div>
      </div>

      <div class="stat-card">
        <div class="stat-header"><span>Avg Daily Score</span><span>📈</span></div>
        <div class="stat-value">${avgDailyScore}</div>
        <div class="stat-footer">Net pts per recorded day</div>
      </div>

      <div class="stat-card stat-positive">
        <div class="stat-header"><span>Positive Points</span><span>👍</span></div>
        <div class="stat-value" style="color: #10b981;">+${totalPositive}</div>
        <div class="stat-footer">Total awarded</div>
      </div>

      <div class="stat-card stat-negative">
        <div class="stat-header"><span>Negative Points</span><span>👎</span></div>
        <div class="stat-value" style="color: #ef4444;">-${totalNegative}</div>
        <div class="stat-footer">Total deducted</div>
      </div>
    </div>

    <!-- Criterion Performance Breakdown -->
    <div class="card">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 1rem;">
        Performance Breakdown by Criteria
      </h3>
      <div class="grid-2">
        ${Array.from(criterionStatsMap.values()).map(item => {
          const totalRecorded = item.positive + item.negative + item.neutral;
          const pct = totalRecorded > 0 ? Math.round((item.positive / totalRecorded) * 100) : 0;
          return `
            <div style="background: #f8fafc; border: 1px solid var(--color-border); padding: 0.85rem 1rem; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <strong style="color: var(--color-primary-navy);">${item.criterion.icon} ${item.criterion.name}</strong>
                <span class="badge ${pct >= 80 ? 'badge-positive' : pct >= 50 ? 'badge-neutral' : 'badge-negative'}">${pct}%</span>
              </div>
              <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">
                Positive: +${item.positive} • Negative: -${item.negative}
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Performance Chart -->
    <div class="card">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 1rem;">
        Performance Distribution Chart
      </h3>
      <div class="chart-container">
        <canvas id="student-profile-chart"></canvas>
      </div>
    </div>
  `;

  // Draw Profile Chart
  setTimeout(() => {
    const canvas = container.querySelector('#student-profile-chart');
    if (canvas) {
      const labels = Array.from(criterionStatsMap.values()).map(item => item.criterion.name);
      const posData = Array.from(criterionStatsMap.values()).map(item => item.positive);
      const negData = Array.from(criterionStatsMap.values()).map(item => item.negative);
      ChartHelper.renderBarChart(canvas, labels, posData, negData);
    }
  }, 100);
}
