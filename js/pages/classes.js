/* ==========================================================================
   CLASSES PAGE
   Folder-style class interface with creation, renaming, and archiving
   ========================================================================== */

import { classRepository } from '../repositories/classRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { performanceRepository } from '../repositories/performanceRepository.js';
import { reportService } from '../services/reportService.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export async function renderClasses(container) {
  const todayStr = new Date().toISOString().split('T')[0];
  const classes = await classRepository.getClasses();

  const classCardsData = await Promise.all(classes.map(async c => {
    const students = await studentRepository.getStudentsByClass(c.id);
    const summaries = await performanceRepository.getDailySummaries(c.id, todayStr);
    const completedCount = summaries.length;
    const totalStudents = students.length;
    const pct = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

    const report = await reportService.getDailyReportData(c.id, todayStr);
    const bestStudent = report.bestPerformer?.bestPerformerNames || 'None';

    return {
      class: c,
      totalStudents,
      completedCount,
      percentage: pct,
      avgScore: report.classAvg,
      bestStudent
    };
  }));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>Classes</h2>
        <p>Manage your Madrasa class folders</p>
      </div>
      <div>
        <button class="btn btn-primary" id="add-class-btn">
          ➕ Create Class
        </button>
      </div>
    </div>

    <div class="grid-3" id="classes-grid">
      ${classCardsData.map(cd => `
        <div class="class-folder-card" data-class-id="${cd.class.id}">
          <div>
            <div class="class-folder-header">
              <div class="class-icon-badge">📁</div>
              <div class="class-title">${cd.class.name} ${cd.class.section ? `(${cd.class.section})` : ''}</div>
            </div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">
              👥 <strong>${cd.totalStudents}</strong> Students • ${cd.completedCount} Completed (${cd.percentage}%)
            </div>
            <div class="progress-bar-container" style="margin-bottom: 0.75rem;">
              <div class="progress-bar-fill" style="width: ${cd.percentage}%;"></div>
            </div>
          </div>
          <div class="class-stats-row">
            <div>Avg: <strong>${cd.avgScore}</strong></div>
            <div>Top: <strong style="color: var(--color-accent-indigo);">${cd.bestStudent}</strong></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Handle Class Click
  container.querySelectorAll('.class-folder-card').forEach(card => {
    card.addEventListener('click', () => {
      const cid = card.dataset.classId;
      window.location.hash = `#/class/${cid}`;
    });
  });

  // Handle Create Class
  container.querySelector('#add-class-btn').addEventListener('click', () => {
    Modal.open({
      title: 'Create New Class',
      contentHTML: `
        <div class="form-group">
          <label class="form-label">Class Name *</label>
          <input type="text" id="new-class-name" class="form-control" placeholder="e.g. Class 5, UKG, Hifz 1">
        </div>
        <div class="form-group">
          <label class="form-label">Section (Optional)</label>
          <input type="text" id="new-class-section" class="form-control" placeholder="e.g. A, B">
        </div>
      `,
      confirmText: 'Create Class',
      onConfirm: async (overlay) => {
        const name = overlay.querySelector('#new-class-name').value.trim();
        const section = overlay.querySelector('#new-class-section').value.trim();
        if (!name) {
          Toast.error('Class name is required.');
          return;
        }

        await classRepository.createClass({ name, section });
        Toast.success(`Class "${name}" created successfully.`);
        renderClasses(container);
      }
    });
  });
}
