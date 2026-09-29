/* ==========================================================================
   DAILY PERFORMANCE PAGE
   Rapid multi-student score entry matrix & Quick Entry Mode deck
   ========================================================================== */

import { classRepository } from '../repositories/classRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { settingsRepository } from '../repositories/settingsRepository.js';
import { performanceRepository } from '../repositories/performanceRepository.js';
import { renderStudentPerfCard } from '../components/studentCard.js';
import { renderScoreButton } from '../components/scoreButton.js';
import { scoringService } from '../services/scoringService.js';
import { Toast } from '../components/toast.js';

export async function renderDailyPerformance(container, params = {}) {
  const classes = await classRepository.getClasses();
  if (!classes || classes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3>No classes found</h3>
        <p>Please create a class before recording daily performance.</p>
        <a href="#/classes" class="btn btn-primary">Create Class</a>
      </div>
    `;
    return;
  }

  let selectedClassId = params.classId || classes[0].id;
  let selectedDateStr = params.date || new Date().toISOString().split('T')[0];

  const criteria = await settingsRepository.getCriteria();
  const activeCriteria = criteria.filter(c => c.isActive !== false);

  let isQuickEntryMode = false;
  let quickEntryIndex = 0;

  const renderView = async () => {
    const currentClass = await classRepository.getClass(selectedClassId);
    const students = await studentRepository.getStudentsByClass(selectedClassId);
    const existingPerfList = await performanceRepository.getDailyPerformance(selectedClassId, selectedDateStr);

    // Map existing records: studentId -> { criterionId -> record }
    const perfMap = {};
    students.forEach(s => { perfMap[s.id] = {}; });

    existingPerfList.forEach(rec => {
      if (perfMap[rec.studentId]) {
        perfMap[rec.studentId][rec.criterionId] = rec;
      }
    });

    const handleRecordChange = async (studentId, criterionId, status, points, remark) => {
      const record = {
        studentId,
        classId: selectedClassId,
        date: selectedDateStr,
        criterionId,
        status,
        points,
        remark
      };

      if (!perfMap[studentId]) perfMap[studentId] = {};
      perfMap[studentId][criterionId] = record;

      await performanceRepository.savePerformance(record);
      Toast.success('Saved');
    };

    const classOptionsHTML = classes.map(c => `
      <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>${c.name} ${c.section ? `(${c.section})` : ''}</option>
    `).join('');

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Daily Performance Entry</h2>
          <p>Record student criteria scores quickly</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn ${isQuickEntryMode ? 'btn-secondary' : 'btn-primary'}" id="toggle-quick-entry-btn">
            ${isQuickEntryMode ? '📋 Grid Mode' : '⚡ Quick Entry Mode'}
          </button>
          <a href="#/reports?classId=${selectedClassId}&date=${selectedDateStr}" class="btn btn-secondary">
            📊 View Report
          </a>
        </div>
      </div>

      <!-- Class & Date Selector Header Bar -->
      <div class="card" style="padding: 0.85rem 1.25rem;">
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 160px;">
            <label class="form-label" style="font-size: 0.75rem;">SELECT CLASS</label>
            <select id="select-class-dropdown" class="form-control">
              ${classOptionsHTML}
            </select>
          </div>
          <div style="flex: 1; min-width: 160px;">
            <label class="form-label" style="font-size: 0.75rem;">SELECT DATE</label>
            <input type="date" id="select-date-picker" class="form-control" value="${selectedDateStr}">
          </div>
        </div>
      </div>

      <!-- Main Entry Container (Grid vs Quick Entry) -->
      <div id="entry-main-container"></div>
    `;

    // Bind Controls
    container.querySelector('#select-class-dropdown').onchange = (e) => {
      selectedClassId = e.target.value;
      renderView();
    };

    container.querySelector('#select-date-picker').onchange = (e) => {
      selectedDateStr = e.target.value;
      renderView();
    };

    container.querySelector('#toggle-quick-entry-btn').onclick = () => {
      isQuickEntryMode = !isQuickEntryMode;
      renderView();
    };

    const mainContainer = container.querySelector('#entry-main-container');

    if (students.length === 0) {
      mainContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No students in ${currentClass?.name}</h3>
          <p>Add students to this class to start recording daily performance.</p>
          <a href="#/students?classId=${selectedClassId}" class="btn btn-primary">➕ Add Students</a>
        </div>
      `;
      return;
    }

    if (isQuickEntryMode) {
      renderQuickEntryDeck(mainContainer, students, activeCriteria, perfMap, handleRecordChange);
    } else {
      renderMatrixGrid(mainContainer, students, activeCriteria, perfMap, handleRecordChange);
    }
  };

  const renderMatrixGrid = (targetContainer, students, activeCriteria, perfMap, handleRecordChange) => {
    targetContainer.innerHTML = `
      <div class="performance-matrix" id="matrix-cards-list"></div>
    `;

    const matrixList = targetContainer.querySelector('#matrix-cards-list');
    students.forEach(student => {
      const studentMap = perfMap[student.id] || {};
      const card = renderStudentPerfCard({
        student,
        criteria: activeCriteria,
        currentRecordsMap: studentMap,
        onRecordChange: handleRecordChange
      });
      matrixList.appendChild(card);
    });
  };

  const renderQuickEntryDeck = (targetContainer, students, activeCriteria, perfMap, handleRecordChange) => {
    if (quickEntryIndex >= students.length) quickEntryIndex = students.length - 1;
    if (quickEntryIndex < 0) quickEntryIndex = 0;

    const student = students[quickEntryIndex];
    const studentMap = perfMap[student.id] || {};

    let positiveCount = 0;
    let negativeCount = 0;
    activeCriteria.forEach(c => {
      const r = studentMap[c.id] || { status: 'neutral' };
      if (r.status === 'positive') positiveCount += Math.abs(r.points || 1);
      if (r.status === 'negative') negativeCount += Math.abs(r.points || 1);
    });
    const net = positiveCount - negativeCount;

    targetContainer.innerHTML = `
      <div class="quick-entry-card">
        <div class="quick-entry-nav">
          <button class="btn btn-secondary btn-sm" id="prev-student-btn" ${quickEntryIndex === 0 ? 'disabled' : ''}>
            ◀ Previous
          </button>
          <div style="font-weight: 700; color: var(--color-primary-navy);">
            Student ${quickEntryIndex + 1} of ${students.length}
          </div>
          <button class="btn btn-secondary btn-sm" id="next-student-btn" ${quickEntryIndex === students.length - 1 ? 'disabled' : ''}>
            Next ▶
          </button>
        </div>

        <!-- Sticky Student Name Bar -->
        <div style="background: var(--color-primary-navy); color: #ffffff; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="font-size: 1.35rem; font-weight: 800; margin: 0;">${student.name}</h3>
            <span style="font-size: 0.8rem; color: #c7d2fe;">Adm: ${student.admissionNumber || 'N/A'}</span>
          </div>
          <div class="badge ${net > 0 ? 'badge-positive' : net < 0 ? 'badge-negative' : 'badge-neutral'}" style="font-size: 1.1rem; padding: 0.4rem 0.85rem;">
            Score: ${net >= 0 ? '+' : ''}${net}
          </div>
        </div>

        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; text-align: center;">
          Tap criteria below to toggle score state (+ / - / 0):
        </p>

        <div class="grid-2" id="quick-criteria-grid" style="margin-bottom: 1.5rem;"></div>

        <div style="display: flex; gap: 1rem; justify-content: space-between;">
          <button class="btn btn-secondary" id="quick-prev-btn" style="flex: 1;" ${quickEntryIndex === 0 ? 'disabled' : ''}>
            ◀ Previous
          </button>
          <button class="btn btn-primary" id="quick-next-btn" style="flex: 1;">
            ${quickEntryIndex === students.length - 1 ? 'Finish Entry ✓' : 'Save & Next Student ▶'}
          </button>
        </div>
      </div>
    `;

    const grid = targetContainer.querySelector('#quick-criteria-grid');
    activeCriteria.forEach((crit, idx) => {
      const rec = studentMap[crit.id] || { status: 'neutral', points: 0, remark: '' };
      const scoreBtn = renderScoreButton({
        criterion: crit,
        status: rec.status,
        points: rec.points,
        onClick: (criterion, currentStatus) => {
          const nextStatus = scoringService.getNextStatus(currentStatus);
          const points = scoringService.getStatusPoints(nextStatus, criterion);
          studentMap[crit.id] = { status: nextStatus, points, remark: '' };
          handleRecordChange(student.id, crit.id, nextStatus, points, '');
          renderQuickEntryDeck(targetContainer, students, activeCriteria, perfMap, handleRecordChange);
        }
      });
      grid.appendChild(scoreBtn);
    });

    targetContainer.querySelector('#prev-student-btn').onclick = () => {
      quickEntryIndex--;
      renderQuickEntryDeck(targetContainer, students, activeCriteria, perfMap, handleRecordChange);
    };

    targetContainer.querySelector('#next-student-btn').onclick = () => {
      if (quickEntryIndex < students.length - 1) {
        quickEntryIndex++;
        renderQuickEntryDeck(targetContainer, students, activeCriteria, perfMap, handleRecordChange);
      } else {
        Toast.success('Daily performance entry completed!');
        window.location.hash = `#/reports?classId=${selectedClassId}&date=${selectedDateStr}`;
      }
    };

    targetContainer.querySelector('#quick-prev-btn').onclick = () => {
      quickEntryIndex--;
      renderQuickEntryDeck(targetContainer, students, activeCriteria, perfMap, handleRecordChange);
    };

    targetContainer.querySelector('#quick-next-btn').onclick = () => {
      if (quickEntryIndex < students.length - 1) {
        quickEntryIndex++;
        renderQuickEntryDeck(targetContainer, students, activeCriteria, perfMap, handleRecordChange);
      } else {
        Toast.success('Daily performance entry completed!');
        window.location.hash = `#/reports?classId=${selectedClassId}&date=${selectedDateStr}`;
      }
    };
  };

  await renderView();
}
