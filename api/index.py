from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json
import os

app = FastAPI()

# 解决跨域问题
app.add_middleware(
    CORSMiddleware,
    allow_origins=["\*"],
    allow_methods=["\*"],
    allow_headers=["\*"],
)

# 数据模型
class BlogPost(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    tags: list[str] = []

# 模拟数据库（实际项目可替换为真实数据库）
BLOG_POSTS = [
    BlogPost(
        id=1,
        title="我的第一篇博客",
        content="这是我的个人博客首篇文章，主要分享Python开发经验...",
        created_at=datetime(2025, 1, 15),
        tags=["Python", "编程"]
    ),
    BlogPost(
        id=2,
        title="Vercel部署指南",
        content="详细讲解如何将Python应用部署到Vercel平台...",
        created_at=datetime(2025, 2, 20),
        tags=["部署", "云服务"]
    )
]

@app.get("/posts")
async def get_posts():
    """获取所有博客文章"""
    return [post.dict() for post in BLOG_POSTS]

@app.get("/posts/{post_id}")
async def get_post(post_id: int):
    """根据ID获取单篇文章"""
    for post in BLOG_POSTS:
        if post.id == post_id:
            return post.dict()
    raise HTTPException(status_code=404, detail="文章未找到")

# Vercel要求导出app实例
handler = app
