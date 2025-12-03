# Todo API Server

这是一个为Android Todo List应用提供后端API的Node.js服务器。

## API端点

### 基础信息
- `GET /` - 服务状态和API文档

### 任务管理
1. **查看所有任务**
   - `GET /jeecg-boot/grain/task/list`
   - 响应格式：
     ```json
     {
       "success": true,
       "message": "获取成功",
       "data": [...]
     }
     ```

2. **新增任务**
   - `POST /jeecg-boot/grain/task/add`
   - 请求体：
     ```json
     {
       "id": "2025112601",
       "title": "Task-03",
       "description": "Task-03 任务内容"
     }
     ```

3. **修改任务**
   - `PUT /jeecg-boot/grain/task/edit`
   - 请求体：
     ```json
     {
       "id": "2025112601",
       "title": "Task-04",
       "description": "Task-04 任务内容",
       "dueDate": "",
       "isCompleted": true,
       "priority": 0
     }
     ```

4. **删除任务**
   - `DELETE /jeecg-boot/grain/task/delete?id=任务ID`

## 本地运行

1. 安装依赖：
   ```bash
   npm install
