/* ==========================================================================
   REPORT REPOSITORY (LOCAL IMPLEMENTATION)
   High level report data aggregation
   ========================================================================== */

import { performanceRepository } from './performanceRepository.js';
import { studentRepository } from './studentRepository.js';
import { classRepository } from './classRepository.js';

export class ReportRepository {
  async getDailyReport(classId, dateStr) {
    const validClassId = (classId && classId !== 'null' && classId !== 'undefined') ? classId : null;
    const students = validClassId ? await studentRepository.getStudentsByClass(validClassId) : await studentRepository.getStudents();
    const cls = validClassId ? await classRepository.getClass(validClassId) : null;
    const summaries = await performanceRepository.getDailySummaries(validClassId, dateStr);
    const perfRecords = await performanceRepository.getDailyPerformance(validClassId, dateStr);

    const summaryMap = new Map();
    summaries.forEach(s => summaryMap.set(s.studentId, s));

    const rows = students.map(student => {
      const sum = summaryMap.get(student.id) || { positivePoints: 0, negativePoints: 0, netPoints: 0 };
      const studentRecords = perfRecords.filter(r => r.studentId === student.id);
      return {
        student,
        positivePoints: sum.positivePoints,
        negativePoints: sum.negativePoints,
        netPoints: sum.netPoints,
        records: studentRecords
      };
    });

    return {
      class: cls,
      date: dateStr,
      totalStudents: students.length,
      rows
    };
  }

  async getPeriodReport(classId, startDateStr, endDateStr) {
    const validClassId = (classId && classId !== 'null' && classId !== 'undefined') ? classId : null;
    const students = validClassId ? await studentRepository.getStudentsByClass(validClassId) : await studentRepository.getStudents();
    const cls = validClassId ? await classRepository.getClass(validClassId) : null;
    const summaries = await performanceRepository.getSummariesByDateRange(validClassId, startDateStr, endDateStr);
    const perfRecords = await performanceRepository.getPerformanceByDateRange(validClassId, startDateStr, endDateStr);

    const studentAggMap = new Map();
    students.forEach(std => {
      studentAggMap.set(std.id, {
        student: std,
        positivePoints: 0,
        negativePoints: 0,
        netPoints: 0,
        daysCount: 0,
        records: []
      });
    });

    const datesRecordedPerStudent = new Map();

    summaries.forEach(sum => {
      if (studentAggMap.has(sum.studentId)) {
        const item = studentAggMap.get(sum.studentId);
        item.positivePoints += (sum.positivePoints || 0);
        item.negativePoints += (sum.negativePoints || 0);
        item.netPoints += (sum.netPoints || 0);

        if (!datesRecordedPerStudent.has(sum.studentId)) {
          datesRecordedPerStudent.set(sum.studentId, new Set());
        }
        datesRecordedPerStudent.get(sum.studentId).add(sum.date);
      }
    });

    perfRecords.forEach(rec => {
      if (studentAggMap.has(rec.studentId)) {
        studentAggMap.get(rec.studentId).records.push(rec);
      }
    });

    const rows = Array.from(studentAggMap.values()).map(item => {
      const daysCount = datesRecordedPerStudent.has(item.student.id) ? datesRecordedPerStudent.get(item.student.id).size : 0;
      const avgScore = daysCount > 0 ? (item.netPoints / daysCount).toFixed(1) : '0.0';
      return {
        ...item,
        daysCount,
        avgScore
      };
    });

    return {
      class: cls,
      startDate: startDateStr,
      endDate: endDateStr,
      totalStudents: students.length,
      rows
    };
  }
}

export const reportRepository = new ReportRepository();
