/* ==========================================================================
   BACKUP & RESTORE SERVICE
   JSON Data Export, Schema Validation, and Safe Import (Merge or Replace)
   ========================================================================== */

import { dbGetAll, dbPutBatch, dbClearAll } from '../database/indexedDB.js';

export class BackupService {
  async exportBackup() {
    const classes = await dbGetAll('classes');
    const students = await dbGetAll('students');
    const criteria = await dbGetAll('criteria');
    const performanceRecords = await dbGetAll('performanceRecords');
    const dailySummaries = await dbGetAll('dailySummaries');
    const subjects = await dbGetAll('subjects');
    const materials = await dbGetAll('materials');
    const settings = await dbGetAll('settings');

    const backupPayload = {
      app: 'MadrasaStudentPerformanceManager',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        classes,
        students,
        criteria,
        performanceRecords,
        dailySummaries,
        subjects,
        materials,
        settings
      }
    };

    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Madrasa_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  validateBackupFile(jsonObj) {
    if (!jsonObj || typeof jsonObj !== 'object') return false;
    if (jsonObj.app !== 'MadrasaStudentPerformanceManager') return false;
    if (!jsonObj.data || typeof jsonObj.data !== 'object') return false;
    if (!Array.isArray(jsonObj.data.classes) || !Array.isArray(jsonObj.data.students)) return false;
    return true;
  }

  async importBackup(jsonObj, strategy = 'merge') {
    if (!this.validateBackupFile(jsonObj)) {
      throw new Error('Invalid or corrupted backup JSON file format.');
    }

    const { classes, students, criteria, performanceRecords, dailySummaries, subjects, materials, settings } = jsonObj.data;

    if (strategy === 'replace') {
      await dbClearAll();
    }

    if (classes && classes.length) await dbPutBatch('classes', classes);
    if (students && students.length) await dbPutBatch('students', students);
    if (criteria && criteria.length) await dbPutBatch('criteria', criteria);
    if (performanceRecords && performanceRecords.length) await dbPutBatch('performanceRecords', performanceRecords);
    if (dailySummaries && dailySummaries.length) await dbPutBatch('dailySummaries', dailySummaries);
    if (subjects && subjects.length) await dbPutBatch('subjects', subjects);
    if (materials && materials.length) await dbPutBatch('materials', materials);
    if (settings && settings.length) await dbPutBatch('settings', settings);

    return true;
  }
}

export const backupService = new BackupService();
