/**
 * age.js - 年龄和时间进度相关功能
 */

import { appData, saveData } from './core.js';
import { 
    calculateDaysBetweenDates, 
    formatDateToYYYYMMDD, 
    parseDateString, 
    showToast, 
    showModal 
} from './utils.js';

// 显示年龄目标
function displayAgeGoals(container) {
    container.innerHTML = '';
    
    if (!appData.birthDate) {
        container.innerHTML = '<div class="alert alert-warning">请先设置出生日期</div>';
        return;
    }

    if (!appData.ageGoals || appData.ageGoals.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无时间目标，请点击"添加时间目标"按钮添加</div>';
        return;
    }

    // 计算当前年龄
    const currentAge = calculateAge(appData.birthDate);
    
    // 分组：今年目标和终身目标
    const yearlyGoals = [];
    const lifetimeGoals = [];
    
    // 先按目标日期排序，然后按年龄段排序
    const sortByTargetDate = (a, b) => {
        const aIsTargetDateGoal = a.targetDate !== undefined;
        const bIsTargetDateGoal = b.targetDate !== undefined;
        
        // 如果两个都有或都没有目标日期，则按年龄段排序
        if (aIsTargetDateGoal === bIsTargetDateGoal) {
            return a.startAge - b.startAge;
        }
        
        // 有目标日期的排在前面
        return aIsTargetDateGoal ? -1 : 1;
    };
    
    // 分类目标
    appData.ageGoals.forEach(goal => {
        if (goal.yearly) {
            yearlyGoals.push(goal);
        } else {
            lifetimeGoals.push(goal);
        }
    });
    
    // 排序
    yearlyGoals.sort(sortByTargetDate);
    lifetimeGoals.sort(sortByTargetDate);
    
    // 创建年度目标区域
    if (yearlyGoals.length > 0) {
        const yearlySection = document.createElement('div');
        yearlySection.className = 'age-goals-section';
        yearlySection.innerHTML = `<h5 class="age-category-title yearly">今年目标</h5>`;
        
        const yearlyGrid = document.createElement('div');
        yearlyGrid.className = 'age-goals-grid';
        
        yearlyGoals.forEach((goal, index) => {
            const actualIndex = appData.ageGoals.indexOf(goal);
            yearlyGrid.appendChild(createAgeGoalCard(goal, actualIndex, true));
        });
        
        yearlySection.appendChild(yearlyGrid);
        container.appendChild(yearlySection);
    }
    
    // 创建终身目标区域
    if (lifetimeGoals.length > 0) {
        const lifetimeSection = document.createElement('div');
        lifetimeSection.className = 'age-goals-section';
        lifetimeSection.innerHTML = `<h5 class="age-category-title lifetime">人生目标</h5>`;
        
        const lifetimeGrid = document.createElement('div');
        lifetimeGrid.className = 'age-goals-grid';
        
        lifetimeGoals.forEach((goal, index) => {
            const actualIndex = appData.ageGoals.indexOf(goal);
            lifetimeGrid.appendChild(createAgeGoalCard(goal, actualIndex, false));
        });
        
        lifetimeSection.appendChild(lifetimeGrid);
        container.appendChild(lifetimeSection);
    }
}

// 创建年龄目标卡片
function createAgeGoalCard(goal, index, isYearly) {
    const card = document.createElement('div');
    card.className = `age-goal-card ${isYearly ? 'yearly' : 'lifetime'}`;
    
    const birthDate = parseDateString(appData.birthDate);
    const now = new Date();
    
    // 目标开始和结束日期/年龄
    const startAge = goal.startAge || 0;
    const startAgeYears = Math.floor(startAge);
    const startAgeMonths = Math.floor((startAge - startAgeYears) * 12);
    
    const endAge = goal.endAge || 100;
    const endAgeYears = Math.floor(endAge);
    const endAgeMonths = Math.floor((endAge - endAgeYears) * 12);
    
    // 格式化年龄显示
    const formatAge = (years, months) => {
        if (months === 0) {
            return `${years}岁`;
        } else {
            return `${years}岁${months}个月`;
        }
    };
    
    // 计算开始和结束的实际日期
    const startDate = new Date(birthDate);
    startDate.setFullYear(startDate.getFullYear() + startAgeYears);
    startDate.setMonth(startDate.getMonth() + startAgeMonths);
    
    const endDate = new Date(birthDate);
    endDate.setFullYear(endDate.getFullYear() + endAgeYears);
    endDate.setMonth(endDate.getMonth() + endAgeMonths);
    
    // 计算进度
    let progress = 0;
    let remainingDays = 0;
    
    if (now < startDate) {
        // 还没开始
        progress = 0;
        remainingDays = calculateDaysBetweenDates(now, startDate);
    } else if (now > endDate) {
        // 已经结束
        progress = 100;
        remainingDays = 0;
    } else {
        // 进行中
        const totalDays = calculateDaysBetweenDates(startDate, endDate);
        const passedDays = calculateDaysBetweenDates(startDate, now);
        progress = Math.min(100, (passedDays / totalDays) * 100);
        remainingDays = calculateDaysBetweenDates(now, endDate);
    }
    
    // 显示进度的时间值
    let timeValue = '';
    let timeClass = '';
    
    if (remainingDays <= 30) {
        timeValue = `剩余${remainingDays}天`;
        timeClass = 'urgent';
    } else if (remainingDays <= 90) {
        timeValue = `剩余${remainingDays}天`;
        timeClass = 'warning';
    } else {
        timeValue = `剩余${Math.floor(remainingDays / 30)}个月${remainingDays % 30}天`;
        timeClass = 'normal';
    }
    
    // 卡片内容
    let cardContent = `
        <div class="card-body">
            <div class="age-goal-info">
                <div class="goal-header">
                    <div class="goal-name">${goal.name}</div>
                </div>
                <div class="age-range">
                    <span>${formatAge(startAgeYears, startAgeMonths)}</span>
                    <span class="age-arrow">→</span>
                    <span>${formatAge(endAgeYears, endAgeMonths)}</span>
                </div>
                <div class="time-info">
                    <div class="remaining-days">
                        <i class="fas fa-clock"></i>
                        <span class="days-count">${remainingDays}</span>
                        <span class="days-label">天</span>
                    </div>
                    <div class="time-value ${timeClass}">${timeValue}</div>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress">
                    <div class="progress-bar bg-${progress >= 100 ? 'success' : 'danger'}" style="width: ${progress}%"></div>
                </div>
                <div class="d-flex justify-content-between small">
                    <div>${startDate.toLocaleDateString()}</div>
                    <div>${endDate.toLocaleDateString()}</div>
                </div>
            </div>
            <div class="age-goal-actions">
                <button class="btn btn-sm btn-primary" onclick="editAgeGoal(${index})">
                    <i class="btn-icon fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm btn-success" onclick="archiveGoal(${index}, 'age')">
                    <i class="btn-icon fas fa-archive"></i> 归档
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAgeGoal(${index})">
                    <i class="btn-icon fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

// 添加年龄目标
function saveAgeGoal() {
    const goalName = document.getElementById('ageGoalName').value.trim();
    const startAgeYears = parseInt(document.getElementById('startAgeYears').value) || 0;
    const startAgeMonths = parseInt(document.getElementById('startAgeMonths').value) || 0;
    const endAgeYears = parseInt(document.getElementById('endAgeYears').value) || 0;
    const endAgeMonths = parseInt(document.getElementById('endAgeMonths').value) || 0;
    const isYearly = document.getElementById('isYearlyGoal').checked;
    
    if (!goalName) {
        alert('请输入目标名称');
        return;
    }
    
    const startAge = startAgeYears + (startAgeMonths / 12);
    const endAge = endAgeYears + (endAgeMonths / 12);
    
    if (endAge <= startAge) {
        alert('结束年龄必须大于开始年龄');
        return;
    }
    
    appData.ageGoals.push({
        name: goalName,
        startAge: startAge,
        endAge: endAge,
        yearly: isYearly,
        createdAt: new Date().toISOString()
    });
    
    saveData();
    displayAgeGoals(document.getElementById('goalsContainer'));
    
    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('ageSettingsModal'));
    if (modal) {
        modal.hide();
    }
    
    showToast('年龄目标已添加');
}

// 删除年龄目标
function deleteAgeGoal(index) {
    if (confirm('确定要删除这个目标吗?')) {
        appData.ageGoals.splice(index, 1);
        saveData();
        displayAgeGoals(document.getElementById('goalsContainer'));
        showToast('目标已删除');
    }
}

// 重置时间相关数据
function resetTime() {
    if (confirm('确定要重置所有时间数据吗? 这将清空所有年龄目标和出生日期。')) {
        appData.birthDate = null;
        appData.ageGoals = [];
        appData.archivedAgeGoals = [];
        saveData();
        showToast('时间数据已重置');
    }
}

// 显示年龄设置模态框
function showAgeSettingsModal() {
    // 创建模态框
    const modalContent = `
        <form id="ageGoalForm">
            <div class="mb-3">
                <label for="ageGoalName" class="form-label">目标名称:</label>
                <input type="text" class="form-control" id="ageGoalName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">开始年龄:</label>
                <div class="d-flex gap-2">
                    <div class="input-group">
                        <input type="number" class="form-control" id="startAgeYears" min="0" max="120" placeholder="岁" required>
                        <span class="input-group-text">岁</span>
                    </div>
                    <div class="input-group">
                        <input type="number" class="form-control" id="startAgeMonths" min="0" max="11" placeholder="月" required>
                        <span class="input-group-text">月</span>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">结束年龄:</label>
                <div class="d-flex gap-2">
                    <div class="input-group">
                        <input type="number" class="form-control" id="endAgeYears" min="0" max="120" placeholder="岁" required>
                        <span class="input-group-text">岁</span>
                    </div>
                    <div class="input-group">
                        <input type="number" class="form-control" id="endAgeMonths" min="0" max="11" placeholder="月" required>
                        <span class="input-group-text">月</span>
                    </div>
                </div>
            </div>
            <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="isYearlyGoal">
                <label class="form-check-label" for="isYearlyGoal">设为今年目标</label>
            </div>
        </form>
    `;
    
    showModal({
        id: 'ageSettingsModal',
        title: '添加时间目标',
        content: modalContent,
        onSave: saveAgeGoal
    });
    
    // 设置当前年龄为默认值
    const currentAge = calculateAge(appData.birthDate);
    document.getElementById('startAgeYears').value = Math.floor(currentAge.years);
    document.getElementById('startAgeMonths').value = Math.floor(currentAge.months);
    document.getElementById('endAgeYears').value = Math.floor(currentAge.years) + 1;
    document.getElementById('endAgeMonths').value = Math.floor(currentAge.months);
}

// 编辑年龄目标
function editAgeGoal(index) {
    const goal = appData.ageGoals[index];
    
    if (!goal) {
        showToast('目标不存在');
        return;
    }
    
    const startAgeYears = Math.floor(goal.startAge);
    const startAgeMonths = Math.floor((goal.startAge - startAgeYears) * 12);
    
    const endAgeYears = Math.floor(goal.endAge);
    const endAgeMonths = Math.floor((goal.endAge - endAgeYears) * 12);
    
    const modalContent = `
        <form id="editAgeGoalForm">
            <input type="hidden" id="editAgeGoalIndex" value="${index}">
            <div class="mb-3">
                <label for="editAgeGoalName" class="form-label">目标名称:</label>
                <input type="text" class="form-control" id="editAgeGoalName" value="${goal.name}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">开始年龄:</label>
                <div class="d-flex gap-2">
                    <div class="input-group">
                        <input type="number" class="form-control" id="editStartAgeYears" min="0" max="120" value="${startAgeYears}" required>
                        <span class="input-group-text">岁</span>
                    </div>
                    <div class="input-group">
                        <input type="number" class="form-control" id="editStartAgeMonths" min="0" max="11" value="${startAgeMonths}" required>
                        <span class="input-group-text">月</span>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">结束年龄:</label>
                <div class="d-flex gap-2">
                    <div class="input-group">
                        <input type="number" class="form-control" id="editEndAgeYears" min="0" max="120" value="${endAgeYears}" required>
                        <span class="input-group-text">岁</span>
                    </div>
                    <div class="input-group">
                        <input type="number" class="form-control" id="editEndAgeMonths" min="0" max="11" value="${endAgeMonths}" required>
                        <span class="input-group-text">月</span>
                    </div>
                </div>
            </div>
            <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="editIsYearlyGoal" ${goal.yearly ? 'checked' : ''}>
                <label class="form-check-label" for="editIsYearlyGoal">设为今年目标</label>
            </div>
        </form>
    `;
    
    showModal({
        id: 'editAgeGoalModal',
        title: '编辑时间目标',
        content: modalContent,
        onSave: saveEditedAgeGoal
    });
}

// 保存编辑的年龄目标
function saveEditedAgeGoal() {
    const index = parseInt(document.getElementById('editAgeGoalIndex').value);
    const name = document.getElementById('editAgeGoalName').value.trim();
    const startAgeYears = parseInt(document.getElementById('editStartAgeYears').value) || 0;
    const startAgeMonths = parseInt(document.getElementById('editStartAgeMonths').value) || 0;
    const endAgeYears = parseInt(document.getElementById('editEndAgeYears').value) || 0;
    const endAgeMonths = parseInt(document.getElementById('editEndAgeMonths').value) || 0;
    const isYearly = document.getElementById('editIsYearlyGoal').checked;
    
    if (!name) {
        alert('请输入目标名称');
        return;
    }
    
    const startAge = startAgeYears + (startAgeMonths / 12);
    const endAge = endAgeYears + (endAgeMonths / 12);
    
    if (endAge <= startAge) {
        alert('结束年龄必须大于开始年龄');
        return;
    }
    
    appData.ageGoals[index] = {
        ...appData.ageGoals[index],
        name,
        startAge,
        endAge,
        yearly: isYearly
    };
    
    saveData();
    displayAgeGoals(document.getElementById('goalsContainer'));
    showToast('目标已更新');
}

// 归档年龄目标
function archiveAgeGoal(index) {
    const goal = appData.ageGoals[index];
    if (goal) {
        appData.archivedAgeGoals.push({
            ...goal,
            archivedAt: new Date().toISOString()
        });
        appData.ageGoals.splice(index, 1);
        saveData();
        displayAgeGoals(document.getElementById('goalsContainer'));
        showToast('目标已归档');
    }
}

// 恢复归档的年龄目标
function restoreAgeGoal(index) {
    const goal = appData.archivedAgeGoals[index];
    if (goal) {
        // 移除归档时间戳
        const { archivedAt, ...goalData } = goal;
        appData.ageGoals.push(goalData);
        appData.archivedAgeGoals.splice(index, 1);
        saveData();
        showToast('目标已恢复');
        return true;
    }
    return false;
}

// 处理出生日期表单提交
function handleBirthDateFormSubmit(event) {
    event.preventDefault();
    saveBirthDate();
}

// 保存出生日期
function saveBirthDate() {
    const birthDateInput = document.getElementById('birthDate').value.trim();
    
    if (!birthDateInput || !/^\d{8}$/.test(birthDateInput)) {
        showToast('请输入有效的出生日期（格式：YYYYMMDD）');
        return;
    }
    
    // 验证日期是否有效
    try {
        const date = parseDateString(birthDateInput);
        if (isNaN(date.getTime())) {
            throw new Error('无效日期');
        }
        
        appData.birthDate = birthDateInput;
        saveData();
        updateBirthDateDisplay();
        showToast('出生日期已设置');
    } catch (error) {
        showToast('请输入有效的出生日期');
    }
}

// 计算年龄
function calculateAge(birthDateStr) {
    if (!birthDateStr) {
        return { years: 0, months: 0, days: 0, total: 0 };
    }
    
    const birthDate = parseDateString(birthDateStr);
    const now = new Date();
    
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    let days = now.getDate() - birthDate.getDate();
    
    // 调整月份和天数
    if (days < 0) {
        months--;
        // 获取上个月的天数
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // 计算总年龄（年 + 月/12）
    const total = years + (months / 12) + (days / 365.25);
    
    return { years, months, days, total };
}

// 更新出生日期显示
function updateBirthDateDisplay() {
    if (!appData.birthDate) {
        return;
    }
    
    const ageDisplayElements = document.querySelectorAll('.age-display');
    if (ageDisplayElements.length === 0) {
        return;
    }
    
    const age = calculateAge(appData.birthDate);
    
    ageDisplayElements.forEach(elem => {
        elem.innerHTML = `${age.years}岁${age.months}个月${age.days}天`;
    });
    
    // 也可以更新进度条显示
    const ageProgressElements = document.querySelectorAll('.age-progress');
    if (ageProgressElements.length === 0) {
        return;
    }
    
    const lifeExpectancy = 80; // 假设预期寿命80岁
    const lifeProgress = (age.total / lifeExpectancy) * 100;
    
    ageProgressElements.forEach(elem => {
        elem.style.width = `${lifeProgress}%`;
        elem.textContent = `${lifeProgress.toFixed(2)}%`;
    });
}

// 显示出生日期输入界面
function showBirthDateInput() {
    const birthDateInput = document.getElementById('birthDate');
    if (birthDateInput) {
        birthDateInput.focus();
    }
}

// 导出年龄相关功能
export {
    displayAgeGoals,
    createAgeGoalCard,
    saveAgeGoal,
    deleteAgeGoal,
    resetTime,
    showAgeSettingsModal,
    editAgeGoal,
    saveEditedAgeGoal,
    archiveAgeGoal,
    restoreAgeGoal,
    handleBirthDateFormSubmit,
    saveBirthDate,
    calculateAge,
    updateBirthDateDisplay,
    showBirthDateInput
}; 