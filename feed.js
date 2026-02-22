// ===========================
// Feed Module — Posts & Homework
// ===========================

const FeedModule = {
    currentFilter: 'all',
    imageDataUrl: null,

    init() {
        this.setupCreatePost();
        this.setupFilters();
        this.loadPosts();
    },

    refresh() {
        this.loadPosts();
    },

    // --- Create Post ---
    setupCreatePost() {
        const input = document.getElementById('createPostInput');
        const expanded = document.getElementById('createPostExpanded');
        const textarea = document.getElementById('postContent');
        const imageInput = document.getElementById('postImage');
        const btnSubmit = document.getElementById('btnSubmitPost');

        input.addEventListener('focus', () => {
            expanded.classList.remove('hidden');
            textarea.focus();
        });

        // Image upload
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                this.imageDataUrl = ev.target.result;
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${this.imageDataUrl}" alt="preview">`;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });

        // Submit post
        btnSubmit.addEventListener('click', () => {
            const content = textarea.value.trim();
            if (!content) {
                App.toast('เขียนอะไรสักอย่างก่อนโพสต์สิ! 😊', 'error');
                return;
            }

            const user = App.currentUser;
            const postType = document.getElementById('postType').value;

            const post = DataStore.addPost({
                user_id: user.id,
                user_name: user.display_name,
                user_avatar_color: user.avatar_color,
                content: content,
                post_type: postType,
                image_url: this.imageDataUrl
            });

            textarea.value = '';
            input.value = '';
            this.imageDataUrl = null;
            document.getElementById('imagePreview').classList.add('hidden');
            document.getElementById('imagePreview').innerHTML = '';
            expanded.classList.add('hidden');

            this.loadPosts();
            App.toast('โพสต์แล้ว! 🚀', 'success');
        });
    },

    // --- Filters ---
    setupFilters() {
        document.querySelectorAll('.tab-header-actions .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.tab-header-actions .chip').forEach(c => c.classList.remove('chip-active'));
                chip.classList.add('chip-active');
                this.currentFilter = chip.dataset.filter;
                this.loadPosts();
            });
        });
    },

    // --- Load Posts ---
    loadPosts() {
        let posts = DataStore.getPosts();

        if (this.currentFilter !== 'all') {
            posts = posts.filter(p => p.post_type === this.currentFilter);
        }

        const feed = document.getElementById('postsFeed');
        if (posts.length === 0) {
            feed.innerHTML = `
                <div class="card" style="text-align:center; padding:40px;">
                    <div style="font-size:3rem; margin-bottom:12px;">📝</div>
                    <p style="color:var(--text-muted);">ยังไม่มีโพสต์ เริ่มเขียนอะไรสักอย่างเลย!</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = posts.map(post => this.renderPost(post)).join('');
        this.attachPostEvents();
    },

    renderPost(post) {
        const user = App.currentUser;
        const isLiked = post.liked_by && post.liked_by.includes(user?.id);
        const initial = post.user_name ? post.user_name.charAt(0).toUpperCase() : '?';
        const tagClass = post.post_type === 'homework' ? 'homework' : 'general';
        const tagLabel = post.post_type === 'homework' ? '📚 การบ้าน' : '💬 ทั่วไป';

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="avatar avatar-sm" style="background:${post.user_avatar_color || 'var(--gradient-primary)'}">
                        <span>${initial}</span>
                    </div>
                    <div class="post-user-info">
                        <h4>${this.escapeHtml(post.user_name)}</h4>
                        <div class="post-meta">
                            <span class="post-tag ${tagClass}">${tagLabel}</span>
                            <span>${App.timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                ${post.image_url ? `<div class="post-image"><img src="${post.image_url}" alt="post image"></div>` : ''}
                <div class="post-actions">
                    <button class="post-action-btn ${isLiked ? 'liked' : ''}" data-action="like" data-post-id="${post.id}">
                        <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" width="18" height="18">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="post-action-btn" data-action="comment" data-post-id="${post.id}">
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </button>
                </div>
                <div class="post-comments hidden" id="comments-${post.id}">
                    ${(post.comments || []).map(c => `
                        <div class="comment">
                            <div class="avatar avatar-sm" style="background:${c.avatar_color || 'var(--gradient-primary)'}; width:28px;height:28px;font-size:0.7rem;">
                                <span>${c.user_name ? c.user_name.charAt(0).toUpperCase() : '?'}</span>
                            </div>
                            <div class="comment-body">
                                <h5>${this.escapeHtml(c.user_name)}</h5>
                                <p>${this.escapeHtml(c.content)}</p>
                            </div>
                        </div>
                    `).join('')}
                    <div class="comment-input-row">
                        <input type="text" placeholder="เขียนคอมเมนต์..." data-comment-post-id="${post.id}">
                        <button data-submit-comment="${post.id}">ส่ง</button>
                    </div>
                </div>
            </div>
        `;
    },

    attachPostEvents() {
        // Like
        document.querySelectorAll('[data-action="like"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                this.toggleLike(postId);
            });
        });

        // Toggle comments
        document.querySelectorAll('[data-action="comment"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                const commentsEl = document.getElementById(`comments-${postId}`);
                commentsEl.classList.toggle('hidden');
            });
        });

        // Submit comment
        document.querySelectorAll('[data-submit-comment]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.submitComment;
                const input = document.querySelector(`[data-comment-post-id="${postId}"]`);
                const content = input.value.trim();
                if (!content) return;

                const user = App.currentUser;
                const post = DataStore.getPosts().find(p => p.id === postId);
                if (!post) return;

                if (!post.comments) post.comments = [];
                post.comments.push({
                    user_name: user.display_name,
                    avatar_color: user.avatar_color,
                    content: content,
                    created_at: new Date().toISOString()
                });
                DataStore.updatePost(postId, { comments: post.comments });
                input.value = '';
                this.loadPosts();
            });
        });
    },

    toggleLike(postId) {
        const post = DataStore.getPosts().find(p => p.id === postId);
        if (!post) return;
        const userId = App.currentUser.id;

        if (!post.liked_by) post.liked_by = [];

        if (post.liked_by.includes(userId)) {
            post.liked_by = post.liked_by.filter(id => id !== userId);
            post.likes = Math.max(0, (post.likes || 0) - 1);
        } else {
            post.liked_by.push(userId);
            post.likes = (post.likes || 0) + 1;
        }

        DataStore.updatePost(postId, { likes: post.likes, liked_by: post.liked_by });
        this.loadPosts();
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
