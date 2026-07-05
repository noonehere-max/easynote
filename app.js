class EasyNote {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('easyNotes')) || [];
        this.activeNoteId = null;
        this.searchTerm = '';
        this.theme = localStorage.getItem('easyNoteTheme') || 'light';

        this.initElements();
        this.initEventListeners();
        this.applyTheme();
        this.renderNotesList();
        this.updateEmptyState();
    }

    initElements() {
        this.sidebar = document.getElementById('sidebar');
        this.notesList = document.getElementById('notesList');
        this.searchInput = document.getElementById('searchInput');
        this.btnNew = document.getElementById('btnNew');
        this.btnTheme = document.getElementById('btnTheme');
        this.btnDelete = document.getElementById('btnDelete');
        this.btnCopy = document.getElementById('btnCopy');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteBody = document.getElementById('noteBody');
        this.editor = document.getElementById('editor');
        this.emptyState = document.getElementById('emptyState');
        this.lastEdited = document.getElementById('lastEdited');
        this.notesCount = document.getElementById('notesCount');
        this.toast = document.getElementById('toast');
    }

    initEventListeners() {
        this.btnNew.addEventListener('click', () => this.createNote());
        this.btnTheme.addEventListener('click', () => this.toggleTheme());
        this.btnDelete.addEventListener('click', () => this.deleteActiveNote());
        this.btnCopy.addEventListener('click', () => this.copyContent());

        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.renderNotesList();
        });

        this.noteTitle.addEventListener('input', () => this.saveCurrentNote());
        this.noteBody.addEventListener('input', () => this.saveCurrentNote());

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNote();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.deleteActiveNote();
            }
        });
    }

    createNote() {
        const note = {
            id: Date.now().toString(),
            title: '',
            body: '',
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.activeNoteId = note.id;
        this.searchTerm = '';
        this.searchInput.value = '';
        this.saveToStorage();
        this.renderNotesList();
        this.loadNote(note.id);
        this.noteTitle.focus();
        this.showToast('Nota creada', 'success');
    }

    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.activeNoteId = id;
        this.noteTitle.value = note.title;
        this.noteBody.value = note.body;
        this.updateLastEdited(note.updatedAt);

        this.editor.classList.add('active');
        this.emptyState.style.display = 'none';
        this.renderNotesList();
    }

    saveCurrentNote() {
        if (!this.activeNoteId) return;

        const note = this.notes.find(n => n.id === this.activeNoteId);
        if (!note) return;

        note.title = this.noteTitle.value.trim();
        note.body = this.noteBody.value;
        note.updatedAt = new Date().toISOString();

        // Mover la nota activa al inicio
        this.notes = [note, ...this.notes.filter(n => n.id !== this.activeNoteId)];

        this.saveToStorage();
        this.updateLastEdited(note.updatedAt);
        this.renderNotesList(false); // false = mantener foco
    }

    deleteActiveNote() {
        if (!this.activeNoteId) return;

        const note = this.notes.find(n => n.id === this.activeNoteId);
        const title = note?.title || 'Sin título';

        if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

        this.notes = this.notes.filter(n => n.id !== this.activeNoteId);
        this.activeNoteId = null;
        this.saveToStorage();
        this.renderNotesList();
        this.updateEmptyState();
        this.showToast('Nota eliminada', 'success');
    }

    copyContent() {
        if (!this.activeNoteId) return;

        const note = this.notes.find(n => n.id === this.activeNoteId);
        if (!note) return;

        const text = `${note.title}\n\n${note.body}`;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Contenido copiado', 'success');
        }).catch(() => {
            this.showToast('Error al copiar', 'error');
        });
    }

    updateLastEdited(isoDate) {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let text;
        if (diffMins < 1) text = 'Guardado justo ahora';
        else if (diffMins < 60) text = `Hace ${diffMins} min`;
        else if (diffHours < 24) text = `Hace ${diffHours} h`;
        else text = `Hace ${diffDays} d`;

        this.lastEdited.textContent = text;
    }

    getFilteredNotes() {
        if (!this.searchTerm) return this.notes;

        return this.notes.filter(note =>
            note.title.toLowerCase().includes(this.searchTerm) ||
            note.body.toLowerCase().includes(this.searchTerm)
        );
    }

    renderNotesList(maintainFocus = true) {
        const filtered = this.getFilteredNotes();
        this.notesCount.textContent = `${filtered.length} nota${filtered.length !== 1 ? 's' : ''}`;

        if (filtered.length === 0) {
            this.notesList.innerHTML = `
                <div class="empty-state" style="position: static; opacity: 0.6; padding: 30px 10px;">
                    <p style="font-size: 13px; color: var(--text-muted);">
                        ${this.searchTerm ? 'No se encontraron notas' : 'No hay notas aún'}
                    </p>
                </div>
            `;
            return;
        }

        this.notesList.innerHTML = filtered.map(note => {
            const title = note.title || 'Sin título';
            const preview = note.body || 'Sin contenido';
            const date = new Date(note.updatedAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });
            const isActive = note.id === this.activeNoteId;

            return `
                <div class="note-item ${isActive ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${this.escapeHtml(title)}</div>
                    <div class="note-item-preview">${this.escapeHtml(preview)}</div>
                    <div class="note-item-meta">
                        <span>${date}</span>
                        <span>${this.formatTime(note.updatedAt)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Event listeners de los items
        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.id);
            });
        });
    }

    updateEmptyState() {
        if (this.notes.length === 0) {
            this.editor.classList.remove('active');
            this.emptyState.style.display = 'flex';
            this.noteTitle.value = '';
            this.noteBody.value = '';
            this.lastEdited.textContent = '';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('easyNoteTheme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = this.btnTheme.querySelector('i');
        icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    saveToStorage() {
        localStorage.setItem('easyNotes', JSON.stringify(this.notes));
    }

    formatTime(isoDate) {
        return new Date(isoDate).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type} show`;

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2500);
    }
}

// Iniciar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new EasyNote();
});
