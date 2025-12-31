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
            musicPlayer.play().catch(e => {
                console.log('音频播放失败:', e);
                showMessage('音乐播放失败，请检查浏览器设置', 'error');
            });
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
    memorialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const message = document.getElementById('message').value;
        
        if (!name.trim() || !message.trim()) {
            showMessage('请填写完整信息', 'error');
            return;
        }
        
        // 创建新的留言卡片
        const messagesContainer = document.querySelector('.messages-container');
        const newMessage = document.createElement('div');
        newMessage.className = 'message-card';
        newMessage.innerHTML = `
            <div class="message-header">
                <i class="fas fa-user-circle"></i>
                <div>
                    <h4>${escapeHtml(name)}</h4>
                    <span class="message-date">${new Date().toLocaleDateString('zh-CN')}</span>
                </div>
            </div>
            <p class="message-content">${escapeHtml(message)}</p>
        `;
        
        // 添加到顶部
        messagesContainer.insertBefore(newMessage, messagesContainer.firstChild);
        
        // 显示成功消息
        showMessage('留言已敬献，感谢您的思念', 'success');
        
        // 清空表单
        memorialForm.reset();
        
        // 添加动画效果
        newMessage.style.opacity = '0';
        newMessage.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            newMessage.style.transition = 'all 0.5s ease';
            newMessage.style.opacity = '1';
            newMessage.style.transform = 'translateY(0)';
        }, 10);
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