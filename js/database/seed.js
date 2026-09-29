/* ==========================================================================
   DEMO DATA SEEDER & CLEANER
   Provides sample classes, students, and 7-day performance history
   ========================================================================== */

import { dbPutBatch, dbGetAll, dbPut, dbDelete, dbClearAll } from './indexedDB.js';
import { DEFAULT_CRITERIA } from './migrations.js';

export async function seedDemoData() {
  const isDemo = true;
  const now = new Date().toISOString();

  // 1. Create 3 Classes
  const classes = [
    { id: 'class_demo_1', name: 'Class 5', section: 'A', isArchived: false, isDemo, createdAt: now, updatedAt: now },
    { id: 'class_demo_2', name: 'Class 6', section: 'A', isArchived: false, isDemo, createdAt: now, updatedAt: now },
    { id: 'class_demo_3', name: 'Class 7', section: 'B', isArchived: false, isDemo, createdAt: now, updatedAt: now }
  ];

  await dbPutBatch('classes', classes);

  // 2. Create 10 Students per class
  const sampleNames = [
    'Muhammad Rayan', 'Afnan Ahmed', 'Zayan Khan', 'Hamza Ali', 'Bilal Hussain',
    'Omar Farooq', 'Yusuf Ibrahim', 'Tariq Ziyad', 'Mustafa Hassan', 'Zayd Malik'
  ];

  const students = [];
  classes.forEach((c, cIdx) => {
    sampleNames.forEach((name, sIdx) => {
      const id = `std_demo_${cIdx + 1}_${sIdx + 1}`;
      const admNo = `ADM-${202600 + (cIdx * 10) + sIdx + 1}`;
      students.push({
        id,
        name: `${name} ${cIdx > 0 ? `(${c.name})` : ''}`,
        admissionNumber: admNo,
        classId: c.id,
        gender: 'Male',
        parentName: `Parent of ${name}`,
        phone: `+91 98765 4321${sIdx}`,
        notes: 'Demo student profile',
        isActive: true,
        isDemo,
        createdAt: now,
        updatedAt: now
      });
    });
  });

  await dbPutBatch('students', students);

  // 3. Generate 7 Days of Daily Performance Records
  const today = new Date();
  const perfRecords = [];
  const dailySummaries = [];

  for (let d = 0; d < 7; d++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - d);
    const dateStr = targetDate.toISOString().split('T')[0];

    students.forEach(std => {
      let positiveCount = 0;
      let negativeCount = 0;

      DEFAULT_CRITERIA.forEach((crit, critIdx) => {
        // Random score simulation favoring positive
        const rand = Math.random();
        let status = 'positive';
        let points = 1;
        let remark = '';

        if (rand < 0.15) {
          status = 'negative';
          points = -1;
          negativeCount++;
          remark = `${crit.name} incomplete`;
        } else if (rand < 0.25) {
          status = 'neutral';
          points = 0;
        } else {
          positiveCount++;
        }

        const recordId = `${std.id}_${dateStr}_${crit.id}`;
        perfRecords.push({
          id: recordId,
          studentId: std.id,
          classId: std.classId,
          date: dateStr,
          criterionId: crit.id,
          status,
          points,
          remark,
          isDemo,
          createdAt: now,
          updatedAt: now
        });
      });

      // Aggregate Summary
      const summaryId = `${std.id}_${dateStr}`;
      dailySummaries.push({
        id: summaryId,
        studentId: std.id,
        classId: std.classId,
        date: dateStr,
        positivePoints: positiveCount,
        negativePoints: negativeCount,
        netPoints: positiveCount - negativeCount,
        isDemo,
        updatedAt: now
      });
    });
  }

  await dbPutBatch('performanceRecords', perfRecords);
  await dbPutBatch('dailySummaries', dailySummaries);

  // Mark setting
  await dbPut('settings', { key: 'isDemoLoaded', value: true });
  return true;
}

export async function removeDemoData() {
  const classes = await dbGetAll('classes');
  const students = await dbGetAll('students');
  const perf = await dbGetAll('performanceRecords');
  const summaries = await dbGetAll('dailySummaries');

  // Filter out demo items
  const demoClassIds = classes.filter(c => c.isDemo).map(c => c.id);
  const demoStudentIds = students.filter(s => s.isDemo).map(s => s.id);

  for (const cid of demoClassIds) await dbDelete('classes', cid);
  for (const sid of demoStudentIds) await dbDelete('students', sid);

  const nonDemoPerf = perf.filter(p => !p.isDemo);
  const nonDemoSum = summaries.filter(s => !s.isDemo);

  // Re-write non-demo data
  await dbPutBatch('performanceRecords', nonDemoPerf);
  await dbPutBatch('dailySummaries', nonDemoSum);

  await dbPut('settings', { key: 'isDemoLoaded', value: false });
  return true;
}
