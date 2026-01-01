// 灵堂页面交互脚本
document.addEventListener('DOMContentLoaded', function() {
    // 元素获取
    const lightCandleBtn = document.getElementById('lightCandle');
    const playMusicBtn = document.getElementById('playMusic');
    const momentSilenceBtn = document.getElementById('momentSilence');
    const memorialForm = document.getElementById('memorialForm');
    const musicPlayer = document.getElementById('memorialMusic');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const virtualCandles = document.getElementById('virtualCandles');
    
    // 蜡烛点亮计数器
    let candleCount = 0;
    const maxCandles = 10;
    
    // 点亮蜡烛功能
    lightCandleBtn.addEventListener('click', function() {
        if (candleCount >= maxCandles) {
            alert('已达到最大蜡烛数量（10支）。感谢您的虔诚。');
            return;
        }
        
        // 创建新蜡烛
        const candle = document.createElement('div');
        candle.className = 'virtual-candle';
        candle.innerHTML = '<div class="virtual-flame"></div>';
        
        // 随机位置
        const x = Math.random() * 80 + 10; // 10%到90%
        const y = Math.random() * 60 + 20; // 20%到80%
        
        candle.style.left = `${x}%`;
        candle.style.top = `${y}%`;
        
        virtualCandles.appendChild(candle);
        candleCount++;
        
        // 显示提示
        showMessage(`已点亮 ${candleCount} 支蜡烛`, 'success');
        
        // 5秒后淡出
        setTimeout(() => {
            candle.style.opacity = '0.5';
        }, 5000);
    });
    
    // 音乐控制功能
    let isPlaying = false;
    let isMuted = false;
    
    playMusicBtn.addEventListener('click', function() {
        if (!isPlaying) {
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            showMessage('安魂曲播放中...', 'success');
        } else {
            musicPlayer.pause();
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // 播放/暂停按钮
    playPauseBtn.addEventListener('click', function() {
        playMusicBtn.click();
    });
    
    // 音量控制
    volumeBtn.addEventListener('click', function() {
        isMuted = !isMuted;
        musicPlayer.muted = isMuted;
        volumeBtn.innerHTML = isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    });
    
    // 默哀功能
    momentSilenceBtn.addEventListener('click', function() {
        // 暂停音乐
        if (isPlaying) {
            musicPlayer.pause();
            const wasPlaying = true;
            
            // 显示默哀提示
            showMessage('正在默哀... 请保持安静', 'info');
            momentSilenceBtn.disabled = true;
            momentSilenceBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> 默哀中...';
            
            // 30秒后恢复
            setTimeout(() => {
                showMessage('默哀结束，感谢您的敬意', 'success');
                momentSilenceBtn.disabled = false;
                momentSilenceBtn.innerHTML = '<i class="fas fa-hand-peace"></i> 默哀片刻';
                
                if (wasPlaying) {
                    musicPlayer.play();
                }
            }, 30000);
        } else {
            showMessage('请保持30秒的静默...', 'info');
            
            setTimeout(() => {
                showMessage('默哀结束，感谢您的敬意', 'success');
            }, 30000);
        }
    });
    
    // 留言表单提交
    // memorialForm.addEventListener('submit', function(e) {
    //     e.preventDefault();
        
    //     const name = document.getElementById('name').value;
    //     const message = document.getElementById('message').value;
        
    //     if (!name.trim() || !message.trim()) {
    //         showMessage('请填写完整信息', 'error');
    //         return;
    //     }
        
    //     // 创建新的留言卡片
    //     const messagesContainer = document.querySelector('.messages-container');
    //     const newMessage = document.createElement('div');
    //     newMessage.className = 'message-card';
    //     newMessage.innerHTML = `
    //         <div class="message-header">
    //             <i class="fas fa-user-circle"></i>
    //             <div>
    //                 <h4>${escapeHtml(name)}</h4>
    //                 <span class="message-date">${new Date().toLocaleDateString('zh-CN')}</span>
    //             </div>
    //         </div>
    //         <p class="message-content">${escapeHtml(message)}</p>
    //     `;
        
    //     // 添加到顶部
    //     messagesContainer.insertBefore(newMessage, messagesContainer.firstChild);
        
    //     // 显示成功消息
    //     showMessage('留言已敬献，感谢您的思念', 'success');
        
    //     // 清空表单
    //     memorialForm.reset();
        
    //     // 添加动画效果
    //     newMessage.style.opacity = '0';
    //     newMessage.style.transform = 'translateY(-20px)';
        
    //     setTimeout(() => {
    //         newMessage.style.transition = 'all 0.5s ease';
    //         newMessage.style.opacity = '1';
    //         newMessage.style.transform = 'translateY(0)';
    //     }, 10);
    });
    
    // 创建花瓣飘落效果
    function createPetals() {
        const petalsContainer = document.querySelector('.petals-container');
        const petalCount = 15;
        
        for (let i = 0; i < petalCount; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.innerHTML = '❀';
            
            // 随机属性
            const size = Math.random() * 20 + 10;
            const startX = Math.random() * 100;
            const duration = Math.random() * 10 + 10;
            const delay = Math.random() * 5;
            
            petal.style.fontSize = `${size}px`;
            petal.style.left = `${startX}%`;
            petal.style.animationDuration = `${duration}s`;
            petal.style.animationDelay = `${delay}s`;
            petal.style.opacity = Math.random() * 0.5 + 0.3;
            
            petalsContainer.appendChild(petal);
        }
    }
    
    // 显示消息提示
    function showMessage(text, type) {
        // 移除现有的消息
        const existingMsg = document.querySelector('.memorial-message-toast');
        if (existingMsg) existingMsg.remove();
        
        // 创建新消息
        const message = document.createElement('div');
        message.className = `memorial-message-toast ${type}`;
        message.textContent = text;
        
        // 添加到页面
        document.body.appendChild(message);
        
        // 3秒后移除
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }
    
    // HTML转义，防止XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 添加花瓣飘落样式
    const style = document.createElement('style');
    style.textContent = `
        .memorial-message-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            z-index: 2000;
            animation: toastSlideIn 0.3s ease;
            max-width: 300px;
        }
        
        .memorial-message-toast.success {
            background: rgba(34, 139, 34, 0.9);
            border: 1px solid rgba(0, 100, 0, 0.5);
        }
        
        .memorial-message-toast.error {
            background: rgba(139, 0, 0, 0.9);
            border: 1px solid rgba(100, 0, 0, 0.5);
        }
        
        .memorial-message-toast.info {
            background: rgba(30, 60, 114, 0.9);
            border: 1px solid rgba(20, 40, 80, 0.5);
        }
        
        @keyframes toastSlideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .petals-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: -1;
        }
        
        .petal {
            position: absolute;
            top: -50px;
            color: rgba(255, 240, 245, 0.7);
            animation: fall linear infinite;
            user-select: none;
        }
        
        @keyframes fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        .virtual-candle {
            position: absolute;
            width: 20px;
            height: 60px;
            background: linear-gradient(to bottom, #8B4513, #D2691E, #F4A460);
            border-radius: 10px;
            z-index: 999;
        }
        
        .virtual-flame {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 15px;
            height: 30px;
            background: linear-gradient(to bottom, #FFD700, #FF8C00, #FF4500);
            border-radius: 50% 50% 20% 20%;
            animation: flame-flicker 1.5s infinite ease-in-out;
            filter: blur(1px);
        }
    `;
    document.head.appendChild(style);
    
    // 初始化花瓣效果
    createPetals();
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // 添加页面卸载前的提示
    window.addEventListener('beforeunload', function() {
        if (candleCount > 0) {
            return '您点亮的蜡烛将不会被保存。确定要离开吗？';
        }
    });
});

// 照片查看功能
function viewPhoto(type, index = 0) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.id = 'photoModal';
    
    let imgSrc = '';
    let title = '';
    let description = '';
    
    if (type === 'main') {
        const mainPhoto = document.getElementById('mainMemorialPhoto');
        imgSrc = mainPhoto.src || '';
        title = '永恒的回忆';
        description = '主纪念照片';
    } else {
        const photos = document.querySelectorAll('.wall-img');
        if (photos[index]) {
            const photo = photos[index];
            imgSrc = photo.dataset.large || photo.src || '';
            title = photo.dataset.title || '纪念照片';
            description = photo.dataset.desc || '';
        }
    }
    
    // 如果有实际图片链接才显示图片，否则显示提示
    const imgContent = imgSrc ? 
        `<img src="${imgSrc}" alt="${title}" class="modal-img">` :
        `<div class="no-photo-placeholder">
            <i class="fas fa-camera-slash"></i>
            <p>请先添加照片链接</p>
        </div>`;
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
            
            ${imgContent}
            
            <div class="modal-info">
                <h3>${title}</h3>
                <p>${description}</p>
                <p class="modal-date">
                    <i class="far fa-calendar-alt"></i>
                    拍摄时间：${imgSrc ? '待填写' : '请先添加照片'}
                </p>
            </div>
            
            <button class="modal-nav modal-prev" onclick="navigatePhoto(-1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="modal-nav modal-next" onclick="navigatePhoto(1)">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
    
    // 存储当前查看信息
    modal.dataset.currentType = type;
    modal.dataset.currentIndex = index;
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
}

function navigatePhoto(direction) {
    const modal = document.getElementById('photoModal');
    if (!modal) return;
    
    const currentType = modal.dataset.currentType;
    const currentIndex = parseInt(modal.dataset.currentIndex);
    
    if (currentType === 'wall') {
        const photos = document.querySelectorAll('.wall-img');
        const newIndex = (currentIndex + direction + photos.length) % photos.length;
        closeModal();
        setTimeout(() => viewPhoto('wall', newIndex), 50);
    }
}

// 为照片墙图片添加点击事件
document.addEventListener('DOMContentLoaded', function() {
    const wallPhotos = document.querySelectorAll('.wall-img');
    wallPhotos.forEach((photo, index) => {
        photo.addEventListener('click', () => viewPhoto('wall', index));
        
        // 添加键盘快捷键
        photo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                viewPhoto('wall', index);
            }
        });
        
        // 为可访问性添加tabindex
        photo.setAttribute('tabindex', '0');
    });
    
    // 添加模态框样式
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .no-photo-placeholder {
            width: 500px;
            height: 300px;
            background: rgba(40, 30, 20, 0.9);
            border: 2px dashed #8B4513;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #b0a8a8;
            text-align: center;
            padding: 2rem;
        }
        
        .no-photo-placeholder i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #8B4513;
        }
        
        @keyframes modalFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        .photo-modal {
            animation: modalFadeIn 0.3s ease;
        }
    `;
    document.head.appendChild(modalStyle);
    
    // 添加ESC键关闭功能
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // 点击模态框背景关闭
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('photoModal');
        if (modal && e.target === modal) {
            closeModal();
        }
    });
});

// 纪念留言功能
class MemorialMessages {
    constructor() {
        this.apiBase = '/api/memorial';
        this.messagesContainer = document.querySelector('.messages-container');
        this.messageForm = document.getElementById('memorialForm');
        this.init();
    }
    
    async init() {
        await this.loadMessages();
        this.setupEventListeners();
        this.updateMessageStats();
    }
    
    async loadMessages() {
        try {
            const response = await fetch(`${this.apiBase}/messages?limit=20`);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const data = await response.json();
            this.renderMessages(data.messages);
            
        } catch (error) {
            console.error('加载留言失败:', error);
            this.showErrorMessage('留言加载失败，请稍后刷新重试');
        }
    }
    
    renderMessages(messages) {
        if (!this.messagesContainer) return;
        
        if (messages.length === 0) {
            this.messagesContainer.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-comment-slash"></i>
                    <p>暂无留言，成为第一个留言者吧</p>
                </div>
            `;
            return;
        }
        
        this.messagesContainer.innerHTML = messages.map(msg => `
            <div class="message-card" data-message-id="${msg.id}">
                <div class="message-header">
                    <i class="fas fa-user-circle"></i>
                    <div>
                        <h4>${this.escapeHtml(msg.author_name)}</h4>
                        <span class="message-date">
                            ${this.formatDate(msg.created_at)}
                            // ${msg.is_private ? '<i class="fas fa-lock private-icon" title="私密留言"></i>' : ''}
                        </span>
                    </div>
                </div>
                <p class="message-content">${this.escapeHtml(msg.message_content)}</p>
                <div class="message-footer">
                    <span class="message-id">#${msg.id}</span>
                    ${msg.status === 'pending' ? 
                        '<span class="pending-badge"><i class="fas fa-clock"></i> 审核中</span>' : ''}
                </div>
            </div>
        `).join('');
    }
    
    async submitMessage(event) {
        event.preventDefault();
        
        const nameInput = document.getElementById('name');
        const messageInput = document.getElementById('message');
        // const isPrivateCheckbox = document.getElementById('isPrivate');
        
        const messageData = {
            author_name: nameInput.value.trim(),
            message_content: messageInput.value.trim(),
            // is_private: isPrivateCheckbox ? isPrivateCheckbox.checked : false
        };
        
        // 验证
        if (!messageData.author_name || !messageData.message_content) {
            this.showMessage('请填写完整信息', 'error');
            return;
        }
        
        if (messageData.author_name.length > 100) {
            this.showMessage('姓名不能超过100个字符', 'error');
            return;
        }
        
        // 显示加载状态
        const submitBtn = this.messageForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${this.apiBase}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || '提交失败');
            }
            
            // 清空表单
            this.messageForm.reset();
            
            // 显示成功消息
            this.showMessage('留言提交成功！感谢您的纪念', 'success');
            
            // 重新加载留言列表
            await this.loadMessages();
            await this.updateMessageStats();
            
            // 滚动到最新的留言
            this.scrollToNewMessage();
            
        } catch (error) {
            console.error('提交留言失败:', error);
            this.showMessage(`提交失败: ${error.message}`, 'error');
            
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async updateMessageStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            const stats = await response.json();
            
            // 可以在这里更新页面上的统计信息
            const statsElement = document.getElementById('messageStats');
            if (statsElement) {
                statsElement.innerHTML = `
                    <span><i class="fas fa-comments"></i> 共 ${stats.total_messages} 条留言</span>
                    <span><i class="fas fa-history"></i> 最近更新: ${new Date(stats.last_updated).toLocaleDateString()}</span>
                `;
            }
            
        } catch (error) {
            console.error('更新统计信息失败:', error);
        }
    }
    
    scrollToNewMessage() {
        const messages = this.messagesContainer.querySelectorAll('.message-card');
        if (messages.length > 0) {
            messages[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    setupEventListeners() {
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => this.submitMessage(e));
        }
        
        // 添加定期刷新
        setInterval(() => this.loadMessages(), 60000); // 每60秒刷新一次
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showMessage(text, type) {
        // 使用你现有的 showMessage 函数或创建一个新的
        const messageDiv = document.createElement('div');
        messageDiv.className = `memorial-message-toast ${type}`;
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            z-index: 2000;
            animation: slideIn 0.3s ease;
            color: white;
            ${type === 'success' ? 'background: rgba(34, 139, 34, 0.9);' : 
              type === 'error' ? 'background: rgba(139, 0, 0, 0.9);' : 
              'background: rgba(30, 60, 114, 0.9);'}
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.3s';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
    
    showErrorMessage(text) {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>加载失败</h3>
                    <p>${text}</p>
                    <button onclick="location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> 重新加载
                    </button>
                </div>
            `;
        }
    }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化留言系统
    const memorialMessages = new MemorialMessages();
    
    // 添加到全局，方便调试
    window.memorialMessages = memorialMessages;
    
    // // 添加私密留言选项到表单
    // const messageForm = document.getElementById('memorialForm');
    // if (messageForm) {
    //     const isPrivateDiv = document.createElement('div');
    //     isPrivateDiv.className = 'form-group private-option';
    //     isPrivateDiv.innerHTML = `
    //         <label>
    //             <input type="checkbox" id="isPrivate" name="isPrivate">
    //             <i class="fas fa-lock"></i> 设为私密留言（仅自己可见）
    //         </label>
    //     `;
        
    //     const submitBtn = messageForm.querySelector('.submit-btn');
    //     if (submitBtn) {
    //         messageForm.insertBefore(isPrivateDiv, submitBtn);
    //     }
    // }
    
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .no-messages {
            text-align: center;
            padding: 3rem;
            color: #b0a8a8;
        }
        
        .no-messages i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #8B4513;
        }
        
        .message-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            padding-top: 0.5rem;
            border-top: 1px solid rgba(139, 0, 0, 0.1);
            font-size: 0.8rem;
            color: #8a7f7f;
        }
        
        .message-id {
            font-family: monospace;
        }
        
        .private-icon {
            margin-left: 0.5rem;
            color: #D2691E;
            font-size: 0.8rem;
        }
        
        .pending-badge {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            font-size: 0.75rem;
        }
        
        .private-option {
            margin-bottom: 1rem;
            color: #b0a8a8;
        }
        
        .private-option label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
        }
        
        .private-option input[type="checkbox"] {
            margin-right: 0.5rem;
        }
        
        .error-message {
            text-align: center;
            padding: 2rem;
            background: rgba(139, 0, 0, 0.1);
            border: 1px solid rgba(139, 0, 0, 0.3);
            border-radius: 6px;
        }
        
        .error-message i {
            font-size: 2rem;
            color: rgba(139, 0, 0, 0.5);
            margin-bottom: 1rem;
        }
        
        .retry-btn {
            background: rgba(139, 0, 0, 0.7);
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});