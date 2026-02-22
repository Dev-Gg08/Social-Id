// ===========================
// Chat Module — Discord-style
// ===========================

const ChatModule = {
    activeRoom: null,

    init() {
        this.loadChannels();
        this.setupCreateRoom();
        this.setupMessageInput();
        this.setupBackButton();
    },

    refresh() {
        this.loadChannels();
        if (this.activeRoom) {
            this.loadMessages(this.activeRoom);
        }
    },

    // --- Load Channels ---
    loadChannels() {
        const rooms = DataStore.getChatRooms();
        const list = document.getElementById('channelList');

        list.innerHTML = rooms.map(room => `
            <div class="channel-item ${this.activeRoom === room.id ? 'active' : ''}" data-room-id="${room.id}">
                <span class="channel-icon">${room.icon || '💬'}</span>
                <div>
                    <div class="channel-name">${room.name}</div>
                </div>
            </div>
        `).join('');

        // Attach click events
        list.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const roomId = item.dataset.roomId;
                this.selectRoom(roomId);
            });
        });
    },

    // --- Select Room ---
    selectRoom(roomId) {
        this.activeRoom = roomId;
        const rooms = DataStore.getChatRooms();
        const room = rooms.find(r => r.id === roomId);

        if (!room) return;

        // Update UI
        document.getElementById('chatRoomName').textContent = `${room.icon} ${room.name}`;
        document.getElementById('chatMembers').textContent = room.description || '';
        document.getElementById('chatInputArea').classList.remove('hidden');

        // Mark active channel
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.toggle('active', item.dataset.roomId === roomId);
        });

        // Collapse sidebar on mobile
        const sidebar = document.getElementById('chatSidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
        }

        this.loadMessages(roomId);
    },

    // --- Load Messages ---
    loadMessages(roomId) {
        const messages = DataStore.getMessages(roomId);
        const container = document.getElementById('messagesContainer');

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <div class="empty-icon">🎉</div>
                    <p>เริ่มส่งข้อความแรกในห้องนี้กันเถอะ!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => this.renderMessage(msg)).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    renderMessage(msg) {
        const initial = msg.user_name ? msg.user_name.charAt(0).toUpperCase() : '?';
        const time = new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="message-group">
                <div class="avatar avatar-sm" style="background:${msg.avatar_color || 'var(--gradient-primary)'}">
                    <span>${initial}</span>
                </div>
                <div class="message-content">
                    <div class="message-author">
                        <h4>${this.escapeHtml(msg.user_name)}</h4>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(msg.content)}</div>
                </div>
            </div>
        `;
    },

    // --- Send Message ---
    setupMessageInput() {
        const input = document.getElementById('messageInput');
        const btn = document.getElementById('btnSendMessage');

        const send = () => {
            const content = input.value.trim();
            if (!content || !this.activeRoom) return;

            const user = App.currentUser;
            DataStore.addMessage(this.activeRoom, {
                user_id: user.id,
                user_name: user.display_name,
                avatar_color: user.avatar_color,
                content: content
            });

            input.value = '';
            this.loadMessages(this.activeRoom);
        };

        btn.addEventListener('click', send);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') send();
        });
    },

    // --- Create Room ---
    setupCreateRoom() {
        document.getElementById('btnCreateRoom').addEventListener('click', () => {
            App.openModal('createRoomModal');
        });

        document.getElementById('createRoomForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('roomName').value.trim();
            const desc = document.getElementById('roomDesc').value.trim();

            if (!name) return;

            DataStore.addChatRoom({ name, description: desc });
            document.getElementById('roomName').value = '';
            document.getElementById('roomDesc').value = '';
            App.closeModal('createRoomModal');
            this.loadChannels();
            App.toast('สร้างห้องแชทแล้ว! 💬', 'success');
        });
    },

    // --- Back Button (mobile) ---
    setupBackButton() {
        document.getElementById('btnChatBack').addEventListener('click', () => {
            const sidebar = document.getElementById('chatSidebar');
            sidebar.classList.remove('collapsed');
        });
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
