/**
 * time-tracking.js - 时间追踪相关功能
 */

import { appData, saveData } from './core.js';
import { showToast, formatDate } from './utils.js';

// 显示时间统计
function displayTimeTracking(container) {
    container.innerHTML = '';
    
    // 添加时间统计的UI元素
    const timeTrackingElement = document.createElement('div');
    timeTrackingElement.className = 'time-tracking-wrapper';
    timeTrackingElement.innerHTML = `
        <div class="card mb-4">
            <div class="card-header">
                <h5>时间追踪</h5>
            </div>
            <div class="card-body">
                <div class="time-display-container mb-3">
                    <div class="current-time" id="currentTime">00:00:00</div>
                    <div id="currentActivity" class="mt-2 text-muted">未开始追踪活动</div>
                </div>
                <div class="time-controls">
                    <button id="startTimeBtn" class="btn btn-success">开始</button>
                    <button id="pauseTimeBtn" class="btn btn-warning" disabled>暂停</button>
                    <button id="stopTimeBtn" class="btn btn-danger" disabled>结束</button>
                </div>
                <div class="time-event-form mt-3" id="timeEventForm" style="display: none;">
                    <div class="mb-3">
                        <label for="timeEventName" class="form-label">活动名称</label>
                        <input type="text" id="timeEventName" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label for="timeEventCategory" class="form-label">类别</label>
                        <select id="timeEventCategory" class="form-select">
                            <option value="work">工作</option>
                            <option value="study">学习</option>
                            <option value="exercise">锻炼</option>
                            <option value="leisure">休闲</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <button type="button" id="saveTimeEventBtn" class="btn btn-primary">保存</button>
                </div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>时间记录</h5>
                <div class="time-filters">
                    <select id="timeFilterPeriod" class="form-select form-select-sm">
                        <option value="day">今天</option>
                        <option value="week">本周</option>
                        <option value="month">本月</option>
                        <option value="all">全部</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <div id="timeChart" class="mb-4" style="height: 300px;">
                    <!-- 图表将在这里渲染 -->
                </div>
                <div id="timeEventsList" class="time-events-list">
                    <!-- 时间记录将在这里展示 -->
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(timeTrackingElement);
    
    // 初始化时间追踪模块
    initTimeTracking();
}

// 初始化时间追踪
function initTimeTracking() {
    // 获取时间控制按钮
    const startTimeBtn = document.getElementById('startTimeBtn');
    const pauseTimeBtn = document.getElementById('pauseTimeBtn');
    const stopTimeBtn = document.getElementById('stopTimeBtn');
    const timeEventForm = document.getElementById('timeEventForm');
    const saveTimeEventBtn = document.getElementById('saveTimeEventBtn');
    const timeFilterPeriod = document.getElementById('timeFilterPeriod');
    
    // 初始化时间过滤器监听器
    if (timeFilterPeriod) {
        timeFilterPeriod.addEventListener('change', () => {
            displayTimeEvents(timeFilterPeriod.value);
            updateTimeChart(timeFilterPeriod.value);
        });
    }
    
    // 初始化按钮事件监听器
    if (startTimeBtn) {
        startTimeBtn.addEventListener('click', startTimeTracking);
    }
    
    if (pauseTimeBtn) {
        pauseTimeBtn.addEventListener('click', pauseTimeTracking);
    }
    
    if (stopTimeBtn) {
        stopTimeBtn.addEventListener('click', stopTimeTracking);
    }
    
    if (saveTimeEventBtn) {
        saveTimeEventBtn.addEventListener('click', saveTimeEvent);
    }
    
    // 初始化显示
    displayTimeEvents('day');
    updateTimeChart('day');
}

// 全局变量用于时间追踪
let timeTrackingInterval = null;
let startTime = null;
let pausedTime = 0;
let isPaused = false;
let currentActivityName = '';

// 开始时间追踪
function startTimeTracking() {
    // 如果已经暂停，恢复计时
    if (isPaused) {
        isPaused = false;
        startTime = new Date(new Date().getTime() - pausedTime);
    } else {
        // 新的计时
        startTime = new Date();
        pausedTime = 0;
        
        // 显示活动表单
        const timeEventForm = document.getElementById('timeEventForm');
        if (timeEventForm) {
            timeEventForm.style.display = 'block';
        }
        
        // 获取活动名称
        const timeEventNameInput = document.getElementById('timeEventName');
        if (timeEventNameInput) {
            timeEventNameInput.addEventListener('input', (e) => {
                currentActivityName = e.target.value;
                updateCurrentActivity();
            });
        }
    }
    
    // 更新按钮状态
    document.getElementById('startTimeBtn').disabled = true;
    document.getElementById('pauseTimeBtn').disabled = false;
    document.getElementById('stopTimeBtn').disabled = false;
    
    // 启动计时器
    timeTrackingInterval = setInterval(updateTimeDisplay, 1000);
    updateCurrentActivity();
}

// 暂停时间追踪
function pauseTimeTracking() {
    clearInterval(timeTrackingInterval);
    isPaused = true;
    pausedTime = new Date().getTime() - startTime.getTime();
    
    // 更新按钮状态
    document.getElementById('startTimeBtn').disabled = false;
    document.getElementById('pauseTimeBtn').disabled = true;
    document.getElementById('stopTimeBtn').disabled = false;
    
    updateCurrentActivity('暂停');
}

// 停止时间追踪
function stopTimeTracking() {
    // 如果有活动名称，自动保存时间事件
    if (currentActivityName.trim()) {
        saveTimeEvent();
    } else {
        // 提示用户输入活动名称
        alert('请输入活动名称再结束');
        return;
    }
    
    // 重置时间追踪
    resetTimeTracking();
}

// 重置时间追踪
function resetTimeTracking() {
    clearInterval(timeTrackingInterval);
    startTime = null;
    pausedTime = 0;
    isPaused = false;
    currentActivityName = '';
    
    // 更新按钮状态
    document.getElementById('startTimeBtn').disabled = false;
    document.getElementById('pauseTimeBtn').disabled = true;
    document.getElementById('stopTimeBtn').disabled = true;
    
    // 重置时间显示
    document.getElementById('currentTime').textContent = '00:00:00';
    
    // 隐藏活动表单
    const timeEventForm = document.getElementById('timeEventForm');
    if (timeEventForm) {
        timeEventForm.style.display = 'none';
    }
    
    // 重置活动名称输入框
    const timeEventNameInput = document.getElementById('timeEventName');
    if (timeEventNameInput) {
        timeEventNameInput.value = '';
    }
    
    updateCurrentActivity('未开始追踪活动');
}

// 更新时间显示
function updateTimeDisplay() {
    if (!startTime) return;
    
    const currentTime = new Date();
    let elapsedTime = currentTime.getTime() - startTime.getTime();
    
    // 计算时分秒
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    elapsedTime -= hours * (1000 * 60 * 60);
    
    const minutes = Math.floor(elapsedTime / (1000 * 60));
    elapsedTime -= minutes * (1000 * 60);
    
    const seconds = Math.floor(elapsedTime / 1000);
    
    // 格式化为 HH:MM:SS
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新显示
    document.getElementById('currentTime').textContent = timeString;
}

// 更新当前活动显示
function updateCurrentActivity(status = null) {
    const currentActivityElement = document.getElementById('currentActivity');
    if (currentActivityElement) {
        if (status) {
            currentActivityElement.textContent = status;
        } else if (currentActivityName.trim()) {
            currentActivityElement.textContent = `正在追踪: ${currentActivityName}`;
        } else {
            currentActivityElement.textContent = '正在追踪活动...';
        }
    }
}

// 保存时间事件
function saveTimeEvent() {
    // 获取活动表单数据
    const name = document.getElementById('timeEventName').value.trim();
    const category = document.getElementById('timeEventCategory').value;
    
    if (!name) {
        alert('请输入活动名称');
        return;
    }
    
    if (!startTime) {
        alert('请先开始计时');
        return;
    }
    
    // 计算持续时间（毫秒）
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // 创建时间事件对象
    const timeEvent = {
        name,
        category,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        createdAt: new Date().toISOString()
    };
    
    // 添加到应用数据
    if (!appData.timeEvents) {
        appData.timeEvents = [];
    }
    
    appData.timeEvents.push(timeEvent);
    saveData();
    
    // 重置时间追踪
    resetTimeTracking();
    
    // 更新显示
    const timeFilterPeriod = document.getElementById('timeFilterPeriod');
    displayTimeEvents(timeFilterPeriod ? timeFilterPeriod.value : 'day');
    updateTimeChart(timeFilterPeriod ? timeFilterPeriod.value : 'day');
    
    showToast('时间记录已保存');
}

// 显示时间事件列表
function displayTimeEvents(period = 'day') {
    const timeEventsList = document.getElementById('timeEventsList');
    if (!timeEventsList) return;
    
    // 过滤时间事件
    const filteredEvents = filterTimeEventsByPeriod(period);
    
    if (filteredEvents.length === 0) {
        timeEventsList.innerHTML = '<div class="text-center p-4 text-muted">暂无时间记录</div>';
        return;
    }
    
    // 按照开始时间排序（最新的在前面）
    filteredEvents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // 创建事件列表HTML
    let html = '<div class="list-group">';
    
    filteredEvents.forEach((event, index) => {
        // 计算时间格式
        const duration = formatDuration(event.duration);
        const date = formatDate(event.startTime);
        
        // 根据类别获取颜色
        const categoryColorClass = getCategoryColorClass(event.category);
        
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center time-event-item">
                <div class="time-event-info">
                    <div class="d-flex align-items-center">
                        <div class="category-indicator ${categoryColorClass}"></div>
                        <h6 class="mb-0">${event.name}</h6>
                    </div>
                    <div class="text-muted small">${date}</div>
                </div>
                <div class="time-event-duration">${duration}</div>
                <div class="time-event-actions">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTimeEvent(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    timeEventsList.innerHTML = html;
}

// 根据时间段过滤时间事件
function filterTimeEventsByPeriod(period) {
    if (!appData.timeEvents || appData.timeEvents.length === 0) {
        return [];
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return appData.timeEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        
        switch (period) {
            case 'day':
                // 今天的事件
                return eventDate.getFullYear() === today.getFullYear() &&
                       eventDate.getMonth() === today.getMonth() &&
                       eventDate.getDate() === today.getDate();
                
            case 'week':
                // 本周的事件
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // 周日为一周的开始
                return eventDate >= weekStart;
                
            case 'month':
                // 本月的事件
                return eventDate.getFullYear() === today.getFullYear() &&
                       eventDate.getMonth() === today.getMonth();
                
            case 'all':
            default:
                // 所有事件
                return true;
        }
    });
}

// 格式化持续时间
function formatDuration(durationMs) {
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟 ${seconds}秒`;
    } else {
        return `${seconds}秒`;
    }
}

// 获取类别颜色类
function getCategoryColorClass(category) {
    switch (category) {
        case 'work': return 'bg-primary';
        case 'study': return 'bg-success';
        case 'exercise': return 'bg-warning';
        case 'leisure': return 'bg-info';
        case 'other':
        default: return 'bg-secondary';
    }
}

// 删除时间事件
function deleteTimeEvent(index) {
    if (!appData.timeEvents || !appData.timeEvents[index]) {
        return;
    }
    
    if (confirm('确定要删除这条时间记录吗?')) {
        appData.timeEvents.splice(index, 1);
        saveData();
        
        // 更新显示
        const timeFilterPeriod = document.getElementById('timeFilterPeriod');
        displayTimeEvents(timeFilterPeriod ? timeFilterPeriod.value : 'day');
        updateTimeChart(timeFilterPeriod ? timeFilterPeriod.value : 'day');
        
        showToast('时间记录已删除');
    }
}

// 更新时间图表
function updateTimeChart(period) {
    const timeChartElement = document.getElementById('timeChart');
    if (!timeChartElement) return;
    
    // 过滤时间事件
    const filteredEvents = filterTimeEventsByPeriod(period);
    
    if (filteredEvents.length === 0) {
        timeChartElement.innerHTML = '<div class="text-center p-4 text-muted">暂无数据可显示</div>';
        return;
    }
    
    // 按类别汇总时间
    const timeByCategory = {};
    filteredEvents.forEach(event => {
        if (!timeByCategory[event.category]) {
            timeByCategory[event.category] = 0;
        }
        timeByCategory[event.category] += event.duration;
    });
    
    // 准备图表数据
    const categories = [];
    const durations = [];
    const colors = [];
    
    for (const category in timeByCategory) {
        categories.push(getCategoryName(category));
        durations.push(timeByCategory[category] / (1000 * 60 * 60)); // 转换为小时
        colors.push(getCategoryColor(category));
    }
    
    // 创建饼图
    createPieChart(timeChartElement, categories, durations, colors);
}

// 获取类别名称
function getCategoryName(category) {
    switch (category) {
        case 'work': return '工作';
        case 'study': return '学习';
        case 'exercise': return '锻炼';
        case 'leisure': return '休闲';
        case 'other':
        default: return '其他';
    }
}

// 获取类别颜色
function getCategoryColor(category) {
    switch (category) {
        case 'work': return '#007bff';
        case 'study': return '#28a745';
        case 'exercise': return '#ffc107';
        case 'leisure': return '#17a2b8';
        case 'other':
        default: return '#6c757d';
    }
}

// 创建饼图
function createPieChart(element, categories, durations, colors) {
    // 这里假设使用Chart.js绘制图表
    // 实际项目中需要引入Chart.js库
    element.innerHTML = `
        <canvas id="timeChartCanvas"></canvas>
    `;
    
    const ctx = document.getElementById('timeChartCanvas').getContext('2d');
    
    // 如果已存在图表实例，先销毁
    if (window.timeChartInstance) {
        window.timeChartInstance.destroy();
    }
    
    // 创建新图表
    window.timeChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: durations,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const value = data.datasets[0].data[tooltipItem.index];
                        return `${data.labels[tooltipItem.index]}: ${value.toFixed(1)} 小时`;
                    }
                }
            }
        }
    });
}

// 导出时间追踪相关功能
export {
    displayTimeTracking,
    initTimeTracking,
    startTimeTracking,
    pauseTimeTracking,
    stopTimeTracking,
    resetTimeTracking,
    updateTimeDisplay,
    updateCurrentActivity,
    saveTimeEvent,
    displayTimeEvents,
    filterTimeEventsByPeriod,
    formatDuration,
    getCategoryColorClass,
    deleteTimeEvent,
    updateTimeChart,
    getCategoryName,
    getCategoryColor,
    createPieChart
}; 