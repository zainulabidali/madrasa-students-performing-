/* ==========================================================================
   STUDENT CARD COMPONENT
   Renders daily performance card for a student with score buttons & remark modal
   ========================================================================== */

import { renderScoreButton } from './scoreButton.js';
import { scoringService } from '../services/scoringService.js';
import { Modal } from './modal.js';

export function renderStudentPerfCard({ student, criteria, currentRecordsMap, onRecordChange }) {
  const card = document.createElement('div');
  card.className = 'student-perf-card';
  card.dataset.studentId = student.id;

  // Header: Name, Admission, Net Score Badge
  const header = document.createElement('div');
  header.className = 'student-perf-header';

  const avatarInitial = (student.name || 'S').charAt(0).toUpperCase();

  header.innerHTML = `
    <div class="student-perf-info">
      <div class="student-avatar">${avatarInitial}</div>
      <div>
        <div class="student-name-text">${student.name}</div>
        <div class="student-adm-text">${student.admissionNumber || ''}</div>
      </div>
    </div>
    <div class="student-net-badge badge" id="net-badge-${student.id}">
      Net: +0
    </div>
  `;

  card.appendChild(header);

  // Criteria Grid Buttons Container
  const grid = document.createElement('div');
  grid.className = 'criteria-buttons-grid';

  const updateCardNetScore = () => {
    let positive = 0;
    let negative = 0;

    criteria.forEach(crit => {
      const rec = currentRecordsMap[crit.id] || { status: 'neutral' };
      if (rec.status === 'positive') positive += Math.abs(rec.points || 1);
      if (rec.status === 'negative') negative += Math.abs(rec.points || 1);
    });

    const net = positive - negative;
    const badge = card.querySelector(`#net-badge-${student.id}`);
    if (badge) {
      badge.textContent = `Net: ${net >= 0 ? '+' : ''}${net}`;
      badge.className = `student-net-badge badge ${net > 0 ? 'badge-positive' : net < 0 ? 'badge-negative' : 'badge-neutral'}`;
    }
  };

  criteria.forEach(crit => {
    const existingRec = currentRecordsMap[crit.id] || { status: 'neutral', points: 0, remark: '' };

    const scoreBtn = renderScoreButton({
      criterion: crit,
      status: existingRec.status,
      points: existingRec.points,
      onClick: (criterion, currentStatus) => {
        const nextStatus = scoringService.getNextStatus(currentStatus);
        const points = scoringService.getStatusPoints(nextStatus, criterion);

        // If turning negative, optionally prompt for remark/reason
        if (nextStatus === 'negative') {
          promptForRemark(criterion.name, existingRec.remark, (remarkText) => {
            currentRecordsMap[crit.id] = { status: nextStatus, points, remark: remarkText };
            onRecordChange(student.id, crit.id, nextStatus, points, remarkText);
            refreshGrid();
          });
        } else {
          currentRecordsMap[crit.id] = { status: nextStatus, points, remark: '' };
          onRecordChange(student.id, crit.id, nextStatus, points, '');
          refreshGrid();
        }
      }
    });

    grid.appendChild(scoreBtn);
  });

  const refreshGrid = () => {
    grid.innerHTML = '';
    criteria.forEach(crit => {
      const rec = currentRecordsMap[crit.id] || { status: 'neutral', points: 0, remark: '' };
      const btn = renderScoreButton({
        criterion: crit,
        status: rec.status,
        points: rec.points,
        onClick: (criterion, currentStatus) => {
          const nextStatus = scoringService.getNextStatus(currentStatus);
          const points = scoringService.getStatusPoints(nextStatus, criterion);

          if (nextStatus === 'negative') {
            promptForRemark(criterion.name, rec.remark, (remarkText) => {
              currentRecordsMap[crit.id] = { status: nextStatus, points, remark: remarkText };
              onRecordChange(student.id, crit.id, nextStatus, points, remarkText);
              refreshGrid();
            });
          } else {
            currentRecordsMap[crit.id] = { status: nextStatus, points, remark: '' };
            onRecordChange(student.id, crit.id, nextStatus, points, '');
            refreshGrid();
          }
        }
      });
      grid.appendChild(btn);
    });
    updateCardNetScore();
  };

  card.appendChild(grid);
  updateCardNetScore();
  return card;
}

function promptForRemark(criterionName, currentRemark = '', onSave) {
  const presets = [
    `${criterionName} incomplete`,
    `${criterionName} missing`,
    'Pen / Materials missing',
    'Arrived late',
    'Prayer missed',
    'Discipline issue',
    'Other'
  ];

  let optionsHTML = presets.map(p => `<option value="${p}">${p}</option>`).join('');

  const contentHTML = `
    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 0.75rem;">
      Select a reason for <strong>${criterionName}</strong> negative point:
    </p>
    <div class="form-group">
      <select id="remark-preset-select" class="form-control">
        <option value="">-- Choose Reason --</option>
        ${optionsHTML}
      </select>
    </div>
    <div class="form-group" id="other-remark-group" style="display: none;">
      <label class="form-label">Custom Reason / Remark</label>
      <input type="text" id="remark-custom-input" class="form-control" placeholder="Enter reason details..." value="${currentRemark}">
    </div>
  `;

  Modal.open({
    title: `Add Remark: ${criterionName}`,
    contentHTML,
    confirmText: 'Save Remark',
    onConfirm: (overlay) => {
      const presetSelect = overlay.querySelector('#remark-preset-select');
      const customInput = overlay.querySelector('#remark-custom-input');
      let finalRemark = presetSelect.value;
      if (finalRemark === 'Other' || !finalRemark) {
        finalRemark = customInput.value.trim();
      }
      onSave(finalRemark);
    }
  });

  setTimeout(() => {
    const select = document.getElementById('remark-preset-select');
    const customGroup = document.getElementById('other-remark-group');
    if (select) {
      select.onchange = () => {
        if (select.value === 'Other') {
          customGroup.style.display = 'block';
        } else {
          customGroup.style.display = 'none';
        }
      };
    }
  }, 100);
}
