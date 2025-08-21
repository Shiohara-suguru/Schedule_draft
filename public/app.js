// グローバル変数
let currentData = {
    members: [],
    routineJobs: [],
    workEntries: []
};

let currentEditingId = null;

// DOM要素の取得
const elements = {
    // タブ関連
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // フォーム関連
    workEntryForm: document.getElementById('work-entry-form'),
    memberSelect: document.getElementById('member-select'),
    jobSelect: document.getElementById('job-select'),
    hoursInput: document.getElementById('hours-input'),
    dateInput: document.getElementById('date-input'),
    notesInput: document.getElementById('notes-input'),
    clearFormBtn: document.getElementById('clear-form'),
    
    // 一覧関連
    workEntriesTable: document.getElementById('work-entries-table'),
    workEntriesBody: document.getElementById('work-entries-body'),
    filterStartDate: document.getElementById('filter-start-date'),
    filterEndDate: document.getElementById('filter-end-date'),
    filterMember: document.getElementById('filter-member'),
    filterJob: document.getElementById('filter-job'),
    applyFilterBtn: document.getElementById('apply-filter'),
    
    // 統計関連
    statsStartDate: document.getElementById('stats-start-date'),
    statsEndDate: document.getElementById('stats-end-date'),
    updateStatsBtn: document.getElementById('update-stats'),
    totalHours: document.getElementById('total-hours'),
    totalEntries: document.getElementById('total-entries'),
    memberStats: document.getElementById('member-stats'),
    jobStats: document.getElementById('job-stats'),
    
    // 管理関連
    addMemberForm: document.getElementById('add-member-form'),
    memberName: document.getElementById('member-name'),
    memberDepartment: document.getElementById('member-department'),
    addJobForm: document.getElementById('add-job-form'),
    jobName: document.getElementById('job-name'),
    jobDescription: document.getElementById('job-description'),
    jobCategory: document.getElementById('job-category'),
    
    // モーダル関連
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-form'),
    editEntryId: document.getElementById('edit-entry-id'),
    editMemberSelect: document.getElementById('edit-member-select'),
    editJobSelect: document.getElementById('edit-job-select'),
    editHoursInput: document.getElementById('edit-hours-input'),
    editDateInput: document.getElementById('edit-date-input'),
    editNotesInput: document.getElementById('edit-notes-input'),
    
    // UI関連
    loading: document.getElementById('loading'),
    notification: document.getElementById('notification')
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // 今日の日付を設定
    const today = new Date().toISOString().split('T')[0];
    elements.dateInput.value = today;
    
    // タブ切り替えの設定
    setupTabSwitching();
    
    // フォームイベントの設定
    setupFormEvents();
    
    // 初期データの読み込み
    await loadAllData();
    
    // UI要素の更新
    updateSelects();
    updateWorkEntriesList();
    updateStats();
    
    console.log('アプリケーションの初期化が完了しました');
}

// タブ切り替えの設定
function setupTabSwitching() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // アクティブなタブボタンを更新
    elements.tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // アクティブなタブコンテンツを更新
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
            content.classList.add('fade-in');
        }
    });
    
    // タブ固有の初期化処理
    if (tabName === 'stats') {
        updateStats();
    } else if (tabName === 'list') {
        updateWorkEntriesList();
    }
}

// フォームイベントの設定
function setupFormEvents() {
    // 工数記録フォーム
    elements.workEntryForm.addEventListener('submit', handleWorkEntrySubmit);
    elements.clearFormBtn.addEventListener('click', clearWorkEntryForm);
    
    // 担当者追加フォーム
    elements.addMemberForm.addEventListener('submit', handleAddMemberSubmit);
    
    // ジョブ追加フォーム
    elements.addJobForm.addEventListener('submit', handleAddJobSubmit);
    
    // 編集フォーム
    elements.editForm.addEventListener('submit', handleEditSubmit);
    
    // フィルター適用
    elements.applyFilterBtn.addEventListener('click', applyFilters);
    
    // 統計更新
    elements.updateStatsBtn.addEventListener('click', updateStats);
}

// データ読み込み
async function loadAllData() {
    showLoading(true);
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            currentData = await response.json();
        } else {
            throw new Error('データの読み込みに失敗しました');
        }
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// セレクト要素の更新
function updateSelects() {
    // 担当者セレクト
    updateSelect(elements.memberSelect, currentData.members, 'name');
    updateSelect(elements.editMemberSelect, currentData.members, 'name');
    updateSelect(elements.filterMember, currentData.members, 'name');
    
    // ジョブセレクト
    updateSelect(elements.jobSelect, currentData.routineJobs, 'name');
    updateSelect(elements.editJobSelect, currentData.routineJobs, 'name');
    updateSelect(elements.filterJob, currentData.routineJobs, 'name');
}

function updateSelect(selectElement, data, displayField) {
    // 既存のオプション（最初の選択肢以外）を削除
    while (selectElement.children.length > 1) {
        selectElement.removeChild(selectElement.lastChild);
    }
    
    // 新しいオプションを追加
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item[displayField];
        if (item.department) {
            option.textContent += ` (${item.department})`;
        }
        selectElement.appendChild(option);
    });
}

// 工数記録フォームの送信処理
async function handleWorkEntrySubmit(event) {
    event.preventDefault();
    
    const formData = {
        memberId: elements.memberSelect.value,
        jobId: elements.jobSelect.value,
        hours: elements.hoursInput.value,
        date: elements.dateInput.value,
        notes: elements.notesInput.value
    };
    
    // バリデーション
    if (!formData.memberId || !formData.jobId || !formData.hours || !formData.date) {
        showNotification('必須項目を入力してください', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch('/api/work-entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('工数記録を追加しました', 'success');
            clearWorkEntryForm();
            await loadAllData();
            updateWorkEntriesList();
        } else {
            throw new Error('工数記録の追加に失敗しました');
        }
    } catch (error) {
        console.error('工数記録追加エラー:', error);
        showNotification('工数記録の追加に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 工数記録フォームのクリア
function clearWorkEntryForm() {
    elements.memberSelect.value = '';
    elements.jobSelect.value = '';
    elements.hoursInput.value = '';
    elements.dateInput.value = new Date().toISOString().split('T')[0];
    elements.notesInput.value = '';
}

// 工数記録一覧の更新
function updateWorkEntriesList(filteredEntries = null) {
    const entries = filteredEntries || currentData.workEntries;
    const tbody = elements.workEntriesBody;
    
    // テーブルの内容をクリア
    tbody.innerHTML = '';
    
    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">データがありません</td></tr>';
        return;
    }
    
    // エントリーを日付の降順でソート
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedEntries.forEach(entry => {
        const member = currentData.members.find(m => m.id === entry.memberId);
        const job = currentData.routineJobs.find(j => j.id === entry.jobId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${member ? member.name : '不明'}</td>
            <td>${job ? job.name : '不明'}</td>
            <td>${entry.hours}時間</td>
            <td>${entry.notes || '-'}</td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="editWorkEntry(${entry.id})">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteWorkEntry(${entry.id})">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// フィルターの適用
function applyFilters() {
    let filteredEntries = [...currentData.workEntries];
    
    // 日付フィルター
    const startDate = elements.filterStartDate.value;
    const endDate = elements.filterEndDate.value;
    
    if (startDate) {
        filteredEntries = filteredEntries.filter(entry => entry.date >= startDate);
    }
    
    if (endDate) {
        filteredEntries = filteredEntries.filter(entry => entry.date <= endDate);
    }
    
    // 担当者フィルター
    const memberId = elements.filterMember.value;
    if (memberId) {
        filteredEntries = filteredEntries.filter(entry => entry.memberId === parseInt(memberId));
    }
    
    // ジョブフィルター
    const jobId = elements.filterJob.value;
    if (jobId) {
        filteredEntries = filteredEntries.filter(entry => entry.jobId === parseInt(jobId));
    }
    
    updateWorkEntriesList(filteredEntries);
}

// 工数記録の編集
function editWorkEntry(entryId) {
    const entry = currentData.workEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    currentEditingId = entryId;
    
    // モーダルにデータを設定
    elements.editEntryId.value = entryId;
    elements.editMemberSelect.value = entry.memberId;
    elements.editJobSelect.value = entry.jobId;
    elements.editHoursInput.value = entry.hours;
    elements.editDateInput.value = entry.date;
    elements.editNotesInput.value = entry.notes || '';
    
    // モーダルを表示
    elements.editModal.classList.add('show');
}

// 編集フォームの送信処理
async function handleEditSubmit(event) {
    event.preventDefault();
    
    const entryId = elements.editEntryId.value;
    const formData = {
        memberId: elements.editMemberSelect.value,
        jobId: elements.editJobSelect.value,
        hours: elements.editHoursInput.value,
        date: elements.editDateInput.value,
        notes: elements.editNotesInput.value
    };
    
    showLoading(true);
    try {
        const response = await fetch(`/api/work-entries/${entryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('工数記録を更新しました', 'success');
            closeEditModal();
            await loadAllData();
            updateWorkEntriesList();
        } else {
            throw new Error('工数記録の更新に失敗しました');
        }
    } catch (error) {
        console.error('工数記録更新エラー:', error);
        showNotification('工数記録の更新に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 工数記録の削除
async function deleteWorkEntry(entryId) {
    if (!confirm('この工数記録を削除しますか？')) return;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/work-entries/${entryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('工数記録を削除しました', 'success');
            await loadAllData();
            updateWorkEntriesList();
        } else {
            throw new Error('工数記録の削除に失敗しました');
        }
    } catch (error) {
        console.error('工数記録削除エラー:', error);
        showNotification('工数記録の削除に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 担当者追加フォームの送信処理
async function handleAddMemberSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: elements.memberName.value.trim(),
        department: elements.memberDepartment.value.trim()
    };
    
    if (!formData.name || !formData.department) {
        showNotification('名前と部署を入力してください', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('担当者を追加しました', 'success');
            elements.addMemberForm.reset();
            await loadAllData();
            updateSelects();
        } else {
            throw new Error('担当者の追加に失敗しました');
        }
    } catch (error) {
        console.error('担当者追加エラー:', error);
        showNotification('担当者の追加に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// ジョブ追加フォームの送信処理
async function handleAddJobSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: elements.jobName.value.trim(),
        description: elements.jobDescription.value.trim(),
        category: elements.jobCategory.value.trim()
    };
    
    if (!formData.name) {
        showNotification('ジョブ名を入力してください', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch('/api/routine-jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('ルーティンジョブを追加しました', 'success');
            elements.addJobForm.reset();
            elements.jobCategory.value = 'その他'; // デフォルト値をリセット
            await loadAllData();
            updateSelects();
        } else {
            throw new Error('ジョブの追加に失敗しました');
        }
    } catch (error) {
        console.error('ジョブ追加エラー:', error);
        showNotification('ジョブの追加に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 統計の更新
async function updateStats() {
    const startDate = elements.statsStartDate.value;
    const endDate = elements.statsEndDate.value;
    
    showLoading(true);
    try {
        let url = '/api/stats';
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        if (response.ok) {
            const stats = await response.json();
            displayStats(stats);
        } else {
            throw new Error('統計データの取得に失敗しました');
        }
    } catch (error) {
        console.error('統計更新エラー:', error);
        showNotification('統計データの取得に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 統計の表示
function displayStats(stats) {
    // 全体統計
    elements.totalHours.textContent = stats.totalHours.toFixed(1);
    elements.totalEntries.textContent = stats.totalEntries;
    
    // 担当者別統計
    elements.memberStats.innerHTML = '';
    stats.memberStats.forEach(memberStat => {
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `
            <div>
                <strong>${memberStat.member.name}</strong><br>
                <small style="color: #64748b;">${memberStat.member.department}</small>
            </div>
            <div style="text-align: right;">
                <div style="color: #4f46e5; font-weight: 700;">${memberStat.totalHours.toFixed(1)}時間</div>
                <div style="color: #64748b; font-size: 0.9rem;">${memberStat.entryCount}件</div>
            </div>
        `;
        elements.memberStats.appendChild(div);
    });
    
    // ジョブ別統計
    elements.jobStats.innerHTML = '';
    stats.jobStats
        .sort((a, b) => b.totalHours - a.totalHours)
        .forEach(jobStat => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <div>
                    <strong>${jobStat.job.name}</strong><br>
                    <small style="color: #64748b;">${jobStat.job.category}</small>
                </div>
                <div style="text-align: right;">
                    <div style="color: #4f46e5; font-weight: 700;">${jobStat.totalHours.toFixed(1)}時間</div>
                    <div style="color: #64748b; font-size: 0.9rem;">${jobStat.entryCount}件</div>
                </div>
            `;
            elements.jobStats.appendChild(div);
        });
}

// モーダルの閉じる
function closeEditModal() {
    elements.editModal.classList.remove('show');
    currentEditingId = null;
}

// ローディング表示の制御
function showLoading(show) {
    if (show) {
        elements.loading.classList.add('show');
    } else {
        elements.loading.classList.remove('show');
    }
}

// 通知の表示
function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// グローバル関数として公開（HTMLから呼び出せるように）
window.editWorkEntry = editWorkEntry;
window.deleteWorkEntry = deleteWorkEntry;
window.closeEditModal = closeEditModal;