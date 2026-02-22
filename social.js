// ===========================
// Social Module — Profiles, Community, Love Notes
// ===========================

const SocialModule = {
    init() {
        this.loadProfile();
        this.setupEditProfile();
        this.setupLoveNotes();
        this.loadLoveNotes();
        this.loadMembers();
    },

    refresh() {
        this.loadProfile();
        this.loadLoveNotes();
        this.loadMembers();
    },

    // --- Profile ---
    loadProfile() {
        const user = App.currentUser;
        if (!user) return;

        const initial = user.display_name.charAt(0).toUpperCase();
        document.getElementById('profileAvatarLarge').querySelector('span').textContent = initial;
        document.getElementById('profileAvatarLarge').style.background = user.avatar_color;
        document.getElementById('profileDisplayName').textContent = user.display_name;
        document.getElementById('profileUsername').textContent = `@${user.username}`;
        document.getElementById('profileSchool').textContent = user.school || 'ไม่ระบุโรงเรียน';

        // Stats
        const posts = DataStore.getPosts().filter(p => p.user_id === user.id);
        const notes = DataStore.getLoveNotes().filter(n => n.to_user === user.display_name);
        const members = DataStore.getProfiles().length;

        document.getElementById('statPosts').textContent = posts.length;
        document.getElementById('statNotes').textContent = notes.length;
        document.getElementById('statFriends').textContent = members;
    },

    // --- Edit Profile ---
    setupEditProfile() {
        document.getElementById('btnEditProfile').addEventListener('click', () => {
            const user = App.currentUser;
            document.getElementById('editDisplayName').value = user.display_name || '';
            document.getElementById('editBio').value = user.bio || '';
            document.getElementById('editSchool').value = user.school || '';
            document.getElementById('editGrade').value = user.grade || '';
            App.openModal('editProfileModal');
        });

        document.getElementById('editProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = App.currentUser;
            user.display_name = document.getElementById('editDisplayName').value.trim() || user.display_name;
            user.bio = document.getElementById('editBio').value.trim();
            user.school = document.getElementById('editSchool').value.trim();
            user.grade = document.getElementById('editGrade').value.trim();

            DataStore.setCurrentUser(user);
            DataStore.saveProfile(user);
            App.currentUser = user;

            App.closeModal('editProfileModal');
            App.updateUserUI();
            this.loadProfile();
            App.toast('อัปเดตโปรไฟล์แล้ว! ✨', 'success');
        });
    },

    // --- Love Notes ---
    setupLoveNotes() {
        document.getElementById('btnWriteNote').addEventListener('click', () => {
            App.openModal('loveNoteModal');
        });

        document.getElementById('loveNoteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const to = document.getElementById('noteTo').value.trim();
            const message = document.getElementById('noteMessage').value.trim();
            const anonymous = document.getElementById('noteAnonymous').checked;

            if (!to || !message) return;

            DataStore.addLoveNote({
                from_user: anonymous ? 'anonymous' : App.currentUser.display_name,
                to_user: to,
                message: message,
                is_anonymous: anonymous
            });

            document.getElementById('noteTo').value = '';
            document.getElementById('noteMessage').value = '';
            document.getElementById('noteAnonymous').checked = true;

            App.closeModal('loveNoteModal');
            this.loadLoveNotes();
            App.toast('ส่งโน้ตแล้ว! 💌', 'success');
        });
    },

    loadLoveNotes() {
        const notes = DataStore.getLoveNotes();
        const grid = document.getElementById('loveNotesGrid');

        if (notes.length === 0) {
            grid.innerHTML = `
                <div class="card" style="text-align:center; padding:30px; grid-column: 1/-1;">
                    <div style="font-size:2.5rem; margin-bottom:8px;">💌</div>
                    <p style="color:var(--text-muted);">ยังไม่มีโน้ต เขียนโน้ตแรกเลย!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = notes.map(note => `
            <div class="love-note-card">
                <div class="note-header">
                    <span class="note-to">💕 ถึง: ${this.escapeHtml(note.to_user)}</span>
                    <span class="note-from">${note.is_anonymous ? '🎭 ไม่ระบุตัวตน' : `จาก: ${this.escapeHtml(note.from_user)}`}</span>
                </div>
                <p class="note-message">"${this.escapeHtml(note.message)}"</p>
                <div class="note-time">${App.timeAgo(note.created_at)}</div>
            </div>
        `).join('');
    },

    // --- Members ---
    loadMembers() {
        const profiles = DataStore.getProfiles();
        const grid = document.getElementById('membersGrid');

        if (profiles.length === 0) {
            grid.innerHTML = `
                <div class="card" style="text-align:center; padding:30px; grid-column: 1/-1;">
                    <p style="color:var(--text-muted);">ยังไม่มีสมาชิก</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = profiles.map(profile => {
            const initial = profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '?';
            return `
                <div class="member-card">
                    <div class="avatar avatar-md" style="background:${profile.avatar_color || 'var(--gradient-primary)'}">
                        <span>${initial}</span>
                    </div>
                    <div class="member-info">
                        <h4>${this.escapeHtml(profile.display_name)}</h4>
                        <p>${profile.grade ? profile.grade + ' • ' : ''}${profile.school || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
