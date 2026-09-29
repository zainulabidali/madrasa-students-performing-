/* ==========================================================================
   SETTINGS REPOSITORY (LOCAL IMPLEMENTATION)
   Handles app configuration, scoring criteria rules, subjects, and materials
   ========================================================================== */

import { dbGetAll, dbGet, dbPut, dbPutBatch, dbDelete } from '../database/indexedDB.js';

export class SettingsRepository {
  async getSettings() {
    const list = await dbGetAll('settings');
    const settingsMap = {};
    list.forEach(item => {
      settingsMap[item.key] = item.value;
    });
    return settingsMap;
  }

  async getSetting(key, defaultValue = null) {
    const item = await dbGet('settings', key);
    return item ? item.value : defaultValue;
  }

  async saveSetting(key, value) {
    await dbPut('settings', { key, value });
    return value;
  }

  async saveSettings(settingsObj) {
    for (const [key, value] of Object.entries(settingsObj)) {
      await dbPut('settings', { key, value });
    }
  }

  // Criteria Management
  async getCriteria() {
    const list = await dbGetAll('criteria');
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async saveCriterion(criterion) {
    await dbPut('criteria', criterion);
    return criterion;
  }

  async saveCriteriaBatch(criteriaList) {
    await dbPutBatch('criteria', criteriaList);
    return criteriaList;
  }

  // Subjects & Daily Materials
  async getSubjects(classId) {
    const list = await dbGetAll('subjects');
    return classId ? list.filter(s => s.classId === classId) : list;
  }

  async saveSubject(subject) {
    const id = subject.id || `sub_${Date.now()}`;
    const data = { ...subject, id };
    await dbPut('subjects', data);
    return data;
  }

  async deleteSubject(id) {
    await dbDelete('subjects', id);
  }

  async getMaterials(classId, dateStr) {
    const list = await dbGetAll('materials');
    return list.filter(m => (!classId || m.classId === classId) && (!dateStr || m.date === dateStr));
  }

  async saveMaterial(material) {
    const id = material.id || `mat_${Date.now()}`;
    const data = { ...material, id };
    await dbPut('materials', data);
    return data;
  }
}

export const settingsRepository = new SettingsRepository();
