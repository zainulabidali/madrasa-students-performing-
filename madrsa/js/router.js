/* ==========================================================================
   SINGLE PAGE APPLICATION ROUTER
   Client-side hash router with parameter parsing
   ========================================================================== */

import { renderDashboard } from './pages/dashboard.js';
import { renderClasses } from './pages/classes.js';
import { renderClassDetail } from './pages/classDetail.js';
import { renderDailyPerformance } from './pages/dailyPerformance.js';
import { renderStudents } from './pages/students.js';
import { renderStudentProfile } from './pages/studentProfile.js';
import { renderReports } from './pages/reports.js';
import { renderRankings } from './pages/rankings.js';
import { renderSettings } from './pages/settings.js';

export class Router {
  constructor(mainContainer) {
    this.container = mainContainer;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  parseHash() {
    const hash = window.location.hash || '#/dashboard';
    const [pathPart, queryPart] = hash.split('?');
    const pathSegments = pathPart.replace(/^#\//, '').split('/');
    
    const params = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }

    return {
      route: pathSegments[0] || 'dashboard',
      id: pathSegments[1] || null,
      params
    };
  }

  async handleRoute() {
    const { route, id, params } = this.parseHash();

    // Update active nav link states
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
      const linkHash = el.getAttribute('href');
      if (linkHash && linkHash.startsWith(`#/${route}`)) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    this.container.innerHTML = `<div class="spinner"></div>`;

    try {
      switch (route) {
        case 'dashboard':
          await renderDashboard(this.container);
          break;
        case 'classes':
          await renderClasses(this.container);
          break;
        case 'class':
          if (id) await renderClassDetail(this.container, id);
          else await renderClasses(this.container);
          break;
        case 'daily':
          await renderDailyPerformance(this.container, params);
          break;
        case 'students':
          await renderStudents(this.container, params);
          break;
        case 'student':
          if (id) await renderStudentProfile(this.container, id);
          else await renderStudents(this.container);
          break;
        case 'reports':
          await renderReports(this.container, params);
          break;
        case 'rankings':
          await renderRankings(this.container, params);
          break;
        case 'settings':
          await renderSettings(this.container);
          break;
        default:
          await renderDashboard(this.container);
          break;
      }
    } catch (err) {
      console.error('Route handler error:', err);
      this.container.innerHTML = `
        <div class="card">
          <h3 style="color: var(--color-negative);">Unable to load section</h3>
          <p style="color: var(--color-text-muted);">${err.message || 'An unexpected error occurred.'}</p>
          <a href="#/dashboard" class="btn btn-primary" style="margin-top: 1rem;">Return to Dashboard</a>
        </div>
      `;
    }
  }
}
