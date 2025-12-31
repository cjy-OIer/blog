from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import aiomysql
import os
from dotenv import load_dotenv
import logging

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="个人博客API", version="1.0.0")

# 解决跨域问题
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class Tag(BaseModel):
    id: int
    name: str
    slug: str

class BlogPost(BaseModel):
    id: int
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str = "published"
    view_count: int = 0
    created_at: datetime
    updated_at: datetime
    tags: List[Tag] = []

# 纪念留言数据模型
class MemorialMessage(BaseModel):
    id: int
    author_name: str
    message_content: str
    created_at: datetime
    status: str = "approved"
    is_private: bool = False

class CreateMessageRequest(BaseModel):
    author_name: str
    message_content: str
    is_private: Optional[bool] = False

# 数据库连接池
pool = None

# 【请在此处填写你的MySQL数据库连接信息】
# 将以下值替换为你的实际数据库信息
DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),  # 数据库主机地址
    "port": int(os.getenv("MYSQL_PORT", 3306)),     # 数据库端口，默认3306
    "user": os.getenv("MYSQL_USER", "root"),       # 数据库用户名
    "password": os.getenv("MYSQL_PASSWORD", ""),   # 数据库密码
    "db": os.getenv("MYSQL_DATABASE", "blog_db"),  # 数据库名称
    "minsize": int(os.getenv("MYSQL_POOL_MIN", 1)), # 连接池最小连接数
    "maxsize": int(os.getenv("MYSQL_POOL_MAX", 10)),# 连接池最大连接数
    "autocommit": True,
    "charset": "utf8mb4"
}

async def get_db_connection():
    """获取数据库连接"""
    global pool
    if pool is None:
        try:
            pool = await aiomysql.create_pool(**DB_CONFIG)
            logger.info("MySQL连接池创建成功")
        except Exception as e:
            logger.error(f"创建MySQL连接池失败: {e}")
            raise
    return pool

async def close_db_connection():
    """关闭数据库连接池"""
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()
        logger.info("MySQL连接池已关闭")

# 添加启动和关闭事件
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库连接"""
    await get_db_connection()

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理数据库连接"""
    await close_db_connection()

# 数据库操作函数
async def fetch_all_posts(include_draft: bool = False):
    """获取所有文章（支持筛选状态）"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 构建查询条件
            status_condition = "" if include_draft else "WHERE p.status = 'published'"
            
            query = f"""
                SELECT 
                    p.id, p.title, p.content, p.excerpt, 
                    p.cover_image, p.status, p.view_count,
                    p.created_at, p.updated_at,
                    GROUP_CONCAT(DISTINCT t.name) as tag_names
                FROM blog_posts p
                LEFT JOIN post_tags pt ON p.id = pt.post_id
                LEFT JOIN tags t ON pt.tag_id = t.id
                {status_condition}
                GROUP BY p.id
                ORDER BY p.created_at DESC
            """
            
            await cursor.execute(query)
            posts = await cursor.fetchall()
            
            # 格式化标签数据
            formatted_posts = []
            for post in posts:
                tag_list = []
                if post['tag_names']:
                    tag_list = [{"name": tag.strip()} for tag in post['tag_names'].split(',')]
                
                formatted_posts.append({
                    **post,
                    "tags": tag_list
                })
            
            return formatted_posts

async def fetch_post_by_id(post_id: int):
    """根据ID获取单篇文章"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 先更新阅读次数
            await cursor.execute(
                "UPDATE blog_posts SET view_count = view_count + 1 WHERE id = %s",
                (post_id,)
            )
            
            # 查询文章详情
            query = """
                SELECT 
                    p.id, p.title, p.content, p.excerpt, 
                    p.cover_image, p.status, p.view_count,
                    p.created_at, p.updated_at,
                    GROUP_CONCAT(DISTINCT t.id) as tag_ids,
                    GROUP_CONCAT(DISTINCT t.name) as tag_names,
                    GROUP_CONCAT(DISTINCT t.slug) as tag_slugs
                FROM blog_posts p
                LEFT JOIN post_tags pt ON p.id = pt.post_id
                LEFT JOIN tags t ON pt.tag_id = t.id
                WHERE p.id = %s
                GROUP BY p.id
            """
            
            await cursor.execute(query, (post_id,))
            post = await cursor.fetchone()
            
            if not post:
                return None
            
            # 格式化标签数据
            tags = []
            if post['tag_ids'] and post['tag_names'] and post['tag_slugs']:
                tag_ids = post['tag_ids'].split(',')
                tag_names = post['tag_names'].split(',')
                tag_slugs = post['tag_slugs'].split(',')
                
                tags = [
                    {"id": int(tag_ids[i]), "name": tag_names[i], "slug": tag_slugs[i]}
                    for i in range(len(tag_ids))
                ]
            
            return {
                "id": post['id'],
                "title": post['title'],
                "content": post['content'],
                "excerpt": post['excerpt'],
                "cover_image": post['cover_image'],
                "status": post['status'],
                "view_count": post['view_count'],
                "created_at": post['created_at'],
                "updated_at": post['updated_at'],
                "tags": tags
            }

# 【请确保你的MySQL数据库连接信息已正确配置】
# 接在之前配置的 DB_CONFIG 部分之后

async def fetch_all_messages(include_private: bool = False):
    """获取所有纪念留言"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 构建查询条件
            where_clause = "WHERE status = 'approved'"
            if not include_private:
                where_clause += " AND is_private = FALSE"
            
            query = f"""
                SELECT id, author_name, message_content, 
                       created_at, status, is_private
                FROM memorial_messages
                {where_clause}
                ORDER BY created_at DESC
            """
            
            await cursor.execute(query)
            messages = await cursor.fetchall()
            
            # 格式化日期
            for message in messages:
                if isinstance(message['created_at'], str):
                    message['created_at'] = datetime.fromisoformat(message['created_at'].replace('Z', '+00:00'))
            
            return messages

async def create_message(message_data: CreateMessageRequest, client_ip: Optional[str] = None):
    """创建新的纪念留言"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor() as cursor:
            query = """
                INSERT INTO memorial_messages 
                (author_name, message_content, author_ip, is_private)
                VALUES (%s, %s, %s, %s)
            """
            
            values = (
                message_data.author_name,
                message_data.message_content,
                client_ip,
                message_data.is_private
            )
            
            await cursor.execute(query, values)
            await conn.commit()
            
            # 获取刚插入的留言ID
            message_id = cursor.lastrowid
            
            # 返回完整的留言信息
            await cursor.execute("""
                SELECT id, author_name, message_content, 
                       created_at, status, is_private
                FROM memorial_messages
                WHERE id = %s
            """, (message_id,))
            
            result = await cursor.fetchone()
            return dict(result) if result else None

async def get_message_stats():
    """获取留言统计信息"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("""
                SELECT 
                    COUNT(*) as total_messages,
                    COUNT(CASE WHEN is_private = TRUE THEN 1 END) as private_messages,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_messages,
                    DATE(created_at) as date,
                    COUNT(*) as daily_count
                FROM memorial_messages
                WHERE status = 'approved'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
            """)
            
            return await cursor.fetchall()

async def search_posts(keyword: str = None, tag: str = None):
    """搜索文章（按关键词或标签）"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            conditions = ["p.status = 'published'"]
            params = []
            
            if keyword:
                conditions.append("(p.title LIKE %s OR p.content LIKE %s)")
                params.extend([f"%{keyword}%", f"%{keyword}%"])
            
            if tag:
                conditions.append("t.name = %s")
                params.append(tag)
            
            where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
            
            query = f"""
                SELECT DISTINCT
                    p.id, p.title, p.content, p.excerpt, 
                    p.cover_image, p.status, p.view_count,
                    p.created_at, p.updated_at
                FROM blog_posts p
                LEFT JOIN post_tags pt ON p.id = pt.post_id
                LEFT JOIN tags t ON pt.tag_id = t.id
                {where_clause}
                ORDER BY p.created_at DESC
            """
            
            await cursor.execute(query, params)
            return await cursor.fetchall()

# API路由
@app.get("/api/posts")
async def get_posts(include_draft: bool = False):
    """获取所有博客文章"""
    try:
        posts = await fetch_all_posts(include_draft)
        return posts
    except Exception as e:
        logger.error(f"获取文章列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取文章列表失败")

@app.get("/api/posts/{post_id}")
async def get_post(post_id: int):
    """根据ID获取单篇文章"""
    try:
        post = await fetch_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="文章未找到")
        return post
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文章详情失败: {e}")
        raise HTTPException(status_code=500, detail="获取文章详情失败")

@app.get("/api/posts/search")
async def search_posts_api(
    keyword: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """搜索文章API"""
    try:
        posts = await search_posts(keyword, tag)
        return {
            "total": len(posts),
            "limit": limit,
            "offset": offset,
            "posts": posts[offset:offset + limit]
        }
    except Exception as e:
        logger.error(f"搜索文章失败: {e}")
        raise HTTPException(status_code=500, detail="搜索文章失败")

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    try:
        async with (await get_db_connection()).acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT 1")
                await cursor.fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"数据库连接检查失败: {e}")
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# 纪念留言API
@app.get("/api/memorial/messages")
async def get_messages(
    include_private: bool = False,
    limit: int = 50,
    offset: int = 0
):
    """获取纪念留言列表"""
    try:
        messages = await fetch_all_messages(include_private)
        
        # 实现简单的分页
        total = len(messages)
        paginated_messages = messages[offset:offset + limit]
        
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "messages": paginated_messages
        }
    except Exception as e:
        logger.error(f"获取留言列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取留言列表失败")

@app.post("/api/memorial/messages")
async def create_new_message(
    message: CreateMessageRequest,
    request: Request
):
    """创建新的纪念留言"""
    try:
        # 获取客户端IP地址
        client_ip = request.client.host if request.client else None
        
        # 简单的防刷逻辑（同一IP1分钟内只能提交一次）
        if client_ip:
            async with (await get_db_connection()).acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT COUNT(*) as count 
                        FROM memorial_messages 
                        WHERE author_ip = %s 
                        AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
                    """, (client_ip,))
                    
                    result = await cursor.fetchone()
                    if result and result['count'] > 3:
                        raise HTTPException(
                            status_code=429, 
                            detail="提交过于频繁，请稍后再试"
                        )
        
        # 创建留言
        new_message = await create_message(message, client_ip)
        
        if not new_message:
            raise HTTPException(status_code=500, detail="创建留言失败")
        
        # 记录日志
        logger.info(f"新的纪念留言已创建 - 作者: {message.author_name}")
        
        return {
            "message": "留言提交成功",
            "data": new_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建留言失败: {e}")
        raise HTTPException(status_code=500, detail="创建留言失败")

@app.get("/api/memorial/stats")
async def get_memorial_stats():
    """获取纪念堂统计信息"""
    try:
        stats = await get_message_stats()
        total = sum(day['daily_count'] for day in stats) if stats else 0
        
        return {
            "total_messages": total,
            "recent_stats": stats,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        return {
            "total_messages": 0,
            "recent_stats": [],
            "last_updated": datetime.now().isoformat()
        }

# 管理员API（可选，如果需要审核功能）
@app.put("/api/memorial/messages/{message_id}/status")
async def update_message_status(
    message_id: int,
    status: str,
    authorization: Optional[str] = Header(None)
):
    """更新留言状态（需要管理员权限）"""
    # 这里可以添加管理员验证逻辑
    if status not in ['pending', 'approved', 'rejected']:
        raise HTTPException(status_code=400, detail="状态值无效")
    
    try:
        async with (await get_db_connection()).acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    UPDATE memorial_messages 
                    SET status = %s 
                    WHERE id = %s
                """, (status, message_id))
                
                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="留言未找到")
                
                await conn.commit()
                
        return {"message": "状态更新成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新留言状态失败: {e}")
        raise HTTPException(status_code=500, detail="更新留言状态失败")

# # 测试数据插入端点（仅用于开发环境）
# @app.post("/api/dev/seed")
# async def seed_test_data():
#     """插入测试数据（仅开发环境使用）"""
#     # 在实际生产环境中应该移除或保护此端点
#     try:
#         async with (await get_db_connection()).acquire() as conn:
#             async with conn.cursor() as cursor:
#                 # 清空现有数据
#                 await cursor.execute("DELETE FROM post_tags")
#                 await cursor.execute("DELETE FROM tags")
#                 await cursor.execute("DELETE FROM blog_posts")
                
#                 # 插入测试标签
#                 await cursor.execute("""
#                     INSERT INTO tags (name, slug) VALUES
#                     ('Python', 'python'),
#                     ('编程', 'programming'),
#                     ('部署', 'deployment'),
#                     ('云服务', 'cloud-service')
#                 """)
                
#                 # 插入测试文章
#                 await cursor.execute("""
#                     INSERT INTO blog_posts (title, content, excerpt) VALUES
#                     (%s, %s, %s),
#                     (%s, %s, %s)
#                 """, (
#                     "我的第一篇博客",
#                     "这是我的个人博客首篇文章，主要分享Python开发经验...\n\nPython是一种广泛使用的高级编程语言。",
#                     "分享Python开发经验",
#                     "Vercel部署指南",
#                     "详细讲解如何将Python应用部署到Vercel平台...\n\nVercel是一个现代的云平台。",
#                     "Python应用部署指南"
#                 ))
                
#                 # 建立文章-标签关联
#                 await cursor.execute("""
#                     INSERT INTO post_tags (post_id, tag_id) VALUES
#                     (1, 1), (1, 2),
#                     (2, 1), (2, 3), (2, 4)
#                 """)
                
#                 await conn.commit()
                
#         return {"message": "测试数据插入成功", "post_count": 2, "tag_count": 4}
#     except Exception as e:
#         logger.error(f"插入测试数据失败: {e}")
#         raise HTTPException(status_code=500, detail=f"插入测试数据失败: {e}")

# 根路径
@app.get("/")
async def root():
    return {"message": "博客API服务运行正常", "docs": "/docs", "health": "/api/health"}
