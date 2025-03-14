/**
 * money.js - 金钱相关功能，存款目标和记录
 */

import { appData, saveData } from './core.js';
import { formatMoney, showToast, showModal } from './utils.js';

// 定义一个安全的金额处理类
class SafeMoney {
    constructor(amount = 0) {
        this.value = Math.round(amount);
    }

    static fromYuan(yuan) {
        return new SafeMoney(yuan);
    }

    static fromValue(value) {
        const money = new SafeMoney(0);
        money.value = Math.round(value);
        return money;
    }

    add(other) {
        if (other instanceof SafeMoney) {
            return SafeMoney.fromValue(this.value + other.value);
        }
        return SafeMoney.fromValue(this.value + Math.round(other));
    }

    subtract(other) {
        if (other instanceof SafeMoney) {
            return SafeMoney.fromValue(this.value - other.value);
        }
        return SafeMoney.fromValue(this.value - Math.round(other));
    }

    toYuan() {
        return this.value;
    }

    toString() {
        return this.value.toString();
    }
}

// 解析金额
function parseAmount(input) {
    try {
        let amount = 0;
        const units = {
            '万': 10000,
            'w': 10000,
            '十万': 100000,
            'sw': 100000,
            '百万': 1000000,
            'bw': 1000000
        };
        
        for (const [unit, multiplier] of Object.entries(units)) {
            if (input.includes(unit)) {
                const numPart = input.split(unit)[0] || '1';
                if (!isNaN(numPart)) {
                    amount = Math.round(parseFloat(numPart) * multiplier);
                    break;
                }
            }
        }
        
        if (amount === 0) {
            if (!isNaN(input)) {
                amount = Math.round(parseFloat(input));
            } else {
                throw new Error('无效的金额格式');
            }
        }
        
        if (isNaN(amount) || amount <= 0) {
            throw new Error('金额必须大于0');
        }
        
        return amount;
    } catch (error) {
        throw new Error('解析金额失败: ' + error.message);
    }
}

// 处理金额表单提交
function handleMoneyFormSubmit(event) {
    event.preventDefault();
    
    const operationType = document.querySelector('input[name="operationType"]:checked')?.value;
    if (!operationType) {
        showToast('请选择操作类型');
        return;
    }
    
    const amountInput = document.getElementById('amount').value.trim();
    if (!amountInput) {
        showToast('请输入金额');
        return;
    }
    
    try {
        const amount = parseAmount(amountInput);
        const note = document.getElementById('note').value.trim();
        
        if (operationType === 'deposit') {
            deposit(amount, note);
        } else if (operationType === 'withdraw') {
            withdraw(amount, note);
        }
        
        // 清空表单
        document.getElementById('amount').value = '';
        document.getElementById('note').value = '';
        
        // 更新视图
        displaySavingsGoals(document.getElementById('goalsContainer'));
        
    } catch (error) {
        showToast(error.message);
    }
}

// 存款
function deposit(amount, note) {
    appData.totalSaved += amount;
    addHistory('deposit', amount, note);
    saveData();
    showToast(`成功存入 ${formatMoney(amount)}`);
}

// 取款
function withdraw(amount, note) {
    if (amount > appData.totalSaved) {
        showToast('取款金额不能大于总存款');
        return;
    }
    
    appData.totalSaved -= amount;
    addHistory('withdraw', amount, note);
    saveData();
    showToast(`成功取出 ${formatMoney(amount)}`);
}

// 添加历史记录
function addHistory(type, amount, note) {
    appData.history.push({
        id: Date.now(),
        type,
        amount,
        note,
        timestamp: new Date().toISOString()
    });
    saveData();
}

// 删除历史记录
function deleteHistory(id) {
    const index = appData.history.findIndex(record => record.id === id);
    if (index !== -1) {
        appData.history.splice(index, 1);
        saveData();
        showToast('记录已删除');
    }
}

// 清空历史记录
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗?')) {
        appData.history = [];
        saveData();
        showToast('历史记录已清空');
    }
}

// 清空归档记录
function clearArchived() {
    if (confirm('确定要清空所有归档记录吗?')) {
        appData.archivedGoals = [];
        appData.archivedAgeGoals = [];
        saveData();
        showToast('归档记录已清空');
    }
}

// 重置存款
function resetSavings() {
    if (confirm('确定要重置所有存款吗? 这将清空所有存款目标和记录。')) {
        appData.totalSaved = 0;
        appData.goals = [];
        appData.history = [];
        appData.archivedGoals = [];
        saveData();
        showToast('存款已重置');
    }
}

// 显示存款目标
function displaySavingsGoals(container) {
    container.innerHTML = '';
    
    if (appData.goals.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无存款目标，请添加目标</div>';
        return;
    }
    
    document.getElementById('totalSaved').textContent = formatMoney(appData.totalSaved);
    
    // 按目标金额排序
    const sortedGoals = [...appData.goals].sort((a, b) => a.amount - b.amount);
    
    for (let i = 0; i < sortedGoals.length; i++) {
        container.appendChild(createGoalCard(sortedGoals[i], i));
    }
}

// 创建目标卡片
function createGoalCard(goal, index) {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    
    const progress = Math.min(100, (appData.totalSaved / goal.amount) * 100).toFixed(1);
    const progressClass = progress >= 100 ? 'high' : progress >= 50 ? 'medium' : 'low';
    
    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="card-title">${goal.name}</h5>
                <div>
                    <button class="btn btn-sm btn-primary" onclick="editGoal(${index})">编辑</button>
                    <button class="btn btn-sm btn-success" onclick="archiveGoal(${index}, 'savings')">归档</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGoal(${index})">删除</button>
                </div>
            </div>
            <div class="progress-wrapper">
                <div class="amount-display-wrapper">
                    <div class="amount-item">
                        <div class="amount-label">当前存款</div>
                        <div class="amount-value current">${formatMoney(appData.totalSaved)}</div>
                    </div>
                    <div class="amount-item">
                        <div class="amount-label">目标金额</div>
                        <div class="amount-value target">${formatMoney(goal.amount)}</div>
                    </div>
                </div>
                <div class="progress">
                    <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${progress}%">
                        <span class="progress-text">${progress}%</span>
                    </div>
                </div>
                <div class="progress-details">
                    <div>完成: ${progress}%</div>
                    <div class="remaining-amount">
                        剩余: ${formatMoney(Math.max(0, goal.amount - appData.totalSaved))}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 处理目标表单提交
function handleGoalFormSubmit(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('goalName').value.trim();
    const amountInput = document.getElementById('goalAmount').value.trim();
    
    if (!nameInput) {
        showToast('请输入目标名称');
        return;
    }
    
    if (!amountInput) {
        showToast('请输入目标金额');
        return;
    }
    
    try {
        const amount = parseAmount(amountInput);
        
        addGoal(nameInput, amount);
        
        // 清空表单
        document.getElementById('goalName').value = '';
        document.getElementById('goalAmount').value = '';
        
    } catch (error) {
        showToast(error.message);
    }
}

// 添加存款目标
function addGoal(name, amount) {
    appData.goals.push({
        name,
        amount,
        createdAt: new Date().toISOString()
    });
    
    saveData();
    displaySavingsGoals(document.getElementById('goalsContainer'));
    showToast('目标已添加');
}

// 删除存款目标
function deleteGoal(index) {
    if (confirm('确定要删除这个目标吗?')) {
        appData.goals.splice(index, 1);
        saveData();
        displaySavingsGoals(document.getElementById('goalsContainer'));
        showToast('目标已删除');
    }
}

// 编辑存款目标
function editGoal(index) {
    const goal = appData.goals[index];
    
    if (!goal) {
        showToast('目标不存在');
        return;
    }
    
    const modalContent = `
        <form id="editGoalForm">
            <input type="hidden" id="editGoalIndex" value="${index}">
            <div class="mb-3">
                <label for="editGoalName" class="form-label">目标名称:</label>
                <input type="text" class="form-control" id="editGoalName" value="${goal.name}" required>
            </div>
            <div class="mb-3">
                <label for="editGoalAmount" class="form-label">目标金额:</label>
                <input type="text" class="form-control" id="editGoalAmount" value="${goal.amount}" required>
            </div>
        </form>
    `;
    
    showModal({
        id: 'editGoalModal',
        title: '编辑存款目标',
        content: modalContent,
        onSave: saveEditedGoal
    });
}

// 保存编辑后的目标
function saveEditedGoal() {
    const index = parseInt(document.getElementById('editGoalIndex').value);
    const name = document.getElementById('editGoalName').value.trim();
    const amountInput = document.getElementById('editGoalAmount').value.trim();
    
    if (!name) {
        alert('请输入目标名称');
        return;
    }
    
    try {
        const amount = parseAmount(amountInput);
        
        appData.goals[index] = {
            ...appData.goals[index],
            name,
            amount
        };
        
        saveData();
        displaySavingsGoals(document.getElementById('goalsContainer'));
        showToast('目标已更新');
        
    } catch (error) {
        alert(error.message);
    }
}

// 归档目标
function archiveGoal(index, type = 'savings') {
    if (type === 'savings') {
        const goal = appData.goals[index];
        if (goal) {
            appData.archivedGoals.push({
                ...goal,
                archivedAt: new Date().toISOString()
            });
            appData.goals.splice(index, 1);
            saveData();
            displaySavingsGoals(document.getElementById('goalsContainer'));
            showToast('目标已归档');
        }
    }
}

// 从归档恢复目标
function restoreArchivedGoal(index, type = 'savings') {
    if (type === 'savings') {
        const goal = appData.archivedGoals[index];
        if (goal) {
            // 移除归档时间戳
            const { archivedAt, ...goalData } = goal;
            appData.goals.push(goalData);
            appData.archivedGoals.splice(index, 1);
            saveData();
            showToast('目标已恢复');
            return true;
        }
    }
    return false;
}

// 显示归档记录
function displayArchived(container) {
    container.innerHTML = '';
    
    if (appData.archivedGoals.length === 0 && appData.archivedAgeGoals.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无归档记录</div>';
        return;
    }
    
    // 显示存款目标归档
    if (appData.archivedGoals.length > 0) {
        const savingsArchivedSection = document.createElement('div');
        savingsArchivedSection.className = 'mb-4';
        savingsArchivedSection.innerHTML = `<h5 class="archive-category-title">存款目标归档</h5>`;
        
        const archiveGrid = document.createElement('div');
        archiveGrid.className = 'archive-grid';
        
        appData.archivedGoals.forEach((goal, index) => {
            const archiveCard = document.createElement('div');
            archiveCard.className = 'archive-card';
            
            const archiveDate = new Date(goal.archivedAt);
            archiveCard.innerHTML = `
                <div class="archive-info">
                    <div class="archive-name">${goal.name}</div>
                    <div class="archive-target">${formatMoney(goal.amount)}</div>
                </div>
                <div class="archive-info">
                    <div class="archive-date">归档于 ${archiveDate.toLocaleDateString()}</div>
                    <button class="btn btn-primary btn-sm" onclick="restoreArchivedGoal(${index}, 'savings')">恢复</button>
                </div>
            `;
            
            archiveGrid.appendChild(archiveCard);
        });
        
        savingsArchivedSection.appendChild(archiveGrid);
        container.appendChild(savingsArchivedSection);
    }
    
    // 显示年龄目标归档 (这部分将在age.js中实现)
}

// 显示历史记录
function displayHistory(container) {
    container.innerHTML = '';
    
    if (appData.history.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无历史记录</div>';
        return;
    }
    
    // 创建视图切换按钮
    const viewSwitch = document.createElement('div');
    viewSwitch.className = 'view-switch';
    viewSwitch.innerHTML = `
        <button id="gridViewBtn" class="active"><i class="fas fa-th"></i> 网格视图</button>
        <button id="timelineViewBtn"><i class="fas fa-stream"></i> 时间线视图</button>
    `;
    container.appendChild(viewSwitch);
    
    // 创建统计区域
    const statsSection = document.createElement('div');
    statsSection.className = 'mb-4';
    statsSection.innerHTML = `
        <div class="btn-group">
            <button class="btn btn-outline-primary" onclick="showStatistics('today', true)">今日</button>
            <button class="btn btn-outline-primary" onclick="showStatistics('week', true)">本周</button>
            <button class="btn btn-outline-primary" onclick="showStatistics('month', true)">本月</button>
            <button class="btn btn-outline-primary" onclick="showStatistics('year', true)">本年</button>
            <button class="btn btn-outline-primary" onclick="showStatistics('all', true)">全部</button>
        </div>
        <div id="statisticsResult" class="mt-3"></div>
    `;
    container.appendChild(statsSection);
    
    // 创建历史记录区域
    const historyContent = document.createElement('div');
    historyContent.id = 'historyContent';
    container.appendChild(historyContent);
    
    // 初始化显示网格视图
    displayGridView();
    
    // 添加视图切换事件监听
    document.getElementById('gridViewBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('timelineViewBtn').classList.remove('active');
        displayGridView();
    });
    
    document.getElementById('timelineViewBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('gridViewBtn').classList.remove('active');
        displayTimelineView();
    });
    
    // 初始显示全部统计
    showStatistics('all', true);
}

// 网格视图显示历史记录
function displayGridView() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = '';
    
    const sortedHistory = [...appData.history].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const historyGrid = document.createElement('div');
    historyGrid.className = 'history-grid';
    
    sortedHistory.forEach(record => {
        const recordCard = document.createElement('div');
        recordCard.className = 'history-card';
        
        const recordDate = new Date(record.timestamp);
        const isDeposit = record.type === 'deposit';
        
        recordCard.innerHTML = `
            <div class="history-card-header ${isDeposit ? 'deposit' : 'withdraw'}">
                <div class="history-type">${isDeposit ? '存入' : '取出'}</div>
                <div class="history-amount">${formatMoney(record.amount)}</div>
            </div>
            <div class="history-card-body">
                ${record.note ? `<div class="history-note">${record.note}</div>` : ''}
                <div class="history-date">${recordDate.toLocaleString()}</div>
            </div>
            <div class="history-card-footer">
                <button class="btn btn-danger btn-sm" onclick="deleteHistory(${record.id})">删除</button>
            </div>
        `;
        
        historyGrid.appendChild(recordCard);
    });
    
    historyContent.appendChild(historyGrid);
}

// 时间线视图显示历史记录
function displayTimelineView() {
    // 实现时间线视图
}

// 显示统计信息
function showStatistics(period, inPage = false) {
    const stats = calculateStatistics(period);
    
    const formatTitle = () => {
        switch(period) {
            case 'today': return '今日';
            case 'week': return '本周';
            case 'month': return '本月';
            case 'year': return '本年';
            case 'all': return '全部';
            default: return '';
        }
    };
    
    const statsHtml = `
        <div class="statistics-card">
            <h5>${formatTitle()}统计</h5>
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-label">存入</div>
                    <div class="stat-value deposit">${formatMoney(stats.deposit)}</div>
                    <div class="stat-count">${stats.depositCount}笔</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">取出</div>
                    <div class="stat-value withdraw">${formatMoney(stats.withdraw)}</div>
                    <div class="stat-count">${stats.withdrawCount}笔</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">净收入</div>
                    <div class="stat-value ${stats.net >= 0 ? 'deposit' : 'withdraw'}">${formatMoney(stats.net)}</div>
                    <div class="stat-count">${stats.totalCount}笔</div>
                </div>
            </div>
        </div>
    `;
    
    if (inPage) {
        document.getElementById('statisticsResult').innerHTML = statsHtml;
    } else {
        return statsHtml;
    }
}

// 计算统计信息
function calculateStatistics(period) {
    // 实现统计计算
    return {
        deposit: 0,
        withdraw: 0,
        net: 0,
        depositCount: 0,
        withdrawCount: 0,
        totalCount: 0
    };
}

// 导出金钱相关功能
export {
    SafeMoney,
    parseAmount,
    handleMoneyFormSubmit,
    deposit,
    withdraw,
    addHistory,
    deleteHistory,
    clearHistory,
    clearArchived,
    resetSavings,
    displaySavingsGoals,
    createGoalCard,
    handleGoalFormSubmit,
    addGoal,
    deleteGoal,
    editGoal,
    saveEditedGoal,
    archiveGoal,
    restoreArchivedGoal,
    displayArchived,
    displayHistory,
    displayGridView,
    displayTimelineView,
    showStatistics,
    calculateStatistics
}; 