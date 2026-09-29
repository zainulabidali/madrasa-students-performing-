/* ==========================================================================
   PERFORMANCE REPOSITORY (LOCAL IMPLEMENTATION)
   Handles daily performance entry, historical score lookups, and score summaries
   ========================================================================== */

import { dbGetAll, dbGet, dbGetByIndex, dbPut, dbPutBatch } from '../database/indexedDB.js';

export class PerformanceRepository {
  async getDailyPerformance(classId, dateStr) {
    if (classId && classId !== 'null' && classId !== 'undefined') {
      const list = await dbGetByIndex('performanceRecords', 'classId_date', [classId, dateStr]);
      return list || [];
    }
    const list = await dbGetByIndex('performanceRecords', 'date', dateStr);
    return list || [];
  }

  async getStudentPerformance(studentId) {
    const list = await dbGetByIndex('performanceRecords', 'studentId', studentId);
    return list || [];
  }

  async getPerformanceByDateRange(classId, startDateStr, endDateStr) {
    const all = classId ? await dbGetByIndex('performanceRecords', 'classId', classId) : await dbGetAll('performanceRecords');
    return all.filter(r => r.date >= startDateStr && r.date <= endDateStr);
  }

  async savePerformance(record) {
    const recordId = `${record.studentId}_${record.date}_${record.criterionId}`;
    const now = new Date().toISOString();
    
    const entry = {
      id: recordId,
      studentId: record.studentId,
      classId: record.classId,
      date: record.date,
      criterionId: record.criterionId,
      status: record.status, // 'positive' | 'negative' | 'neutral'
      points: record.points, // e.g. +1, -1, 0
      remark: record.remark || '',
      updatedAt: now,
      createdAt: record.createdAt || now
    };

    await dbPut('performanceRecords', entry);
    await this.updateDailySummary(record.studentId, record.classId, record.date);
    return entry;
  }

  async savePerformanceBatch(records) {
    if (!records || records.length === 0) return;
    const now = new Date().toISOString();
    const formatted = records.map(r => ({
      id: `${r.studentId}_${r.date}_${r.criterionId}`,
      studentId: r.studentId,
      classId: r.classId,
      date: r.date,
      criterionId: r.criterionId,
      status: r.status,
      points: r.points,
      remark: r.remark || '',
      updatedAt: now,
      createdAt: r.createdAt || now
    }));

    await dbPutBatch('performanceRecords', formatted);

    // Update affected daily summaries
    const studentDateKeys = new Set(records.map(r => `${r.studentId}|${r.classId}|${r.date}`));
    for (const key of studentDateKeys) {
      const [sId, cId, date] = key.split('|');
      await this.updateDailySummary(sId, cId, date);
    }
  }

  async updateDailySummary(studentId, classId, dateStr) {
    const studentRecords = await dbGetByIndex('performanceRecords', 'studentId_date', [studentId, dateStr]);
    let positive = 0;
    let negative = 0;

    studentRecords.forEach(r => {
      if (r.status === 'positive') positive += Math.abs(r.points || 1);
      if (r.status === 'negative') negative += Math.abs(r.points || 1);
    });

    const summaryId = `${studentId}_${dateStr}`;
    const summary = {
      id: summaryId,
      studentId,
      classId,
      date: dateStr,
      positivePoints: positive,
      negativePoints: negative,
      netPoints: positive - negative,
      updatedAt: new Date().toISOString()
    };

    await dbPut('dailySummaries', summary);
    return summary;
  }

  async getDailySummaries(classId, dateStr) {
    if (classId && classId !== 'null' && classId !== 'undefined') {
      return await dbGetByIndex('dailySummaries', 'classId_date', [classId, dateStr]);
    }
    return await dbGetByIndex('dailySummaries', 'date', dateStr);
  }

  async getSummariesByDateRange(classId, startDateStr, endDateStr) {
    const all = classId ? await dbGetByIndex('dailySummaries', 'classId', classId) : await dbGetAll('dailySummaries');
    return all.filter(s => s.date >= startDateStr && s.date <= endDateStr);
  }
}

export const performanceRepository = new PerformanceRepository();
