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
        this.notesList = document.getElementById('notesList');
        this.searchInput = document.getElementById('searchInput');
        this.btnNew = document.getElementById('btnNew');
        this.btnTheme = document.getElementById('btnTheme');
        this.themeIcon = document.getElementById('themeIcon');
        this.btnDelete = document.getElementById('btnDelete');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteBody = document.getElementById('noteBody');
        this.editor = document.getElementById('editor');
        this.emptyState = document.getElementById('emptyState');
        this.toast = document.getElementById('toast');
    }

    initEventListeners() {
        this.btnNew.addEventListener('click', () => this.createNote());
        this.btnTheme.addEventListener('click', () => this.toggleTheme());
        this.btnDelete.addEventListener('click', () => this.deleteActiveNote());

        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.renderNotesList();
        });

        this.noteTitle.addEventListener('input', () => this.saveCurrentNote());
        this.noteBody.addEventListener('input', () => this.saveCurrentNote());

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNote();
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
    }

    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.activeNoteId = id;
        this.noteTitle.value = note.title;
        this.noteBody.value = note.body;

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

        this.notes = [note, ...this.notes.filter(n => n.id !== this.activeNoteId)];

        this.saveToStorage();
        this.renderNotesList(false);
    }

    deleteActiveNote() {
        if (!this.activeNoteId) return;

        const note = this.notes.find(n => n.id === this.activeNoteId);
        const title = note?.title || 'esta nota';

        if (!confirm(`¿Eliminar "${title}"?`)) return;

        this.notes = this.notes.filter(n => n.id !== this.activeNoteId);
        this.activeNoteId = null;
        this.saveToStorage();
        this.renderNotesList();
        this.updateEmptyState();
        this.showToast('Nota eliminada');
    }

    getFilteredNotes() {
        if (!this.searchTerm) return this.notes;

        return this.notes.filter(note =>
            note.title.toLowerCase().includes(this.searchTerm) ||
            note.body.toLowerCase().includes(this.searchTerm)
        );
    }

    renderNotesList() {
        const filtered = this.getFilteredNotes();

        if (filtered.length === 0) {
            this.notesList.innerHTML = `
                <div class="empty-state" style="position: static; padding: 30px 10px;">
                    <p style="font-size: 13px; color: var(--text-soft);">
                        ${this.searchTerm ? 'No se encontraron notas' : 'No hay notas'}
                    </p>
                </div>
            `;
            return;
        }

        this.notesList.innerHTML = filtered.map(note => {
            const title = note.title || 'Sin título';
            const preview = note.body || 'Sin contenido';
            const isActive = note.id === this.activeNoteId;

            return `
                <div class="note-item ${isActive ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${this.escapeHtml(title)}</div>
                    <div class="note-item-preview">${this.escapeHtml(preview)}</div>
                </div>
            `;
        }).join('');

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
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('easyNoteTheme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.themeIcon.textContent = this.theme === 'light' ? '☾' : '☀';
    }

    saveToStorage() {
        localStorage.setItem('easyNotes', JSON.stringify(this.notes));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EasyNote();
});
