 // 将关键配置集中管理，便于后期修改
        const CONFIG = {
            STORAGE_KEY: 'savingsData',
            CURRENT_DATE: new Date()
        };

        // 数据结构
        let appData = {
            totalSaved: 0,
            goals: [],
            ageGoals: [],
            birthDate: null,
            history: [],  // 添加历史记录数组
            archivedGoals: [],  // 添加归档数组
            archivedAgeGoals: [], // 添加年龄目标归档数组
            todos: {  // 添加四象限待办事项
                q1: [], // 重要且紧急
                q2: [], // 重要不紧急
                q3: [], // 紧急不重要
                q4: []  // 不重要不紧急
            },
            inspirations: [],
            inspirationTags: ['工作', '学习', '生活', '其他'], // 默认标签
            timeEvents: [] // 添加时间统计事件数组
        };

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

        // 修改解析金额的函数
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
                throw new Error('请输入有效的金额（如：100、1万、50w、100万）');
            }
        }

        // UI 更新函数
        function renderViewMode(view) {
            const totalElement = document.getElementById('totalSaved');
            if (totalElement) {
                totalElement.textContent = formatMoney(appData.totalSaved);
            }

            const container = document.getElementById('goalsContainer');
            if (!container) return;

            // 更新视图选择状态
            if (view) {
                const viewModes = {
                    'savings': 'savingsMode',
                    'age': 'ageMode',
                    'history': 'historyMode',
                    'archive': 'archiveMode',
                    'todo': 'todoMode',
                    'inspiration': 'inspirationMode',
                    'habit': 'habitMode',
                    'timeTracking': 'timeTrackingMode',
                    'personalData': 'personalDataMode'
                };

                // 重置所有按钮状态
                Object.values(viewModes).forEach(modeId => {
                    const element = document.getElementById(modeId);
                    if (element) {
                        element.checked = false;
                    }
                });

                // 设置当前视图按钮状态
                const currentModeId = viewModes[view];
                if (currentModeId) {
                    const element = document.getElementById(currentModeId);
                    if (element) {
                        element.checked = true;
                    }
                }
            }

            // 根据当前视图显示相应内容
            if (view === 'timeTracking' || document.getElementById('timeTrackingMode').checked) {
                showTimeTrackingView();
                return;
            }

            // 显示目标容器
            container.style.display = 'grid';
            container.className = 'goal-container';
            container.innerHTML = '';

            // 根据视图类型显示内容
            if (document.getElementById('inspirationMode').checked) {
                container.className = 'inspiration-wrapper';
                displayInspirations(container);
            } else if (document.getElementById('todoMode').checked) {
                displayTodos(container);
            } else if (document.getElementById('archiveMode').checked) {
                displayArchived(container);
            } else if (document.getElementById('historyMode').checked) {
                displayHistory(container);
            } else if (document.getElementById('ageMode').checked) {
                displayAgeGoals(container);
            } else if (document.getElementById('habitMode').checked) {
                showHabitView();
            } else if (document.getElementById('personalDataMode').checked) {
                displayPersonalData(container);
            } else {
                displaySavingsGoals(container);
            }

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
        }

        // 事件处理函数
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('goalName').value;
                const amountStr = document.getElementById('goalAmount').value;
                const amount = parseAmount(amountStr);
                
                // 确保 appData.goals 是数组
                if (!Array.isArray(appData.goals)) {
                    appData.goals = [];
                }
                
                // 添加新目标
                appData.goals.push({
                    name: name,
                    target: amount
                });
                
                // 按目标金额从小到大排序
                appData.goals.sort((a, b) => a.target - b.target);
                
                // 清空输入框
                document.getElementById('goalName').value = '';
                document.getElementById('goalAmount').value = '';
                
                renderViewMode();
            } catch (error) {
                alert(error.message);
            }
        });

        document.getElementById('moneyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                const amountStr = document.getElementById('amount').value;
                const note = document.getElementById('note').value;
                const amount = parseAmount(amountStr);
                const operationType = document.querySelector('input[name="operationType"]:checked').value;
                
                const currentMoney = SafeMoney.fromYuan(appData.totalSaved);
                const money = SafeMoney.fromYuan(amount);
                
                let newTotal;
                if (operationType === 'deposit') {
                    newTotal = currentMoney.add(money);
                } else {
                    if (amount > appData.totalSaved) {
                    throw new Error('取款金额不能大于总存款');
                    }
                    newTotal = currentMoney.subtract(money);
                }
                
                appData.totalSaved = newTotal.toYuan();
                addHistory(operationType, amount, note);
                
                document.getElementById('amount').value = '';
                document.getElementById('note').value = '';
                // 保持在当前视图更新UI
                const isAgeMode = document.getElementById('ageMode').checked;
                const isHistoryMode = document.getElementById('historyMode').checked;
                renderViewMode(isAgeMode ? 'age' : (isHistoryMode ? 'history' : 'savings'));
            } catch (error) {
                alert(error.message);
            }
        });

        function deleteGoal(index) {
            appData.goals.splice(index, 1);
            renderViewMode();
        }

        // 初始化
        function initialize() {
            // 从本地存储加载数据
            const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    appData = {
                        ...appData,  // 保持默认值
                        ...parsedData,  // 加载保存的数据
                        timeEvents: Array.isArray(parsedData.timeEvents) ? parsedData.timeEvents : []  // 确保timeEvents是数组
                    };
                } catch (e) {
                    console.error('Error parsing saved data:', e);
                    // 如果解析失败，确保timeEvents被初始化为空数组
                    appData.timeEvents = [];
                }
            }

            // 初始化视图模式
            const viewModes = {
                'savings': 'savingsMode',
                'age': 'ageMode',
                'history': 'historyMode',
                'archive': 'archiveMode',
                'todo': 'todoMode',
                'inspiration': 'inspirationMode',
                'habit': 'habitMode',
                'timeTracking': 'timeTrackingMode',
                'personalData': 'personalDataMode'
            };

            // 为每个视图模式添加事件监听
            Object.entries(viewModes).forEach(([modeId, viewName]) => {
                const element = document.getElementById(modeId);
                if (element) {
                    element.addEventListener('change', () => {
                        if (element.checked) {
                            renderViewMode(viewName);
                        }
                    });
                }
            });

            // 更新UI
            renderViewMode();
            updateDateTime();
            setInterval(updateDateTime, 1000);
        }

        // 确保在页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', () => {
            const savingsMode = document.getElementById('savingsMode');
            const ageMode = document.getElementById('ageMode');
            const historyMode = document.getElementById('historyMode');
            const archiveMode = document.getElementById('archiveMode');
            const todoMode = document.getElementById('todoMode');
            const inspirationMode = document.getElementById('inspirationMode');
            const habitMode = document.getElementById('habitMode');
            const timeTrackingMode = document.getElementById('timeTrackingMode');
            const personalDataMode = document.getElementById('personalDataMode');
            
            if (savingsMode && ageMode && historyMode && archiveMode && todoMode && inspirationMode && habitMode && timeTrackingMode && personalDataMode) {
                savingsMode.addEventListener('change', () => {
                    if (savingsMode.checked) renderViewMode('savings');
                });
                
                ageMode.addEventListener('change', () => {
                    if (ageMode.checked) renderViewMode('age');
                });
                
                historyMode.addEventListener('change', () => {
                    if (historyMode.checked) renderViewMode('history');
                });
                
                archiveMode.addEventListener('change', () => {
                    if (archiveMode.checked) renderViewMode('archive');
                });
                
                todoMode.addEventListener('change', () => {
                    if (todoMode.checked) renderViewMode('todo');
                });
                
                inspirationMode.addEventListener('change', () => {
                    if (inspirationMode.checked) renderViewMode('inspiration');
                });
                
                habitMode.addEventListener('change', () => {
                    if (habitMode.checked) renderViewMode('habit');
                });
                timeTrackingMode.addEventListener('change', () => {
                    if (timeTrackingMode.checked) renderViewMode('timeTracking');
                });
                personalDataMode.addEventListener('change', () => {
                    if (personalDataMode.checked) renderViewMode('personalData');
                });
            }
            
            initialize();
        });

        // 导出数据函数
        function exportData() {
            const dataStr = JSON.stringify(appData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `savings-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // 导入数据函数
        function importData(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const imported = JSON.parse(e.target.result);
                        if (confirm('确定要导入数据吗？当前数据将被替换。')) {
                            appData = {
                                totalSaved: Number((Math.round(parseFloat(imported.totalSaved || 0) * 100) / 100).toFixed(2)),
                                goals: Array.isArray(imported.goals) ? imported.goals.map(goal => ({
                                    name: goal.name,
                                    target: Number((Math.round(parseFloat(goal.target) * 100) / 100).toFixed(2))
                                })) : [],
                                ageGoals: Array.isArray(imported.ageGoals) ? imported.ageGoals : [],
                                birthDate: imported.birthDate,
                                history: imported.history || [],
                                archivedGoals: Array.isArray(imported.archivedGoals) ? imported.archivedGoals : [],
                                archivedAgeGoals: Array.isArray(imported.archivedAgeGoals) ? imported.archivedAgeGoals : [],
                                todos: imported.todos || { q1: [], q2: [], q3: [], q4: [] },
                                inspirations: Array.isArray(imported.inspirations) ? imported.inspirations : [],
                                inspirationTags: imported.inspirationTags || ['工作', '学习', '生活', '其他'],
                                timeEvents: Array.isArray(imported.timeEvents) ? imported.timeEvents : [],
                                habits: Array.isArray(imported.habits) ? imported.habits : [],
                                personalData: imported.personalData || { categories: [] }
                            };
                            renderViewMode();
                            alert('数据导入成功！');
                        }
                    } catch (error) {
                        alert('导入失败：无效的数据格式');
                    }
                };
                reader.readAsText(file);
            }
            event.target.value = '';
        }

        // 添加日期计算的辅助函数
        function calculateDaysBetweenDates(startDate, endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            const diffTime = end - start;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // 修改日期格式化函数
        function formatDateToYYYYMMDD(date) {
            const d = new Date(date);
            return d.getFullYear().toString() +
                   (d.getMonth() + 1).toString().padStart(2, '0') +
                   d.getDate().toString().padStart(2, '0');
        }

        function parseDateString(dateStr) {
            if (!dateStr || !/^\d{8}$/.test(dateStr)) {
                return new Date();
            }
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            return new Date(year, month, day);
        }

        // 修改显示年龄目标的函数
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

            const BIRTH_DATE = parseDateString(appData.birthDate);
            const CURRENT_DATE = new Date();

            const yearlyGoals = [];
            const lifetimeGoals = [];
            
            appData.ageGoals.forEach(goal => {
                if (!goal.category) {
                    goal.category = 'yearly';
                }
                if (goal.category === 'yearly') {
                    yearlyGoals.push(goal);
                } else {
                    lifetimeGoals.push(goal);
                }
            });

            const sortByTargetDate = (a, b) => {
                const dateA = parseDateString(a.targetDate);
                const dateB = parseDateString(b.targetDate);
                return dateA - dateB;
            };

            yearlyGoals.sort(sortByTargetDate);
            lifetimeGoals.sort(sortByTargetDate);

            if (yearlyGoals.length > 0) {
                const yearlySection = document.createElement('div');
                yearlySection.className = 'age-goals-section';
                
                const yearlyTitle = document.createElement('h6');
                yearlyTitle.className = 'age-category-title yearly';
                yearlyTitle.textContent = '今年进度';
                yearlySection.appendChild(yearlyTitle);

                const yearlyGrid = document.createElement('div');
                yearlyGrid.className = 'age-goals-grid';
                yearlyGoals.forEach(goal => {
                    const realIndex = appData.ageGoals.indexOf(goal);
                    const card = createGoalCard(goal, realIndex);
                    card.classList.add('yearly');
                    yearlyGrid.appendChild(card);
                });
                yearlySection.appendChild(yearlyGrid);
                container.appendChild(yearlySection);
            }

            if (lifetimeGoals.length > 0) {
                const lifetimeSection = document.createElement('div');
                lifetimeSection.className = 'age-goals-section';
                
                const lifetimeTitle = document.createElement('h6');
                lifetimeTitle.className = 'age-category-title lifetime';
                lifetimeTitle.textContent = '人生总进度';
                lifetimeSection.appendChild(lifetimeTitle);

                const lifetimeGrid = document.createElement('div');
                lifetimeGrid.className = 'age-goals-grid';
                lifetimeGoals.forEach(goal => {
                    const realIndex = appData.ageGoals.indexOf(goal);
                    const card = createGoalCard(goal, realIndex);
                    card.classList.add('lifetime');
                    lifetimeGrid.appendChild(card);
                });
                lifetimeSection.appendChild(lifetimeGrid);
                container.appendChild(lifetimeSection);
            }

            function createGoalCard(goal, index) {
                const targetDate = parseDateString(goal.targetDate);
                
                const currentAgeInYears = (CURRENT_DATE - BIRTH_DATE) / (1000 * 60 * 60 * 24 * 365.25);
                const currentYears = Math.floor(currentAgeInYears);
                const currentMonths = Math.floor((currentAgeInYears - currentYears) * 12);
                
                const targetAgeInYears = (targetDate - BIRTH_DATE) / (1000 * 60 * 60 * 24 * 365.25);
                const targetYears = Math.floor(targetAgeInYears);
                const targetMonths = Math.floor((targetAgeInYears - targetYears) * 12);
                
                const remainingDays = calculateDaysBetweenDates(CURRENT_DATE, targetDate);

                let progress;
                if (goal.category === 'yearly') {
                    const yearStart = new Date(CURRENT_DATE.getFullYear(), 0, 1);
                    const daysFromStart = calculateDaysBetweenDates(yearStart, CURRENT_DATE);
                    const totalDaysUntilTarget = calculateDaysBetweenDates(yearStart, targetDate);
                    progress = (totalDaysUntilTarget > 0) ? (daysFromStart / totalDaysUntilTarget) * 100 : 100;
                } else {
                    const totalDays = calculateDaysBetweenDates(BIRTH_DATE, targetDate);
                    const daysPassed = calculateDaysBetweenDates(BIRTH_DATE, CURRENT_DATE);
                    progress = (totalDays > 0) ? (daysPassed / totalDays) * 100 : 100;
                }

                const timeStatus = progress >= 80 ? 'urgent' : progress >= 50 ? 'warning' : 'normal';

                const formatAge = (years, months) => {
                    if (months === 0) {
                        return `${years}岁`;
                    }
                    return `${years}岁${months}个月`;
                };

                const card = document.createElement('div');
                card.className = 'card age-goal-card';
                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="goal-name">${goal.name}</div>
                            <div class="d-flex gap-2">
                                ${progress >= 100 ? `
                                    <button class="btn btn-success btn-sm py-0 px-2" onclick="archiveGoal(${index}, 'age')">
                                        <i class="fas fa-check-circle btn-icon"></i>归档
                                    </button>
                                ` : ''}
                                <button class="btn btn-primary btn-sm py-0 px-2" onclick="editAgeGoal(${index})">
                                    <i class="fas fa-edit btn-icon"></i>编辑
                                </button>
                                <button class="btn btn-danger btn-sm py-0 px-2" onclick="deleteAgeGoal(${index})">
                                    <i class="fas fa-trash btn-icon"></i>删除
                                </button>
                            </div>
                        </div>
                        <div class="age-goal-info">
                            <div class="age-range">
                                <span>${formatAge(currentYears, currentMonths)}</span>
                                <span class="age-arrow">→</span>
                                <span>${formatAge(targetYears, targetMonths)}</span>
                            </div>
                            <div class="time-info">
                                <div class="remaining-days">
                                    <i class="fas fa-hourglass-half"></i>
                                    <span class="days-count">${remainingDays}</span>
                                    <span class="days-label">天后截止</span>
                                </div>
                                <div class="time-value ${timeStatus}">
                                    已过${Math.round(progress)}%时间
                                </div>
                            </div>
                            <div class="progress-section">
                                <div class="progress">
                                    <div class="progress-bar ${goal.category === 'lifetime' ? 'bg-warning' : ''}" 
                                         role="progressbar" 
                                         style="width: ${Math.min(100, Math.max(0, progress))}%"
                                         aria-valuenow="${progress}"
                                         aria-valuemin="0"
                                         aria-valuemax="100">
                                        ${progress.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                return card;
            }
        }

        // 修改保存年龄目标的函数
        function saveAgeGoal() {
            const name = document.getElementById('ageGoalName').value;
            const targetDate = document.getElementById('targetDate').value;
            const category = document.getElementById('ageGoalCategory').value;

            if (!name || !targetDate || !category) {
                alert('请填写完整信息');
                return;
            }

            if (!/^\d{8}$/.test(targetDate)) {
                alert('请输入正确的日期格式（例如：20260106）');
                return;
            }

            // 为现有的目标添加默认分类
            if (!appData.ageGoals.every(goal => goal.hasOwnProperty('category'))) {
                appData.ageGoals = appData.ageGoals.map(goal => ({
                    ...goal,
                    category: 'yearly' // 将现有目标默认设置为今年进度
                }));
            }

            // 添加新目标
            appData.ageGoals.push({
                name: name,
                targetDate: targetDate,
                category: category
            });

            // 按日期排序
            appData.ageGoals.sort((a, b) => {
                const dateA = parseDateString(a.targetDate);
                const dateB = parseDateString(b.targetDate);
                return dateA - dateB;
            });

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            renderViewMode();

            const modal = bootstrap.Modal.getInstance(document.getElementById('ageSettingsModal'));
            modal.hide();
        }

        // 添加删除年龄目标的函数
        function deleteAgeGoal(index) {
            appData.ageGoals.splice(index, 1);
            renderViewMode();
        }

        // 修改重置函数,分为重置存款和重置年龄
        function resetSavings() {
            if (confirm('确定要重置所有存款数据吗？此操作不可恢复！')) {
                appData.totalSaved = 0;
                appData.goals = [];
                renderViewMode();
            }
        }

        function resetTime() {
            appData.ageGoals = [];
            renderViewMode();
        }

        // 确保 showAgeSettingsModal 函数在全局作用域中
        window.showAgeSettingsModal = showAgeSettingsModal;
        window.saveAgeGoal = saveAgeGoal;
        window.deleteAgeGoal = deleteAgeGoal;

        // 修改添加年龄目标的模态框
        function showAgeSettingsModal() {
            const content = `
                <form id="ageSettingsForm">
                    <div class="mb-3">
                        <label class="form-label">目标分类</label>
                        <select class="form-select" id="ageGoalCategory" required>
                            <option value="yearly">今年进度</option>
                            <option value="lifetime">人生总进度</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">目标名称</label>
                        <input type="text" class="form-control" id="ageGoalName" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">目标日期 (YYYYMMDD格式)</label>
                        <input type="text" class="form-control" id="targetDate" required>
                    </div>
                </form>
            `;

            const modalHtml = createModal({
                id: 'ageSettingsModal',
                title: '添加时间目标',
                content: content,
                onSave: 'saveAgeGoal()'
            });

            if (!document.getElementById('ageSettingsModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                document.getElementById('ageSettingsModal').outerHTML = modalHtml;
            }

            const modal = new bootstrap.Modal(document.getElementById('ageSettingsModal'));
            modal.show();
        }

        // 确保添加按钮正常工作
        document.addEventListener('DOMContentLoaded', function() {
            // 添加点击事件监听器
            document.body.addEventListener('click', function(e) {
                if (e.target.matches('.add-age-goal-btn') || e.target.closest('.add-age-goal-btn')) {
                    showAgeSettingsModal();
                }
            });
        });

        // 添加 formatMoney 函数
        function formatMoney(amount) {
            const value = Math.round(Number(amount));
            if (isNaN(value)) {
                return '¥0';
            }
            return new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency: 'CNY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }

        // 修改出生日期设置处理
        document.getElementById('birthDateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const birthDateStr = document.getElementById('birthDate').value;
            
            if (!/^\d{8}$/.test(birthDateStr)) {
                alert('请输入正确的日期格式（例如：20000101）');
                return;
            }
            
            try {
                const birthDate = parseDateString(birthDateStr);
                if (birthDate > new Date()) {
                    alert('出生日期不能晚于当前日期');
                    return;
                }
                
                appData.birthDate = birthDateStr;
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                
                // 清空输入框
                document.getElementById('birthDate').value = '';
                
                renderViewMode();
                alert('出生日期设置成功！');
            } catch (error) {
                alert('日期格式无效，请重试');
            }
        });

        // 添加编辑年龄目标的函数
        function editAgeGoal(index) {
            const goal = appData.ageGoals[index];
            
            const content = `
                <form id="editAgeGoalForm">
                    <div class="mb-3">
                        <label class="form-label">目标名称</label>
                        <input type="text" class="form-control" id="editAgeGoalName" value="${goal.name}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">目标日期 (YYYYMMDD)</label>
                        <input type="text" class="form-control" id="editTargetDate" value="${goal.targetDate}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">目标分类</label>
                        <select class="form-select" id="editAgeGoalCategory">
                            <option value="yearly" ${goal.category === 'yearly' ? 'selected' : ''}>今年进度</option>
                            <option value="lifetime" ${goal.category === 'lifetime' ? 'selected' : ''}>人生总进度</option>
                        </select>
                    </div>
                    <input type="hidden" id="editGoalIndex" value="${index}">
                </form>
            `;

            const modalHtml = createModal({
                id: 'editAgeGoalModal',
                title: '编辑年龄目标',
                content: content,
                onSave: 'saveEditedAgeGoal()'
            });

            const existingModal = document.getElementById('editAgeGoalModal');
            if (existingModal) {
                existingModal.remove();
            }
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = new bootstrap.Modal(document.getElementById('editAgeGoalModal'));
            modal.show();
        }

        // 添加保存编辑后的年龄目标函数
        function saveEditedAgeGoal() {
            const index = parseInt(document.getElementById('editGoalIndex').value);
            const name = document.getElementById('editAgeGoalName').value;
            const targetDate = document.getElementById('editTargetDate').value;
            const category = document.getElementById('editAgeGoalCategory').value;

            if (!name || !targetDate || !category) {
                alert('请填写完整信息');
                return;
            }

            if (!/^\d{8}$/.test(targetDate)) {
                alert('请输入正确的日期格式（例如：20260106）');
                return;
            }

            try {
                const date = parseDateString(targetDate);
                if (date < new Date()) {
                    alert('目标日期不能早于当前日期');
                    return;
                }

                appData.ageGoals[index] = {
                    name: name,
                    targetDate: targetDate,
                    category: category
                };

                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode();

                const modal = bootstrap.Modal.getInstance(document.getElementById('editAgeGoalModal'));
                modal.hide();
            } catch (error) {
                alert('日期格式无效，请重试');
            }
        }

        // 将编辑函数添加到全局作用域
        window.editAgeGoal = editAgeGoal;
        window.saveEditedAgeGoal = saveEditedAgeGoal;

        // 添加编辑存款目标的函数
        function editGoal(index) {
            const goal = appData.goals[index];
            
            const modalHtml = `
                <div class="modal fade" id="editGoalModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">编辑存款目标</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editGoalForm">
                                    <div class="mb-3">
                                        <label class="form-label">目标名称</label>
                                        <input type="text" class="form-control" id="editGoalName" 
                                               value="${goal.name}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">目标金额</label>
                                        <input type="text" class="form-control" id="editGoalAmount" 
                                               value="${goal.target}" required>
                                    </div>
                                    <input type="hidden" id="editGoalIndex" value="${index}">
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" onclick="saveEditedGoal()">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 移除已存在的模态框
            const existingModal = document.getElementById('editGoalModal');
            if (existingModal) {
                existingModal.remove();
            }

            // 添加新的模态框
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('editGoalModal'));
            modal.show();
        }

        // 添加保存编辑后的存款目标函数
        function saveEditedGoal() {
            const index = parseInt(document.getElementById('editGoalIndex').value);
            const name = document.getElementById('editGoalName').value;
            const amountStr = document.getElementById('editGoalAmount').value;

            if (!name || !amountStr) {
                alert('请填写完整信息');
                return;
            }

            try {
                const amount = parseAmount(amountStr);
                
                appData.goals[index] = {
                    name: name,
                    target: amount
                };

                // 按目标金额从小到大排序
                appData.goals.sort((a, b) => a.target - b.target);

                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode();

                const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
                modal.hide();
            } catch (error) {
                alert(error.message);
            }
        }

        // 将编辑函数添加到全局作用域
        window.editGoal = editGoal;
        window.saveEditedGoal = saveEditedGoal;

        // 添加历史记录函数
        function addHistory(type, amount, note) {
            const record = {
                id: Date.now(),  // 使用时间戳作为唯一ID
                type: type,      // 'deposit' 或 'withdraw'
                amount: amount,
                note: note || '',
                date: new Date().toISOString()
            };
            appData.history.unshift(record);  // 添加到数组开头
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
        }

        // 删除历史记录函数
        function deleteHistory(id) {
            const index = appData.history.findIndex(record => record.id === id);
            if (index !== -1) {
                // 恢复金额
                const record = appData.history[index];
                if (record.type === 'deposit') {
                    appData.totalSaved = SafeMoney.fromYuan(appData.totalSaved)
                        .subtract(record.amount).toYuan();
                } else {
                    appData.totalSaved = SafeMoney.fromYuan(appData.totalSaved)
                        .add(record.amount).toYuan();
                }
                // 删除记录
                appData.history.splice(index, 1);
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode();
            }
        }

        // 修改显示历史记录的函数
        function displayHistory(container) {
            container.innerHTML = '';
            
            if (!appData.history || appData.history.length === 0) {
                container.innerHTML = '<div class="alert alert-info">暂无历史记录</div>';
                return;
            }

            // 创建左右布局的容器
            const layoutDiv = document.createElement('div');
            layoutDiv.className = 'd-flex gap-3';
            container.appendChild(layoutDiv);

            // 创建左侧统计区域
            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex-shrink-0';
            leftDiv.style.width = '300px';
            leftDiv.innerHTML = `
                <div class="text-center mb-3">
                    <div class="btn-group">
                        <button class="btn btn-primary btn-sm" onclick="showStatistics('week', true)">本周统计</button>
                        <button class="btn btn-primary btn-sm" onclick="showStatistics('month', true)">本月统计</button>
                    </div>
                </div>
                <div id="statisticsContainer"></div>
            `;
            layoutDiv.appendChild(leftDiv);

            // 创建右侧历史记录列表
            const rightDiv = document.createElement('div');
            rightDiv.className = 'flex-grow-1';
            layoutDiv.appendChild(rightDiv);

            // 创建历史记录列表
            const historySection = document.createElement('div');
            historySection.className = 'history-section';

            appData.history.forEach((record) => {
                const recordDate = new Date(record.date);
                const card = document.createElement('div');
                card.className = 'card mb-2';
                
                const isDeposit = record.type === 'deposit';
                const operationClass = isDeposit ? 'text-success' : 'text-danger';
                const operationText = isDeposit ? '存' : '取';
                
                // 修改显示历史记录的函数中的卡片部分
                card.innerHTML = `
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <div style="min-width: 30px;">
                                    <span class="${operationClass} fw-bold">${operationText}</span>
                                </div>
                                <div style="min-width: 100px;">
                                    <span class="fw-bold ${operationClass}">${formatMoney(record.amount)}</span>
                                </div>
                                <div class="flex-grow-1">
                                    ${record.note ? `<span class="text-muted">${record.note}</span>` : ''}
                                </div>
                                <div style="min-width: 150px;">
                                    <small class="text-muted">${recordDate.toLocaleString('zh-CN')}</small>
                                </div>
                                <div>
                                    <button class="btn btn-danger btn-sm py-0 px-2" 
                                            style="font-size: 0.75rem;"
                                            onclick="deleteHistory(${record.id})">
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                historySection.appendChild(card);
            });

            rightDiv.appendChild(historySection);
        }

        // 修改统计功能显示方式
        function showStatistics(period, inPage = false) {
            const stats = calculateStatistics(period);
            const periodText = period === 'week' ? '本周' : '本月';
            
            const statsHtml = `
                <div class="statistics-container p-3 bg-light rounded">
                    <h6 class="text-center mb-3">${periodText}统计</h6>
                    <div class="stat-card deposit mb-3">
                        <h6>存款统计</h6>
                        <div class="stat-value text-success">${formatMoney(stats.totalDeposit)}</div>
                        <div class="stat-count">共${stats.deposits}笔</div>
                    </div>
                    <div class="stat-card withdraw mb-3">
                        <h6>取款统计</h6>
                        <div class="stat-value text-danger">${formatMoney(stats.totalWithdraw)}</div>
                        <div class="stat-count">共${stats.withdrawals}笔</div>
                    </div>
                    <div class="net-change">
                        <h6>净变化</h6>
                        <div class="stat-value ${stats.netChange >= 0 ? 'text-success' : 'text-danger'}">
                            ${formatMoney(stats.netChange)}
                        </div>
                    </div>
                </div>
            `;

            if (inPage) {
                // 在页面左侧显示统计信息
                const container = document.getElementById('statisticsContainer');
                if (container) {
                    container.innerHTML = statsHtml;
                }
            } else {
                // 弹窗显示统计信息（保留原有功能以备用）
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${periodText}统计</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${statsHtml}
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);
                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
                
                modal.addEventListener('hidden.bs.modal', () => {
                    modal.remove();
                });
            }
        }

        // 计算统计数据
        function calculateStatistics(period) {
            const now = new Date();
            const stats = {
                deposits: 0,
                withdrawals: 0,
                totalDeposit: 0,
                totalWithdraw: 0,
                netChange: 0
            };

            appData.history.forEach(record => {
                const recordDate = new Date(record.date);
                let isInPeriod = false;

                if (period === 'week') {
                    // 计算本周的开始时间（周一）
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                    weekStart.setHours(0, 0, 0, 0);
                    isInPeriod = recordDate >= weekStart;
                } else {
                    // 本月
                    isInPeriod = recordDate.getMonth() === now.getMonth() && 
                                recordDate.getFullYear() === now.getFullYear();
                }

                if (isInPeriod) {
                    if (record.type === 'deposit') {
                        stats.deposits++;
                        stats.totalDeposit += record.amount;
                    } else {
                        stats.withdrawals++;
                        stats.totalWithdraw += record.amount;
                    }
                }
            });

            stats.netChange = stats.totalDeposit - stats.totalWithdraw;
            return stats;
        }

        // 添加相关样式
        const statisticsStyle = `
        .statistics-container {
            padding: 1rem;
        }

        .stat-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .stat-card.deposit {
            background: linear-gradient(145deg, #e8f5e9, #f8f9fa);
        }

        .stat-card.withdraw {
            background: linear-gradient(145deg, #fee8e7, #f8f9fa);
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0.5rem 0;
        }

        .stat-count {
            color: #666;
            font-size: 0.9rem;
        }

        .net-change {
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 10px;
            margin-top: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .history-header {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .history-section {
            background: #fff;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        `;

        // 将样式添加到文档中
        if (!document.getElementById('statistics-style')) {
            const style = document.createElement('style');
            style.id = 'statistics-style';
            style.textContent = statisticsStyle;
            document.head.appendChild(style);
        }

        // 添加归档函数
        function archiveGoal(index, type = 'savings') {
            if (type === 'savings') {
                const goal = appData.goals[index];
                goal.archiveDate = new Date().toISOString();
                appData.archivedGoals.unshift(goal);
                appData.goals.splice(index, 1);
            } else if (type === 'age') {
                const goal = appData.ageGoals[index];
                goal.archiveDate = new Date().toISOString();
                appData.archivedAgeGoals.unshift(goal);
                appData.ageGoals.splice(index, 1);
            }
            renderViewMode();
        }

        // 修改显示归档记录的函数
        function displayArchived(container) {
            container.innerHTML = '';
            
            if ((!appData.archivedGoals || appData.archivedGoals.length === 0) && 
                (!appData.archivedAgeGoals || appData.archivedAgeGoals.length === 0)) {
                container.innerHTML = '<div class="alert alert-info">暂无归档记录</div>';
                return;
            }

            // 显示归档的存款目标
            if (appData.archivedGoals && appData.archivedGoals.length > 0) {
                appData.archivedGoals.forEach((goal, index) => {
                    const archiveDate = new Date(goal.archiveDate);
                    const card = document.createElement('div');
                    card.className = 'card mb-2';
                    card.innerHTML = `
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="d-flex align-items-center gap-1">
                                        <span class="text-success">[存]</span>
                                        <span>${goal.name}</span>
                                        <span class="text-muted">-${formatMoney(goal.target)}</span>
                                    </div>
                                    <small class="text-muted">归档时间: ${archiveDate.toLocaleString('zh-CN')}</small>
                                </div>
                                <button class="btn btn-primary btn-sm py-0 px-2" 
                                        style="font-size: 0.75rem;"
                                        onclick="restoreArchivedGoal(${index}, 'savings')">恢复</button>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }

            // 显示归档的时间目标
            if (appData.archivedAgeGoals && appData.archivedAgeGoals.length > 0) {
                appData.archivedAgeGoals.forEach((goal, index) => {
                    const archiveDate = new Date(goal.archiveDate);
                    const targetDate = parseDateString(goal.targetDate);
                    const formattedTargetDate = targetDate.toLocaleDateString('zh-CN');
                    
                    const card = document.createElement('div');
                    card.className = 'card mb-2';
                    card.innerHTML = `
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="d-flex align-items-center gap-1">
                                        <span class="text-primary">[时]</span>
                                        <span>${goal.name}</span>
                                        <span class="text-muted">-${formattedTargetDate}</span>
                                    </div>
                                    <small class="text-muted">归档时间: ${archiveDate.toLocaleString('zh-CN')}</small>
                                </div>
                                <button class="btn btn-primary btn-sm py-0 px-2" 
                                        style="font-size: 0.75rem;"
                                        onclick="restoreArchivedGoal(${index}, 'age')">恢复</button>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }
        }

        // 添加归档模式的事件监听
        document.getElementById('archiveMode').addEventListener('change', () => {
            if (document.getElementById('archiveMode').checked) {
                renderViewMode('archive');
            }
        });

        // 修改恢复归档目标的函数
        function restoreArchivedGoal(index, type = 'savings') {
            if (type === 'savings') {
                const goal = appData.archivedGoals[index];
                delete goal.archiveDate; // 删除归档日期
                appData.goals.push(goal);
                // 按目标金额排序
                appData.goals.sort((a, b) => a.target - b.target);
                appData.archivedGoals.splice(index, 1);
            } else if (type === 'age') {
                const goal = appData.archivedAgeGoals[index];
                delete goal.archiveDate; // 删除归档日期
                appData.ageGoals.push(goal);
                // 按日期排序
                appData.ageGoals.sort((a, b) => {
                    const dateA = parseDateString(a.targetDate);
                    const dateB = parseDateString(b.targetDate);
                    return dateA - dateB;
                });
                appData.archivedAgeGoals.splice(index, 1);
            }
            renderViewMode();
        }

        // 将恢复函数添加到全局作用域
        window.restoreArchivedGoal = restoreArchivedGoal;

        // 添加清空历史记录的函数
        function clearHistory() {
            if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
                appData.history = [];
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode();
                showToast('历史记录已清空');
            }
        }

        // 添加清空归档记录的函数
        function clearArchived() {
            if (confirm('确定要清空所有归档记录吗？此操作不可恢复！')) {
                appData.archivedGoals = [];
                appData.archivedAgeGoals = [];
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode();
                showToast('归档记录已清空');
            }
        }

        // 添加提示函数
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            // 2秒后自动消失
            setTimeout(() => {
                toast.remove();
            }, 2000);
        }

        // 修改显示四象限待办事项的函数
        function displayTodos(container) {
            container.innerHTML = `
                <div class="quadrant-grid">
                    <div class="quadrant quadrant-1" data-quadrant="q1" ondrop="dropTodo(event)" ondragover="allowDrop(event)">
                        <div class="quadrant-header">
                            <h3 class="quadrant-title">重要且紧急</h3>
                        </div>
                        <div class="todo-list" id="q1-list"></div>
                        <div class="add-todo">
                            <input type="text" class="form-control" placeholder="添加待办事项">
                            <button class="btn btn-primary btn-sm" onclick="addTodo('q1')">添加</button>
                        </div>
                    </div>
                    <div class="quadrant quadrant-2" data-quadrant="q2" ondrop="dropTodo(event)" ondragover="allowDrop(event)">
                        <div class="quadrant-header">
                            <h3 class="quadrant-title">重要不紧急</h3>
                        </div>
                        <div class="todo-list" id="q2-list"></div>
                        <div class="add-todo">
                            <input type="text" class="form-control" placeholder="添加待办事项">
                            <button class="btn btn-primary btn-sm" onclick="addTodo('q2')">添加</button>
                        </div>
                    </div>
                    <div class="quadrant quadrant-3" data-quadrant="q3" ondrop="dropTodo(event)" ondragover="allowDrop(event)">
                        <div class="quadrant-header">
                            <h3 class="quadrant-title">紧急不重要</h3>
                        </div>
                        <div class="todo-list" id="q3-list"></div>
                        <div class="add-todo">
                            <input type="text" class="form-control" placeholder="添加待办事项">
                            <button class="btn btn-primary btn-sm" onclick="addTodo('q3')">添加</button>
                        </div>
                    </div>
                    <div class="quadrant quadrant-4" data-quadrant="q4" ondrop="dropTodo(event)" ondragover="allowDrop(event)">
                        <div class="quadrant-header">
                            <h3 class="quadrant-title">不重要不紧急</h3>
                        </div>
                        <div class="todo-list" id="q4-list"></div>
                        <div class="add-todo">
                            <input type="text" class="form-control" placeholder="添加待办事项">
                            <button class="btn btn-primary btn-sm" onclick="addTodo('q4')">添加</button>
                        </div>
                    </div>
                </div>
            `;

            // 更新每个象限的待办事项列表
            ['q1', 'q2', 'q3', 'q4'].forEach(quadrant => {
                const list = document.getElementById(`${quadrant}-list`);
                list.ondragover = allowDrop;
                list.ondrop = dropTodo;
                
                appData.todos[quadrant].forEach((todo, index) => {
                    const item = document.createElement('div');
                    item.className = 'todo-item';
                    item.draggable = true;
                    item.setAttribute('data-quadrant', quadrant);
                    item.setAttribute('data-index', index);
                    
                    // 添加拖拽事件监听器
                    item.ondragstart = dragTodo;
                    item.ondragend = dragEnd;
                    item.ondragover = (e) => {
                        e.preventDefault();
                        const draggingItem = document.querySelector('.dragging');
                        if (draggingItem !== item) {
                            const rect = item.getBoundingClientRect();
                            const midY = rect.top + rect.height / 2;
                            if (e.clientY < midY) {
                                item.classList.add('drag-over-top');
                                item.classList.remove('drag-over-bottom');
                            } else {
                                item.classList.add('drag-over-bottom');
                                item.classList.remove('drag-over-top');
                            }
                        }
                    };
                    item.ondragleave = () => {
                        item.classList.remove('drag-over-top', 'drag-over-bottom');
                    };
                    
                    item.innerHTML = `
                        <input type="checkbox" class="todo-checkbox" 
                               ${todo.completed ? 'checked' : ''} 
                               onchange="toggleTodo('${quadrant}', ${index})">
                        <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                        <div class="todo-actions">
                            <button class="btn btn-danger btn-sm py-0 px-2" 
                                    onclick="deleteTodo('${quadrant}', ${index})">删除</button>
                        </div>
                    `;
                    list.appendChild(item);
                });
            });
        }

        // 修改拖拽相关函数
        function dragTodo(event) {
            const item = event.target;
            item.classList.add('dragging');
            event.dataTransfer.setData('text/plain', JSON.stringify({
                quadrant: item.getAttribute('data-quadrant'),
                index: parseInt(item.getAttribute('data-index'))
            }));
        }

        function dragEnd(event) {
            event.target.classList.remove('dragging');
            // 移除所有拖拽指示器
            document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        }

        function allowDrop(event) {
            event.preventDefault();
        }

        function dropTodo(event) {
            event.preventDefault();
            
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            const sourceQuadrant = data.quadrant;
            const sourceIndex = data.index;
            
            // 获取目标象限和位置
            let targetQuadrant = event.currentTarget.getAttribute('data-quadrant');
            if (!targetQuadrant) {
                // 如果拖到了项目上，获取其父元素的象限
                const targetItem = event.target.closest('.todo-item');
                if (targetItem) {
                    targetQuadrant = targetItem.getAttribute('data-quadrant');
                }
            }
            
            if (!targetQuadrant) return;
            
            // 获取拖放位置
            const targetList = document.getElementById(`${targetQuadrant}-list`);
            const items = Array.from(targetList.querySelectorAll('.todo-item'));
            let targetIndex = items.length;
            
            const targetItem = event.target.closest('.todo-item');
            if (targetItem) {
                targetIndex = parseInt(targetItem.getAttribute('data-index'));
                const rect = targetItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (event.clientY > midY) {
                    targetIndex++;
                }
            }
            
            // 移动待办事项
            const todo = appData.todos[sourceQuadrant][sourceIndex];
            appData.todos[sourceQuadrant].splice(sourceIndex, 1);
            
            if (sourceQuadrant === targetQuadrant) {
                // 同一象限内移动
                if (targetIndex > sourceIndex) {
                    targetIndex--;
                }
                appData.todos[targetQuadrant].splice(targetIndex, 0, todo);
            } else {
                // 不同象限间移动
                appData.todos[targetQuadrant].splice(targetIndex, 0, todo);
            }
            
            // 更新UI
            renderViewMode();
        }

        // 添加待办事项
        function addTodo(quadrant) {
            const input = document.querySelector(`.quadrant-${quadrant.slice(-1)} .add-todo input`);
            const text = input.value.trim();
            
            if (text) {
                appData.todos[quadrant].push({
                    text: text,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
                input.value = '';
                renderViewMode();
            }
        }

        // 切换待办事项状态
        function toggleTodo(quadrant, index) {
            appData.todos[quadrant][index].completed = !appData.todos[quadrant][index].completed;
            renderViewMode();
        }

        // 删除待办事项
        function deleteTodo(quadrant, index) {
            appData.todos[quadrant].splice(index, 1);
            renderViewMode();
        }

        // 添加四象限待办事项模式的事件监听
        document.getElementById('todoMode').addEventListener('change', () => {
            if (document.getElementById('todoMode').checked) {
                renderViewMode('todo');
            }
        });

        // 添加灵感管理相关的函数
        function addInspiration() {
            const name = prompt('请输入灵感名称:');
            const category = prompt('请选择灵感分类:');
            const content = prompt('请输入灵感内容:');

            if (name && category && content) {
                const newInspiration = {
                    id: Date.now().toString(),
                    number: 1,
                    title: name,
                    category: category,
                    content: content,
                    createTime: Date.now(),
                    updateTime: Date.now()
                };
                appData.inspirations.push(newInspiration);
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode();
                alert('灵感添加成功！');
            }
        }

        // 显示灵感管理界面
        function showInspirationModal() {
            const modalHtml = `
                <div class="modal fade" id="inspirationModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">添加灵感</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="inspirationForm">
                                    <div class="mb-3">
                                        <label class="form-label">灵感名称</label>
                                        <input type="text" class="form-control" id="inspirationName" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">灵感分类</label>
                                        <select class="form-select" id="inspirationCategory">
                                            <option value="">请选择分类</option>
                                            ${appData.inspirationTags.map(tag => `
                                                <option value="${tag}">${tag}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">灵感内容</label>
                                        <textarea class="form-control" id="inspirationContent" rows="3" required></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" onclick="addInspiration()">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            if (!document.getElementById('inspirationModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                document.getElementById('inspirationModal').outerHTML = modalHtml;
            }

            const modal = new bootstrap.Modal(document.getElementById('inspirationModal'));
            modal.show();
        }

        // 确保添加灵感按钮正常工作
        document.addEventListener('DOMContentLoaded', function() {
            // 添加点击事件监听器
            document.body.addEventListener('click', function(e) {
                if (e.target.matches('.add-inspiration-btn') || e.target.closest('.add-inspiration-btn')) {
                    showInspirationModal();
                }
            });
        });

        // 添加灵感列表的函数
        function displayInspirationList() {
            const listContainer = document.getElementById('inspirationList');
            listContainer.innerHTML = '';

            appData.inspirations.forEach(inspiration => {
                const item = document.createElement('div');
                item.className = 'inspiration-item';
                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                            <span class="inspiration-number">${inspiration.number}</span>
                            <div class="inspiration-content">
                                <h5 class="inspiration-title">${inspiration.title}</h5>
                                <p class="inspiration-text">${inspiration.content}</p>
                                <small class="inspiration-time">创建时间: ${new Date(inspiration.createTime).toLocaleString()}</small>
                            </div>
                        </div>
                        <div class="inspiration-actions">
                            <button class="btn btn-primary btn-sm" onclick="editInspiration(${inspiration.id})">编辑</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteInspiration(${inspiration.id})">删除</button>
                        </div>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        }

        // 修改编辑灵感函数
        function editInspiration(id) {
            const inspiration = appData.inspirations.find(inspiration => inspiration.id === id);
            if (inspiration) {
                const modalHtml = `
                    <div class="modal fade" id="editInspirationModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">编辑灵感</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="editInspirationForm">
                                        <div class="mb-3">
                                            <label class="form-label">标签</label>
                                            <div class="tag-selection">
                                                ${appData.inspirationTags.map(tag => `
                                                    <div class="form-check form-check-inline">
                                                        <input class="form-check-input" type="checkbox" 
                                                               id="edit-tag-${tag}" value="${tag}"
                                                               ${(inspiration.tags || []).includes(tag) ? 'checked' : ''}>
                                                        <label class="form-check-label" for="edit-tag-${tag}">${tag}</label>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">灵感内容</label>
                                            <textarea class="form-control" id="editInspirationContent" rows="3" required>${inspiration.content}</textarea>
                                        </div>
                                        <input type="hidden" id="editInspirationId" value="${inspiration.id}">
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                    <button type="button" class="btn btn-primary" onclick="saveEditedInspiration()">保存</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // 移除已存在的模态框
                const existingModal = document.getElementById('editInspirationModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // 添加新的模态框
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // 显示模态框
                const modal = new bootstrap.Modal(document.getElementById('editInspirationModal'));
                modal.show();
            }
        }

        // 修改保存编辑后的灵感函数
        function saveEditedInspiration() {
            const id = document.getElementById('editInspirationId').value;
            const content = document.getElementById('editInspirationContent').value;
            
            // 获取选中的标签
            const selectedTags = appData.inspirationTags
                .filter(tag => document.getElementById(`edit-tag-${tag}`).checked);

            if (!content) {
                alert('请填写灵感内容');
                return;
            }

            const inspiration = appData.inspirations.find(insp => insp.id === id);
            if (inspiration) {
                inspiration.content = content;
                inspiration.tags = selectedTags;
                inspiration.updateTime = Date.now();
                
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('editInspirationModal'));
                modal.hide();
                // 更新界面
                renderViewMode();
            }
        }

        // 将编辑函数添加到全局作用域
        window.editInspiration = editInspiration;
        window.saveEditedInspiration = saveEditedInspiration;

        // 删除灵感函数
        function deleteInspiration(id) {
            appData.inspirations = appData.inspirations.filter(inspiration => inspiration.id !== id);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            renderViewMode();
        }

        // 添加灵感列表的事件监听
        document.getElementById('inspirationMode').addEventListener('change', () => {
            if (document.getElementById('inspirationMode').checked) {
                renderViewMode('inspiration');
            }
        });

        // 显示灵感列表
        document.getElementById('inspirationMode').addEventListener('change', displayInspirationList);

        // 添加拖拽排序相关的函数
        function initDragAndDrop() {
            const items = document.querySelectorAll('.inspiration-item');
            const container = document.querySelector('.inspiration-grid');

            items.forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    e.target.classList.add('dragging');
                });

                item.addEventListener('dragend', (e) => {
                    e.target.classList.remove('dragging');
                    updateInspirationNumbers();
                });
            });

            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggable = document.querySelector('.dragging');
                const afterElement = getDragAfterElement(container, e.clientY);
                
                if (afterElement == null) {
                    container.appendChild(draggable);
                } else {
                    container.insertBefore(draggable, afterElement);
                }
            });
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.inspiration-item:not(.dragging)')];

            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function updateInspirationNumbers() {
            const items = document.querySelectorAll('.inspiration-item');
            const newOrder = [];
            
            items.forEach((item, index) => {
                const id = item.dataset.id;
                const inspiration = appData.inspirations.find(insp => insp.id === id);
                if (inspiration) {
                    inspiration.number = index + 1;
                    newOrder.push(inspiration);
                }
            });

            appData.inspirations = newOrder;
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            renderViewMode();
        }

        // 修改显示灵感列表的函数，添加拖拽功能
        function displayInspirations(container) {
            // 获取当前视图模式
            const viewMode = localStorage.getItem('inspiration_view_mode') || 'grid';
            
            container.innerHTML = `
                <div class="inspiration-header">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <div class="inspiration-search">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="搜索灵感..." onkeyup="searchInspirations(this.value)">
                        </div>
                        <div class="view-switch">
                            <button class="${viewMode === 'grid' ? 'active' : ''}" onclick="switchView('grid')" title="网格视图">
                                <i class="fas fa-th-large"></i> 网格
                            </button>
                            <button class="${viewMode === 'timeline' ? 'active' : ''}" onclick="switchView('timeline')" title="时间线视图">
                                <i class="fas fa-stream"></i> 时间线
                            </button>
                        </div>
                        <div class="inspiration-actions-group">
                            <button class="btn btn-danger btn-sm" id="batchDeleteBtn" style="display:none" onclick="batchDeleteInspirations()" title="删除选中的灵感">
                                <i class="fas fa-trash"></i> 删除选中
                            </button>
                            <button class="btn btn-success btn-sm" id="batchMergeBtn" style="display:none" onclick="showMergeModal()" title="合并选中的灵感">
                                <i class="fas fa-object-group"></i> 合并选中
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="showBulkInputModal()" title="批量导入灵感">
                                <i class="fas fa-file-import"></i> 批量导入
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="showAddInspirationModal()" title="添加新灵感">
                                <i class="fas fa-plus"></i> 添加
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="showAddTagModal()" title="管理标签">
                                <i class="fas fa-tags"></i> 标签
                            </button>
                        </div>
                    </div>
                </div>

                <div class="inspiration-filters">
                    <div class="tag-buttons">
                        <button class="tag-btn active" onclick="filterInspirations('all')">全部</button>
                        ${appData.inspirationTags.map(tag => `
                            <button class="tag-btn" onclick="filterInspirations('${tag}')">${tag}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="${viewMode === 'grid' ? 'inspiration-grid' : 'timeline-view'}" id="inspirationContainer">
                    ${viewMode === 'grid' ? displayGridView() : displayTimelineView()}
                </div>
            `;

            // 初始化拖拽功能（仅在网格视图时）
            if (viewMode === 'grid') {
                initDragAndDrop();
            }
        }

        // 添加视图切换函数
        function switchView(mode) {
            localStorage.setItem('inspiration_view_mode', mode);
            const container = document.getElementById('inspirationContainer');
            container.className = mode === 'grid' ? 'inspiration-grid' : 'timeline-view';
            container.innerHTML = mode === 'grid' ? displayGridView() : displayTimelineView();
            
            // 重新初始化拖拽功能（仅在网格视图时）
            if (mode === 'grid') {
                initDragAndDrop();
            }

            // 更新按钮状态
            document.querySelectorAll('.view-switch button').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.toLowerCase().includes(mode));
            });
        }

        // 添加网格视图显示函数
        function displayGridView() {
            return appData.inspirations
                .sort((a, b) => a.number - b.number)
                .map(inspiration => `
                    <div class="inspiration-item" draggable="true" data-id="${inspiration.id}">
                        <div class="inspiration-header-row">
                            <div class="inspiration-checkbox">
                                <input type="checkbox" class="inspiration-select" onchange="toggleInspiration(this)">
                            </div>
                            <div class="inspiration-number">${inspiration.number}</div>
                            <div class="inspiration-content">
                                <div class="inspiration-text">${inspiration.content}</div>
                            </div>
                        </div>
                        <div class="inspiration-footer">
                            <div class="inspiration-info">
                                <div class="inspiration-tags">
                                    ${(inspiration.tags || []).map(tag => `
                                        <span class="inspiration-tag">${tag}</span>
                                    `).join('')}
                                </div>
                                <div class="inspiration-time">
                                    最后更新: ${formatDate(inspiration.updateTime)}
                                </div>
                            </div>
                            <div class="inspiration-actions">
                                <button class="btn-edit" onclick="editInspiration('${inspiration.id}')">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button class="btn-delete" onclick="deleteInspiration('${inspiration.id}')">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
        }

        // 添加时间线视图显示函数
        function displayTimelineView() {
            // 按日期分组
            const groups = {};
            appData.inspirations
                .sort((a, b) => b.createTime - a.createTime) // 按创建时间倒序排列
                .forEach(inspiration => {
                    const date = new Date(inspiration.createTime).toLocaleDateString('zh-CN');
                    if (!groups[date]) {
                        groups[date] = [];
                    }
                    groups[date].push(inspiration);
                });

            // 生成时间线HTML
            return Object.entries(groups).map(([date, inspirations]) => `
                <div class="timeline-group">
                    <div class="timeline-date">${date}</div>
                    <div class="timeline-items">
                        ${inspirations.map(inspiration => `
                            <div class="timeline-item" data-id="${inspiration.id}">
                                <div class="inspiration-content">
                                    <div class="inspiration-text">${inspiration.content}</div>
                                    <div class="inspiration-footer mt-2">
                                        <div class="inspiration-tags">
                                            ${(inspiration.tags || []).map(tag => `
                                                <span class="inspiration-tag">${tag}</span>
                                            `).join('')}
                                        </div>
                                        <div class="inspiration-time text-muted small">
                                            ${new Date(inspiration.createTime).toLocaleTimeString('zh-CN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div class="inspiration-actions mt-2">
                                            <button class="btn-edit" onclick="editInspiration('${inspiration.id}')">
                                                <i class="fas fa-edit"></i> 编辑
                                            </button>
                                            <button class="btn-delete" onclick="deleteInspiration('${inspiration.id}')">
                                                <i class="fas fa-trash"></i> 删除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        // 将视图切换函数添加到全局作用域
        window.switchView = switchView;

        // 修改保存批量灵感的函数
        function saveBulkInspirations() {
            const content = document.getElementById('bulkContent').value.trim();
            if (!content) {
                alert('请输入灵感内容');
                return;
            }

            // 按换行符分割内容，并过滤空行
            const inspirations = content.split(/\n/)
                .map(text => text.trim())
                .filter(text => text)
                .map(text => {
                    // 去除常见的序号格式：
                    // 1. 数字加点: "1. "
                    // 2. 数字加括号: "1) " 或 "(1) "
                    // 3. 中文数字加顿号或点: "一、" 或 "一. "
                    return text.replace(/^(\d+[\.\)］\】]|\(\d+\)|[一二三四五六七八九十百千万]+[、\.])\s*/, '').trim();
                });

            // 获取当前最大编号
            const maxNumber = appData.inspirations.reduce((max, insp) => 
                Math.max(max, insp.number || 0), 0);

            // 定义标签关键词映射
            const tagKeywords = {
                '工作': ['工作', '职业', '事业', '工资', '薪资', '公司', '老板', '同事', '客户', '项目', '会议', '汇报', '晋升', '职位', '办公'],
                '学习': ['学习', '知识', '课程', '考试', '读书', '笔记', '研究', '学校', '教育', '培训', '技能', '成长', '进步', '思考', '理解', '复习', '练习'],
                '生活': ['生活', '家庭', '健康', '运动', '饮食', '休息', '娱乐', '旅行', '购物', '朋友', '社交', '爱好', '兴趣', '心情', '感受'],
                '其他': []  // 其他类别作为默认分类，不需要关键词
            };

            // 批量添加灵感
            inspirations.forEach((text, index) => {
                // 自动识别标签
                const matchedTags = [];
                for (const [tag, keywords] of Object.entries(tagKeywords)) {
                    // 检查内容是否包含该标签的任何关键词
                    if (keywords.some(keyword => text.includes(keyword))) {
                        matchedTags.push(tag);
                    }
                }
                
                // 如果没有匹配到任何标签，添加"其他"标签
                if (matchedTags.length === 0) {
                    matchedTags.push('其他');
                }

                const newInspiration = {
                    id: Date.now() + index.toString(),
                    number: maxNumber + index + 1,
                    content: text,
                    tags: matchedTags,
                    createTime: Date.now(),
                    updateTime: Date.now()
                };
                appData.inspirations.push(newInspiration);
            });

            // 保存数据
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkInputModal'));
            modal.hide();

            // 更新界面
            renderViewMode();
            showToast('批量导入成功');
        }

        // 修改批量导入模态框的提示文本
        function showBulkInputModal() {
            const content = `
                <div class="mb-3">
                    <label class="form-label">请输入灵感内容(每行一条灵感，自动去除序号)</label>
                    <div class="text-muted small mb-2">系统会自动识别内容并添加合适的标签</div>
                    <textarea class="form-control" id="bulkContent" rows="10" 
                            placeholder="1. 第一条灵感
2. 第二条灵感
3. 第三条灵感"></textarea>
                </div>
            `;

            const modalHtml = createModal({
                id: 'bulkInputModal',
                title: '批量导入灵感',
                content: content,
                onSave: 'saveBulkInspirations()'
            });

            const existingModal = document.getElementById('bulkInputModal');
            if (existingModal) {
                existingModal.remove();
            }
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = new bootstrap.Modal(document.getElementById('bulkInputModal'));
            modal.show();
        }

        // 添加格式化日期的函数
        function formatDate(timestamp) {
            return new Date(timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // 修改标签管理模态框函数
        function showAddTagModal() {
            const modalHtml = `
                <div class="modal fade" id="addTagModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">管理标签</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">添加新标签</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="newTagInput" placeholder="输入新标签">
                                        <button class="btn btn-primary" type="button" onclick="addNewTag()">添加</button>
                                    </div>
                                </div>
                                <div class="current-tags">
                                    <label class="form-label">当前标签</label>
                                    <div class="tag-list" id="tagList">
                                        ${renderTagList()}
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 移除已存在的模态框
            const existingModal = document.getElementById('addTagModal');
            if (existingModal) {
                existingModal.remove();
            }

            // 添加新的模态框
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('addTagModal'));
            modal.show();
        }

        // 修改显示标签列表的函数
        function renderTagList() {
            return appData.inspirationTags.map(tag => {
                // 确保tag是字符串
                const tagStr = typeof tag === 'object' ? (tag.name || tag.toString()) : tag;
                return `
                    <div class="tag-item">
                        <span>${tagStr}</span>
                        <button type="button" class="btn btn-sm" onclick="deleteTag('${tagStr}')">×</button>
                    </div>
                `;
            }).join('');
        }

        // 修改添加新标签的函数
        function addNewTag() {
            const input = document.getElementById('newTagInput');
            const tag = input.value.trim();
            
            if (!tag) {
                alert('请输入标签名称');
                return;
            }
            
            // 确保标签是字符串形式
            if (appData.inspirationTags.includes(tag) || appData.inspirationTags.some(t => 
                (typeof t === 'object' && (t.name === tag || t.toString() === tag)))) {
                alert('该标签已存在');
                return;
            }
            
            // 直接添加字符串形式的标签
            appData.inspirationTags.push(tag);
            
            // 修复现有的标签数据
            appData.inspirationTags = appData.inspirationTags.map(t => 
                typeof t === 'object' ? (t.name || t.toString()) : t
            );
            
            // 修复所有灵感中的标签数据
            appData.inspirations.forEach(inspiration => {
                if (inspiration.tags) {
                    inspiration.tags = inspiration.tags.map(t => 
                        typeof t === 'object' ? (t.name || t.toString()) : t
                    );
                }
            });
            
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            
            // 更新标签列表
            const tagList = document.getElementById('tagList');
            if (tagList) {
                tagList.innerHTML = renderTagList();
            }
            
            // 清空输入框
            input.value = '';
            
            // 更新主界面
            renderViewMode();
        }

        // 修改删除标签的函数
        function deleteTag(tag) {
            appData.inspirationTags = appData.inspirationTags.filter(t => 
                typeof t === 'object' ? (t.name !== tag && t.toString() !== tag) : t !== tag
            );
            
            // 从所有灵感中移除该标签
            appData.inspirations.forEach(inspiration => {
                if (inspiration.tags) {
                    inspiration.tags = inspiration.tags.filter(t => 
                        typeof t === 'object' ? (t.name !== tag && t.toString() !== tag) : t !== tag
                    );
                }
            });
            
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            
            // 更新标签列表
            const tagList = document.getElementById('tagList');
            if (tagList) {
                tagList.innerHTML = renderTagList();
            }
            
            // 更新主界面
            renderViewMode();
        }

        // 添加数据修复函数
        function fixTagData() {
            // 修复标签列表
            if (Array.isArray(appData.inspirationTags)) {
                appData.inspirationTags = appData.inspirationTags.map(tag => 
                    typeof tag === 'object' ? (tag.name || tag.toString()) : tag
                );
            } else {
                appData.inspirationTags = ['工作', '学习', '生活', '其他'];
            }
            
            // 修复灵感中的标签
            if (Array.isArray(appData.inspirations)) {
                appData.inspirations.forEach(inspiration => {
                    if (inspiration.tags) {
                        inspiration.tags = inspiration.tags.map(tag => 
                            typeof tag === 'object' ? (tag.name || tag.toString()) : tag
                        );
                    }
                });
            }
            
            // 保存修复后的数据
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
        }

        // 将标签管理相关函数添加到全局作用域
        window.showAddTagModal = showAddTagModal;
        window.addNewTag = addNewTag;
        window.deleteTag = deleteTag;

        // 修改筛选函数
        function filterInspirations(tag) {
            const filters = document.querySelectorAll('.inspiration-filter');
            filters.forEach(filter => {
                filter.classList.toggle('active', filter.textContent === tag || (tag === 'all' && filter.textContent === '全部'));
            });

            const items = document.querySelectorAll('.inspiration-item');
            items.forEach(item => {
                const id = item.dataset.id;
                const inspiration = appData.inspirations.find(insp => insp.id === id);
                if (tag === 'all' || (inspiration.tags && inspiration.tags.includes(tag))) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // 添加搜索灵感的函数
        function searchInspirations(keyword) {
            const items = document.querySelectorAll('.inspiration-item');
            keyword = keyword.toLowerCase().trim();
            
            items.forEach(item => {
                const id = item.dataset.id;
                const inspiration = appData.inspirations.find(insp => insp.id === id);
                const content = inspiration.content.toLowerCase();
                const tags = inspiration.tags ? inspiration.tags.join(' ').toLowerCase() : '';
                
                if (!keyword || content.includes(keyword) || tags.includes(keyword)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // 1. 添加显示存款目标的独立函数
        function displaySavingsGoals(container) {
            appData.goals.forEach((goal, index) => {
                const totalMoney = SafeMoney.fromYuan(appData.totalSaved);
                const targetMoney = SafeMoney.fromYuan(goal.target);
                
                // 计算进度
                const progress = Math.min((totalMoney.value / targetMoney.value) * 100, 100);
                
                const card = document.createElement('div');
                card.className = 'card mb-3';
                
                // 计算剩余金额
                const remainingMoney = SafeMoney.fromYuan(goal.target).subtract(appData.totalSaved);
                
                // 确定进度条状态
                const progressClass = progress >= 80 ? 'high' : progress >= 50 ? 'medium' : 'low';
                
                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${goal.name}</h5>
                            <div class="d-flex gap-2">
                                ${progress >= 100 ? `
                                    <button class="btn btn-success btn-sm py-0 px-2" onclick="archiveGoal(${index}, 'savings')">归档</button>
                                ` : ''}
                                <button class="btn btn-primary btn-sm py-0 px-2" onclick="editGoal(${index})">编辑</button>
                                <button class="btn btn-danger btn-sm py-0 px-2" onclick="deleteGoal(${index})">删除</button>
                            </div>
                        </div>
                        <div class="progress-wrapper">
                            <div class="amount-display-wrapper">
                                <div class="amount-item">
                                    <div class="amount-label">当前存款</div>
                                    <div class="amount-value">${formatMoney(appData.totalSaved)}</div>
                                </div>
                                <div class="amount-item">
                                    <div class="amount-label">目标金额</div>
                                    <div class="amount-value">${formatMoney(goal.target)}</div>
                                </div>
                            </div>
                            <div class="progress">
                                <div class="progress-bar progress-bar-striped progress-bar-animated ${progressClass}"
                                     role="progressbar"
                                     style="width: ${progress}%"
                                     aria-valuenow="${progress}"
                                     aria-valuemin="0"
                                     aria-valuemax="100">
                                    ${progress.toFixed(1)}%
                                </div>
                            </div>
                            <div class="remaining-amount">
                                还需存款: ${formatMoney(remainingMoney.toYuan())}
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // 2. 添加显示添加灵感模态框的函数
        function showAddInspirationModal() {
            const modalHtml = `
                <div class="modal fade" id="addInspirationModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">添加灵感</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="addInspirationForm">
                                    <div class="mb-3">
                                        <label class="form-label">内容</label>
                                        <textarea class="form-control" id="addInspirationContent" rows="3" required></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">标签</label>
                                        <div class="tag-selection">
                                            ${appData.inspirationTags.map(tag => `
                                                <div class="form-check form-check-inline">
                                                    <input class="form-check-input" type="checkbox" 
                                                           id="tag-${tag}" value="${tag}">
                                                    <label class="form-check-label" for="tag-${tag}">${tag}</label>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" onclick="saveNewInspiration()">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 移除已存在的模态框
            const existingModal = document.getElementById('addInspirationModal');
            if (existingModal) {
                existingModal.remove();
            }

            // 添加新的模态框
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('addInspirationModal'));
            modal.show();
        }

        // 3. 添加保存新灵感的函数
        function saveNewInspiration() {
            const content = document.getElementById('addInspirationContent').value.trim();
            
            // 获取选中的标签
            const selectedTags = appData.inspirationTags
                .filter(tag => document.getElementById(`tag-${tag}`).checked);

            if (!content) {
                alert('请填写内容');
                return;
            }

            // 获取当前最大编号
            const maxNumber = appData.inspirations.reduce((max, insp) => 
                Math.max(max, insp.number || 0), 0);

            // 创建新灵感
            const newInspiration = {
                id: Date.now().toString(),
                number: maxNumber + 1,
                content: content,
                tags: selectedTags,
                createTime: Date.now(),
                updateTime: Date.now()
            };

            // 添加到灵感列表
            appData.inspirations.push(newInspiration);

            // 保存数据
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addInspirationModal'));
            modal.hide();

            // 更新界面
            renderViewMode();
        }

        // 添加批量删除相关函数
        function toggleInspiration(checkbox) {
            const batchDeleteBtn = document.getElementById('batchDeleteBtn');
            const batchMergeBtn = document.getElementById('batchMergeBtn');
            const checkedBoxes = document.querySelectorAll('.inspiration-select:checked');
            const hasChecked = checkedBoxes.length > 0;
            
            batchDeleteBtn.style.display = hasChecked ? '' : 'none';
            batchMergeBtn.style.display = checkedBoxes.length > 1 ? '' : 'none';
        }

        function batchDeleteInspirations() {
            const checkedBoxes = document.querySelectorAll('.inspiration-select:checked');
            if (checkedBoxes.length === 0) return;

            const itemsToDelete = Array.from(checkedBoxes).map(checkbox => 
                checkbox.closest('.inspiration-item').dataset.id
            );

            appData.inspirations = appData.inspirations.filter(insp => 
                !itemsToDelete.includes(insp.id)
            );

            // 重新编号
            appData.inspirations.forEach((insp, index) => {
                insp.number = index + 1;
            });

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            renderViewMode();
        }

        // 1. 修改出生日期表单部分的HTML
        function updateBirthDateDisplay() {
            const birthDateForm = document.getElementById('birthDateForm');
            if (appData.birthDate) {
                // 已设置出生日期时显示年龄和修改按钮
                birthDateForm.innerHTML = `
                    <div class="current-age mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="text-muted small">当前年龄</div>
                                <div class="fs-5 fw-bold">${calculateAge(appData.birthDate)}岁</div>
                            </div>
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="showBirthDateInput()">
                                修改
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // 未设置时显示输入表单
                birthDateForm.innerHTML = `
                    <div class="mb-3">
                        <label class="form-label">出生日期 (YYYYMMDD):</label>
                        <input type="text" class="form-control" id="birthDate" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">设置出生日期</button>
                `;
            }
        }

        // 2. 添加显示出生日期输入框的函数
        function showBirthDateInput() {
            const birthDateForm = document.getElementById('birthDateForm');
            birthDateForm.innerHTML = `
                <div class="mb-3">
                    <label class="form-label">出生日期 (YYYYMMDD):</label>
                    <input type="text" class="form-control" id="birthDate" value="${appData.birthDate || ''}" required>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-primary flex-grow-1" onclick="saveBirthDate()">确认</button>
                    <button type="button" class="btn btn-secondary" onclick="updateBirthDateDisplay()">取消</button>
                </div>
            `;
        }

        // 3. 添加计算年龄的函数
        function calculateAge(birthDateStr) {
            const birthDate = parseDateString(birthDateStr);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age;
        }

        // 4. 修改存取款操作部分的HTML
        const depositWithdrawForm = `
            <div class="card mt-2">
                <div class="card-header py-2">记录存取款</div>
                <div class="card-body p-2">
                    <form id="moneyForm">
                        <div class="mb-2">
                            <div class="btn-group w-100" role="group">
                                <input type="radio" class="btn-check" name="operationType" id="depositType" value="deposit" checked>
                                <label class="btn btn-outline-success" for="depositType">存入</label>
                                
                                <input type="radio" class="btn-check" name="operationType" id="withdrawType" value="withdraw">
                                <label class="btn btn-outline-warning" for="withdrawType">取出</label>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">金额:</label>
                            <input type="text" class="form-control form-control-sm" id="amount" required>
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">备注:</label>
                            <input type="text" class="form-control form-control-sm" id="note" placeholder="可选">
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm w-100">确认</button>
                    </form>
                </div>
            </div>
        `;

        // 5. 修改事件监听器
        document.addEventListener('DOMContentLoaded', () => {
            // ... 其他初始化代码 ...
            
            // 更新出生日期显示
            updateBirthDateDisplay();
            
            // 替换存取款表单
            const depositWithdrawContainer = document.querySelector('.card.mt-2');
            if (depositWithdrawContainer) {
                depositWithdrawContainer.outerHTML = depositWithdrawForm;
            }
            
            // 添加存取款表单提交事件
            document.getElementById('moneyForm').addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    const operationType = document.querySelector('input[name="operationType"]:checked').value;
                    const amountStr = document.getElementById('amount').value;
                    const note = document.getElementById('note').value;
                    const amount = parseAmount(amountStr);
                    
                    if (operationType === 'withdraw' && amount > appData.totalSaved) {
                        throw new Error('取款金额不能大于总存款');
                    }
                    
                    const currentMoney = SafeMoney.fromYuan(appData.totalSaved);
                    const operationMoney = SafeMoney.fromYuan(amount);
                    
                    if (operationType === 'deposit') {
                        appData.totalSaved = currentMoney.add(operationMoney).toYuan();
                    } else {
                        appData.totalSaved = currentMoney.subtract(operationMoney).toYuan();
                    }
                    
                    addHistory(operationType, amount, note);
                    
                    document.getElementById('amount').value = '';
                    document.getElementById('note').value = '';
                    
                    renderViewMode();
                } catch (error) {
                    alert(error.message);
                }
            });
        });


        // 新增保存出生日期的函数
        function saveBirthDate() {
            const birthDateStr = document.getElementById('birthDate').value;
            
            if (!/^\d{8}$/.test(birthDateStr)) {
                alert('请输入正确的日期格式（例如：20000101）');
                return;
            }
            
            try {
                const birthDate = parseDateString(birthDateStr);
                if (birthDate > new Date()) {
                    alert('出生日期不能晚于当前日期');
                    return;
                }
                
                // 直接保存，不再弹出确认窗口
                appData.birthDate = birthDateStr;
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                updateBirthDateDisplay();
                //renderViewMode();
            } catch (error) {
                alert('日期格式无效，请重试');
            }
        }


        // 添加更新时间的函数
        function updateDateTime() {
            const now = new Date();
            
            // 格式化日期
            const dateStr = now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // 格式化时间（精确到分钟）
            const timeStr = now.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            // 更新显示
            document.getElementById('currentDate').textContent = dateStr;
            document.getElementById('currentTime').textContent = timeStr;
        }

        // 页面加载时立即更新一次
        updateDateTime();

        // 每分钟更新一次时间
        setInterval(updateDateTime, 60000);

        // 合并 showAgeSettingsModal 和 showAddInspirationModal 等类似的模态框显示函数
        // 可以创建一个通用的 showModal 函数，传入不同的配置

        function showModal(config) {
            const { id, title, content, onSave } = config;
            // 通用的模态框显示逻辑
        }

        // 统一错误处理逻辑
        function handleError(error) {
            alert(error.message || '操作失败，请重试');
        }

        // 在其他地方统一使用
        try {
            // 业务逻辑
        } catch (error) {
            handleError(error);
        }

        // 将频繁的 DOM 操作合并
        function renderViewModeElements(updates) {
            Object.entries(updates).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        }

        // 使用事件委托替代多个独立的事件监听器
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.btn-edit')) {
                editItem(target.dataset.id);
            } else if (target.matches('.btn-delete')) {
                deleteItem(target.dataset.id);
            }
        });

        // 添加显示合并模态框的函数
        function showMergeModal() {
            const checkedBoxes = document.querySelectorAll('.inspiration-select:checked');
            const selectedInspirations = Array.from(checkedBoxes).map(checkbox => {
                const itemId = checkbox.closest('.inspiration-item').dataset.id;
                return appData.inspirations.find(insp => insp.id === itemId);
            });

            const mergedContent = selectedInspirations.map(insp => insp.content).join('\n\n');
            const allTags = new Set();
            selectedInspirations.forEach(insp => {
                if (insp.tags) {
                    insp.tags.forEach(tag => allTags.add(tag));
                }
            });

            const modalHtml = `
                <div class="modal fade" id="mergeModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">合并灵感</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="mergeForm">
                                    <div class="mb-3">
                                        <label class="form-label">合并后的内容</label>
                                        <textarea class="form-control" id="mergedContent" rows="10">${mergedContent}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">标签</label>
                                        <div class="tag-selection">
                                            ${appData.inspirationTags.map(tag => `
                                                <div class="form-check form-check-inline">
                                                    <input class="form-check-input" type="checkbox" 
                                                           id="merge-tag-${tag}" value="${tag}"
                                                           ${allTags.has(tag) ? 'checked' : ''}>
                                                    <label class="form-check-label" for="merge-tag-${tag}">${tag}</label>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" onclick="mergeInspirations()">合并</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const existingModal = document.getElementById('mergeModal');
            if (existingModal) {
                existingModal.remove();
            }
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = new bootstrap.Modal(document.getElementById('mergeModal'));
            modal.show();
        }

        // 添加合并灵感的函数
        function mergeInspirations() {
            const mergedContent = document.getElementById('mergedContent').value.trim();
            if (!mergedContent) {
                alert('请输入合并后的内容');
                return;
            }

            // 获取选中的标签
            const selectedTags = appData.inspirationTags
                .filter(tag => document.getElementById(`merge-tag-${tag}`).checked);

            // 获取要合并的灵感
            const checkedBoxes = document.querySelectorAll('.inspiration-select:checked');
            const itemsToMerge = Array.from(checkedBoxes).map(checkbox => 
                checkbox.closest('.inspiration-item').dataset.id
            );

            // 创建新的合并后的灵感
            const maxNumber = appData.inspirations.reduce((max, insp) => 
                Math.max(max, insp.number || 0), 0);

            const newInspiration = {
                id: Date.now().toString(),
                number: maxNumber + 1,
                content: mergedContent,
                tags: selectedTags,
                createTime: Date.now(),
                updateTime: Date.now()
            };

            // 删除原来的灵感
            appData.inspirations = appData.inspirations.filter(insp => 
                !itemsToMerge.includes(insp.id)
            );

            // 添加合并后的新灵感
            appData.inspirations.push(newInspiration);

            // 重新编号
            appData.inspirations.forEach((insp, index) => {
                insp.number = index + 1;
            });

            // 保存数据并更新界面
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('mergeModal'));
            modal.hide();

            renderViewMode();
            showToast('灵感合并成功');
        }

        // 添加createModal函数
        function createModal({ id, title, content, onSave }) {
            return `
                <div class="modal fade" id="${id}" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${content}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" onclick="${onSave}">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 合并 showAgeSettingsModal 和 showAddInspirationModal 等类似的模态框显示函数
        // 可以创建一个通用的 showModal 函数，传入不同的配置

        // 将批量导入函数添加到全局作用域
        window.saveBulkInspirations = saveBulkInspirations;
        window.showBulkInputModal = showBulkInputModal;

        // 添加习惯打卡视图的显示逻辑
        function showHabitView() {
            const container = document.querySelector('.goal-container');
            container.innerHTML = `
                <!-- 添加习惯表单 -->
                <div class="card mb-3">
                    <div class="card-body p-3">
                        <form id="habitForm" onsubmit="addHabit(event)" class="row g-2 align-items-end">
                            <div class="col">
                                <label class="form-label">习惯名称</label>
                                <input type="text" class="form-control" id="habitName" required 
                                       placeholder="输入习惯名称">
                            </div>
                            <div class="col-auto">
                                <label class="form-label">目标次数</label>
                                <input type="number" class="form-control" id="habitTarget" 
                                       min="1" required style="width: 100px;" placeholder="输入次数">
                            </div>
                            <div class="col-auto">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-plus"></i> 添加习惯
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- 习惯列表 -->
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            `;
            
            if (!appData.habits) {
                appData.habits = [];
            }
            
            if (appData.habits.length === 0) {
                container.innerHTML += '<div class="col-12"><div class="alert alert-info">还没有添加任何习惯</div></div>';
            } else {
                appData.habits.forEach((habit, index) => {
                    const progress = (habit.count || 0) / habit.target * 100;
                    const progressClass = progress >= 100 ? 'bg-success' : 
                                        progress >= 70 ? 'bg-info' :
                                        progress >= 40 ? 'bg-warning' : 'bg-primary';
                    
                    container.innerHTML += `
                        <div class="col">
                            <div class="card h-100" data-habit-index="${index}">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h5 class="card-title mb-0">${habit.name}</h5>
                                        <button class="btn btn-outline-danger btn-sm" onclick="deleteHabit(${index})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div class="progress mb-2" style="height: 8px;">
                                        <div class="progress-bar ${progressClass}" role="progressbar" 
                                             style="width: ${progress}%"></div>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="text-muted small">进度: ${habit.count || 0}/${habit.target}</div>
                                        <button class="btn btn-outline-success btn-sm" 
                                                onclick="incrementHabit(${index})"
                                                ${progress >= 100 ? 'disabled' : ''}>
                                            <i class="fas fa-plus"></i> 打卡
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            container.innerHTML += '</div>';
        }

        // 添加相关的JavaScript函数
        function addHabit(event) {
            event.preventDefault();
            const name = document.getElementById('habitName').value.trim();
            const target = parseInt(document.getElementById('habitTarget').value);
            
            if (!name) {
                alert('请输入习惯名称');
                return;
            }
            
            if (!target || target < 1) {
                alert('请输入有效的目标次数');
                return;
            }
            
            if (!appData.habits) {
                appData.habits = [];
            }
            
            appData.habits.push({
                name,
                target,
                count: 0,
                createTime: Date.now()
            });
            
            saveData();  // 这里保留 saveData，因为需要显示新添加的习惯
            document.getElementById('habitForm').reset();
            showToast('习惯添加成功');
        }

        function incrementHabit(index) {
            if (appData.habits[index].count < appData.habits[index].target) {
                appData.habits[index].count = (appData.habits[index].count || 0) + 1;
                // 只保存数据，不刷新界面
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                
                // 只更新当前习惯的进度
                const habit = appData.habits[index];
                const progress = (habit.count / habit.target) * 100;
                const progressClass = progress >= 100 ? 'bg-success' : 
                                    progress >= 70 ? 'bg-info' :
                                    progress >= 40 ? 'bg-warning' : 'bg-primary';
                
                // 获取当前习惯的卡片（修改为使用data-habit-index属性来定位）
                const currentCard = document.querySelector(`.goal-container [data-habit-index="${index}"]`);
                if (currentCard) {
                    // 更新进度条
                    const progressBar = currentCard.querySelector('.progress-bar');
                    if (progressBar) {
                        progressBar.className = `progress-bar ${progressClass}`;
                        progressBar.style.width = `${progress}%`;
                    }
                    
                    // 更新进度文本
                    const progressText = currentCard.querySelector('.text-muted.small');
                    if (progressText) {
                        progressText.textContent = `进度: ${habit.count}/${habit.target}`;
                    }
                    
                    // 如果达到目标，禁用打卡按钮
                    const incrementBtn = currentCard.querySelector('.btn-outline-success');
                    if (incrementBtn && progress >= 100) {
                        incrementBtn.disabled = true;
                    }
                }
            }
        }

        function deleteHabit(index) {
            appData.habits.splice(index, 1);
            saveData();
            showToast('习惯已删除');
        }

        // 在初始化时添加事件监听
        document.getElementById('habitForm').addEventListener('submit', addHabit);
        document.getElementById('habitMode').addEventListener('change', () => {
            if (document.getElementById('habitMode').checked) {
                showHabitView();
            }
        });

        // 修改 saveData 函数
        function saveData() {
            // 保存前获取当前视图状态
            const currentView = document.getElementById('timeTrackingMode').checked ? 'timeTracking' :
                              document.getElementById('habitMode').checked ? 'habit' :
                              document.getElementById('inspirationMode').checked ? 'inspiration' :
                              document.getElementById('todoMode').checked ? 'todo' :
                              document.getElementById('archiveMode').checked ? 'archive' :
                              document.getElementById('historyMode').checked ? 'history' :
                              document.getElementById('ageMode').checked ? 'age' : 'savings';

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            //renderViewMode(currentView); // 使用当前视图更新UI
            if (currentView !== 'age') {
                renderViewMode(currentView);
            }
        }

        // 修改添加时间的函数
        function addTime(eventCard) {
            const timeInput = eventCard.querySelector('.time-input');
            const timeTotal = eventCard.querySelector('.time-total');
            const eventId = parseInt(eventCard.dataset.eventId);
            
            const minutes = parseTimeInput(timeInput.value);
            if (minutes === 0) {
                alert('请输入有效的时间格式（例：1h30m）');
                return;
            }

            // 更新数据
            const event = appData.timeEvents.find(e => e.id === eventId);
            if (event) {
                event.totalMinutes = (event.totalMinutes || 0) + minutes;
                timeTotal.textContent = formatTime(event.totalMinutes);
                timeInput.value = '';
                
                // 保存数据
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            }
        }

        // 修改删除事件的函数
        function deleteEvent(eventCard) {
            const eventId = parseInt(eventCard.dataset.eventId);
            // 从数据中删除
            appData.timeEvents = appData.timeEvents.filter(e => e.id !== eventId);
            // 从界面中删除
            eventCard.remove();
            // 保存数据
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
        }

        // 修改添加新事件的函数
        function addNewEvent() {
            const eventName = prompt('请输入事件名称：');
            if (!eventName) return;

            // 创建新事件对象
            const newEvent = {
                name: eventName,
                totalMinutes: 0,
                id: Date.now()
            };

            // 添加到数据中
            appData.timeEvents.push(newEvent);
            
            // 更新界面
            renderTimeEvent(newEvent);
            
            // 保存数据
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
        }

        // 添加渲染单个事件的函数
        function renderTimeEvent(event) {
            const eventsContainer = document.getElementById('events-container');
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.dataset.eventId = event.id;
            eventCard.innerHTML = `
                <div class="event-header">
                    <span class="event-name">${event.name}</span>
                    <div>
                        <input type="text" class="time-input" placeholder="例：1h30m">
                        <button class="btn btn-success btn-sm" onclick="addTime(this.parentElement.parentElement.parentElement)">
                            <i class="fas fa-plus"></i> 添加
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEvent(this.parentElement.parentElement.parentElement)">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
                <div class="time-total">${formatTime(event.totalMinutes || 0)}</div>
            `;
            eventsContainer.appendChild(eventCard);
        }

        // 添加渲染所有时间统计事件的函数
        function renderAllTimeEvents() {
            const eventsContainer = document.getElementById('events-container');
            if (!eventsContainer) return;
            
            eventsContainer.innerHTML = ''; // 清空容器
            appData.timeEvents.forEach(event => {
                renderTimeEvent(event);
            });
        }

        // 修改显示时间统计视图的函数
        function showTimeTrackingView() {
            const container = document.getElementById('goalsContainer');
            if (!container) return;
            
            // 清空容器并设置基本样式
            container.style.display = 'block';
            container.className = '';
            
            // 使用统一的布局结构
            container.innerHTML = `
                <div class="time-tracking-container">
                    <h3 class="mb-3">时间统计</h3>
                    <button class="btn btn-primary add-event-btn" onclick="addNewEvent()">
                        <i class="fas fa-plus"></i> 添加新事件
                    </button>
                    <div id="events-container" class="mt-3">
                        <!-- 事件卡片将在这里动态添加 -->
                    </div>
                </div>
            `;
            
            // 确保timeEvents数组存在
            if (!Array.isArray(appData.timeEvents)) {
                appData.timeEvents = [];
            }
            
            // 渲染所有事件
            renderAllTimeEvents();
        }

        // 在初始化时添加事件监听
        document.getElementById('timeTrackingMode').addEventListener('change', () => {
            if (document.getElementById('timeTrackingMode').checked) {
                showTimeTrackingView();
            }
        });

        // 添加事件监听
        document.addEventListener('DOMContentLoaded', function() {
            const timeTrackingMode = document.getElementById('timeTrackingMode');
            if (timeTrackingMode) {
                timeTrackingMode.addEventListener('change', function() {
                    if (this.checked) {
                        renderViewMode('timeTracking');
                    }
                });
            }
        });

        function parseTimeInput(timeStr) {
            let totalMinutes = 0;
            const hourMatch = timeStr.match(/(\d+)h/);
            const minuteMatch = timeStr.match(/(\d+)m/);
            
            if (hourMatch) {
                totalMinutes += parseInt(hourMatch[1]) * 60;
            }
            if (minuteMatch) {
                totalMinutes += parseInt(minuteMatch[1]);
            }
            
            return totalMinutes;
        }

        function formatTime(totalMinutes) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if (hours > 0) {
                return `总时间：${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
            }
            return `总时间：${minutes}分钟`;
        }

        // 显示个人数据界面
        function displayPersonalData(container) {
            // 确保appData中有personalData对象
            if (!appData.personalData) {
                appData.personalData = {
                    categories: []
                };
            }

            container.innerHTML = `
                <div class="personal-data-container">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0">个人数据管理</h5>
                        <button class="btn btn-primary btn-sm" onclick="addDataCategory()">
                            <i class="fas fa-plus"></i> 添加数据分类
                        </button>
                    </div>
                    <div class="categories-container">
                        ${appData.personalData.categories.map((category, index) => `
                            <div class="card mb-3 data-category" data-category-id="${category.id}">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">${category.name}</h6>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="addDataItem(${category.id})">
                                            <i class="fas fa-plus"></i> 添加数据
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    ${category.items ? category.items.map((item, itemIndex) => `
                                        <div class="data-item mb-2 d-flex justify-content-between align-items-center">
                                            <div>
                                                <span class="data-content">${item.content}</span>
                                                ${item.value ? `<span class="badge bg-primary ms-2">${item.value}</span>` : ''}
                                            </div>
                                            <div class="btn-group">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="editDataItem(${category.id}, ${itemIndex})">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="deleteDataItem(${category.id}, ${itemIndex})">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 添加数据分类
        function addDataCategory() {
            const categoryName = prompt('请输入数据分类名称：');
            if (categoryName) {
                if (!appData.personalData.categories) {
                    appData.personalData.categories = [];
                }
                appData.personalData.categories.push({
                    id: Date.now(),
                    name: categoryName,
                    items: []
                });
                renderViewMode('personalData');
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            }
        }

        // 删除数据分类
        function deleteCategory(categoryId) {
            appData.personalData.categories = appData.personalData.categories.filter(c => c.id !== categoryId);
            renderViewMode('personalData');
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
        }

        // 添加数据项
        function addDataItem(categoryId) {
            const input = prompt('请输入数据项和值（格式：数据项内容 数据值）：');
            if (!input) return;
            
            // 用第一个空格分隔数据项和值
            const [itemName, ...valueParts] = input.split(' ');
            const itemValue = valueParts.join(' '); // 重新组合值部分，以防值中包含空格
            
            if (!itemName) return;

            // 找到对应的分类
            const category = appData.personalData.categories.find(c => c.id === categoryId);
            if (!category) return;

            // 确保items数组存在
            if (!category.items) {
                category.items = [];
            }

            // 添加新的数据项
            category.items.push({
                name: itemName,
                value: itemValue || ''
            });

            // 更新界面和保存数据
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            renderViewMode('personalData');
        }

        // 编辑数据项
        function editDataItem(categoryId, itemIndex) {
            const category = appData.personalData.categories.find(c => c.id === categoryId);
            if (category && category.items[itemIndex]) {
                const item = category.items[itemIndex];
                const input = prompt('请输入数据项和值（格式：数据项内容 数据值）：', `${item.name} ${item.value}`);
                if (!input) return;
                
                // 用第一个空格分隔数据项和值
                const [newName, ...valueParts] = input.split(' ');
                const newValue = valueParts.join(' '); // 重新组合值部分，以防值中包含空格
                
                if (newName) {
                    item.name = newName;
                    item.value = newValue || '';
                    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                    renderViewMode('personalData');
                }
            }
        }

        // 删除数据项
        function deleteDataItem(categoryId, itemIndex) {
            const category = appData.personalData.categories.find(c => c.id === categoryId);
            if (category) {
                category.items.splice(itemIndex, 1);
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode('personalData');
            }
        }

        // 显示个人数据界面
        function displayPersonalData(container) {
            // 确保appData中有personalData对象
            if (!appData.personalData) {
                appData.personalData = {
                    categories: []
                };
            }

            container.innerHTML = `
                <div class="personal-data-container">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0">个人数据管理</h5>
                        <button class="btn btn-primary btn-sm" onclick="addDataCategory()">
                            <i class="fas fa-plus"></i> 添加数据分类
                        </button>
                    </div>
                    <div class="categories-container">
                        ${appData.personalData.categories.map((category, index) => `
                            <div class="card mb-3 data-category" data-category-id="${category.id}">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">${category.name}</h6>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="addDataItem(${category.id})">
                                            <i class="fas fa-plus"></i> 
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    ${category.items && category.items.length > 0 ? category.items.map((item, itemIndex) => `
                                        <div class="data-item d-flex justify-content-between align-items-center mb-2">
                                            <div class="d-flex" style="width: 70%;">
                                                <span class="data-name" style="width: 120px; min-width: 120px;">${item.name}</span>
                                                <span class="data-value" style="color: #0d6efd;">${item.value || ''}</span>
                                            </div>
                                            <div class="btn-group">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="editDataItem(${category.id}, ${itemIndex})">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="deleteDataItem(${category.id}, ${itemIndex})">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : '<div class="text-muted">暂无数据项</div>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 添加数据分类
        window.addDataCategory = function() {
            const categoryName = prompt('请输入分类名称：');
            if (categoryName) {
                appData.personalData.categories.push({
                    id: Date.now(),
                    name: categoryName,
                    items: []
                });
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode('personalData');
            }
        };

        // 删除数据分类
        window.deleteCategory = function(categoryId) {
            appData.personalData.categories = appData.personalData.categories.filter(category => category.id !== categoryId);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
            renderViewMode('personalData');
        };

        // 编辑数据项
        window.editDataItem = function(categoryId, itemIndex) {
            const category = appData.personalData.categories.find(c => c.id === categoryId);
            if (category && category.items[itemIndex]) {
                const newName = prompt('请输入新的数据项名称：', category.items[itemIndex].name);
                if (newName) {
                    category.items[itemIndex].name = newName;
                    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                    renderViewMode('personalData');
                }
            }
        };

        // 删除数据项
        window.deleteDataItem = function(categoryId, itemIndex) {
            const category = appData.personalData.categories.find(c => c.id === categoryId);
            if (category) {
                category.items.splice(itemIndex, 1);
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
                renderViewMode('personalData');
            }
        };