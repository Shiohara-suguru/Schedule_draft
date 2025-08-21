const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// データファイルのパス
const DATA_FILE = './data/routine_jobs.json';

// データディレクトリとファイルの初期化
function initializeData() {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            members: [
                { id: 1, name: '田中太郎', department: 'IT部門' },
                { id: 2, name: '佐藤花子', department: 'マーケティング部' },
                { id: 3, name: '鈴木次郎', department: '営業部' }
            ],
            routineJobs: [
                { id: 1, name: 'システム監視', description: '日次システム監視業務', category: 'IT運用' },
                { id: 2, name: 'レポート作成', description: '週次売上レポート作成', category: '事務作業' },
                { id: 3, name: 'データバックアップ', description: '重要データのバックアップ', category: 'IT運用' },
                { id: 4, name: '顧客対応', description: '顧客からの問い合わせ対応', category: 'サポート' }
            ],
            workEntries: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

// データの読み込み
function loadData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('データの読み込みエラー:', error);
        return { members: [], routineJobs: [], workEntries: [] };
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

// API エンドポイント

// 全データの取得
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

// 担当者一覧の取得
app.get('/api/members', (req, res) => {
    const data = loadData();
    res.json(data.members);
});

// ルーティンジョブ一覧の取得
app.get('/api/routine-jobs', (req, res) => {
    const data = loadData();
    res.json(data.routineJobs);
});

// 工数記録一覧の取得
app.get('/api/work-entries', (req, res) => {
    const data = loadData();
    res.json(data.workEntries);
});

// 工数記録の追加
app.post('/api/work-entries', (req, res) => {
    const data = loadData();
    const { memberId, jobId, hours, date, notes } = req.body;
    
    // バリデーション
    if (!memberId || !jobId || !hours || !date) {
        return res.status(400).json({ error: '必要なフィールドが不足しています' });
    }
    
    const newEntry = {
        id: Date.now(),
        memberId: parseInt(memberId),
        jobId: parseInt(jobId),
        hours: parseFloat(hours),
        date,
        notes: notes || '',
        createdAt: new Date().toISOString()
    };
    
    data.workEntries.push(newEntry);
    
    if (saveData(data)) {
        res.json({ success: true, entry: newEntry });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// 工数記録の更新
app.put('/api/work-entries/:id', (req, res) => {
    const data = loadData();
    const entryId = parseInt(req.params.id);
    const { memberId, jobId, hours, date, notes } = req.body;
    
    const entryIndex = data.workEntries.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
        return res.status(404).json({ error: '工数記録が見つかりません' });
    }
    
    data.workEntries[entryIndex] = {
        ...data.workEntries[entryIndex],
        memberId: parseInt(memberId),
        jobId: parseInt(jobId),
        hours: parseFloat(hours),
        date,
        notes: notes || '',
        updatedAt: new Date().toISOString()
    };
    
    if (saveData(data)) {
        res.json({ success: true, entry: data.workEntries[entryIndex] });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// 工数記録の削除
app.delete('/api/work-entries/:id', (req, res) => {
    const data = loadData();
    const entryId = parseInt(req.params.id);
    
    const entryIndex = data.workEntries.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
        return res.status(404).json({ error: '工数記録が見つかりません' });
    }
    
    data.workEntries.splice(entryIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// 担当者の追加
app.post('/api/members', (req, res) => {
    const data = loadData();
    const { name, department } = req.body;
    
    if (!name || !department) {
        return res.status(400).json({ error: '名前と部署は必須です' });
    }
    
    const newMember = {
        id: Math.max(...data.members.map(m => m.id), 0) + 1,
        name,
        department
    };
    
    data.members.push(newMember);
    
    if (saveData(data)) {
        res.json({ success: true, member: newMember });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// ルーティンジョブの追加
app.post('/api/routine-jobs', (req, res) => {
    const data = loadData();
    const { name, description, category } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'ジョブ名は必須です' });
    }
    
    const newJob = {
        id: Math.max(...data.routineJobs.map(j => j.id), 0) + 1,
        name,
        description: description || '',
        category: category || 'その他'
    };
    
    data.routineJobs.push(newJob);
    
    if (saveData(data)) {
        res.json({ success: true, job: newJob });
    } else {
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// 統計情報の取得
app.get('/api/stats', (req, res) => {
    const data = loadData();
    const { startDate, endDate } = req.query;
    
    let filteredEntries = data.workEntries;
    
    if (startDate) {
        filteredEntries = filteredEntries.filter(entry => entry.date >= startDate);
    }
    
    if (endDate) {
        filteredEntries = filteredEntries.filter(entry => entry.date <= endDate);
    }
    
    // 担当者別統計
    const memberStats = data.members.map(member => {
        const memberEntries = filteredEntries.filter(entry => entry.memberId === member.id);
        const totalHours = memberEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const jobCounts = {};
        
        memberEntries.forEach(entry => {
            const job = data.routineJobs.find(j => j.id === entry.jobId);
            if (job) {
                jobCounts[job.name] = (jobCounts[job.name] || 0) + entry.hours;
            }
        });
        
        return {
            member,
            totalHours,
            entryCount: memberEntries.length,
            jobBreakdown: jobCounts
        };
    });
    
    // ジョブ別統計
    const jobStats = data.routineJobs.map(job => {
        const jobEntries = filteredEntries.filter(entry => entry.jobId === job.id);
        const totalHours = jobEntries.reduce((sum, entry) => sum + entry.hours, 0);
        
        return {
            job,
            totalHours,
            entryCount: jobEntries.length
        };
    });
    
    res.json({
        memberStats,
        jobStats,
        totalEntries: filteredEntries.length,
        totalHours: filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)
    });
});

// メインページの配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
initializeData();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`ルーティンジョブトラッカーがポート ${PORT} で起動しました`);
    console.log(`アプリケーション URL: http://localhost:${PORT}`);
});

module.exports = app;