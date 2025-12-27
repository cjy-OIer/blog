from flask import Flask, render_template

app = Flask(__name__)

# 模拟数据库中的博客文章数据
blog_posts = [
    {
        'id': 1,
        'title': 'Python Web开发入门',
        'content': 'Flask是一个轻量级的Python Web框架，非常适合快速开发...',
        'author': '张三',
        'date': '2023-10-15',
        'category': '编程',
        'tags': ['Python', 'Flask', 'Web开发']
    },
    {
        'id': 2,
        'title': '响应式设计实践',
        'content': '使用CSS媒体查询创建适应不同设备的布局...',
        'author': '李四',
        'date': '2023-10-10',
        'category': '设计',
        'tags': ['CSS', '响应式', '前端']
    }
]

@app.route('/')
def home():
    return render_template('index.html', posts=blog_posts)

if __name__ == '__main__':
    app.run(debug=True)
