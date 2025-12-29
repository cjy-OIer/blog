from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import aiomysql
import os
from dotenv import load_dotenv
import logging
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets


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
# 添加HTTP Basic认证
security = HTTPBasic()

# 博客发布请求模型
class BlogPostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str = "published"
    tag_names: List[str] = []  # 标签名称列表

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

# 认证依赖函数
async def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = os.getenv("ADMIN_USER", "admin")
    correct_password = os.getenv("ADMIN_PASSWORD", "password")
    
    if not (secrets.compare_digest(credentials.username, correct_username) and 
            secrets.compare_digest(credentials.password, correct_password)):
        raise HTTPException(
            status_code=401,
            detail="认证失败",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

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

async def create_blog_post(post_data: BlogPostCreate):
    """创建新博客文章"""
    async with (await get_db_connection()).acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                # 插入博客文章
                await cursor.execute(
                    """INSERT INTO blog_posts 
                    (title, content, excerpt, cover_image, status) 
                    VALUES (%s, %s, %s, %s, %s)""",
                    (post_data.title, post_data.content, post_data.excerpt, 
                     post_data.cover_image, post_data.status)
                )
                
                post_id = cursor.lastrowid
                
                # 处理标签
                if post_data.tag_names:
                    for tag_name in post_data.tag_names:
                        # 检查标签是否存在
                        await cursor.execute(
                            "SELECT id FROM tags WHERE name = %s", (tag_name,)
                        )
                        tag_result = await cursor.fetchone()
                        
                        if tag_result:
                            tag_id = tag_result
                        else:
                            # 创建新标签
                            slug = tag_name.lower().replace(' ', '-')
                            await cursor.execute(
                                "INSERT INTO tags (name, slug) VALUES (%s, %s)",
                                (tag_name, slug)
                            )
                            tag_id = cursor.lastrowid
                        
                        # 建立文章-标签关联
                        await cursor.execute(
                            "INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s)",
                            (post_id, tag_id)
                        )
                
                await conn.commit()
                return post_id
                
            except Exception as e:
                await conn.rollback()
                logger.error(f"创建博客文章失败: {e}")
                raise HTTPException(status_code=500, detail="创建文章失败")

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

# @app.post("/api/seed")
# async def create_post(
#     post: BlogPostCreate, 
#     username: str = Depends(authenticate)
# ):
#     """创建新博客文章（需要管理员认证）"""
#     try:
#         post_id = await create_blog_post(post)
#         return {
#             "status": "success", 
#             "message": "博客发布成功", 
#             "post_id": post_id
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"发布文章异常: {e}")
#         raise HTTPException(status_code=500, detail="服务器内部错误")

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
