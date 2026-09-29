/* ==========================================================================
   CLASS REPOSITORY (LOCAL IMPLEMENTATION)
   Abstraction layer for Class data persistence
   ========================================================================== */

import { dbGetAll, dbGet, dbPut, dbDelete } from '../database/indexedDB.js';

export class ClassRepository {
  async getClasses(includeArchived = false) {
    const list = await dbGetAll('classes');
    if (includeArchived) return list;
    return list.filter(c => !c.isArchived);
  }

  async getClass(id) {
    if (!id) return null;
    return await dbGet('classes', id);
  }

  async createClass(data) {
    const id = data.id || `class_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const newClass = {
      id,
      name: data.name,
      section: data.section || '',
      isArchived: false,
      createdAt: now,
      updatedAt: now
    };
    await dbPut('classes', newClass);
    return newClass;
  }

  async updateClass(id, data) {
    const existing = await this.getClass(id);
    if (!existing) throw new Error('Class not found');

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };
    await dbPut('classes', updated);
    return updated;
  }

  async archiveClass(id) {
    return await this.updateClass(id, { isArchived: true });
  }

  async deleteClass(id) {
    return await dbDelete('classes', id);
  }
}

export const classRepository = new ClassRepository();
