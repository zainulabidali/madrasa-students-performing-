/* ==========================================================================
   MODAL COMPONENT
   Flexible dialog and destructive confirmation system
   ========================================================================== */

export class Modal {
  static open({ title, contentHTML, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-primary', requirePhrase = null }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    let phraseInputHTML = '';
    if (requirePhrase) {
      phraseInputHTML = `
        <div style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <p style="font-size: 0.85rem; color: #b91c1c; font-weight: 600; margin-bottom: 0.5rem;">
            ⚠️ Type <strong>${requirePhrase}</strong> below to confirm:
          </p>
          <input type="text" id="modal-phrase-input" class="form-control" placeholder="${requirePhrase}">
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHTML}
          ${phraseInputHTML}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('open'));

    const close = () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#modal-close-btn').onclick = close;
    overlay.querySelector('#modal-cancel-btn').onclick = close;

    const confirmBtn = overlay.querySelector('#modal-confirm-btn');

    confirmBtn.onclick = async () => {
      if (requirePhrase) {
        const typed = overlay.querySelector('#modal-phrase-input').value.trim();
        if (typed !== requirePhrase) {
          alert(`You must type "${requirePhrase}" exactly to confirm.`);
          return;
        }
      }

      if (onConfirm) {
        await onConfirm(overlay);
      }
      close();
    };
  }

  static confirm({ title, message, onConfirm, confirmText = 'Yes, Proceed', confirmClass = 'btn-danger' }) {
    this.open({
      title,
      contentHTML: `<p style="font-size: 0.95rem; color: #475569;">${message}</p>`,
      onConfirm,
      confirmText,
      confirmClass
    });
  }
}
