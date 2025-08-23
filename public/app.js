// グローバル変数
let currentData = {
    members: [],
    projects: [],
    tasks: [],
    routineJobs: []
};

let calendar = null;
let charts = {};

// DOM要素の取得
const elements = {
    // タブ関連
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // KPI要素
    totalProjects: document.getElementById('total-projects'),
    totalTasks: document.getElementById('total-tasks'),
    totalHours: document.getElementById('total-hours'),
    totalMembers: document.getElementById('total-members'),
    
    // モーダル関連
    projectModal: document.getElementById('project-modal'),
    taskModal: document.getElementById('task-modal'),
    memberModal: document.getElementById('member-modal'),
    routineModal: document.getElementById('routine-modal'),
    
    // フォーム関連
    projectForm: document.getElementById('project-form'),
    taskForm: document.getElementById('task-form'),
    memberForm: document.getElementById('member-form'),
    routineForm: document.getElementById('routine-form'),
    
    // UI関連
    loading: document.getElementById('loading'),
    notification: document.getElementById('notification')
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('プロジェクト管理システムを初期化中...');
    
    // タブ切り替えの設定
    setupTabSwitching();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 初期データの読み込み
    await loadAllData();
    
    // UI要素の更新（チャート初期化のため少し遅延）
    setTimeout(() => {
        updateDashboard();
        updateSelects();
        initializeCalendar();
        updateTasksList(); // タスクリストを明示的に更新
    }, 100);
    
    console.log('プロジェクト管理システムの初期化が完了しました');
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
    switch (tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'gantt':
            renderGanttChart();
            break;
        case 'workload':
            updateWorkloadView();
            break;
        case 'calendar':
            if (calendar) calendar.render();
            break;
        case 'tasks':
            updateTasksList();
            break;
        case 'routine':
            updateRoutineJobsList();
            break;
        case 'manage':
            updateManagementLists();
            break;
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // プロジェクト関連
    document.getElementById('add-project-btn').addEventListener('click', () => openProjectModal());
    elements.projectForm.addEventListener('submit', handleProjectSubmit);
    
    // タスク関連
    document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal());
    elements.taskForm.addEventListener('submit', handleTaskSubmit);
    
    // メンバー関連
    document.getElementById('add-member-btn').addEventListener('click', () => openMemberModal());
    elements.memberForm.addEventListener('submit', handleMemberSubmit);
    
    // ルーティンジョブ関連
    document.getElementById('add-routine-btn').addEventListener('click', () => openRoutineModal());
    elements.routineForm.addEventListener('submit', handleRoutineSubmit);
    
    // 承認関連
    const submitApprovalForm = document.getElementById('submit-approval-form');
    const approvalForm = document.getElementById('approval-form');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
    if (submitApprovalForm) {
        submitApprovalForm.addEventListener('submit', handleSubmitApprovalSubmit);
    }
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportTasksToCSV);
    }
    
    // ガントチャート関連
    document.getElementById('gantt-refresh').addEventListener('click', renderGanttChart);
    
    // 業務負荷関連
    document.getElementById('workload-update').addEventListener('click', updateWorkloadView);
    
    // フィルター関連
    setupFilterListeners();
    
    // 日付の初期設定
    setDefaultDates();
}

function setupFilterListeners() {
    // タスクフィルター
    ['task-project-filter', 'task-status-filter', 'task-member-filter', 'task-priority-filter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateTasksList);
        }
    });
    
    // ガントチャートフィルター
    ['gantt-project-filter', 'gantt-member-filter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', renderGanttChart);
        }
    });
    
    // 業務負荷フィルター
    const workloadMemberFilter = document.getElementById('workload-member-filter');
    if (workloadMemberFilter) {
        workloadMemberFilter.addEventListener('change', updateWorkloadView);
    }
}

function setDefaultDates() {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // 業務負荷用日付
    const workloadStartDate = document.getElementById('workload-start-date');
    const workloadEndDate = document.getElementById('workload-end-date');
    
    if (workloadStartDate) workloadStartDate.value = oneWeekAgo.toISOString().split('T')[0];
    if (workloadEndDate) workloadEndDate.value = oneMonthLater.toISOString().split('T')[0];
}

// データ読み込み
async function loadAllData() {
    showLoading(true);
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            currentData = await response.json();
            console.log('データ読み込み完了:', currentData);
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

// ダッシュボードの更新
function updateDashboard() {
    // KPI更新
    elements.totalProjects.textContent = currentData.projects.length;
    elements.totalTasks.textContent = currentData.tasks.length;
    elements.totalHours.textContent = currentData.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    elements.totalMembers.textContent = currentData.members.length;
    
    // チャート更新
    updateDashboardCharts();
    updateRecentActivities();
}

function updateDashboardCharts() {
    // プロジェクト状況チャート
    const projectStatusCtx = document.getElementById('project-status-chart');
    if (projectStatusCtx) {
        const statusCounts = {
            pending: currentData.projects?.filter(p => p.status === 'pending').length || 0,
            in_progress: currentData.projects?.filter(p => p.status === 'in_progress').length || 0,
            completed: currentData.projects?.filter(p => p.status === 'completed').length || 0
        };
        
        if (charts.projectStatus) {
            charts.projectStatus.destroy();
            charts.projectStatus = null;
        }
        
        // 強制的にcanvasサイズをリセット
        projectStatusCtx.style.width = '';
        projectStatusCtx.style.height = '';
        projectStatusCtx.width = 0;
        projectStatusCtx.height = 0;
        
        charts.projectStatus = new Chart(projectStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['未着手', '進行中', '完了'],
                datasets: [{
                    data: [statusCounts.pending, statusCounts.in_progress, statusCounts.completed],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                animation: {
                    duration: 300
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    }
    
    // タスク進捗チャート
    const taskProgressCtx = document.getElementById('task-progress-chart');
    if (taskProgressCtx) {
        const taskStatusCounts = {
            pending: currentData.tasks?.filter(t => t.status === 'pending').length || 0,
            in_progress: currentData.tasks?.filter(t => t.status === 'in_progress').length || 0,
            completed: currentData.tasks?.filter(t => t.status === 'completed').length || 0
        };
        
        if (charts.taskProgress) {
            charts.taskProgress.destroy();
            charts.taskProgress = null;
        }
        
        // 強制的にcanvasサイズをリセット
        taskProgressCtx.style.width = '';
        taskProgressCtx.style.height = '';
        taskProgressCtx.width = 0;
        taskProgressCtx.height = 0;
        
        charts.taskProgress = new Chart(taskProgressCtx, {
            type: 'bar',
            data: {
                labels: ['未着手', '進行中', '完了'],
                datasets: [{
                    label: 'タスク数',
                    data: [taskStatusCounts.pending, taskStatusCounts.in_progress, taskStatusCounts.completed],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: Math.max(10, Math.max(...Object.values(taskStatusCounts)) + 2),
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    }
}

function updateRecentActivities() {
    const activitiesContainer = document.getElementById('recent-activities');
    if (!activitiesContainer) return;
    
    const activities = [];
    
    // 最近のタスクを追加
    currentData.tasks.slice(-5).forEach(task => {
        const member = currentData.members.find(m => m.id === task.assigneeId);
        const project = currentData.projects.find(p => p.id === task.projectId);
        
        activities.push({
            icon: 'fas fa-tasks',
            color: '#3b82f6',
            title: `タスク「${task.name}」が作成されました`,
            detail: `担当者: ${member ? member.name : 'Unknown'}, プロジェクト: ${project ? project.name : 'Unknown'}`,
            time: '最近'
        });
    });
    
    // 最近のプロジェクトを追加
    currentData.projects.slice(-3).forEach(project => {
        activities.push({
            icon: 'fas fa-project-diagram',
            color: project.color,
            title: `プロジェクト「${project.name}」が作成されました`,
            detail: `期間: ${project.startDate} - ${project.endDate}`,
            time: '最近'
        });
    });
    
    activitiesContainer.innerHTML = activities.length === 0 
        ? '<p style="text-align: center; color: #64748b; padding: 2rem;">最近のアクティビティはありません</p>'
        : activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-detail">${activity.detail}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
}

// セレクト要素の更新
function updateSelects() {
    // プロジェクトセレクトの更新
    updateSelect('task-project', currentData.projects, 'name', 'プロジェクトを選択');
    updateSelect('task-project-filter', currentData.projects, 'name', 'すべてのプロジェクト');
    updateSelect('gantt-project-filter', currentData.projects, 'name', 'すべてのプロジェクト');
    
    // メンバーセレクトの更新
    updateSelect('task-assignee', currentData.members, 'name', '担当者を選択');
    updateSelect('task-requester', currentData.members, 'name', '依頼者を選択');
    updateSelect('task-approval-level-1', currentData.members, 'name', 'レベル1承認者を選択');
    updateSelect('task-member-filter', currentData.members, 'name', 'すべてのメンバー');
    updateSelect('gantt-member-filter', currentData.members, 'name', 'すべてのメンバー');
    updateSelect('workload-member-filter', currentData.members, 'name', 'すべてのメンバー');
    updateSelect('routine-assignee', currentData.members, 'name', '担当者を選択');
}

function updateSelect(selectId, data, displayField, placeholder) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    
    // 既存のオプション（最初の選択肢以外）を削除
    while (selectElement.children.length > 1) {
        selectElement.removeChild(selectElement.lastChild);
    }
    
    // プレースホルダーを更新
    if (selectElement.firstChild) {
        selectElement.firstChild.textContent = placeholder;
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

// ガントチャートの描画
function renderGanttChart() {
    const ganttContainer = document.getElementById('gantt-chart');
    if (!ganttContainer) return;
    
    const projectFilter = document.getElementById('gantt-project-filter').value;
    const memberFilter = document.getElementById('gantt-member-filter').value;
    
    let filteredTasks = currentData.tasks;
    
    if (projectFilter) {
        filteredTasks = filteredTasks.filter(task => task.projectId == projectFilter);
    }
    
    if (memberFilter) {
        filteredTasks = filteredTasks.filter(task => task.assigneeId == memberFilter);
    }
    
    if (filteredTasks.length === 0) {
        ganttContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">表示するタスクがありません</p>';
        return;
    }
    
    // 日付範囲の計算
    const startDates = filteredTasks.map(task => new Date(task.startDate));
    const endDates = filteredTasks.map(task => new Date(task.endDate));
    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    
    // 日付配列の生成
    const dateRange = [];
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d));
    }
    
    // ガントチャートHTML生成
    const ganttHTML = `
        <div class="gantt-timeline">
            <div class="gantt-timeline-header">タスク</div>
            <div class="gantt-date-header">
                ${dateRange.map(date => 
                    `<div class="gantt-date-cell">${date.getDate()}</div>`
                ).join('')}
            </div>
        </div>
        <div class="gantt-content">
            ${filteredTasks.map(task => {
                const member = currentData.members.find(m => m.id === task.assigneeId);
                const project = currentData.projects.find(p => p.id === task.projectId);
                const taskStart = new Date(task.startDate);
                const taskEnd = new Date(task.endDate);
                const startOffset = Math.max(0, (taskStart - minDate) / (1000 * 60 * 60 * 24));
                const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
                
                return `
                    <div class="gantt-task-row">
                        <div class="gantt-task-info">
                            <div>
                                <strong>${task.name}</strong><br>
                                <small>${member ? member.name : 'Unknown'}</small>
                            </div>
                        </div>
                        <div class="gantt-timeline-bars">
                            <div class="gantt-task-bar" 
                                 style="left: ${startOffset * 40}px; 
                                        width: ${duration * 40}px; 
                                        background: ${member ? member.color : '#6b7280'}">
                                ${task.name}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    ganttContainer.innerHTML = ganttHTML;
}

// 業務負荷ビューの更新
async function updateWorkloadView() {
    const startDate = document.getElementById('workload-start-date').value;
    const endDate = document.getElementById('workload-end-date').value;
    const memberFilter = document.getElementById('workload-member-filter').value;
    
    if (!startDate || !endDate) {
        showNotification('開始日と終了日を選択してください', 'warning');
        return;
    }
    
    showLoading(true);
    try {
        const url = memberFilter 
            ? `/api/workload/${memberFilter}?startDate=${startDate}&endDate=${endDate}`
            : `/api/workload-all?startDate=${startDate}&endDate=${endDate}`;
            
        const response = await fetch(url);
        if (response.ok) {
            const workloadData = await response.json();
            renderWorkloadChart(workloadData, memberFilter);
            renderWorkloadWarnings(workloadData);
            renderWorkloadTable(workloadData);
        } else {
            throw new Error('業務負荷データの取得に失敗しました');
        }
    } catch (error) {
        console.error('業務負荷更新エラー:', error);
        showNotification('業務負荷データの取得に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

function renderWorkloadChart(workloadData, memberFilter) {
    const ctx = document.getElementById('workload-trend-chart');
    if (!ctx) return;
    
    if (charts.workloadTrend) {
        charts.workloadTrend.destroy();
        charts.workloadTrend = null;
    }
    
    // 強制的にcanvasサイズをリセット
    ctx.style.width = '';
    ctx.style.height = '';
    ctx.width = 0;
    ctx.height = 0;
    
    if (memberFilter) {
        // 単一メンバーの場合
        const labels = workloadData.map(item => moment(item.date).format('MM/DD'));
        const data = workloadData.map(item => item.workload);
        const colors = data.map(workload => {
            if (workload >= 10) return '#ef4444';
            if (workload >= 8) return '#f59e0b';
            return '#10b981';
        });
        
        charts.workloadTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '業務負荷（時間）',
                    data: data,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                animation: {
                    duration: 300
                },
                interaction: {
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 12,
                        ticks: {
                            stepSize: 2,
                            callback: function(value) {
                                return value + 'h';
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        backgroundColor: function(context) {
                            const workload = context.raw;
                            if (workload >= 10) return '#ef4444';
                            if (workload >= 8) return '#f59e0b';
                            return '#10b981';
                        },
                        radius: 4,
                        hoverRadius: 6
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    } else {
        // 全メンバーの場合
        const datasets = Object.entries(workloadData).map(([memberId, memberData]) => {
            const member = memberData.member;
            return {
                label: member.name,
                data: memberData.workload.map(item => item.workload),
                borderColor: member.color,
                backgroundColor: member.color + '20',
                tension: 0.3
            };
        });
        
        const labels = Object.values(workloadData)[0]?.workload.map(item => 
            moment(item.date).format('MM/DD')
        ) || [];
        
        charts.workloadTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                animation: {
                    duration: 300
                },
                interaction: {
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 12,
                        ticks: {
                            stepSize: 2,
                            callback: function(value) {
                                return value + 'h';
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    }
}

function renderWorkloadWarnings(workloadData) {
    const warningsContainer = document.getElementById('workload-warnings');
    if (!warningsContainer) return;
    
    const warnings = [];
    
    if (Array.isArray(workloadData)) {
        // 単一メンバーの場合
        workloadData.forEach(item => {
            if (item.status !== 'normal') {
                warnings.push({
                    date: item.date,
                    workload: item.workload,
                    status: item.status,
                    message: item.message,
                    member: null
                });
            }
        });
    } else {
        // 全メンバーの場合
        Object.entries(workloadData).forEach(([memberId, memberData]) => {
            memberData.workload.forEach(item => {
                if (item.status !== 'normal') {
                    warnings.push({
                        date: item.date,
                        workload: item.workload,
                        status: item.status,
                        message: item.message,
                        member: memberData.member
                    });
                }
            });
        });
    }
    
    if (warnings.length === 0) {
        warningsContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">負荷警告はありません</p>';
        return;
    }
    
    warningsContainer.innerHTML = warnings.map(warning => `
        <div class="warning-item ${warning.status}">
            <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="warning-content">
                <h4>${warning.member ? warning.member.name : ''} - ${moment(warning.date).format('YYYY/MM/DD')}</h4>
                <div class="warning-details">
                    ${warning.message} (${warning.workload.toFixed(1)}時間)
                </div>
            </div>
        </div>
    `).join('');
}

function renderWorkloadTable(workloadData) {
    const tableContainer = document.getElementById('workload-table');
    if (!tableContainer) return;
    
    if (Array.isArray(workloadData)) {
        // 単一メンバーの場合
        tableContainer.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>日付</th>
                        <th>業務負荷</th>
                        <th>ステータス</th>
                    </tr>
                </thead>
                <tbody>
                    ${workloadData.map(item => `
                        <tr>
                            <td>${moment(item.date).format('YYYY/MM/DD (ddd)')}</td>
                            <td>${item.workload.toFixed(1)}時間</td>
                            <td>
                                <span class="status-badge ${item.status === 'critical' ? 'priority-high' : item.status === 'warning' ? 'priority-medium' : 'priority-low'}">
                                    ${item.status === 'critical' ? '破綻' : item.status === 'warning' ? '警告' : '正常'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        // 全メンバーの場合
        const dates = Object.values(workloadData)[0]?.workload.map(item => item.date) || [];
        const members = Object.values(workloadData).map(data => data.member);
        
        tableContainer.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>日付</th>
                        ${members.map(member => `<th>${member.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${dates.map(date => `
                        <tr>
                            <td>${moment(date).format('YYYY/MM/DD (ddd)')}</td>
                            ${members.map(member => {
                                const memberWorkload = workloadData[member.id].workload.find(item => item.date === date);
                                const workload = memberWorkload ? memberWorkload.workload : 0;
                                const status = memberWorkload ? memberWorkload.status : 'normal';
                                return `
                                    <td>
                                        <span class="status-badge ${status === 'critical' ? 'priority-high' : status === 'warning' ? 'priority-medium' : 'priority-low'}">
                                            ${workload.toFixed(1)}h
                                        </span>
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

// カレンダーの初期化
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        events: function(info, successCallback, failureCallback) {
            fetch('/api/calendar')
                .then(response => response.json())
                .then(events => successCallback(events))
                .catch(error => {
                    console.error('カレンダーイベント取得エラー:', error);
                    failureCallback(error);
                });
        },
        eventClick: function(info) {
            // イベントクリック時の処理
            console.log('Event clicked:', info.event);
        }
    });
    
    calendar.render();
}

// タスクリストの更新
function updateTasksList() {
    const tasksBody = document.getElementById('tasks-body');
    if (!tasksBody) return;
    
    // フィルター適用
    let filteredTasks = currentData.tasks;
    
    const projectFilter = document.getElementById('task-project-filter').value;
    const statusFilter = document.getElementById('task-status-filter').value;
    const memberFilter = document.getElementById('task-member-filter').value;
    const priorityFilter = document.getElementById('task-priority-filter').value;
    
    if (projectFilter) filteredTasks = filteredTasks.filter(t => t.projectId == projectFilter);
    if (statusFilter) filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    if (memberFilter) filteredTasks = filteredTasks.filter(t => t.assigneeId == memberFilter);
    if (priorityFilter) filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
    
    if (filteredTasks.length === 0) {
        tasksBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">表示するタスクがありません</td></tr>';
        return;
    }
    
    tasksBody.innerHTML = filteredTasks.map(task => {
        const member = currentData.members.find(m => m.id == task.assigneeId);
        const requester = currentData.members.find(m => m.id == task.requesterId);
        const project = currentData.projects.find(p => p.id == task.projectId);
        
        // 現在の承認レベルと承認者を取得
        const currentLevel = task.currentApprovalLevel || 1;
        const currentApproverId = task[`approvalLevel${currentLevel}Id`];
        const currentApprover = currentApproverId ? currentData.members.find(m => m.id == currentApproverId) : null;
        
        // 承認レベル表示
        let approvalLevelDisplay = '';
        if (task.maxApprovalLevel > 1) {
            approvalLevelDisplay = `${currentLevel}/${task.maxApprovalLevel}`;
        } else {
            approvalLevelDisplay = currentLevel.toString();
        }
        
        // 承認関連のアクションボタンを生成
        let approvalActions = '';
        if (task.status === 'completed' && currentApproverId) {
            approvalActions = `
                <button class="btn btn-small btn-primary" onclick="openSubmitApprovalModal(${task.id})" title="承認申請">
                    <i class="fas fa-paper-plane"></i>
                </button>
            `;
        } else if (task.status === 'pending_approval' && currentApproverId) {
            approvalActions = `
                <button class="btn btn-small btn-success" onclick="openHierarchicalApprovalModal(${task.id})" title="階層承認処理">
                    <i class="fas fa-check-circle"></i>
                </button>
            `;
        }
        
        return `
            <tr>
                <td>${task.name}</td>
                <td>${project ? project.name : 'Unknown'}</td>
                <td>${member ? member.name : 'Unknown'}</td>
                <td>${requester ? requester.name : '-'}</td>
                <td>${approvalLevelDisplay}</td>
                <td>${currentApprover ? currentApprover.name : '-'}</td>
                <td>${moment(task.startDate).format('YYYY/MM/DD')}</td>
                <td>${moment(task.endDate).format('YYYY/MM/DD')}</td>
                <td>${task.estimatedHours}h</td>
                <td>
                    <span class="status-badge status-${task.status}">
                        ${getStatusText(task.status)}
                    </span>
                </td>
                <td>
                    <span class="status-badge priority-${task.priority}">
                        ${getPriorityText(task.priority)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${approvalActions}
                </td>
            </tr>
        `;
    }).join('');
}

// ルーティンジョブリストの更新
function updateRoutineJobsList() {
    const routineList = document.getElementById('active-routine-jobs');
    if (!routineList) return;
    
    const activeJobs = currentData.routineJobs.filter(job => job.isActive);
    
    if (activeJobs.length === 0) {
        routineList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">アクティブなルーティンジョブはありません</p>';
        return;
    }
    
    routineList.innerHTML = activeJobs.map(job => {
        const member = currentData.members.find(m => m.id === job.assigneeId);
        const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const weekdaysText = job.weekdays.map(day => weekdayNames[day === 7 ? 0 : day]).join('、');
        
        return `
            <div class="routine-item">
                <div class="routine-info">
                    <h4>${job.name}</h4>
                    <div class="routine-details">
                        担当者: ${member ? member.name : 'Unknown'}<br>
                        工数: ${job.dailyHours}時間/日<br>
                        実行日: ${weekdaysText}
                    </div>
                </div>
                <div class="routine-actions">
                    <button class="btn btn-small btn-secondary" onclick="editRoutineJob(${job.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteRoutineJob(${job.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // ルーティンジョブ工数チャート
    updateRoutineWorkloadChart();
}

function updateRoutineWorkloadChart() {
    const ctx = document.getElementById('routine-workload-chart');
    if (!ctx) return;
    
    if (charts.routineWorkload) charts.routineWorkload.destroy();
    
    const memberWorkload = {};
    
    const activeJobs = currentData.routineJobs?.filter(job => job.isActive) || [];
    activeJobs.forEach(job => {
        const member = currentData.members?.find(m => m.id === job.assigneeId);
        if (member) {
            const weeklyHours = (job.dailyHours || 0) * (job.weekdays?.length || 0);
            memberWorkload[member.name] = (memberWorkload[member.name] || 0) + weeklyHours;
        }
    });
    
    const labels = Object.keys(memberWorkload);
    const data = Object.values(memberWorkload).filter(d => !isNaN(d) && d > 0);
    
    if (charts.routineWorkload) {
        charts.routineWorkload.destroy();
        charts.routineWorkload = null;
    }
    
    // 強制的にcanvasサイズをリセット
    ctx.style.width = '';
    ctx.style.height = '';
    ctx.width = 0;
    ctx.height = 0;
    
    if (labels.length === 0 || data.length === 0) {
        // 空のデータの場合はチャートをクリア
        ctx.style.display = 'none';
        return;
    }
    ctx.style.display = 'block';
    
    charts.routineWorkload = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '週間ルーティン工数',
                data: data,
                backgroundColor: labels.map((_, index) => {
                    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    return colors[index % colors.length];
                }),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: {
                duration: 300
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: data.length > 0 ? Math.max(40, Math.max(...data) + 5) : 40,
                    ticks: {
                        stepSize: 5,
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            layout: {
                padding: 10
            }
        }
    });
}

// 管理リストの更新
function updateManagementLists() {
    updateProjectsList();
    updateMembersList();
}

function updateProjectsList() {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;
    
    if (currentData.projects.length === 0) {
        projectsList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">プロジェクトがありません</p>';
        return;
    }
    
    projectsList.innerHTML = currentData.projects.map(project => `
        <div class="manage-item">
            <div class="manage-item-info">
                <h4>${project.name}</h4>
                <div class="manage-item-details">
                    期間: ${moment(project.startDate).format('YYYY/MM/DD')} - ${moment(project.endDate).format('YYYY/MM/DD')}<br>
                    ステータス: ${getStatusText(project.status)}
                </div>
            </div>
            <div class="manage-item-actions">
                <button class="btn btn-small btn-secondary" onclick="editProject(${project.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteProject(${project.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateMembersList() {
    const membersList = document.getElementById('members-list');
    if (!membersList) return;
    
    if (currentData.members.length === 0) {
        membersList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">メンバーがいません</p>';
        return;
    }
    
    membersList.innerHTML = currentData.members.map(member => `
        <div class="manage-item">
            <div class="manage-item-info">
                <h4>${member.name}</h4>
                <div class="manage-item-details">
                    部署: ${member.department}
                </div>
            </div>
            <div class="manage-item-actions">
                <button class="btn btn-small btn-secondary" onclick="editMember(${member.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteMember(${member.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// プロジェクトモーダル
function openProjectModal(projectId = null) {
    const modal = elements.projectModal;
    const title = document.getElementById('project-modal-title');
    const form = elements.projectForm;
    
    if (projectId) {
        const project = currentData.projects.find(p => p.id === projectId);
        if (project) {
            title.textContent = 'プロジェクト編集';
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-start-date').value = project.startDate;
            document.getElementById('project-end-date').value = project.endDate;
            document.getElementById('project-status').value = project.status;
            document.getElementById('project-priority').value = project.priority;
            document.getElementById('project-color').value = project.color;
        }
    } else {
        title.textContent = 'プロジェクト追加';
        form.reset();
        document.getElementById('project-id').value = '';
        document.getElementById('project-color').value = '#4f46e5';
    }
    
    modal.classList.add('show');
}

function closeProjectModal() {
    elements.projectModal.classList.remove('show');
}

async function handleProjectSubmit(event) {
    event.preventDefault();
    
    const projectId = document.getElementById('project-id').value;
    const formData = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        startDate: document.getElementById('project-start-date').value,
        endDate: document.getElementById('project-end-date').value,
        status: document.getElementById('project-status').value,
        priority: document.getElementById('project-priority').value,
        color: document.getElementById('project-color').value
    };
    
    const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
    const method = projectId ? 'PUT' : 'POST';
    
    showLoading(true);
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification(projectId ? 'プロジェクトを更新しました' : 'プロジェクトを追加しました', 'success');
            closeProjectModal();
            await loadAllData();
            updateSelects();
            updateManagementLists();
            updateDashboard();
        } else {
            throw new Error('プロジェクトの保存に失敗しました');
        }
    } catch (error) {
        console.error('プロジェクト保存エラー:', error);
        showNotification('プロジェクトの保存に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// タスクモーダル
function openTaskModal(taskId = null) {
    const modal = elements.taskModal;
    const title = document.getElementById('task-modal-title');
    const form = elements.taskForm;
    
    if (taskId) {
        const task = currentData.tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'タスク編集';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-name').value = task.name;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-project').value = task.projectId;
            document.getElementById('task-assignee').value = task.assigneeId;
            document.getElementById('task-estimated-hours').value = task.estimatedHours;
            document.getElementById('task-start-date').value = task.startDate;
            document.getElementById('task-end-date').value = task.endDate;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-status').value = task.status;
            const requesterId = task.requesterId;
            const approvalLevel1Id = task.approvalLevel1Id || task.approverId; // 既存データの互換性
            document.getElementById('task-requester').value = requesterId || '';
            document.getElementById('task-approval-level-1').value = approvalLevel1Id || '';
            document.getElementById('task-approval-documents').value = task.approvalDocuments || '';
        }
    } else {
        title.textContent = 'タスク追加';
        form.reset();
        document.getElementById('task-id').value = '';
    }
    
    modal.classList.add('show');
}

function closeTaskModal() {
    elements.taskModal.classList.remove('show');
    const warningDiv = document.getElementById('workload-warning');
    if (warningDiv) warningDiv.style.display = 'none';
}

async function handleTaskSubmit(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const formData = {
        name: document.getElementById('task-name').value,
        description: document.getElementById('task-description').value,
        projectId: document.getElementById('task-project').value,
        assigneeId: document.getElementById('task-assignee').value,
        estimatedHours: parseFloat(document.getElementById('task-estimated-hours').value),
        startDate: document.getElementById('task-start-date').value,
        endDate: document.getElementById('task-end-date').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        requesterId: document.getElementById('task-requester').value || null,
        approverId: document.getElementById('task-approval-level-1').value || null, // 互換性のため保持
        approvalLevel1Id: document.getElementById('task-approval-level-1').value || null,
        approvalDocuments: document.getElementById('task-approval-documents').value || null
    };
    
    const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks';
    const method = taskId ? 'PUT' : 'POST';
    
    showLoading(true);
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // 業務負荷警告の表示
            if (result.warnings && result.warnings.length > 0) {
                const warningDiv = document.getElementById('workload-warning');
                const warningText = document.getElementById('workload-warning-text');
                
                const criticalWarnings = result.warnings.filter(w => w.status === 'critical');
                const normalWarnings = result.warnings.filter(w => w.status === 'warning');
                
                if (criticalWarnings.length > 0) {
                    warningDiv.className = 'workload-warning critical';
                    warningText.textContent = `破綻警告: ${criticalWarnings.length}日間で業務負荷が10時間を超えます`;
                } else if (normalWarnings.length > 0) {
                    warningDiv.className = 'workload-warning';
                    warningText.textContent = `負荷警告: ${normalWarnings.length}日間で業務負荷が8時間を超えます`;
                }
                
                warningDiv.style.display = 'flex';
                
                // 確認ダイアログ
                const confirmMessage = criticalWarnings.length > 0 
                    ? '業務負荷が破綻レベルに達しています。このタスクを追加しますか？'
                    : '業務負荷が高くなっています。このタスクを追加しますか？';
                    
                if (!confirm(confirmMessage)) {
                    return;
                }
            }
            
            showNotification(taskId ? 'タスクを更新しました' : 'タスクを追加しました', 'success');
            closeTaskModal();
            await loadAllData();
            updateTasksList();
            updateDashboard();
            if (calendar) calendar.refetchEvents();
        } else {
            throw new Error(result.error || 'タスクの保存に失敗しました');
        }
    } catch (error) {
        console.error('タスク保存エラー:', error);
        showNotification('タスクの保存に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// メンバーモーダル
function openMemberModal(memberId = null) {
    const modal = elements.memberModal;
    const title = document.getElementById('member-modal-title');
    const form = elements.memberForm;
    
    if (memberId) {
        const member = currentData.members.find(m => m.id === memberId);
        if (member) {
            title.textContent = 'メンバー編集';
            document.getElementById('member-id').value = member.id;
            document.getElementById('member-name').value = member.name;
            document.getElementById('member-department').value = member.department;
            document.getElementById('member-color').value = member.color;
        }
    } else {
        title.textContent = 'メンバー追加';
        form.reset();
        document.getElementById('member-id').value = '';
        document.getElementById('member-color').value = '#6b7280';
    }
    
    modal.classList.add('show');
}

function closeMemberModal() {
    elements.memberModal.classList.remove('show');
}

async function handleMemberSubmit(event) {
    event.preventDefault();
    
    const memberId = document.getElementById('member-id').value;
    const formData = {
        name: document.getElementById('member-name').value,
        department: document.getElementById('member-department').value,
        color: document.getElementById('member-color').value
    };
    
    const url = memberId ? `/api/members/${memberId}` : '/api/members';
    const method = memberId ? 'PUT' : 'POST';
    
    showLoading(true);
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification(memberId ? 'メンバーを更新しました' : 'メンバーを追加しました', 'success');
            closeMemberModal();
            await loadAllData();
            updateSelects();
            updateManagementLists();
            updateDashboard();
        } else {
            throw new Error('メンバーの保存に失敗しました');
        }
    } catch (error) {
        console.error('メンバー保存エラー:', error);
        showNotification('メンバーの保存に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// ルーティンジョブモーダル
function openRoutineModal(routineId = null) {
    const modal = elements.routineModal;
    const title = document.getElementById('routine-modal-title');
    const form = elements.routineForm;
    
    if (routineId) {
        const routine = currentData.routineJobs.find(r => r.id === routineId);
        if (routine) {
            title.textContent = 'ルーティンジョブ編集';
            document.getElementById('routine-id').value = routine.id;
            document.getElementById('routine-name').value = routine.name;
            document.getElementById('routine-description').value = routine.description;
            document.getElementById('routine-assignee').value = routine.assigneeId;
            document.getElementById('routine-daily-hours').value = routine.dailyHours;
            
            // 曜日チェックボックスを設定
            const checkboxes = form.querySelectorAll('.weekdays-selector input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = routine.weekdays.includes(parseInt(checkbox.value));
            });
        }
    } else {
        title.textContent = 'ルーティンジョブ追加';
        form.reset();
        document.getElementById('routine-id').value = '';
    }
    
    modal.classList.add('show');
}

function closeRoutineModal() {
    elements.routineModal.classList.remove('show');
}

async function handleRoutineSubmit(event) {
    event.preventDefault();
    
    const routineId = document.getElementById('routine-id').value;
    const checkboxes = elements.routineForm.querySelectorAll('.weekdays-selector input[type="checkbox"]:checked');
    const weekdays = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (weekdays.length === 0) {
        showNotification('実行曜日を1つ以上選択してください', 'error');
        return;
    }
    
    const formData = {
        name: document.getElementById('routine-name').value,
        description: document.getElementById('routine-description').value,
        assigneeId: document.getElementById('routine-assignee').value,
        dailyHours: parseFloat(document.getElementById('routine-daily-hours').value),
        weekdays: weekdays
    };
    
    const url = routineId ? `/api/routine-jobs/${routineId}` : '/api/routine-jobs';
    const method = routineId ? 'PUT' : 'POST';
    
    showLoading(true);
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification(routineId ? 'ルーティンジョブを更新しました' : 'ルーティンジョブを追加しました', 'success');
            closeRoutineModal();
            await loadAllData();
            updateRoutineJobsList();
        } else {
            throw new Error('ルーティンジョブの保存に失敗しました');
        }
    } catch (error) {
        console.error('ルーティンジョブ保存エラー:', error);
        showNotification('ルーティンジョブの保存に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 編集機能
function editProject(projectId) {
    openProjectModal(projectId);
}

function editTask(taskId) {
    openTaskModal(taskId);
}

function editMember(memberId) {
    openMemberModal(memberId);
}

function editRoutineJob(routineId) {
    openRoutineModal(routineId);
}

// 削除機能
async function deleteProject(projectId) {
    if (!confirm('このプロジェクトを削除しますか？関連するタスクも削除されます。')) return;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('プロジェクトを削除しました', 'success');
            await loadAllData();
            updateSelects();
            updateManagementLists();
            updateDashboard();
            updateTasksList();
        } else {
            throw new Error('プロジェクトの削除に失敗しました');
        }
    } catch (error) {
        console.error('プロジェクト削除エラー:', error);
        showNotification('プロジェクトの削除に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteTask(taskId) {
    if (!confirm('このタスクを削除しますか？')) return;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('タスクを削除しました', 'success');
            await loadAllData();
            updateTasksList();
            updateDashboard();
            if (calendar) calendar.refetchEvents();
        } else {
            throw new Error('タスクの削除に失敗しました');
        }
    } catch (error) {
        console.error('タスク削除エラー:', error);
        showNotification('タスクの削除に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteMember(memberId) {
    if (!confirm('このメンバーを削除しますか？')) return;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('メンバーを削除しました', 'success');
            await loadAllData();
            updateSelects();
            updateManagementLists();
            updateDashboard();
        } else {
            throw new Error('メンバーの削除に失敗しました');
        }
    } catch (error) {
        console.error('メンバー削除エラー:', error);
        showNotification('メンバーの削除に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteRoutineJob(routineId) {
    if (!confirm('このルーティンジョブを削除しますか？')) return;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/routine-jobs/${routineId}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('ルーティンジョブを削除しました', 'success');
            await loadAllData();
            updateRoutineJobsList();
        } else {
            throw new Error('ルーティンジョブの削除に失敗しました');
        }
    } catch (error) {
        console.error('ルーティンジョブ削除エラー:', error);
        showNotification('ルーティンジョブの削除に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// ユーティリティ関数
function getStatusText(status) {
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

function getPriorityText(priority) {
    const priorityMap = {
        low: '低',
        medium: '中',
        high: '高'
    };
    return priorityMap[priority] || priority;
}

function showLoading(show) {
    if (show) {
        elements.loading.classList.add('show');
    } else {
        elements.loading.classList.remove('show');
    }
}

function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// グローバル関数として公開（HTMLから呼び出せるように）
window.editProject = editProject;
window.editTask = editTask;
window.editMember = editMember;
window.editRoutineJob = editRoutineJob;
window.deleteProject = deleteProject;
window.deleteTask = deleteTask;
window.deleteMember = deleteMember;
window.deleteRoutineJob = deleteRoutineJob;
window.closeProjectModal = closeProjectModal;
window.closeTaskModal = closeTaskModal;
window.closeMemberModal = closeMemberModal;
window.closeRoutineModal = closeRoutineModal;

// 承認関連の関数をグローバルに公開
window.openSubmitApprovalModal = openSubmitApprovalModal;
window.closeSubmitApprovalModal = closeSubmitApprovalModal;
window.openApprovalModal = openApprovalModal;
window.closeApprovalModal = closeApprovalModal;
window.submitApproval = submitApproval;

// 階層承認関連の関数をグローバルに公開
window.openHierarchicalApprovalModal = openHierarchicalApprovalModal;
window.closeHierarchicalApprovalModal = closeHierarchicalApprovalModal;
window.submitHierarchicalApproval = submitHierarchicalApproval;
window.toggleHigherLevelSelection = toggleHigherLevelSelection;

// 承認申請モーダル
function openSubmitApprovalModal(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('submit-approval-modal');
    const taskInfo = document.getElementById('submit-approval-task-info');
    const member = currentData.members.find(m => m.id === task.assigneeId);
    const project = currentData.projects.find(p => p.id === task.projectId);
    const approver = currentData.members.find(m => m.id === task.approverId);
    
    document.getElementById('submit-approval-task-id').value = taskId;
    document.getElementById('submit-approval-documents').value = task.approvalDocuments || '';
    document.getElementById('submit-approval-notes').value = '';
    
    taskInfo.innerHTML = `
        <div class="task-info">
            <h4><i class="fas fa-tasks"></i> ${task.name}</h4>
            <div class="task-details">
                <p><strong>プロジェクト:</strong> ${project ? project.name : 'Unknown'}</p>
                <p><strong>担当者:</strong> ${member ? member.name : 'Unknown'}</p>
                <p><strong>承認者:</strong> ${approver ? approver.name : 'Unknown'}</p>
                <p><strong>期間:</strong> ${moment(task.startDate).format('YYYY/MM/DD')} - ${moment(task.endDate).format('YYYY/MM/DD')}</p>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeSubmitApprovalModal() {
    const modal = document.getElementById('submit-approval-modal');
    modal.classList.remove('show');
}

async function handleSubmitApprovalSubmit(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('submit-approval-task-id').value;
    const approvalDocuments = document.getElementById('submit-approval-documents').value;
    const notes = document.getElementById('submit-approval-notes').value;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/tasks/${taskId}/submit-approval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                approvalDocuments: approvalDocuments,
                notes: notes
            })
        });
        
        if (response.ok) {
            showNotification('承認申請を送信しました', 'success');
            closeSubmitApprovalModal();
            await loadAllData();
            updateTasksList();
            updateDashboard();
        } else {
            const error = await response.json();
            throw new Error(error.error || '承認申請の送信に失敗しました');
        }
    } catch (error) {
        console.error('承認申請エラー:', error);
        showNotification('承認申請の送信に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 承認処理モーダル
function openApprovalModal(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('approval-modal');
    const taskInfo = document.getElementById('approval-task-info');
    const member = currentData.members.find(m => m.id === task.assigneeId);
    const requester = currentData.members.find(m => m.id === task.requesterId);
    const project = currentData.projects.find(p => p.id === task.projectId);
    
    document.getElementById('approval-task-id').value = taskId;
    document.getElementById('approval-notes').value = '';
    
    let documentsLink = '';
    if (task.approvalDocuments) {
        documentsLink = `<p><strong>資料リンク:</strong> <a href="${task.approvalDocuments}" target="_blank">資料を開く <i class="fas fa-external-link-alt"></i></a></p>`;
    }
    
    taskInfo.innerHTML = `
        <div class="task-info">
            <h4><i class="fas fa-tasks"></i> ${task.name}</h4>
            <div class="task-details">
                <p><strong>プロジェクト:</strong> ${project ? project.name : 'Unknown'}</p>
                <p><strong>担当者:</strong> ${member ? member.name : 'Unknown'}</p>
                <p><strong>依頼者:</strong> ${requester ? requester.name : 'Unknown'}</p>
                <p><strong>期間:</strong> ${moment(task.startDate).format('YYYY/MM/DD')} - ${moment(task.endDate).format('YYYY/MM/DD')}</p>
                ${documentsLink}
                ${task.approvalNotes ? `<p><strong>申請コメント:</strong> ${task.approvalNotes}</p>` : ''}
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeApprovalModal() {
    const modal = document.getElementById('approval-modal');
    modal.classList.remove('show');
}

async function submitApproval(action) {
    const taskId = document.getElementById('approval-task-id').value;
    const notes = document.getElementById('approval-notes').value;
    
    const confirmMessage = action === 'approve' 
        ? 'このタスクを承認しますか？'
        : 'このタスクを却下しますか？';
        
    if (!confirm(confirmMessage)) return;
    
    showLoading(true);
    try {
        const response = await fetch(`/api/tasks/${taskId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approvalNotes: notes })
        });
        
        if (response.ok) {
            const message = action === 'approve' ? 'タスクを承認しました' : 'タスクを却下しました';
            showNotification(message, 'success');
            closeApprovalModal();
            await loadAllData();
            updateTasksList();
            updateDashboard();
        } else {
            const error = await response.json();
            throw new Error(error.error || '承認処理に失敗しました');
        }
    } catch (error) {
        console.error('承認処理エラー:', error);
        showNotification('承認処理に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// CSV出力機能
async function exportTasksToCSV() {
    try {
        showLoading(true);
        const response = await fetch('/api/tasks/export/csv');
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `タスク一覧_${moment().format('YYYY-MM-DD')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('CSVファイルをダウンロードしました', 'success');
        } else {
            throw new Error('CSV出力に失敗しました');
        }
    } catch (error) {
        console.error('CSV出力エラー:', error);
        showNotification('CSV出力に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}

// 階層承認モーダル
function openHierarchicalApprovalModal(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('hierarchical-approval-modal');
    const taskInfo = document.getElementById('hierarchical-approval-task-info');
    const member = currentData.members.find(m => m.id === task.assigneeId);
    const requester = currentData.members.find(m => m.id === task.requesterId);
    const project = currentData.projects.find(p => p.id === task.projectId);
    
    const currentLevel = task.currentApprovalLevel || 1;
    const currentApproverId = task[`approvalLevel${currentLevel}Id`];
    const currentApprover = currentApproverId ? currentData.members.find(m => m.id === currentApproverId) : null;
    
    document.getElementById('hierarchical-approval-task-id').value = taskId;
    document.getElementById('hierarchical-approval-notes').value = '';
    document.getElementById('needs-higher-level').checked = false;
    document.getElementById('higher-level-selection').style.display = 'none';
    
    // 上位レベル承認者の選択肢を更新
    updateHigherLevelApproverOptions();
    
    let documentsLink = '';
    if (task.approvalDocuments) {
        documentsLink = `<p><strong>資料リンク:</strong> <a href="${task.approvalDocuments}" target="_blank">資料を開く <i class="fas fa-external-link-alt"></i></a></p>`;
    }
    
    // 承認履歴を表示
    let approvalHistoryHtml = '';
    if (task.approvalHistory && task.approvalHistory.length > 0) {
        approvalHistoryHtml = '<div class="approval-history"><h5>承認履歴:</h5>';
        task.approvalHistory.forEach(history => {
            const historyApprover = currentData.members.find(m => m.id === history.approverId);
            const actionText = {
                'approved_with_escalation': '承認（エスカレーション）',
                'approved_final': '最終承認',
                'rejected': '却下',
                'auto_submitted': '自動申請'
            }[history.action] || history.action;
            
            approvalHistoryHtml += `
                <div class="history-item">
                    <strong>レベル${history.level}:</strong> ${historyApprover ? historyApprover.name : 'Unknown'} - ${actionText}<br>
                    <small>${moment(history.timestamp).format('YYYY/MM/DD HH:mm')}: ${history.notes}</small>
                </div>
            `;
        });
        approvalHistoryHtml += '</div>';
    }
    
    taskInfo.innerHTML = `
        <div class="task-info">
            <h4><i class="fas fa-tasks"></i> ${task.name}</h4>
            <div class="task-details">
                <p><strong>プロジェクト:</strong> ${project ? project.name : 'Unknown'}</p>
                <p><strong>担当者:</strong> ${member ? member.name : 'Unknown'}</p>
                <p><strong>依頼者:</strong> ${requester ? requester.name : 'Unknown'}</p>
                <p><strong>現在の承認レベル:</strong> ${currentLevel}</p>
                <p><strong>現在の承認者:</strong> ${currentApprover ? currentApprover.name : 'Unknown'}</p>
                <p><strong>期間:</strong> ${moment(task.startDate).format('YYYY/MM/DD')} - ${moment(task.endDate).format('YYYY/MM/DD')}</p>
                ${documentsLink}
                ${approvalHistoryHtml}
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeHierarchicalApprovalModal() {
    const modal = document.getElementById('hierarchical-approval-modal');
    modal.classList.remove('show');
}

function toggleHigherLevelSelection() {
    const checkbox = document.getElementById('needs-higher-level');
    const selection = document.getElementById('higher-level-selection');
    
    if (checkbox.checked) {
        selection.style.display = 'block';
    } else {
        selection.style.display = 'none';
        document.getElementById('higher-level-approver').value = '';
    }
}

function updateHigherLevelApproverOptions() {
    const select = document.getElementById('higher-level-approver');
    
    // 既存のオプション（最初の選択肢以外）を削除
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // メンバーオプションを追加
    currentData.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.name} (${member.department})`;
        select.appendChild(option);
    });
}

async function submitHierarchicalApproval(action) {
    const taskId = document.getElementById('hierarchical-approval-task-id').value;
    const notes = document.getElementById('hierarchical-approval-notes').value;
    const needsHigherLevel = document.getElementById('needs-higher-level').checked;
    const higherLevelApproverId = document.getElementById('higher-level-approver').value;
    
    if (action === 'approve') {
        if (needsHigherLevel && !higherLevelApproverId) {
            showNotification('上位レベルの承認者を選択してください', 'error');
            return;
        }
        
        const confirmMessage = needsHigherLevel 
            ? `このタスクを承認し、上位レベルにエスカレーションしますか？`
            : `このタスクを最終承認しますか？`;
            
        if (!confirm(confirmMessage)) return;
    } else {
        if (!confirm('このタスクを却下しますか？')) return;
    }
    
    showLoading(true);
    try {
        const endpoint = action === 'approve' ? 'approve-with-level' : 'reject-with-level';
        const requestBody = {
            approvalNotes: notes
        };
        
        if (action === 'approve') {
            requestBody.needsHigherLevel = needsHigherLevel;
            if (needsHigherLevel && higherLevelApproverId) {
                requestBody.higherLevelApproverId = higherLevelApproverId;
            }
        }
        
        const response = await fetch(`/api/tasks/${taskId}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            let message = action === 'approve' ? 'タスクを承認しました' : 'タスクを却下しました';
            
            if (result.escalated) {
                const higherApprover = currentData.members.find(m => m.id == higherLevelApproverId);
                message += `。${higherApprover ? higherApprover.name : '上位承認者'}に自動で承認依頼を送信しました。`;
            }
            
            showNotification(message, 'success');
            closeHierarchicalApprovalModal();
            await loadAllData();
            updateTasksList();
            updateDashboard();
        } else {
            throw new Error(result.error || '階層承認処理に失敗しました');
        }
    } catch (error) {
        console.error('階層承認処理エラー:', error);
        showNotification('階層承認処理に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
}