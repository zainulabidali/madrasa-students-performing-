/* ==========================================================================
   SETTINGS PAGE
   App configuration, performance criteria tuning, backup/restore, demo data
   ========================================================================== */

import { settingsRepository } from '../repositories/settingsRepository.js';
import { backupService } from '../services/backupService.js';
import { seedDemoData, removeDemoData } from '../database/seed.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export async function renderSettings(container) {
  const settings = await settingsRepository.getSettings();
  const criteria = await settingsRepository.getCriteria();

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>Settings & Configuration</h2>
        <p>Manage Madrasa info, scoring rules, criteria, and database backups</p>
      </div>
    </div>

    <!-- General Settings -->
    <div class="card">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 1rem;">
        General Information
      </h3>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Madrasa / School Name</label>
          <input type="text" id="setting-madrasa-name" class="form-control" value="${settings.madrasaName || 'Darul Uloom Madrasa'}">
        </div>
        <div class="form-group">
          <label class="form-label">Academic Year</label>
          <input type="text" id="setting-academic-year" class="form-control" value="${settings.academicYear || '2026 - 2027'}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ranking Tie-Breaker Method</label>
        <select id="setting-tie-breaker" class="form-control">
          <option value="positive_points" ${settings.tieBreaker === 'positive_points' ? 'selected' : ''}>Higher Positive Points (Recommended)</option>
          <option value="alphabetical" ${settings.tieBreaker === 'alphabetical' ? 'selected' : ''}>Alphabetical Order</option>
          <option value="admission" ${settings.tieBreaker === 'admission' ? 'selected' : ''}>Admission Number</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" id="save-general-settings-btn">Save General Settings</button>
    </div>

    <!-- Scoring Criteria Configurator -->
    <div class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy);">
          Performance Scoring Criteria
        </h3>
        <button class="btn btn-secondary btn-sm" id="add-criterion-btn">➕ Add Criterion</button>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;" id="criteria-config-list">
        ${criteria.map(c => `
          <div style="background: #f8fafc; border: 1px solid var(--color-border); padding: 0.85rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.2rem;">${c.icon}</span>
              <div>
                <strong style="color: var(--color-primary-navy);">${c.name}</strong>
                <div style="font-size: 0.75rem; color: #64748b;">
                  Positive: +${c.positivePoints} • Negative: ${c.negativePoints}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button class="btn btn-sm btn-secondary edit-crit-btn" data-crit-id="${c.id}">✏️ Edit</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Demo Data Manager -->
    <div class="card">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 0.5rem;">
        Demo Data Management
      </h3>
      <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
        Load optional sample classes, students, and 7 days of performance history for demonstration purposes.
      </p>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="load-demo-btn">📦 Load Demo Data</button>
        <button class="btn btn-danger" id="remove-demo-btn">🗑️ Remove Demo Data</button>
      </div>
    </div>

    <!-- Backup & Restore -->
    <div class="card">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 0.5rem;">
        Data Safety & Offline Backup
      </h3>
      <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
        Export your complete IndexedDB database to a JSON backup file or restore from a previous backup file.
      </p>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <button class="btn btn-primary" id="export-backup-btn">📥 Export JSON Backup</button>
        <label class="btn btn-secondary" style="cursor: pointer;">
          📤 Import JSON Backup
          <input type="file" id="import-backup-file" accept=".json" style="display: none;">
        </label>
      </div>

      <div style="border-top: 1px dashed var(--color-border); padding-top: 1rem;">
        <h4 style="font-size: 0.95rem; color: #ef4444; font-weight: 700; margin-bottom: 0.35rem;">Danger Zone</h4>
        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem;">
          Permanently clear all local IndexedDB data and reset application to initial clean state.
        </p>
        <button class="btn btn-danger btn-sm" id="clear-local-db-btn">⚠️ Clear Local Database</button>
      </div>
    </div>
  `;

  // Bind General Settings Save
  container.querySelector('#save-general-settings-btn').onclick = async () => {
    const madrasaName = container.querySelector('#setting-madrasa-name').value.trim();
    const academicYear = container.querySelector('#setting-academic-year').value.trim();
    const tieBreaker = container.querySelector('#setting-tie-breaker').value;

    await settingsRepository.saveSettings({ madrasaName, academicYear, tieBreaker });
    Toast.success('General settings saved.');
  };

  // Edit Criteria handler
  container.querySelectorAll('.edit-crit-btn').forEach(btn => {
    btn.onclick = () => {
      const cid = btn.dataset.critId;
      const crit = criteria.find(c => c.id === cid);
      if (crit) openCriteriaModal(crit);
    };
  });

  container.querySelector('#add-criterion-btn').onclick = () => {
    openCriteriaModal();
  };

  const openCriteriaModal = (criterion = null) => {
    const isEdit = !!criterion;
    Modal.open({
      title: isEdit ? 'Edit Criterion' : 'Add New Criterion',
      contentHTML: `
        <div class="form-group">
          <label class="form-label">Criterion Name *</label>
          <input type="text" id="modal-crit-name" class="form-control" value="${criterion?.name || ''}" placeholder="e.g. Homework, Attendance">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Positive Points (+)</label>
            <input type="number" id="modal-crit-pos" class="form-control" value="${criterion?.positivePoints !== undefined ? criterion.positivePoints : 1}">
          </div>
          <div class="form-group">
            <label class="form-label">Negative Points (-)</label>
            <input type="number" id="modal-crit-neg" class="form-control" value="${criterion?.negativePoints !== undefined ? criterion.negativePoints : -1}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Icon Emoji</label>
          <input type="text" id="modal-crit-icon" class="form-control" value="${criterion?.icon || '⭐'}" placeholder="⭐, 📓, 📖">
        </div>
      `,
      confirmText: isEdit ? 'Save Changes' : 'Add Criterion',
      onConfirm: async (overlay) => {
        const name = overlay.querySelector('#modal-crit-name').value.trim();
        const positivePoints = parseInt(overlay.querySelector('#modal-crit-pos').value, 10) || 1;
        const negativePoints = parseInt(overlay.querySelector('#modal-crit-neg').value, 10) || -1;
        const icon = overlay.querySelector('#modal-crit-icon').value.trim() || '⭐';

        if (!name) return;

        const id = criterion?.id || `crit_${Date.now()}`;
        const data = {
          id,
          name,
          positivePoints,
          negativePoints,
          icon,
          order: criterion?.order || criteria.length + 1,
          isActive: true
        };

        await settingsRepository.saveCriterion(data);
        Toast.success('Criterion saved.');
        renderSettings(container);
      }
    });
  };

  // Bind Demo Data buttons
  container.querySelector('#load-demo-btn').onclick = async () => {
    Toast.info('Seeding demo data...');
    await seedDemoData();
    Toast.success('Demo data seeded successfully.');
    window.location.hash = '#/dashboard';
  };

  container.querySelector('#remove-demo-btn').onclick = async () => {
    await removeDemoData();
    Toast.success('Demo data removed.');
    renderSettings(container);
  };

  // Export Backup
  container.querySelector('#export-backup-btn').onclick = async () => {
    await backupService.exportBackup();
    Toast.success('Backup exported as JSON.');
  };

  // Import Backup
  container.querySelector('#import-backup-file').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonObj = JSON.parse(evt.target.result);
        Modal.open({
          title: 'Import Backup File',
          contentHTML: `
            <p style="font-size: 0.9rem; color: #475569; margin-bottom: 1rem;">
              Choose import strategy:
            </p>
            <div class="form-group">
              <select id="import-strategy-select" class="form-control">
                <option value="merge">Merge with existing local data</option>
                <option value="replace">Replace local data completely</option>
              </select>
            </div>
          `,
          confirmText: 'Import Now',
          onConfirm: async (overlay) => {
            const strategy = overlay.querySelector('#import-strategy-select').value;
            await backupService.importBackup(jsonObj, strategy);
            Toast.success('Database restored successfully!');
            renderSettings(container);
          }
        });
      } catch (err) {
        Toast.error(`Invalid backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Clear Database (Danger Zone)
  container.querySelector('#clear-local-db-btn').onclick = () => {
    Modal.open({
      title: 'Clear Local Database?',
      contentHTML: `
        <p style="font-size: 0.9rem; color: #b91c1c;">
          This action will permanently wipe all classes, students, and performance records stored in this browser!
        </p>
      `,
      requirePhrase: 'DELETE LOCAL DATA',
      confirmText: 'Permanently Delete Data',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        const { dbClearAll } = await import('../database/indexedDB.js');
        await dbClearAll();
        Toast.warning('Local database wiped.');
        window.location.reload();
      }
    });
  };
}
