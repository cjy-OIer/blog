document.addEventListener('DOMContentLoaded', async () => {
    const postContainer = document.querySelector('.post-detail');
    
    // 从URL获取文章ID
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        showError('文章ID未指定');
        return;
    }
    
    try {
        // 调用后端API获取单篇文章
        const response = await fetch(`/api/posts/${postId}`);
        
        if (response.status === 404) {
            showError('文章不存在或已被删除');
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const post = await response.json();
        
        // 渲染文章详情
        renderPost(post);
        
        // 更新页面标题
        document.title = `${post.title} - 我的个人博客`;
        
    } catch (error) {
        console.error('加载文章详情失败:', error);
        showError(`加载失败: ${error.message}`);
    }
});

function renderPost(post) {
    const postContainer = document.querySelector('.post-detail');
    
    postContainer.innerHTML = `
        <div class="post-header">
            <h1>${post.title}</h1>
            <div class="post-meta">
                <span>发布时间: ${new Date(post.created_at).toLocaleDateString('zh-CN')} ${new Date(post.created_at).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</span>
                <span>文章ID: ${post.id}</span>
            </div>
        </div>
        
        <div class="post-content">
            ${formatContent(post.content)}
        </div>
        
        <div class="post-footer">
            <div class="tag-list">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function formatContent(content) {
    // 将内容按段落分割并添加HTML标签
    return content
        .split('\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
}

function showError(message) {
    const postContainer = document.querySelector('.post-detail');
    postContainer.innerHTML = `
        <div class="error-message">
            <h3>${message}</h3>
            <p>请返回首页或稍后重试</p>
            <a href="/" class="back-button" style="display: inline-block; margin-top: 1rem;">返回首页</a>
        </div>
    `;
}
