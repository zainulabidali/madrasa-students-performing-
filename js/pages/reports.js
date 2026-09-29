/* ==========================================================================
   REPORTS PAGE
   Daily, Weekly, and Monthly performance reports with PDF, Image & WhatsApp share
   ========================================================================== */

import { classRepository } from '../repositories/classRepository.js';
import { settingsRepository } from '../repositories/settingsRepository.js';
import { reportService } from '../services/reportService.js';
import { whatsappService } from '../services/whatsappService.js';
import { imageReportService } from '../services/imageReportService.js';
import { renderReportTable } from '../components/reportTable.js';
import { ChartHelper } from '../lib/chart-helper.js';
import { Toast } from '../components/toast.js';

export async function renderReports(container, params = {}) {
  const classes = await classRepository.getClasses();
  if (!classes || classes.length === 0) {
    container.innerHTML = `<div class="card"><p>No classes found.</p></div>`;
    return;
  }

  let activeTab = params.tab || 'daily'; // 'daily' | 'weekly' | 'monthly'
  let selectedClassId = params.classId || classes[0].id;
  let selectedDateStr = params.date || new Date().toISOString().split('T')[0];

  const criteria = await settingsRepository.getCriteria();

  const renderView = async () => {
    let reportData = null;

    if (activeTab === 'daily') {
      reportData = await reportService.getDailyReportData(selectedClassId, selectedDateStr);
    } else if (activeTab === 'weekly') {
      const targetDate = new Date(selectedDateStr);
      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - 6);
      const startStr = startDate.toISOString().split('T')[0];
      reportData = await reportService.getPeriodReportData(selectedClassId, startStr, selectedDateStr);
    } else if (activeTab === 'monthly') {
      const targetDate = new Date(selectedDateStr);
      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - 29);
      const startStr = startDate.toISOString().split('T')[0];
      reportData = await reportService.getPeriodReportData(selectedClassId, startStr, selectedDateStr);
    }

    const classOptionsHTML = classes.map(c => `
      <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>${c.name}</option>
    `).join('');

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Performance Reports</h2>
          <p>Generate, export and share student reports</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="share-wa-btn">💬 Share WhatsApp</button>
          <button class="btn btn-secondary" id="export-img-btn">🖼️ Download Image</button>
          <button class="btn btn-secondary" id="export-pdf-btn">📄 Export PDF</button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-group">
        <button class="tab-btn ${activeTab === 'daily' ? 'active' : ''}" data-tab="daily">Daily Report</button>
        <button class="tab-btn ${activeTab === 'weekly' ? 'active' : ''}" data-tab="weekly">Weekly Summary (7 Days)</button>
        <button class="tab-btn ${activeTab === 'monthly' ? 'active' : ''}" data-tab="monthly">Monthly Report (30 Days)</button>
      </div>

      <!-- Filter Controls -->
      <div class="card" style="padding: 0.85rem 1.25rem;">
        <div class="grid-2" style="align-items: center;">
          <div>
            <label class="form-label" style="font-size: 0.75rem;">SELECT CLASS</label>
            <select id="report-class-select" class="form-control">
              ${classOptionsHTML}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">TARGET DATE</label>
            <input type="date" id="report-date-select" class="form-control" value="${selectedDateStr}">
          </div>
        </div>
      </div>

      <!-- Best Performer Header Card -->
      ${reportData && reportData.bestPerformer && reportData.bestPerformer.bestPerformerNames !== 'None' ? `
        <div class="card" style="background: linear-gradient(135deg, var(--color-gold-bg), #fef3c7); border-color: var(--color-gold);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: #b45309; text-transform: uppercase;">
                🏆 BEST PERFORMER OF THE PERIOD
              </div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--color-primary-navy);">
                ${reportData.bestPerformer.bestPerformerNames}
              </h3>
            </div>
            <div class="badge" style="background: #f59e0b; color: #ffffff; font-size: 1.1rem; padding: 0.4rem 0.85rem;">
              Score: +${reportData.bestPerformer.bestScore}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Report Table Area -->
      <div id="report-table-container" style="margin-bottom: 1.5rem;"></div>

      <!-- Trend Chart Area -->
      <div class="card">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 1rem;">
          Period Comparison Chart
        </h3>
        <div class="chart-container">
          <canvas id="report-trend-chart"></canvas>
        </div>
      </div>
    `;

    // Render Table
    const tableContainer = container.querySelector('#report-table-container');
    const tableElem = renderReportTable(reportData.rows, activeTab === 'daily' ? criteria : []);
    tableContainer.appendChild(tableElem);

    // Render Trend Chart
    setTimeout(() => {
      const canvas = container.querySelector('#report-trend-chart');
      if (canvas && reportData) {
        const topRows = reportData.rows.slice(0, 7);
        const labels = topRows.map(r => r.student.name.split(' ')[0]);
        const posData = topRows.map(r => r.positivePoints);
        const negData = topRows.map(r => r.negativePoints);
        ChartHelper.renderBarChart(canvas, labels, posData, negData);
      }
    }, 100);

    // Bind Controls
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        renderView();
      };
    });

    container.querySelector('#report-class-select').onchange = (e) => {
      selectedClassId = e.target.value;
      renderView();
    };

    container.querySelector('#report-date-select').onchange = (e) => {
      selectedDateStr = e.target.value;
      renderView();
    };

    // Export & Share Handlers
    container.querySelector('#share-wa-btn').onclick = async () => {
      const msg = await whatsappService.formatDailyReport(reportData);
      await whatsappService.shareText(msg);
      Toast.success('WhatsApp summary ready.');
    };

    container.querySelector('#export-img-btn').onclick = async () => {
      Toast.info('Generating report image...');
      await imageReportService.generateDailyReportImage(reportData);
      Toast.success('Image report downloaded.');
    };

    container.querySelector('#export-pdf-btn').onclick = () => {
      window.print();
    };
  };

  await renderView();
}
