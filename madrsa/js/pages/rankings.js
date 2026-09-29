/* ==========================================================================
   RANKINGS PAGE
   Leaderboard podium for top 3 and list rankings for daily, weekly, monthly, overall
   ========================================================================== */

import { classRepository } from '../repositories/classRepository.js';
import { reportService } from '../services/reportService.js';
import { renderRankingsView } from '../components/rankingCard.js';

export async function renderRankings(container, params = {}) {
  const classes = await classRepository.getClasses();
  if (!classes || classes.length === 0) {
    container.innerHTML = `<div class="card"><p>No classes available.</p></div>`;
    return;
  }

  let selectedClassId = params.classId || classes[0].id;
  let activeTab = 'daily'; // 'daily' | 'weekly' | 'monthly' | 'overall'
  let selectedDateStr = new Date().toISOString().split('T')[0];

  const renderView = async () => {
    let reportData = null;

    if (activeTab === 'daily') {
      reportData = await reportService.getDailyReportData(selectedClassId, selectedDateStr);
    } else if (activeTab === 'weekly') {
      const d = new Date(selectedDateStr);
      d.setDate(d.getDate() - 6);
      reportData = await reportService.getPeriodReportData(selectedClassId, d.toISOString().split('T')[0], selectedDateStr);
    } else if (activeTab === 'monthly') {
      const d = new Date(selectedDateStr);
      d.setDate(d.getDate() - 29);
      reportData = await reportService.getPeriodReportData(selectedClassId, d.toISOString().split('T')[0], selectedDateStr);
    } else if (activeTab === 'overall') {
      reportData = await reportService.getPeriodReportData(selectedClassId, '2000-01-01', '2099-12-31');
    }

    const classOptionsHTML = classes.map(c => `
      <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>${c.name}</option>
    `).join('');

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Student Leaderboard</h2>
          <p>Class rankings based on daily performance net score</p>
        </div>
      </div>

      <!-- Timeframe Tabs -->
      <div class="tab-group">
        <button class="tab-btn ${activeTab === 'daily' ? 'active' : ''}" data-tab="daily">Daily</button>
        <button class="tab-btn ${activeTab === 'weekly' ? 'active' : ''}" data-tab="weekly">Weekly</button>
        <button class="tab-btn ${activeTab === 'monthly' ? 'active' : ''}" data-tab="monthly">Monthly</button>
        <button class="tab-btn ${activeTab === 'overall' ? 'active' : ''}" data-tab="overall">Overall All-Time</button>
      </div>

      <!-- Class Filter Card -->
      <div class="card" style="padding: 0.85rem 1.25rem;">
        <div class="grid-2" style="align-items: center;">
          <div>
            <label class="form-label" style="font-size: 0.75rem;">SELECT CLASS</label>
            <select id="ranking-class-select" class="form-control">
              ${classOptionsHTML}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">DATE REFERENCE</label>
            <input type="date" id="ranking-date-select" class="form-control" value="${selectedDateStr}">
          </div>
        </div>
      </div>

      <!-- Rankings View Container -->
      <div id="rankings-view-container"></div>
    `;

    const rankingsContainer = container.querySelector('#rankings-view-container');
    const rankingsElem = renderRankingsView(reportData.rows);
    rankingsContainer.appendChild(rankingsElem);

    // Bind Controls
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        renderView();
      };
    });

    container.querySelector('#ranking-class-select').onchange = (e) => {
      selectedClassId = e.target.value;
      renderView();
    };

    container.querySelector('#ranking-date-select').onchange = (e) => {
      selectedDateStr = e.target.value;
      renderView();
    };
  };

  await renderView();
}
