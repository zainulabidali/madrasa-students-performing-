/* ==========================================================================
   STUDENTS PAGE
   Student directory, search, class filter, sorting, and add/edit forms
   ========================================================================== */

import { studentRepository } from '../repositories/studentRepository.js';
import { classRepository } from '../repositories/classRepository.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export async function renderStudents(container, params = {}) {
  const classes = await classRepository.getClasses();
  let filterClassId = params.classId || '';
  let searchQuery = '';
  let sortBy = 'name'; // name | admission

  const renderList = async () => {
    let list = filterClassId 
      ? await studentRepository.getStudentsByClass(filterClassId, true)
      : await studentRepository.getStudents(true);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.admissionNumber || '').toLowerCase().includes(q));
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'admission') {
      list.sort((a, b) => (a.admissionNumber || '').localeCompare(b.admissionNumber || ''));
    }

    const classMap = new Map();
    classes.forEach(c => classMap.set(c.id, c.name));

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Student Directory</h2>
          <p>Manage all enrolled students</p>
        </div>
        <div>
          <button class="btn btn-primary" id="add-student-btn">
            ➕ Add Student
          </button>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="card" style="padding: 0.85rem 1.25rem;">
        <div class="grid-3" style="align-items: center;">
          <div>
            <label class="form-label" style="font-size: 0.75rem;">SEARCH</label>
            <input type="text" id="student-search-input" class="form-control" placeholder="Search by name or admission..." value="${searchQuery}">
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">FILTER CLASS</label>
            <select id="student-class-filter" class="form-control">
              <option value="">All Classes</option>
              ${classes.map(c => `<option value="${c.id}" ${c.id === filterClassId ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">SORT BY</label>
            <select id="student-sort-by" class="form-control">
              <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name (A - Z)</option>
              <option value="admission" ${sortBy === 'admission' ? 'selected' : ''}>Admission Number</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Student Cards Grid -->
      <div class="grid-2" id="students-grid-list">
        ${list.length === 0 ? `
          <div style="grid-column: 1 / -1;" class="empty-state">
            <div class="empty-state-icon">👥</div>
            <h3>No students found</h3>
            <p>Try adjusting your search or filter parameters.</p>
          </div>
        ` : list.map(std => `
          <div class="card" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <div class="student-avatar" style="width: 44px; height: 44px; font-size: 1.1rem;">
                ${std.name.charAt(0)}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1.05rem; color: var(--color-primary-navy);">
                  ${std.name}
                  ${!std.isActive ? '<span class="badge badge-negative">Archived</span>' : ''}
                </div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">
                  Class: <strong>${classMap.get(std.classId) || 'Unassigned'}</strong> • Adm: ${std.admissionNumber || 'N/A'}
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <a href="#/student/${std.id}" class="btn btn-sm btn-secondary">Profile</a>
              <button class="btn btn-sm btn-secondary edit-std-btn" data-std-id="${std.id}">✏️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Bind Event Listeners
    const searchInput = container.querySelector('#student-search-input');
    searchInput.oninput = (e) => {
      searchQuery = e.target.value;
      renderList();
    };

    container.querySelector('#student-class-filter').onchange = (e) => {
      filterClassId = e.target.value;
      renderList();
    };

    container.querySelector('#student-sort-by').onchange = (e) => {
      sortBy = e.target.value;
      renderList();
    };

    // Edit Student buttons
    container.querySelectorAll('.edit-std-btn').forEach(btn => {
      btn.onclick = async () => {
        const sid = btn.dataset.stdId;
        const std = await studentRepository.getStudent(sid);
        openStudentModal(std);
      };
    });
  };

  const openStudentModal = (student = null) => {
    const isEdit = !!student;
    const classOptionsHTML = classes.map(c => `
      <option value="${c.id}" ${student && student.classId === c.id ? 'selected' : ''}>${c.name}</option>
    `).join('');

    Modal.open({
      title: isEdit ? 'Edit Student Profile' : 'Add New Student',
      contentHTML: `
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="modal-std-name" class="form-control" value="${student?.name || ''}" placeholder="e.g. Muhammad Rayan">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Class *</label>
            <select id="modal-std-class" class="form-control">
              ${classOptionsHTML}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Admission Number</label>
            <input type="text" id="modal-std-adm" class="form-control" value="${student?.admissionNumber || ''}" placeholder="ADM-202601">
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Parent Name</label>
            <input type="text" id="modal-std-parent" class="form-control" value="${student?.parentName || ''}" placeholder="Parent/Guardian">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" id="modal-std-phone" class="form-control" value="${student?.phone || ''}" placeholder="+91 ...">
          </div>
        </div>
        ${isEdit ? `
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-std-status" class="form-control">
              <option value="true" ${student.isActive !== false ? 'selected' : ''}>Active</option>
              <option value="false" ${student.isActive === false ? 'selected' : ''}>Archived / Inactive</option>
            </select>
          </div>
        ` : ''}
      `,
      confirmText: isEdit ? 'Save Changes' : 'Add Student',
      onConfirm: async (overlay) => {
        const name = overlay.querySelector('#modal-std-name').value.trim();
        const classId = overlay.querySelector('#modal-std-class').value;
        const admissionNumber = overlay.querySelector('#modal-std-adm').value.trim();
        const parentName = overlay.querySelector('#modal-std-parent').value.trim();
        const phone = overlay.querySelector('#modal-std-phone').value.trim();
        const isActive = isEdit ? (overlay.querySelector('#modal-std-status').value === 'true') : true;

        if (!name) {
          Toast.error('Student name is required.');
          return;
        }

        if (isEdit) {
          await studentRepository.updateStudent(student.id, { name, classId, admissionNumber, parentName, phone, isActive });
          Toast.success('Student profile updated.');
        } else {
          await studentRepository.createStudent({ name, classId, admissionNumber, parentName, phone });
          Toast.success('New student added.');
        }
        renderList();
      }
    });
  };

  container.addEventListener('click', (e) => {
    if (e.target.id === 'add-student-btn') {
      openStudentModal();
    }
  });

  await renderList();
}
