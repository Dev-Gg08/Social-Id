// ===========================
// App.js — Main App Logic
// ===========================

const App = {
    currentUser: null,
    activeTab: 'feedTab',

    init() {
        this.checkAuth();
        this.setupTabNavigation();
        this.setupModals();
        this.setupTopbar();
    },

    // --- Auth ---
    checkAuth() {
        const user = DataStore.getCurrentUser();
        if (user) {
            this.currentUser = user;
            this.showApp();
        } else {
            this.showAuth();
        }
    },

    showAuth() {
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        this.setupAuthForm();
    },

    showApp() {
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        this.updateUserUI();
        this.initTabs();
    },

    setupAuthForm() {
        const form = document.getElementById('authForm');
        const displayInput = document.getElementById('authDisplayName');
        const avatarLetter = document.getElementById('authAvatarLetter');
        const avatarCircle = document.getElementById('authAvatarPreview');

        // Live avatar preview — update letter as user types
        if (displayInput && avatarLetter) {
            displayInput.addEventListener('input', () => {
                const val = displayInput.value.trim();
                avatarLetter.textContent = val ? val.charAt(0).toUpperCase() : '?';
                // Randomize color on each keystroke for fun
                const hue = (val.length * 47 + val.charCodeAt(0) || 0) % 360;
                if (avatarCircle) {
                    avatarCircle.style.background = `linear-gradient(135deg, hsl(${hue}, 80%, 55%), hsl(${(hue + 60) % 360}, 90%, 50%))`;
                }
            });
        }

        // Fake online count animation
        const onlineEl = document.getElementById('onlineCount');
        if (onlineEl) {
            const base = Math.floor(Math.random() * 20) + 15;
            onlineEl.textContent = base;
            setInterval(() => {
                const delta = Math.random() > 0.5 ? 1 : -1;
                const cur = parseInt(onlineEl.textContent) + delta;
                onlineEl.textContent = Math.max(8, cur);
            }, 4000);
        }

        // Member count
        const memberEl = document.getElementById('memberCountText');
        if (memberEl) {
            const profiles = DataStore.getProfiles ? DataStore.getProfiles() : [];
            memberEl.textContent = Math.max(profiles.length, 127);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('authUsername').value.trim();
            const displayName = document.getElementById('authDisplayName').value.trim();
            const school = document.getElementById('authSchool').value.trim();

            if (!username || !displayName) return;

            const user = {
                id: DB.uid(),
                username: username.toLowerCase().replace(/\s+/g, '_'),
                display_name: displayName,
                school: school || 'ไม่ระบุ',
                bio: '',
                grade: '',
                avatar_color: this.randomGradient(),
                created_at: new Date().toISOString()
            };

            DataStore.setCurrentUser(user);
            DataStore.saveProfile(user);
            this.currentUser = user;
            this.showApp();
            App.toast('ยินดีต้อนรับสู่ SchoolVerse! 🎉', 'success');
        });
    },

    randomGradient() {
        const gradients = [
            'linear-gradient(135deg, #00f5ff, #7b2dff)',
            'linear-gradient(135deg, #ff00e5, #ff6bcb)',
            'linear-gradient(135deg, #7b2dff, #ff00e5)',
            'linear-gradient(135deg, #ff8c42, #ff00e5)',
            'linear-gradient(135deg, #00ff88, #00f5ff)',
            'linear-gradient(135deg, #f093fb, #f5576c)',
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #43e97b, #38f9d7)',
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    },

    updateUserUI() {
        if (!this.currentUser) return;
        const initial = this.currentUser.display_name.charAt(0).toUpperCase();

        // Topbar avatar
        const topAvatar = document.getElementById('topbarAvatar');
        topAvatar.querySelector('span').textContent = initial;
        topAvatar.style.background = this.currentUser.avatar_color;

        // Feed avatar
        const feedAvatar = document.getElementById('feedAvatar');
        feedAvatar.querySelector('span').textContent = initial;
        feedAvatar.style.background = this.currentUser.avatar_color;
    },

    // --- Tab Navigation ---
    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.dataset.tab;
                this.switchTab(tabId);
            });
        });
    },

    switchTab(tabId) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });

        this.activeTab = tabId;

        // Tab-specific refresh
        if (tabId === 'feedTab') FeedModule.refresh();
        if (tabId === 'chatTab') ChatModule.refresh();
        if (tabId === 'socialTab') SocialModule.refresh();
        if (tabId === 'videosTab') VideosModule.refresh();
    },

    // --- Init Tab Modules ---
    initTabs() {
        FeedModule.init();
        ChatModule.init();
        SocialModule.init();
        VideosModule.init();
    },

    // --- Modals ---
    setupModals() {
        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                document.getElementById(modalId).classList.add('hidden');
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay && overlay.id !== 'authModal') {
                    overlay.classList.add('hidden');
                }
            });
        });
    },

    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    // --- Topbar ---
    setupTopbar() {
        document.getElementById('btnProfile').addEventListener('click', () => {
            this.switchTab('socialTab');
        });
    },

    // --- Toast Notifications ---
    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- Time Formatting ---
    timeAgo(dateStr) {
        const now = new Date();
        const past = new Date(dateStr);
        const diff = Math.floor((now - past) / 1000);

        if (diff < 60) return 'เมื่อสักครู่';
        if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
        return past.toLocaleDateString('th-TH');
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());
