/**
 * habit.js - 习惯打卡相关功能
 */

import { appData, saveData } from './core.js';
import { showToast, formatDate } from './utils.js';

// 显示习惯打卡
function displayHabits(container) {
    container.innerHTML = '';
    
    // 创建习惯打卡UI
    const habitsElement = document.createElement('div');
    habitsElement.className = 'habits-wrapper';
    habitsElement.innerHTML = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>我的习惯</h5>
                <button id="addHabitBtn" class="btn btn-sm btn-primary">
                    <i class="fas fa-plus"></i> 添加习惯
                </button>
            </div>
            <div class="card-body">
                <div id="habitsList" class="habits-list">
                    <!-- 习惯列表将在这里显示 -->
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5>习惯统计</h5>
            </div>
            <div class="card-body">
                <div id="habitsStats" class="habits-stats">
                    <!-- 习惯统计将在这里显示 -->
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(habitsElement);
    
    // 添加按钮事件监听
    document.getElementById('addHabitBtn').addEventListener('click', () => {
        showAddHabitModal();
    });
    
    // 显示习惯列表
    displayHabitsList();
    
    // 显示习惯统计
    displayHabitsStats();
}

// 显示习惯列表
function displayHabitsList() {
    const habitsListElement = document.getElementById('habitsList');
    if (!habitsListElement) return;
    
    if (!appData.habits || appData.habits.length === 0) {
        habitsListElement.innerHTML = '<div class="text-center p-4 text-muted">暂无习惯记录，添加一个新习惯吧!</div>';
        return;
    }
    
    // 按照创建时间排序（最新的在前面）
    const sortedHabits = [...appData.habits].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 创建习惯列表
    const habitsHTML = sortedHabits.map((habit, index) => {
        // 计算习惯连续天数
        const streak = calculateStreak(habit);
        
        // 计算总完成次数
        const totalCompletions = Object.values(habit.completions || {}).filter(completed => completed).length;
        
        // 获取今天的日期格式化为 YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
        
        // 检查今天是否已完成
        const isCompletedToday = habit.completions && habit.completions[today];
        
        return `
            <div class="habit-item card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="habit-name">${habit.name}</h5>
                            <div class="habit-description text-muted small">${habit.description || ''}</div>
                            <div class="habit-stats mt-2">
                                <span class="badge bg-success me-2">连续 ${streak} 天</span>
                                <span class="badge bg-info">总计 ${totalCompletions} 次</span>
                            </div>
                        </div>
                        <div class="habit-actions">
                            <button class="btn btn-sm ${isCompletedToday ? 'btn-success' : 'btn-outline-success'} me-1" 
                                    onclick="toggleHabitCompletion(${index}, '${today}')">
                                <i class="fas ${isCompletedToday ? 'fa-check-circle' : 'fa-circle'}"></i>
                                ${isCompletedToday ? '已完成' : '打卡'}
                            </button>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editHabit(${index})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteHabit(${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="habit-calendar mt-3">
                        ${generateHabitCalendar(habit)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    habitsListElement.innerHTML = habitsHTML;
}

// 显示习惯统计
function displayHabitsStats() {
    const habitsStatsElement = document.getElementById('habitsStats');
    if (!habitsStatsElement) return;
    
    if (!appData.habits || appData.habits.length === 0) {
        habitsStatsElement.innerHTML = '<div class="text-center p-4 text-muted">暂无数据可统计</div>';
        return;
    }
    
    // 计算总习惯数
    const totalHabits = appData.habits.length;
    
    // 计算今天已完成的习惯数
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = appData.habits.filter(habit => 
        habit.completions && habit.completions[today]
    ).length;
    
    // 计算总的习惯完成次数
    let totalCompletions = 0;
    appData.habits.forEach(habit => {
        if (habit.completions) {
            totalCompletions += Object.values(habit.completions).filter(completed => completed).length;
        }
    });
    
    // 计算最长连续天数
    const longestStreak = appData.habits.reduce((max, habit) => {
        const currentStreak = calculateStreak(habit);
        return currentStreak > max ? currentStreak : max;
    }, 0);
    
    // 显示统计数据
    habitsStatsElement.innerHTML = `
        <div class="row">
            <div class="col-6 col-md-3 mb-3">
                <div class="stats-card p-3 text-center border rounded">
                    <div class="stats-value">${totalHabits}</div>
                    <div class="stats-label small text-muted">总习惯数</div>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="stats-card p-3 text-center border rounded">
                    <div class="stats-value">${completedToday}/${totalHabits}</div>
                    <div class="stats-label small text-muted">今日完成</div>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="stats-card p-3 text-center border rounded">
                    <div class="stats-value">${totalCompletions}</div>
                    <div class="stats-label small text-muted">总完成次数</div>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="stats-card p-3 text-center border rounded">
                    <div class="stats-value">${longestStreak}</div>
                    <div class="stats-label small text-muted">最长连续天数</div>
                </div>
            </div>
        </div>
        <div id="habitsChartContainer" style="height: 300px;">
            <!-- 图表将在这里显示 -->
        </div>
    `;
    
    // 绘制习惯趋势图表
    drawHabitsTrendChart();
}

// 绘制习惯趋势图表
function drawHabitsTrendChart() {
    const chartContainer = document.getElementById('habitsChartContainer');
    if (!chartContainer) return;
    
    if (!appData.habits || appData.habits.length === 0) {
        chartContainer.innerHTML = '<div class="text-center p-4 text-muted">暂无数据可显示</div>';
        return;
    }
    
    // 准备图表数据
    // 获取最近30天的日期
    const dates = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push(date.toISOString().slice(0, 10));
    }
    
    // 统计每天完成的习惯数
    const completionData = dates.map(date => {
        return appData.habits.filter(habit => 
            habit.completions && habit.completions[date]
        ).length;
    });
    
    // 绘制图表
    chartContainer.innerHTML = '<canvas id="habitsTrendChart"></canvas>';
    const ctx = document.getElementById('habitsTrendChart').getContext('2d');
    
    // 如果已存在图表实例，先销毁
    if (window.habitsTrendChartInstance) {
        window.habitsTrendChartInstance.destroy();
    }
    
    // 创建新图表
    window.habitsTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => formatDate(date, { short: true })),
            datasets: [{
                label: '完成的习惯数',
                data: completionData,
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: appData.habits.length,
                    stepSize: 1
                }
            }
        }
    });
}

// 生成习惯日历
function generateHabitCalendar(habit) {
    // 获取最近7天的日期
    const dates = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push({
            date: date,
            dateStr: date.toISOString().slice(0, 10),
            dayName: getDayName(date.getDay(), true)
        });
    }
    
    // 生成日历HTML
    return `
        <div class="habit-calendar-grid">
            ${dates.map(({ date, dateStr, dayName }) => {
                const isCompleted = habit.completions && habit.completions[dateStr];
                return `
                    <div class="habit-calendar-day">
                        <div class="day-name">${dayName}</div>
                        <div class="day-indicator ${isCompleted ? 'completed' : ''}">
                            ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 获取星期几名称
function getDayName(dayIndex, short = false) {
    const days = {
        long: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        short: ['日', '一', '二', '三', '四', '五', '六']
    };
    return days[short ? 'short' : 'long'][dayIndex];
}

// 计算习惯连续天数
function calculateStreak(habit) {
    if (!habit.completions) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 从今天开始向前检查
    for (let i = 0; i < 1000; i++) { // 设置上限，避免无限循环
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        
        if (habit.completions[dateStr]) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// 切换习惯完成状态
function toggleHabitCompletion(index, dateStr) {
    if (!appData.habits || !appData.habits[index]) return;
    
    const habit = appData.habits[index];
    
    if (!habit.completions) {
        habit.completions = {};
    }
    
    // 切换完成状态
    habit.completions[dateStr] = !habit.completions[dateStr];
    
    // 保存数据
    saveData();
    
    // 更新UI
    displayHabitsList();
    displayHabitsStats();
    
    showToast(habit.completions[dateStr] ? '习惯打卡成功!' : '已取消习惯打卡');
}

// 显示添加习惯模态框
function showAddHabitModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addHabitModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">添加新习惯</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="addHabitForm">
                        <div class="mb-3">
                            <label for="habitName" class="form-label">习惯名称</label>
                            <input type="text" class="form-control" id="habitName" required>
                        </div>
                        <div class="mb-3">
                            <label for="habitDescription" class="form-label">描述 (可选)</label>
                            <textarea class="form-control" id="habitDescription" rows="2"></textarea>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="completeToday">
                                <label class="form-check-label" for="completeToday">
                                    今天已完成
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="saveHabitBtn">保存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 保存习惯
    document.getElementById('saveHabitBtn').addEventListener('click', () => {
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDescription').value.trim();
        const completeToday = document.getElementById('completeToday').checked;
        
        if (!name) {
            alert('请输入习惯名称');
            return;
        }
        
        // 添加习惯
        addHabit(name, description, completeToday);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 添加习惯
function addHabit(name, description = '', completeToday = false) {
    // 创建新习惯对象
    const habit = {
        name,
        description,
        createdAt: new Date().toISOString(),
        completions: {}
    };
    
    // 如果今天已完成，标记为已完成
    if (completeToday) {
        const today = new Date().toISOString().slice(0, 10);
        habit.completions[today] = true;
    }
    
    // 添加到应用数据
    if (!appData.habits) {
        appData.habits = [];
    }
    
    appData.habits.push(habit);
    saveData();
    
    // 更新UI
    displayHabitsList();
    displayHabitsStats();
    
    showToast('习惯已添加');
}

// 编辑习惯
function editHabit(index) {
    if (!appData.habits || !appData.habits[index]) return;
    
    const habit = appData.habits[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editHabitModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">编辑习惯</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editHabitForm">
                        <div class="mb-3">
                            <label for="editHabitName" class="form-label">习惯名称</label>
                            <input type="text" class="form-control" id="editHabitName" value="${habit.name}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editHabitDescription" class="form-label">描述 (可选)</label>
                            <textarea class="form-control" id="editHabitDescription" rows="2">${habit.description || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="updateHabitBtn" data-index="${index}">更新</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 更新习惯
    document.getElementById('updateHabitBtn').addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const name = document.getElementById('editHabitName').value.trim();
        const description = document.getElementById('editHabitDescription').value.trim();
        
        if (!name) {
            alert('请输入习惯名称');
            return;
        }
        
        // 更新习惯
        updateHabit(index, name, description);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 更新习惯
function updateHabit(index, name, description = '') {
    if (!appData.habits || !appData.habits[index]) return;
    
    appData.habits[index].name = name;
    appData.habits[index].description = description;
    
    saveData();
    
    // 更新UI
    displayHabitsList();
    displayHabitsStats();
    
    showToast('习惯已更新');
}

// 删除习惯
function deleteHabit(index) {
    if (!appData.habits || !appData.habits[index]) return;
    
    if (confirm('确定要删除这个习惯吗? 所有记录都将被删除。')) {
        appData.habits.splice(index, 1);
        saveData();
        
        // 更新UI
        displayHabitsList();
        displayHabitsStats();
        
        showToast('习惯已删除');
    }
}

// 导出习惯打卡相关功能
export {
    displayHabits,
    displayHabitsList,
    displayHabitsStats,
    drawHabitsTrendChart,
    generateHabitCalendar,
    getDayName,
    calculateStreak,
    toggleHabitCompletion,
    showAddHabitModal,
    addHabit,
    editHabit,
    updateHabit,
    deleteHabit
}; 