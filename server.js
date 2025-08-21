const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// データファイルのパス
const DATA_FILE = './data/project_data.json';

// データディレクトリとファイルの初期化
function initializeData() {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            members: [
                { id: 1, name: '田中太郎', department: 'IT部門', color: '#4f46e5' },
                { id: 2, name: '佐藤花子', department: 'マーケティング部', color: '#10b981' },
                { id: 3, name: '鈴木次郎', department: '営業部', color: '#f59e0b' },
                { id: 4, name: '高橋美咲', department: 'デザイン部', color: '#ef4444' }
            ],
            projects: [
                { 
                    id: 1, 
                    name: 'Webサイトリニューアル', 
                    description: '会社公式サイトの全面リニューアル',
                    startDate: '2025-08-21',
                    endDate: '2025-10-31',
                    status: 'in_progress',
                    priority: 'high',
                    color: '#4f46e5'
                },
                { 
                    id: 2, 
                    name: 'マーケティングキャンペーン', 
                    description: '新商品のマーケティング活動',
                    startDate: '2025-09-01',
                    endDate: '2025-11-30',
                    status: 'pending',
                    priority: 'medium',
                    color: '#10b981'
                }
            ],
            tasks: [
                {
                    id: 1,
                    projectId: 1,
                    name: 'デザインコンセプト作成',
                    description: '新サイトのデザインコンセプトとワイヤーフレーム作成',
                    assigneeId: 4,
                    requesterId: 2, // 依頼者
                    approverId: 1, // 承認者
                    startDate: '2025-08-21',
                    endDate: '2025-08-28',
                    estimatedHours: 40,
                    actualHours: 20,
                    status: 'in_progress',
                    priority: 'high',
                    dependencies: [],
                    approvalDocuments: '', // OneDriveリンク等
                    approvalNotes: '', // 承認時のコメント
                    approvedAt: null, // 承認日時
                    submittedForApprovalAt: null // 承認申請日時
                },
                {
                    id: 2,
                    projectId: 1,
                    name: 'フロントエンド開発',
                    description: 'HTML/CSS/JavaScriptによるフロントエンド実装',
                    assigneeId: 1,
                    requesterId: 2,
                    approverId: 3,
                    startDate: '2025-08-29',
                    endDate: '2025-09-20',
                    estimatedHours: 120,
                    actualHours: 0,
                    status: 'pending',
                    priority: 'high',
                    dependencies: [1],
                    approvalDocuments: '',
                    approvalNotes: '',
                    approvedAt: null,
                    submittedForApprovalAt: null
                },
                {
                    id: 3,
                    projectId: 1,
                    name: 'バックエンド開発',
                    description: 'サーバーサイドの機能実装',
                    assigneeId: 1,
                    requesterId: 2,
                    approverId: 3,
                    startDate: '2025-09-01',
                    endDate: '2025-09-25',
                    estimatedHours: 100,
                    actualHours: 0,
                    status: 'pending_approval',
                    priority: 'high',
                    dependencies: [1],
                    approvalDocuments: 'https://contoso-my.sharepoint.com/:f:/g/personal/user_contoso_com/sample_folder',
                    approvalNotes: '',
                    approvedAt: null,
                    submittedForApprovalAt: '2025-08-21T06:00:00.000Z'
                },
                {
                    id: 4,
                    projectId: 2,
                    name: 'マーケット調査',
                    description: '競合分析とターゲット市場の調査',
                    assigneeId: 2,
                    requesterId: 3,
                    approverId: 2,
                    startDate: '2025-09-01',
                    endDate: '2025-09-15',
                    estimatedHours: 60,
                    actualHours: 0,
                    status: 'pending',
                    priority: 'medium',
                    dependencies: [],
                    approvalDocuments: '',
                    approvalNotes: '',
                    approvedAt: null,
                    submittedForApprovalAt: null
                }
            ],
            routineJobs: [
                {
                    id: 1,
                    name: 'システム監視',
                    description: '日次システム監視業務',
                    assigneeId: 1,
                    dailyHours: 2,
                    weekdays: [1, 2, 3, 4, 5], // 月-金
                    isActive: true
                },
                {
                    id: 2,
                    name: 'レポート作成',
                    description: '週次売上レポート作成',
                    assigneeId: 2,
                    dailyHours: 1,
                    weekdays: [5], // 金曜日のみ
                    isActive: true
                },
                {
                    id: 3,
                    name: '顧客対応',
                    description: '顧客からの問い合わせ対応',
                    assigneeId: 3,
                    dailyHours: 3,
                    weekdays: [1, 2, 3, 4, 5], // 月-金
                    isActive: true
                }
            ],
            workLogs: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

// データの読み込み
function loadData() {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        // データ移行処理：既存のタスクに承認機能のフィールドを追加
        migrateTaskData(data);
        return data;
    } catch (error) {
        console.error('データの読み込みエラー:', error);
        return { members: [], projects: [], tasks: [], routineJobs: [], workLogs: [] };
    }
}

// タスクデータの移行処理（承認機能対応）
function migrateTaskData(data) {
    let updated = false;
    
    data.tasks.forEach(task => {
        // 承認関連フィールドが存在しない場合は追加
        if (!task.hasOwnProperty('requesterId')) {
            task.requesterId = null;
            updated = true;
        }
        if (!task.hasOwnProperty('approverId')) {
            task.approverId = null;
            updated = true;
        }
        if (!task.hasOwnProperty('approvalDocuments')) {
            task.approvalDocuments = null;
            updated = true;
        }
        if (!task.hasOwnProperty('approvalNotes')) {
            task.approvalNotes = null;
            updated = true;
        }
        if (!task.hasOwnProperty('submittedAt')) {
            task.submittedAt = null;
            updated = true;
        }
        if (!task.hasOwnProperty('approvedAt')) {
            task.approvedAt = null;
            updated = true;
        }
    });
    
    // 更新があった場合はファイルに保存
    if (updated) {
        saveData(data);
        console.log('タスクデータを承認機能対応に移行しました');
    }
}

// データの保存
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('データの保存エラー:', error);
        return false;
    }
}

// 業務負荷の計算
function calculateWorkload(memberId, date, data) {
    const targetDate = moment(date);
    const dayOfWeek = targetDate.isoWeekday(); // 1=月曜日, 7=日曜日
    
    let totalHours = 0;
    
    // プロジェクトタスクの工数
    const memberTasks = data.tasks.filter(task => 
        task.assigneeId === memberId && 
        moment(date).isBetween(moment(task.startDate), moment(task.endDate), null, '[]')
    );
    
    memberTasks.forEach(task => {
        const taskDuration = moment(task.endDate).diff(moment(task.startDate), 'days') + 1;
        const dailyHours = task.estimatedHours / taskDuration;
        totalHours += dailyHours;
    });
    
    // ルーティンジョブの工数
    const memberRoutineJobs = data.routineJobs.filter(job => 
        job.assigneeId === memberId && 
        job.isActive && 
        job.weekdays.includes(dayOfWeek)
    );
    
    memberRoutineJobs.forEach(job => {
        totalHours += job.dailyHours;
    });
    
    return totalHours;
}

// 負荷状態の判定
function getWorkloadStatus(hours) {
    if (hours >= 10) return { status: 'critical', message: '破綻：業務負荷が限界を超えています' };
    if (hours >= 8) return { status: 'warning', message: '警告：業務負荷が高くなっています' };
    return { status: 'normal', message: '正常：業務負荷は適切な範囲内です' };
}

// API エンドポイント

// 全データの取得
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

// メンバー管理
app.get('/api/members', (req, res) => {
    const data = loadData();
    res.json(data.members);
});

app.post('/api/members', (req, res) => {
    const data = loadData();
    const { name, department, color } = req.body;
    
    if (!name || !department) {
        return res.status(400).json({ error: '名前と部署は必須です' });
    }
    
    const newMember = {
        id: Math.max(...data.members.map(m => m.id), 0) + 1,
        name,
        department,
        color: color || '#6b7280'
    };
    
    data.members.push(newMember);
    
    if (saveData(data)) {
        res.json({ success: true, member: newMember });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.put('/api/members/:id', (req, res) => {
    const data = loadData();
    const memberId = parseInt(req.params.id);
    const { name, department, color } = req.body;
    
    const memberIndex = data.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'メンバーが見つかりません' });
    }
    
    data.members[memberIndex] = { ...data.members[memberIndex], name, department, color };
    
    if (saveData(data)) {
        res.json({ success: true, member: data.members[memberIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.delete('/api/members/:id', (req, res) => {
    const data = loadData();
    const memberId = parseInt(req.params.id);
    
    const memberIndex = data.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
        return res.status(404).json({ error: 'メンバーが見つかりません' });
    }
    
    data.members.splice(memberIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// プロジェクト管理
app.get('/api/projects', (req, res) => {
    const data = loadData();
    res.json(data.projects);
});

app.post('/api/projects', (req, res) => {
    const data = loadData();
    const { name, description, startDate, endDate, status, priority, color } = req.body;
    
    if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: '必須項目が不足しています' });
    }
    
    const newProject = {
        id: Math.max(...data.projects.map(p => p.id), 0) + 1,
        name,
        description: description || '',
        startDate,
        endDate,
        status: status || 'pending',
        priority: priority || 'medium',
        color: color || '#6b7280'
    };
    
    data.projects.push(newProject);
    
    if (saveData(data)) {
        res.json({ success: true, project: newProject });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.put('/api/projects/:id', (req, res) => {
    const data = loadData();
    const projectId = parseInt(req.params.id);
    const updates = req.body;
    
    const projectIndex = data.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    
    data.projects[projectIndex] = { ...data.projects[projectIndex], ...updates };
    
    if (saveData(data)) {
        res.json({ success: true, project: data.projects[projectIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.delete('/api/projects/:id', (req, res) => {
    const data = loadData();
    const projectId = parseInt(req.params.id);
    
    const projectIndex = data.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    
    // 関連タスクも削除
    data.tasks = data.tasks.filter(t => t.projectId !== projectId);
    data.projects.splice(projectIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// タスク管理
app.get('/api/tasks', (req, res) => {
    const data = loadData();
    res.json(data.tasks);
});

app.post('/api/tasks', (req, res) => {
    const data = loadData();
    const { 
        projectId, name, description, assigneeId, requesterId, approverId, 
        startDate, endDate, estimatedHours, priority, dependencies, approvalDocuments 
    } = req.body;
    
    if (!projectId || !name || !assigneeId || !startDate || !endDate || !estimatedHours) {
        return res.status(400).json({ error: '必須項目が不足しています' });
    }
    
    // 業務負荷のチェック
    const taskStartDate = moment(startDate);
    const taskEndDate = moment(endDate);
    const warnings = [];
    
    // タスク期間中の各日の負荷をチェック
    for (let date = taskStartDate.clone(); date.isSameOrBefore(taskEndDate); date.add(1, 'day')) {
        const dateStr = date.format('YYYY-MM-DD');
        const currentWorkload = calculateWorkload(assigneeId, dateStr, data);
        const taskDuration = taskEndDate.diff(taskStartDate, 'days') + 1;
        const dailyTaskHours = estimatedHours / taskDuration;
        const totalWorkload = currentWorkload + dailyTaskHours;
        
        const workloadStatus = getWorkloadStatus(totalWorkload);
        if (workloadStatus.status !== 'normal') {
            warnings.push({
                date: dateStr,
                workload: totalWorkload,
                status: workloadStatus.status,
                message: workloadStatus.message
            });
        }
    }
    
    const newTask = {
        id: Math.max(...data.tasks.map(t => t.id), 0) + 1,
        projectId: parseInt(projectId),
        name,
        description: description || '',
        assigneeId: parseInt(assigneeId),
        requesterId: requesterId ? parseInt(requesterId) : null,
        approverId: approverId ? parseInt(approverId) : null,
        startDate,
        endDate,
        estimatedHours: parseFloat(estimatedHours),
        actualHours: 0,
        status: 'pending',
        priority: priority || 'medium',
        dependencies: dependencies || [],
        approvalDocuments: approvalDocuments || '',
        approvalNotes: '',
        approvedAt: null,
        submittedForApprovalAt: null
    };
    
    data.tasks.push(newTask);
    
    if (saveData(data)) {
        res.json({ 
            success: true, 
            task: newTask,
            warnings: warnings
        });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.put('/api/tasks/:id', (req, res) => {
    const data = loadData();
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
    }
    
    data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
    
    if (saveData(data)) {
        res.json({ success: true, task: data.tasks[taskIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    const data = loadData();
    const taskId = parseInt(req.params.id);
    
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
    }
    
    data.tasks.splice(taskIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// タスク承認関連
app.post('/api/tasks/:id/submit-approval', (req, res) => {
    const data = loadData();
    const taskId = parseInt(req.params.id);
    const { approvalDocuments, notes } = req.body;
    
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
    }
    
    data.tasks[taskIndex] = {
        ...data.tasks[taskIndex],
        status: 'pending_approval',
        approvalDocuments: approvalDocuments || '',
        submittedForApprovalAt: new Date().toISOString(),
        approvalNotes: notes || ''
    };
    
    if (saveData(data)) {
        res.json({ success: true, task: data.tasks[taskIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.post('/api/tasks/:id/approve', (req, res) => {
    const data = loadData();
    const taskId = parseInt(req.params.id);
    const { approvalNotes } = req.body;
    
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
    }
    
    if (data.tasks[taskIndex].status !== 'pending_approval') {
        return res.status(400).json({ error: '承認待ち状態ではありません' });
    }
    
    data.tasks[taskIndex] = {
        ...data.tasks[taskIndex],
        status: 'approved',
        approvalNotes: approvalNotes || '',
        approvedAt: new Date().toISOString()
    };
    
    if (saveData(data)) {
        res.json({ success: true, task: data.tasks[taskIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.post('/api/tasks/:id/reject', (req, res) => {
    const data = loadData();
    const taskId = parseInt(req.params.id);
    const { rejectionReason } = req.body;
    
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
    }
    
    if (data.tasks[taskIndex].status !== 'pending_approval') {
        return res.status(400).json({ error: '承認待ち状態ではありません' });
    }
    
    data.tasks[taskIndex] = {
        ...data.tasks[taskIndex],
        status: 'rejected',
        approvalNotes: rejectionReason || '',
        approvedAt: null,
        submittedForApprovalAt: null
    };
    
    if (saveData(data)) {
        res.json({ success: true, task: data.tasks[taskIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// CSV出力エンドポイント
app.get('/api/tasks/export/csv', (req, res) => {
    const data = loadData();
    
    // CSVヘッダー
    const csvHeader = [
        'ID', 'プロジェクト名', 'タスク名', '説明', '担当者', '依頼者', '承認者',
        '開始日', '終了日', '予定工数', '実績工数', 'ステータス', '優先度',
        '承認書類', '承認コメント', '承認日時', '申請日時'
    ].join(',');
    
    // CSVデータ行
    const csvRows = data.tasks.map(task => {
        const project = data.projects.find(p => p.id === task.projectId);
        const assignee = data.members.find(m => m.id === task.assigneeId);
        const requester = data.members.find(m => m.id === task.requesterId);
        const approver = data.members.find(m => m.id === task.approverId);
        
        return [
            task.id,
            `"${project ? project.name : ''}"`,
            `"${task.name}"`,
            `"${task.description}"`,
            `"${assignee ? assignee.name : ''}"`,
            `"${requester ? requester.name : ''}"`,
            `"${approver ? approver.name : ''}"`,
            task.startDate,
            task.endDate,
            task.estimatedHours,
            task.actualHours,
            getStatusTextForCSV(task.status),
            getPriorityTextForCSV(task.priority),
            `"${task.approvalDocuments || ''}"`,
            `"${task.approvalNotes || ''}"`,
            task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('ja-JP') : '',
            task.submittedForApprovalAt ? new Date(task.submittedForApprovalAt).toLocaleDateString('ja-JP') : ''
        ].join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tasks_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csvContent); // BOM付きでExcelで正常に表示
});

function getStatusTextForCSV(status) {
    const statusMap = {
        pending: '未着手',
        in_progress: '進行中',
        completed: '完了',
        pending_approval: '承認待ち',
        approved: '承認済み',
        rejected: '却下'
    };
    return statusMap[status] || status;
}

function getPriorityTextForCSV(priority) {
    const priorityMap = {
        low: '低',
        medium: '中',
        high: '高'
    };
    return priorityMap[priority] || priority;
}

// ルーティンジョブ管理
app.get('/api/routine-jobs', (req, res) => {
    const data = loadData();
    res.json(data.routineJobs);
});

app.post('/api/routine-jobs', (req, res) => {
    const data = loadData();
    const { name, description, assigneeId, dailyHours, weekdays } = req.body;
    
    if (!name || !assigneeId || !dailyHours || !weekdays) {
        return res.status(400).json({ error: '必須項目が不足しています' });
    }
    
    const newRoutineJob = {
        id: Math.max(...data.routineJobs.map(r => r.id), 0) + 1,
        name,
        description: description || '',
        assigneeId: parseInt(assigneeId),
        dailyHours: parseFloat(dailyHours),
        weekdays: weekdays,
        isActive: true
    };
    
    data.routineJobs.push(newRoutineJob);
    
    if (saveData(data)) {
        res.json({ success: true, routineJob: newRoutineJob });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.put('/api/routine-jobs/:id', (req, res) => {
    const data = loadData();
    const jobId = parseInt(req.params.id);
    const updates = req.body;
    
    const jobIndex = data.routineJobs.findIndex(r => r.id === jobId);
    if (jobIndex === -1) {
        return res.status(404).json({ error: 'ルーティンジョブが見つかりません' });
    }
    
    data.routineJobs[jobIndex] = { ...data.routineJobs[jobIndex], ...updates };
    
    if (saveData(data)) {
        res.json({ success: true, routineJob: data.routineJobs[jobIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

app.delete('/api/routine-jobs/:id', (req, res) => {
    const data = loadData();
    const jobId = parseInt(req.params.id);
    
    const jobIndex = data.routineJobs.findIndex(r => r.id === jobId);
    if (jobIndex === -1) {
        return res.status(404).json({ error: 'ルーティンジョブが見つかりません' });
    }
    
    data.routineJobs.splice(jobIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// 業務負荷計算API
app.get('/api/workload/:memberId', (req, res) => {
    const data = loadData();
    const memberId = parseInt(req.params.memberId);
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: '開始日と終了日が必要です' });
    }
    
    const workloadData = [];
    const start = moment(startDate);
    const end = moment(endDate);
    
    for (let date = start.clone(); date.isSameOrBefore(end); date.add(1, 'day')) {
        const dateStr = date.format('YYYY-MM-DD');
        const workload = calculateWorkload(memberId, dateStr, data);
        const status = getWorkloadStatus(workload);
        
        workloadData.push({
            date: dateStr,
            workload: workload,
            status: status.status,
            message: status.message
        });
    }
    
    res.json(workloadData);
});

// 全メンバーの業務負荷取得
app.get('/api/workload-all', (req, res) => {
    const data = loadData();
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: '開始日と終了日が必要です' });
    }
    
    const result = {};
    
    data.members.forEach(member => {
        const workloadData = [];
        const start = moment(startDate);
        const end = moment(endDate);
        
        for (let date = start.clone(); date.isSameOrBefore(end); date.add(1, 'day')) {
            const dateStr = date.format('YYYY-MM-DD');
            const workload = calculateWorkload(member.id, dateStr, data);
            const status = getWorkloadStatus(workload);
            
            workloadData.push({
                date: dateStr,
                workload: workload,
                status: status.status,
                message: status.message
            });
        }
        
        result[member.id] = {
            member: member,
            workload: workloadData
        };
    });
    
    res.json(result);
});

// ガントチャート用データ取得
app.get('/api/gantt', (req, res) => {
    const data = loadData();
    
    const ganttData = {
        projects: data.projects,
        tasks: data.tasks.map(task => {
            const assignee = data.members.find(m => m.id === task.assigneeId);
            const project = data.projects.find(p => p.id === task.projectId);
            
            return {
                ...task,
                assigneeName: assignee ? assignee.name : 'Unknown',
                projectName: project ? project.name : 'Unknown',
                projectColor: project ? project.color : '#6b7280'
            };
        }),
        members: data.members
    };
    
    res.json(ganttData);
});

// カレンダー用データ取得
app.get('/api/calendar', (req, res) => {
    const data = loadData();
    const { month, year } = req.query;
    
    const events = [];
    
    // タスクのイベント
    data.tasks.forEach(task => {
        const assignee = data.members.find(m => m.id === task.assigneeId);
        events.push({
            id: `task-${task.id}`,
            title: task.name,
            start: task.startDate,
            end: moment(task.endDate).add(1, 'day').format('YYYY-MM-DD'), // FullCalendarの仕様
            type: 'task',
            assignee: assignee ? assignee.name : 'Unknown',
            color: assignee ? assignee.color : '#6b7280',
            status: task.status,
            priority: task.priority
        });
    });
    
    // プロジェクトのマイルストーン
    data.projects.forEach(project => {
        events.push({
            id: `project-start-${project.id}`,
            title: `${project.name} 開始`,
            start: project.startDate,
            type: 'milestone',
            color: project.color,
            status: project.status
        });
        
        events.push({
            id: `project-end-${project.id}`,
            title: `${project.name} 終了`,
            start: project.endDate,
            type: 'milestone',
            color: project.color,
            status: project.status
        });
    });
    
    res.json(events);
});

// メインページの配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
initializeData();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`プロジェクト管理システムがポート ${PORT} で起動しました`);
    console.log(`アプリケーション URL: http://localhost:${PORT}`);
});

module.exports = app;