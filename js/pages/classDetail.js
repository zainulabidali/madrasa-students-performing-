/* ==========================================================================
   CLASS DETAIL PAGE
   Class overview and quick actions for Daily Performance, Reports, Rankings
   ========================================================================== */

import { classRepository } from '../repositories/classRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export async function renderClassDetail(container, classId) {
  const cls = await classRepository.getClass(classId);
  if (!cls) {
    container.innerHTML = `<div class="card"><p>Class not found.</p></div>`;
    return;
  }

  const students = await studentRepository.getStudentsByClass(classId);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>${cls.name} ${cls.section ? `(${cls.section})` : ''}</h2>
        <p>👥 ${students.length} Total Students</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary btn-sm" id="edit-class-btn">✏️ Rename</button>
        <button class="btn btn-danger btn-sm" id="archive-class-btn">📦 Archive</button>
      </div>
    </div>

    <!-- Quick Action Dashboard Buttons -->
    <div class="card" style="background: linear-gradient(135deg, var(--color-primary-navy), var(--color-primary-indigo)); color: #ffffff;">
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem;">Class Quick Actions</h3>
      <p style="font-size: 0.85rem; color: #c7d2fe; margin-bottom: 1.25rem;">Select an action to manage daily performance or view reports for this class.</p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
        <a href="#/daily?classId=${cls.id}" class="btn btn-primary" style="background: #ffffff; color: var(--color-primary-navy); font-weight: 700;">
          ⚡ TAKE TODAY'S PERFORMANCE
        </a>
        <a href="#/students?classId=${cls.id}" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.3);">
          👥 CLASS STUDENTS
        </a>
        <a href="#/reports?classId=${cls.id}&tab=daily" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.3);">
          📊 DAILY REPORT
        </a>
        <a href="#/reports?classId=${cls.id}&tab=weekly" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.3);">
          📅 WEEKLY REPORT
        </a>
        <a href="#/reports?classId=${cls.id}&tab=monthly" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.3);">
          📈 MONTHLY REPORT
        </a>
        <a href="#/rankings?classId=${cls.id}" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.3);">
          🏆 CLASS RANKINGS
        </a>
      </div>
    </div>

    <!-- Student List Summary -->
    <div class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-navy);">Students in ${cls.name}</h3>
        <a href="#/students?classId=${cls.id}" class="btn btn-sm btn-secondary">Manage Students</a>
      </div>
      
      ${students.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No students added yet</h3>
          <p>Add students to this class to start recording daily performance.</p>
          <a href="#/students?classId=${cls.id}" class="btn btn-primary">➕ Add First Student</a>
        </div>
      ` : `
        <div class="grid-2">
          ${students.slice(0, 8).map(s => `
            <div style="background: #f8fafc; border: 1px solid var(--color-border); padding: 0.75rem 1rem; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="color: var(--color-primary-navy);">${s.name}</strong>
                <div style="font-size: 0.75rem; color: #64748b;">${s.admissionNumber || ''}</div>
              </div>
              <a href="#/student/${s.id}" class="btn btn-sm btn-secondary">Profile</a>
            </div>
          `).join('')}
        </div>
        ${students.length > 8 ? `
          <div style="text-align: center; margin-top: 1rem;">
            <a href="#/students?classId=${cls.id}" style="font-size: 0.9rem; font-weight: 600; color: var(--color-accent-indigo);">
              View all ${students.length} students →
            </a>
          </div>
        ` : ''}
      `}
    </div>
  `;

  // Rename class listener
  container.querySelector('#edit-class-btn').onclick = () => {
    Modal.open({
      title: 'Rename Class',
      contentHTML: `
        <div class="form-group">
          <label class="form-label">Class Name</label>
          <input type="text" id="edit-class-name" class="form-control" value="${cls.name}">
        </div>
      `,
      confirmText: 'Save Changes',
      onConfirm: async (overlay) => {
        const name = overlay.querySelector('#edit-class-name').value.trim();
        if (!name) return;
        await classRepository.updateClass(classId, { name });
        Toast.success('Class renamed successfully.');
        renderClassDetail(container, classId);
      }
    });
  };

  // Archive class listener
  container.querySelector('#archive-class-btn').onclick = () => {
    Modal.confirm({
      title: 'Archive Class?',
      message: `Are you sure you want to archive "${cls.name}"? Historical performance records will be preserved.`,
      confirmText: 'Archive Class',
      onConfirm: async () => {
        await classRepository.archiveClass(classId);
        Toast.success('Class archived.');
        window.location.hash = '#/classes';
      }
    });
  };
}
