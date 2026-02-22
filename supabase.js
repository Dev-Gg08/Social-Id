// ===========================
// Supabase Client & Data Layer
// ===========================

const SUPABASE_URL = 'https://xhoiouzraqoyvevbxefj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_K3hyy5i7tZ5J9Z4WtTop1g_ZFAW06R5';

let supabaseClient = null;

// Try to init Supabase, fallback to localStorage
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase connected');
    }
} catch (e) {
    console.warn('⚠️ Supabase not available, using localStorage fallback');
}

// ===========================
// LocalStorage Data Layer
// ===========================
const DB = {
    get(key) {
        try {
            const data = localStorage.getItem(`sv_${key}`);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },

    set(key, value) {
        try {
            localStorage.setItem(`sv_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    // Generate unique ID
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
};

// ===========================
// Data Access Functions
// ===========================
const DataStore = {
    // --- Current User ---
    getCurrentUser() {
        return DB.get('currentUser');
    },

    setCurrentUser(user) {
        DB.set('currentUser', user);
    },

    // --- Profiles ---
    getProfiles() {
        return DB.get('profiles') || [];
    },

    saveProfile(profile) {
        const profiles = this.getProfiles();
        const idx = profiles.findIndex(p => p.id === profile.id);
        if (idx >= 0) {
            profiles[idx] = { ...profiles[idx], ...profile };
        } else {
            profiles.push(profile);
        }
        DB.set('profiles', profiles);
        return profile;
    },

    // --- Posts ---
    getPosts() {
        return DB.get('posts') || [];
    },

    addPost(post) {
        const posts = this.getPosts();
        post.id = DB.uid();
        post.created_at = new Date().toISOString();
        post.likes = 0;
        post.liked_by = [];
        post.comments = [];
        posts.unshift(post);
        DB.set('posts', posts);
        return post;
    },

    updatePost(postId, updates) {
        const posts = this.getPosts();
        const idx = posts.findIndex(p => p.id === postId);
        if (idx >= 0) {
            posts[idx] = { ...posts[idx], ...updates };
            DB.set('posts', posts);
            return posts[idx];
        }
        return null;
    },

    // --- Chat Rooms ---
    getChatRooms() {
        const rooms = DB.get('chatRooms');
        if (!rooms || rooms.length === 0) {
            // Default rooms
            const defaultRooms = [
                { id: 'general', name: 'ห้องทั่วไป', description: 'พูดคุยทั่วไป', icon: '💬', messages: [] },
                { id: 'homework', name: 'การบ้าน & งาน', description: 'แชร์การบ้านและงานที่ได้รับ', icon: '📚', messages: [] },
                { id: 'memes', name: 'มีม & ขำขัน', description: 'แชร์มีมตลกๆ', icon: '😂', messages: [] },
                { id: 'random', name: 'สุ่ม', description: 'คุยอะไรก็ได้!', icon: '🎲', messages: [] },
                { id: 'gaming', name: 'เกมมิ่ง', description: 'คุยเรื่องเกม', icon: '🎮', messages: [] },
            ];
            DB.set('chatRooms', defaultRooms);
            return defaultRooms;
        }
        return rooms;
    },

    addChatRoom(room) {
        const rooms = this.getChatRooms();
        room.id = DB.uid();
        room.messages = [];
        room.icon = '💬';
        rooms.push(room);
        DB.set('chatRooms', rooms);
        return room;
    },

    addMessage(roomId, message) {
        const rooms = this.getChatRooms();
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            message.id = DB.uid();
            message.created_at = new Date().toISOString();
            room.messages.push(message);
            DB.set('chatRooms', rooms);
            return message;
        }
        return null;
    },

    getMessages(roomId) {
        const rooms = this.getChatRooms();
        const room = rooms.find(r => r.id === roomId);
        return room ? room.messages : [];
    },

    // --- Love Notes ---
    getLoveNotes() {
        return DB.get('loveNotes') || [];
    },

    addLoveNote(note) {
        const notes = this.getLoveNotes();
        note.id = DB.uid();
        note.created_at = new Date().toISOString();
        notes.unshift(note);
        DB.set('loveNotes', notes);
        return note;
    },

    // --- Videos ---
    getVideos() {
        return DB.get('videos') || [];
    },

    addVideo(video) {
        const videos = this.getVideos();
        video.id = DB.uid();
        video.created_at = new Date().toISOString();
        video.likes = 0;
        video.liked_by = [];
        video.views = Math.floor(Math.random() * 100);
        videos.unshift(video);
        DB.set('videos', videos);
        return video;
    },

    updateVideo(videoId, updates) {
        const videos = this.getVideos();
        const idx = videos.findIndex(v => v.id === videoId);
        if (idx >= 0) {
            videos[idx] = { ...videos[idx], ...updates };
            DB.set('videos', videos);
            return videos[idx];
        }
        return null;
    }
};
