document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.getElementById('posts-list');
    
    try {
        // 调用后端API获取文章数据
        const response = await fetch('/api/posts');
        const posts = await response.json();
        
        // 渲染文章列表
        postsContainer.innerHTML = posts.map(post => `
            <article class="post-card">
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <p>${post.content.substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span>${new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="tag-list">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('加载文章失败:', error);
        postsContainer.innerHTML = `
            <div class="error">
                <p>文章加载失败，请稍后刷新重试</p>
            </div>
        `;
    }
});
