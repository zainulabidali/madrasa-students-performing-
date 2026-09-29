/* ==========================================================================
   DATABASE MIGRATIONS & DEFAULTS
   Initializes default system criteria and settings schema
   ========================================================================== */

import { dbGetAll, dbPutBatch, dbPut, dbGet } from './indexedDB.js';

export const DEFAULT_CRITERIA = [
  { id: 'crit_notebook', name: 'Notebook', positivePoints: 1, negativePoints: -1, icon: '📓', order: 1, isActive: true },
  { id: 'crit_kitab', name: 'Kitab', positivePoints: 1, negativePoints: -1, icon: '📖', order: 2, isActive: true },
  { id: 'crit_lesson', name: 'Lesson', positivePoints: 1, negativePoints: -1, icon: '🧠', order: 3, isActive: true },
  { id: 'crit_prayer', name: 'Prayer', positivePoints: 1, negativePoints: -1, icon: '🕌', order: 4, isActive: true },
  { id: 'crit_punctuality', name: 'Punctuality', positivePoints: 1, negativePoints: -1, icon: '⏰', order: 5, isActive: true },
  { id: 'crit_discipline', name: 'Discipline', positivePoints: 1, negativePoints: -1, icon: '⭐', order: 6, isActive: true },
  { id: 'crit_items', name: 'Required Items', positivePoints: 1, negativePoints: -1, icon: '🎒', order: 7, isActive: true }
];

export const DEFAULT_SETTINGS = [
  { key: 'madrasaName', value: 'Darul Uloom Madrasa' },
  { key: 'academicYear', value: '2026 - 2027' },
  { key: 'logo', value: '' },
  { key: 'tieBreaker', value: 'positive_points' }, // positive_points | alphabetical | admission
  { key: 'reportHeader', value: 'MADRASA DAILY PERFORMANCE REPORT' },
  { key: 'reportFooter', value: 'Generated via Madrasa Performance Manager' },
  { key: 'isDemoLoaded', value: false }
];

export async function runMigrations() {
  // Ensure criteria exist
  const existingCriteria = await dbGetAll('criteria');
  if (!existingCriteria || existingCriteria.length === 0) {
    await dbPutBatch('criteria', DEFAULT_CRITERIA);
  }

  // Ensure default settings exist
  for (const s of DEFAULT_SETTINGS) {
    const existing = await dbGet('settings', s.key);
    if (!existing) {
      await dbPut('settings', s);
    }
  }
}
