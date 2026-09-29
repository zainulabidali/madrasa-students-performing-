/* ==========================================================================
   STUDENT REPOSITORY (LOCAL IMPLEMENTATION)
   Abstraction layer for Student profiles and list queries
   ========================================================================== */

import { dbGetAll, dbGet, dbGetByIndex, dbPut, dbDelete } from '../database/indexedDB.js';

export class StudentRepository {
  async getStudents(includeInactive = false) {
    const list = await dbGetAll('students');
    if (includeInactive) return list;
    return list.filter(s => s.isActive !== false);
  }

  async getStudentsByClass(classId, includeInactive = false) {
    const list = await dbGetByIndex('students', 'classId', classId);
    if (includeInactive) return list;
    return list.filter(s => s.isActive !== false);
  }

  async getStudent(id) {
    return await dbGet('students', id);
  }

  async createStudent(data) {
    const id = data.id || `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const newStudent = {
      id,
      name: data.name,
      admissionNumber: data.admissionNumber || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      classId: data.classId,
      gender: data.gender || 'Male',
      parentName: data.parentName || '',
      phone: data.phone || '',
      notes: data.notes || '',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    await dbPut('students', newStudent);
    return newStudent;
  }

  async updateStudent(id, data) {
    const existing = await this.getStudent(id);
    if (!existing) throw new Error('Student not found');

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };
    await dbPut('students', updated);
    return updated;
  }

  async archiveStudent(id) {
    return await this.updateStudent(id, { isActive: false });
  }

  async restoreStudent(id) {
    return await this.updateStudent(id, { isActive: true });
  }

  async deleteStudent(id) {
    return await dbDelete('students', id);
  }
}

export const studentRepository = new StudentRepository();
