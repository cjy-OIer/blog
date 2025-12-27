document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.getElementById('posts-list');
    
    try {
        // 调用后端API获取文章数据
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        const posts = await response.json();
        
        // 渲染文章列表，添加点击跳转
        postsContainer.innerHTML = posts.map(post => `
            <article class="post-card" data-post-id="${post.id}">
                <div class="post-content">
                    <h3><a href="/post.html?id=${post.id}" class="post-link">${post.title}</a></h3>
                    <p>${post.content.substring(0, 120)}...</p>
                    <div class="post-meta">
                        <span>发布于 ${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                        <span>${post.tags.length} 个标签</span>
                    </div>
                    <div class="tag-list">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </article>
        `).join('');
        
        // 添加卡片悬停效果
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 防止链接点击被阻止
                if (!e.target.closest('.post-link')) {
                    const postId = card.dataset.postId;
                    window.location.href = `/post.html?id=${postId}`;
                }
            });
            
            // 添加点击光标样式
            card.style.cursor = 'pointer';
        });
        
    } catch (error) {
        console.error('加载文章失败:', error);
        postsContainer.innerHTML = `
            <div class="error-message">
                <h3>文章加载失败</h3>
                <p>请稍后刷新重试或检查网络连接</p>
                <p><small>错误信息: ${error.message}</small></p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    刷新页面
                </button>
            </div>
        `;
    }
});

// 添加文章链接的样式
const style = document.createElement('style');
style.textContent = `
    .post-link {
        color: var(--dark);
        text-decoration: none;
        transition: color 0.2s;
    }
    .post-link:hover {
        color: var(--primary);
    }
`;
document.head.appendChild(style);
