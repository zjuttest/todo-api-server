const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 数据库路径
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'todos.db')  // Render.com临时存储
  : './todos.db';

// 创建SQLite数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err);
    } else {
        console.log('成功连接到SQLite数据库:', dbPath);
    }
});

// 创建任务表
const createTable = () => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            dueDate TEXT,
            isCompleted INTEGER DEFAULT 0,
            priority INTEGER DEFAULT 1
        )
    `, (err) => {
        if (err) {
            console.error('创建表错误:', err);
        } else {
            console.log('任务表已准备就绪');
        }
    });
};

// 初始化数据库
createTable();

// 健康检查端点
app.get('/', (req, res) => {
    res.json({
        service: 'Todo API Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            getAllTasks: 'GET /jeecg-boot/grain/task/list',
            addTask: 'POST /jeecg-boot/grain/task/add',
            updateTask: 'PUT /jeecg-boot/grain/task/edit',
            deleteTask: 'DELETE /jeecg-boot/grain/task/delete'
        }
    });
});

// 1. 查看所有任务
app.get('/jeecg-boot/grain/task/list', (req, res) => {
    console.log('收到GET请求：获取任务列表');
    db.all('SELECT * FROM tasks ORDER BY id DESC', (err, rows) => {
        if (err) {
            console.error('查询错误:', err);
            res.status(500).json({
                success: false,
                message: '获取任务列表失败',
                data: null
            });
        } else {
            console.log('返回任务数量:', rows.length);
            res.json({
                success: true,
                message: '获取成功',
                data: rows
            });
        }
    });
});

// 2. 新增任务
app.post('/jeecg-boot/grain/task/add', (req, res) => {
    console.log('收到POST请求：添加任务', req.body);
    const { id, title, description } = req.body;
    
    if (!id || !title) {
        console.log('参数验证失败');
        return res.status(400).json({
            success: false,
            message: '缺少必要参数 id 和 title',
            data: null
        });
    }
    
    const sql = 'INSERT INTO tasks (id, title, description) VALUES (?, ?, ?)';
    db.run(sql, [id, title, description || ''], function(err) {
        if (err) {
            console.error('插入错误:', err);
            res.status(500).json({
                success: false,
                message: '添加任务失败',
                data: null
            });
        } else {
            console.log('任务添加成功，ID:', id);
            res.json({
                success: true,
                message: '添加成功',
                data: id
            });
        }
    });
});

// 3. 修改任务
app.put('/jeecg-boot/grain/task/edit', (req, res) => {
    console.log('收到PUT请求：更新任务', req.body);
    const { id, title, description, dueDate = '', isCompleted = false, priority = 0 } = req.body;
    
    if (!id) {
        console.log('任务ID为空');
        return res.status(400).json({
            success: false,
            message: '任务ID不能为空',
            data: null
        });
    }
    
    const sql = `
        UPDATE tasks 
        SET title = ?, description = ?, dueDate = ?, isCompleted = ?, priority = ?
        WHERE id = ?
    `;
    
    db.run(sql, [title, description || '', dueDate, isCompleted ? 1 : 0, priority, id], function(err) {
        if (err) {
            console.error('更新错误:', err);
            res.status(500).json({
                success: false,
                message: '更新任务失败',
                data: null
            });
        } else {
            console.log('任务更新成功，影响行数:', this.changes);
            res.json({
                success: true,
                message: '更新成功',
                data: id
            });
        }
    });
});

// 4. 删除任务
app.delete('/jeecg-boot/grain/task/delete', (req, res) => {
    console.log('收到DELETE请求：删除任务，ID:', req.query.id);
    const { id } = req.query;
    
    if (!id) {
        console.log('删除请求缺少ID');
        return res.status(400).json({
            success: false,
            message: '任务ID不能为空',
            data: null
        });
    }
    
    const sql = 'DELETE FROM tasks WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('删除错误:', err);
            res.status(500).json({
                success: false,
                message: '删除任务失败',
                data: null
            });
        } else {
            console.log('任务删除成功，影响行数:', this.changes);
            res.json({
                success: true,
                message: '删除成功',
                data: id
            });
        }
    });
});

// 初始化测试数据端点（可选）
app.post('/init-test-data', (req, res) => {
    const testData = [
        { id: '2025112601', title: 'Task-01', description: '任务内容-01' },
        { id: '2025112602', title: 'Task-02', description: '任务内容-02' },
        { id: '2025112603', title: 'Task-03', description: '任务内容-03' }
    ];
    
    const sql = 'INSERT OR IGNORE INTO tasks (id, title, description) VALUES (?, ?, ?)';
    let inserted = 0;
    
    testData.forEach(task => {
        db.run(sql, [task.id, task.title, task.description], function(err) {
            if (!err && this.changes > 0) {
                inserted++;
            }
        });
    });
    
    setTimeout(() => {
        res.json({ 
            success: true, 
            message: `测试数据初始化完成，添加了${inserted}条数据` 
        });
    }, 1000);
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Todo API服务器运行在端口 ${PORT}`);
    console.log(`API地址: http://localhost:${PORT}`);
    console.log(`API端点:`);
    console.log(`  主页: GET /`);
    console.log(`  获取任务: GET /jeecg-boot/grain/task/list`);
    console.log(`  添加任务: POST /jeecg-boot/grain/task/add`);
    console.log(`  更新任务: PUT /jeecg-boot/grain/task/edit`);
    console.log(`  删除任务: DELETE /jeecg-boot/grain/task/delete?id=xxx`);
    console.log(`  初始化测试数据: POST /init-test-data`);
});
