// ===========================
// Videos Module — TikTok-style
// ===========================

const VideosModule = {
    init() {
        this.setupUpload();
        this.loadVideos();
    },

    refresh() {
        this.loadVideos();
    },

    // --- Upload ---
    setupUpload() {
        const uploadBtn = document.getElementById('btnUploadVideo');
        const uploadArea = document.getElementById('videoUploadArea');
        const fileInput = document.getElementById('videoFile');
        const previewArea = document.getElementById('videoPreviewArea');
        const videoPreview = document.getElementById('videoPreview');

        uploadBtn.addEventListener('click', () => {
            App.openModal('uploadVideoModal');
        });

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 50 * 1024 * 1024) {
                App.toast('ไฟล์ใหญ่เกินไป! (ไม่เกิน 50MB)', 'error');
                return;
            }

            const url = URL.createObjectURL(file);
            videoPreview.src = url;
            previewArea.classList.remove('hidden');
            uploadArea.style.display = 'none';
        });

        document.getElementById('uploadVideoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('videoTitle').value.trim();
            if (!title) return;

            const file = fileInput.files[0];
            let videoUrl = null;

            if (file) {
                videoUrl = URL.createObjectURL(file);
            }

            const user = App.currentUser;
            DataStore.addVideo({
                user_id: user.id,
                user_name: user.display_name,
                user_avatar_color: user.avatar_color,
                title: title,
                video_url: videoUrl,
                thumbnail_color: this.randomThumbnailColor()
            });

            // Reset form
            document.getElementById('videoTitle').value = '';
            fileInput.value = '';
            previewArea.classList.add('hidden');
            uploadArea.style.display = '';
            videoPreview.src = '';

            App.closeModal('uploadVideoModal');
            this.loadVideos();
            App.toast('อัปโหลดวิดีโอแล้ว! 🎬', 'success');
        });
    },

    randomThumbnailColor() {
        const colors = [
            'linear-gradient(135deg, #667eea, #764ba2)',
            'linear-gradient(135deg, #f093fb, #f5576c)',
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #43e97b, #38f9d7)',
            'linear-gradient(135deg, #ff8c42, #ff00e5)',
            'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // --- Load Videos ---
    loadVideos() {
        const videos = DataStore.getVideos();
        const feed = document.getElementById('videoFeed');

        if (videos.length === 0) {
            feed.innerHTML = `
                <div class="card" style="text-align:center; padding:40px; grid-column: 1/-1;">
                    <div style="font-size:3rem; margin-bottom:12px;">🎬</div>
                    <p style="color:var(--text-muted);">ยังไม่มีวิดีโอ อัปโหลดวิดีโอแรกเลย!</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = videos.map(video => this.renderVideo(video)).join('');
        this.attachVideoEvents();
    },

    renderVideo(video) {
        const initial = video.user_name ? video.user_name.charAt(0).toUpperCase() : '?';
        const isLiked = video.liked_by && video.liked_by.includes(App.currentUser?.id);

        let thumbnailContent;
        if (video.video_url) {
            thumbnailContent = `
                <video src="${video.video_url}" preload="metadata"></video>
                <div class="video-play-overlay" data-play-video="${video.id}">
                    <div class="play-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                    </div>
                </div>
            `;
        } else {
            thumbnailContent = `
                <div style="width:100%;height:100%;background:${video.thumbnail_color || 'var(--bg-tertiary)'};display:flex;align-items:center;justify-content:center;">
                    <div style="text-align:center;color:rgba(255,255,255,0.6);">
                        <svg viewBox="0 0 24 24" fill="none" width="40" height="40" style="margin-bottom:8px;">
                            <polygon points="5,3 19,12 5,21" stroke="currentColor" stroke-width="1.5" fill="rgba(255,255,255,0.1)"/>
                        </svg>
                        <div style="font-size:0.75rem;">ดูตัวอย่าง</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    ${thumbnailContent}
                </div>
                <div class="video-info">
                    <div class="video-author">
                        <div class="avatar avatar-sm" style="background:${video.user_avatar_color || 'var(--gradient-primary)'}; width:28px;height:28px;font-size:0.7rem;">
                            <span>${initial}</span>
                        </div>
                        <span>${this.escapeHtml(video.user_name)}</span>
                    </div>
                    <h4>${this.escapeHtml(video.title)}</h4>
                    <div class="video-meta">
                        <span class="video-stat">👁 ${video.views || 0} views</span>
                        <span class="video-stat">❤️ ${video.likes || 0}</span>
                        <span class="video-stat">${App.timeAgo(video.created_at)}</span>
                    </div>
                    <div class="video-actions">
                        <button class="video-action-btn ${isLiked ? 'liked' : ''}" data-like-video="${video.id}">
                            ❤️ ${video.likes || 0}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    attachVideoEvents() {
        // Like video
        document.querySelectorAll('[data-like-video]').forEach(btn => {
            btn.addEventListener('click', () => {
                const videoId = btn.dataset.likeVideo;
                this.toggleLike(videoId);
            });
        });

        // Play video
        document.querySelectorAll('[data-play-video]').forEach(overlay => {
            overlay.addEventListener('click', () => {
                const videoCard = overlay.closest('.video-card');
                const video = videoCard.querySelector('video');
                if (video) {
                    if (video.paused) {
                        video.play();
                        overlay.style.opacity = '0';
                    } else {
                        video.pause();
                        overlay.style.opacity = '1';
                    }
                }
            });
        });
    },

    toggleLike(videoId) {
        const video = DataStore.getVideos().find(v => v.id === videoId);
        if (!video) return;
        const userId = App.currentUser.id;

        if (!video.liked_by) video.liked_by = [];

        if (video.liked_by.includes(userId)) {
            video.liked_by = video.liked_by.filter(id => id !== userId);
            video.likes = Math.max(0, (video.likes || 0) - 1);
        } else {
            video.liked_by.push(userId);
            video.likes = (video.likes || 0) + 1;
        }

        DataStore.updateVideo(videoId, { likes: video.likes, liked_by: video.liked_by });
        this.loadVideos();
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
