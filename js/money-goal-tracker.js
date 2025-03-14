// 数据结构和本地存储
class GoalTracker {
    constructor() {
        // 尝试从本地存储加载数据，如果没有则初始化空数组
        this.goals = JSON.parse(localStorage.getItem('moneyGoals')) || [];
        this.currentGoalId = parseInt(localStorage.getItem('currentGoalId')) || 1;
        this.currentSubgoalId = parseInt(localStorage.getItem('currentSubgoalId')) || 1;
    }

    // 保存数据到本地存储
    saveToLocalStorage() {
        localStorage.setItem('moneyGoals', JSON.stringify(this.goals));
        localStorage.setItem('currentGoalId', this.currentGoalId);
        localStorage.setItem('currentSubgoalId', this.currentSubgoalId);
    }

    // 添加新目标
    addGoal(goalData) {
        const newGoal = {
            id: this.currentGoalId++,
            name: goalData.name,
            targetAmount: parseFloat(goalData.targetAmount),
            currentAmount: parseFloat(goalData.currentAmount),
            deadline: goalData.deadline || null,
            notes: goalData.notes || '',
            createdAt: new Date().toISOString(),
            subgoals: [],
            isExpanded: true // 新添加的目标默认展开
        };

        this.goals.push(newGoal);
        this.saveToLocalStorage();
        return newGoal;
    }

    // 更新目标
    updateGoal(goalId, goalData) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return null;

        const updatedGoal = {
            ...this.goals[goalIndex],
            name: goalData.name,
            targetAmount: parseFloat(goalData.targetAmount),
            currentAmount: parseFloat(goalData.currentAmount),
            deadline: goalData.deadline || null,
            notes: goalData.notes || '',
        };

        this.goals[goalIndex] = updatedGoal;
        this.saveToLocalStorage();
        return updatedGoal;
    }

    // 删除目标
    deleteGoal(goalId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return false;

        this.goals.splice(goalIndex, 1);
        this.saveToLocalStorage();
        return true;
    }

    // 添加子目标
    addSubgoal(goalId, subgoalData) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return null;

        const newSubgoal = {
            id: this.currentSubgoalId++,
            name: subgoalData.name,
            targetAmount: parseFloat(subgoalData.targetAmount),
            currentAmount: parseFloat(subgoalData.currentAmount),
            deadline: subgoalData.deadline || null,
            notes: subgoalData.notes || '',
            createdAt: new Date().toISOString()
        };

        this.goals[goalIndex].subgoals.push(newSubgoal);
        this.saveToLocalStorage();

        // 更新父目标的当前金额
        this.updateParentGoalAmount(goalId);
        
        return newSubgoal;
    }

    // 更新子目标
    updateSubgoal(goalId, subgoalId, subgoalData) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return null;

        const subgoalIndex = this.goals[goalIndex].subgoals.findIndex(
            subgoal => subgoal.id === subgoalId
        );
        if (subgoalIndex === -1) return null;

        const updatedSubgoal = {
            ...this.goals[goalIndex].subgoals[subgoalIndex],
            name: subgoalData.name,
            targetAmount: parseFloat(subgoalData.targetAmount),
            currentAmount: parseFloat(subgoalData.currentAmount),
            deadline: subgoalData.deadline || null,
            notes: subgoalData.notes || '',
        };

        this.goals[goalIndex].subgoals[subgoalIndex] = updatedSubgoal;
        this.saveToLocalStorage();

        // 更新父目标的当前金额
        this.updateParentGoalAmount(goalId);
        
        return updatedSubgoal;
    }

    // 删除子目标
    deleteSubgoal(goalId, subgoalId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return false;

        const subgoalIndex = this.goals[goalIndex].subgoals.findIndex(
            subgoal => subgoal.id === subgoalId
        );
        if (subgoalIndex === -1) return false;

        this.goals[goalIndex].subgoals.splice(subgoalIndex, 1);
        this.saveToLocalStorage();

        // 更新父目标的当前金额
        this.updateParentGoalAmount(goalId);
        
        return true;
    }

    // 根据子目标的金额更新父目标金额
    updateParentGoalAmount(goalId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return false;

        // 如果有子目标，则父目标的当前金额是所有子目标当前金额的总和
        if (this.goals[goalIndex].subgoals.length > 0) {
            this.goals[goalIndex].currentAmount = this.goals[goalIndex].subgoals.reduce(
                (sum, subgoal) => sum + subgoal.currentAmount, 0
            );
            this.saveToLocalStorage();
        }
        
        return true;
    }

    // 切换目标的展开/折叠状态
    toggleGoalExpanded(goalId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return false;

        this.goals[goalIndex].isExpanded = !this.goals[goalIndex].isExpanded;
        this.saveToLocalStorage();
        return true;
    }

    // 获取所有目标
    getAllGoals() {
        return this.goals;
    }

    // 获取单个目标
    getGoal(goalId) {
        return this.goals.find(goal => goal.id === goalId) || null;
    }

    // 获取统计数据
    getStats() {
        const totalGoals = this.goals.length;
        const completedGoals = this.goals.filter(goal => 
            goal.currentAmount >= goal.targetAmount
        ).length;
        const inProgressGoals = totalGoals - completedGoals;
        
        let totalTargetAmount = 0;
        let totalCurrentAmount = 0;
        
        this.goals.forEach(goal => {
            totalTargetAmount += goal.targetAmount;
            totalCurrentAmount += goal.currentAmount;
        });
        
        const overallProgress = totalTargetAmount > 0 
            ? Math.min(Math.round((totalCurrentAmount / totalTargetAmount) * 100), 100)
            : 0;
            
        return {
            totalGoals,
            completedGoals,
            inProgressGoals,
            overallProgress
        };
    }

    // 添加金额到目标
    addMoneyToGoal(goalId, amount) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return false;
        
        // 如果有子目标，则根据子目标的目标金额比例分配新增金额
        if (this.goals[goalIndex].subgoals.length > 0) {
            const totalTargetAmount = this.goals[goalIndex].subgoals.reduce(
                (sum, subgoal) => sum + subgoal.targetAmount, 0
            );
            
            // 按比例分配金额给各个子目标
            this.goals[goalIndex].subgoals.forEach(subgoal => {
                const ratio = subgoal.targetAmount / totalTargetAmount;
                subgoal.currentAmount += amount * ratio;
            });
            
            // 更新父目标金额
            this.updateParentGoalAmount(goalId);
        } else {
            // 如果没有子目标，直接增加父目标金额
            this.goals[goalIndex].currentAmount += parseFloat(amount);
        }
        
        this.saveToLocalStorage();
        return true;
    }
    
    // 添加金额到子目标
    addMoneyToSubgoal(goalId, subgoalId, amount) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) return false;
        
        const subgoalIndex = this.goals[goalIndex].subgoals.findIndex(
            subgoal => subgoal.id === subgoalId
        );
        if (subgoalIndex === -1) return false;
        
        // 增加子目标金额
        this.goals[goalIndex].subgoals[subgoalIndex].currentAmount += parseFloat(amount);
        
        // 更新父目标金额
        this.updateParentGoalAmount(goalId);
        
        this.saveToLocalStorage();
        return true;
    }

    // 导出所有数据 - 简化为内部使用
    exportData() {
        return {
            goals: this.goals,
            currentGoalId: this.currentGoalId,
            currentSubgoalId: this.currentSubgoalId
        };
    }

    // 导入数据 - 简化为内部使用
    importData(data) {
        if (data && data.goals) {
            this.goals = data.goals;
            if (data.currentGoalId) this.currentGoalId = data.currentGoalId;
            if (data.currentSubgoalId) this.currentSubgoalId = data.currentSubgoalId;
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }
}

// UI 控制器
class UIController {
    constructor(goalTracker) {
        this.goalTracker = goalTracker;
        this.initElements();
        this.initEventListeners();
        this.renderGoals();
        this.updateDashboard();
    }

    // 初始化DOM元素引用
    initElements() {
        // 主要容器
        this.goalsContainer = document.getElementById('goals-container');
        this.emptyState = document.getElementById('empty-state');
        
        // 仪表盘元素
        this.totalGoalsEl = document.getElementById('total-goals');
        this.inProgressEl = document.getElementById('in-progress');
        this.completedEl = document.getElementById('completed');
        this.overallProgressEl = document.getElementById('overall-progress');
        
        // 统一目标模态框元素
        this.goalModal = document.getElementById('goal-modal');
        this.goalForm = document.getElementById('goal-form');
        this.modalTitle = document.getElementById('modal-title');
        this.goalIdInput = document.getElementById('goal-id');
        this.parentGoalIdInput = document.getElementById('parent-goal-id');
        this.isSubgoalInput = document.getElementById('is-subgoal');
        this.goalNameInput = document.getElementById('goal-name');
        this.goalAmountInput = document.getElementById('goal-amount');
        this.currentAmountInput = document.getElementById('current-amount');
        this.goalDeadlineInput = document.getElementById('goal-deadline');
        this.goalNotesInput = document.getElementById('goal-notes');
        
        // 确认模态框元素
        this.confirmModal = document.getElementById('confirm-modal');
        this.confirmMessage = document.getElementById('confirm-message');
        this.confirmYesBtn = document.getElementById('confirm-yes');
        this.confirmNoBtn = document.getElementById('confirm-no');
        
        // 按钮
        this.addGoalBtn = document.getElementById('add-goal-btn');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelBtn = document.getElementById('cancel-btn');
        
        // 存钱模态框元素
        this.moneyInputModal = document.getElementById('money-input-modal');
        this.moneyModalTitle = document.getElementById('money-modal-title');
        this.moneyGoalIdInput = document.getElementById('money-goal-id');
        this.moneySubgoalIdInput = document.getElementById('money-subgoal-id');
        this.moneyAmountInput = document.getElementById('money-amount');
        this.saveMoneyBtn = document.getElementById('save-money-btn');
        this.cancelMoneyBtn = document.getElementById('cancel-money-btn');
        this.closeMoneyModalBtn = document.getElementById('close-money-modal');
    }

    // 初始化事件监听器
    initEventListeners() {
        // 添加新目标按钮点击事件
        this.addGoalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.showAddGoalModal();
        });
        
        // 目标表单提交事件
        this.goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.handleGoalFormSubmit();
        });
        
        // 目标模态框关闭按钮点击事件
        this.closeModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.hideGoalModal();
        });
        this.cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.hideGoalModal();
        });
        
        // 确认模态框按钮点击事件
        this.confirmNoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.hideConfirmModal();
        });
        
        // 存钱模态框按钮事件
        this.closeMoneyModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.hideMoneyModal();
        });
        this.cancelMoneyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.hideMoneyModal();
        });
        this.saveMoneyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除阻止冒泡，这可能导致移动设备问题
            // e.stopPropagation();
            this.handleMoneySave();
        });
        
        // 点击模态窗口外部关闭
        document.addEventListener('click', (e) => {
            // 不要无条件阻止冒泡，这可能导致移动设备上的点击问题
            // e.stopPropagation(); // 注释掉这一行
            
            if (this.goalModal && this.goalModal.style.display === 'block') {
                if (e.target === this.goalModal) {
                    e.preventDefault();
                    this.hideGoalModal();
                }
            }
            if (this.confirmModal && this.confirmModal.style.display === 'block') {
                if (e.target === this.confirmModal) {
                    e.preventDefault();
                    this.hideConfirmModal();
                }
            }
            if (this.moneyInputModal && this.moneyInputModal.style.display === 'block') {
                if (e.target === this.moneyInputModal) {
                    e.preventDefault();
                    this.hideMoneyModal();
                }
            }
        });
        
        // 添加针对触摸设备的事件处理
        document.addEventListener('touchend', (e) => {
            if (this.goalModal && this.goalModal.style.display === 'block') {
                if (e.target === this.goalModal) {
                    e.preventDefault();
                    this.hideGoalModal();
                }
            }
            if (this.confirmModal && this.confirmModal.style.display === 'block') {
                if (e.target === this.confirmModal) {
                    e.preventDefault();
                    this.hideConfirmModal();
                }
            }
            if (this.moneyInputModal && this.moneyInputModal.style.display === 'block') {
                if (e.target === this.moneyInputModal) {
                    e.preventDefault();
                    this.hideMoneyModal();
                }
            }
        });
        
        // 添加一个通用的触摸事件处理，用于处理iOS上的300ms延迟问题
        if ('ontouchstart' in window) {
            document.querySelectorAll('button, .close-btn, .action-btn').forEach(el => {
                el.addEventListener('touchstart', function() {
                    // 空函数，仅用于激活元素
                }, {passive: true});
            });
        }
    }

    // 渲染所有目标
    renderGoals() {
        const goals = this.goalTracker.getAllGoals();
        
        // 如果没有目标，显示空状态
        if (goals.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.goalsContainer.innerHTML = '';
            this.goalsContainer.appendChild(this.emptyState);
            return;
        }
        
        // 隐藏空状态
        this.emptyState.classList.add('hidden');
        
        // 清空目标容器
        this.goalsContainer.innerHTML = '';
        
        // 渲染每个目标
        goals.forEach(goal => {
            const goalCard = this.createGoalCard(goal);
            this.goalsContainer.appendChild(goalCard);
        });
    }

    // 创建目标卡片
    createGoalCard(goal) {
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        goalCard.dataset.goalId = goal.id;
        
        // 计算金额进度百分比
        const progressPercent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
        const isComplete = progressPercent >= 100;
        const isAlmostComplete = progressPercent >= 80 && progressPercent < 100;
        
        // 计算时间进度百分比
        let timeProgressPercent = 0;
        let timeProgressText = '无截止日期';
        let remainingDays = 0;
        
        if (goal.deadline) {
            const now = new Date();
            const deadline = new Date(goal.deadline);
            const created = new Date(goal.createdAt);
            
            if (deadline > now) {
                // 计算总时间跨度（从创建到截止日期）
                const totalTimeSpan = deadline.getTime() - created.getTime();
                // 计算已经过去的时间
                const elapsedTime = now.getTime() - created.getTime();
                // 计算进度百分比
                timeProgressPercent = Math.min(Math.round((elapsedTime / totalTimeSpan) * 100), 100);
                
                // 计算剩余天数
                remainingDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                timeProgressText = `剩余${remainingDays}天`;
            } else {
                // 如果已过截止日期
                timeProgressPercent = 100;
                timeProgressText = '已过期';
            }
        }
        
        // 时间进度条的颜色类
        const timeProgressClass = timeProgressPercent >= 100 ? 'time-expired' : 
                                 timeProgressPercent >= 80 ? 'time-warning' : '';
        
        // 格式化日期
        const deadlineDisplay = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '无截止日期';
        
        // 构建目标卡片的HTML
        goalCard.innerHTML = `
            <div class="goal-header">
                <div class="goal-info">
                    <h2 class="goal-name">
                        <i class="fas fa-bullseye"></i>
                        ${goal.name}
                    </h2>
                    <div class="goal-details">
                        <div class="goal-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>截止日期: ${deadlineDisplay}</span>
                        </div>
                        <div class="goal-detail">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>目标金额: ¥${goal.targetAmount.toLocaleString()}</span>
                        </div>
                        ${goal.notes ? `
                        <div class="goal-detail">
                            <i class="fas fa-sticky-note"></i>
                            <span>备注: ${goal.notes}</span>
                        </div>` : ''}
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="action-btn add-money-btn" title="存钱">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <button class="action-btn edit-goal-btn" title="编辑目标">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-goal-btn" title="删除目标">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="action-btn toggle-btn" title="${goal.isExpanded ? '折叠' : '展开'}">
                        <i class="fas ${goal.isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                    </button>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-text">
                    <span>金额进度:</span>
                    <span class="progress-amount">¥${goal.currentAmount.toLocaleString()} / ¥${goal.targetAmount.toLocaleString()} (${progressPercent}%)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar ${isComplete ? 'complete' : ''} ${isAlmostComplete ? 'almost-complete' : ''}" style="width: ${progressPercent}%"></div>
                </div>
                
                ${goal.deadline ? `
                <div class="progress-text time-progress-text">
                    <span>时间进度:</span>
                    <span class="progress-time">${timeProgressText} (${timeProgressPercent}%)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar time-progress-bar ${timeProgressClass}" style="width: ${timeProgressPercent}%"></div>
                </div>` : ''}
            </div>
            ${goal.isExpanded ? `
            <div class="subgoals-container">
                ${goal.subgoals.length > 0 ? `
                <h3>子目标</h3>
                <div class="subgoals-list">
                    ${goal.subgoals.map(subgoal => {
                        const subProgressPercent = Math.min(Math.round((subgoal.currentAmount / subgoal.targetAmount) * 100), 100);
                        return `
                        <div class="subgoal-item" data-subgoal-id="${subgoal.id}">
                            <div class="subgoal-info">
                                <div class="subgoal-name">${subgoal.name}</div>
                                <div class="subgoal-progress">
                                    <div class="subgoal-progress-bar-bg">
                                        <div class="subgoal-progress-bar" style="width: ${subProgressPercent}%"></div>
                                    </div>
                                    <span class="subgoal-progress-text">¥${subgoal.currentAmount.toLocaleString()} / ¥${subgoal.targetAmount.toLocaleString()}</span>
                                </div>
                                ${subgoal.deadline ? (() => {
                                    // 计算子目标的时间进度
                                    let subTimeProgressPercent = 0;
                                    let subTimeProgressText = '';
                                    let subRemainingDays = 0;
                                    
                                    const now = new Date();
                                    const deadline = new Date(subgoal.deadline);
                                    const created = new Date(subgoal.createdAt);
                                    
                                    if (deadline > now) {
                                        // 计算总时间跨度（从创建到截止日期）
                                        const totalTimeSpan = deadline.getTime() - created.getTime();
                                        // 计算已经过去的时间
                                        const elapsedTime = now.getTime() - created.getTime();
                                        // 计算进度百分比
                                        subTimeProgressPercent = Math.min(Math.round((elapsedTime / totalTimeSpan) * 100), 100);
                                        
                                        // 计算剩余天数
                                        subRemainingDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        subTimeProgressText = `剩余${subRemainingDays}天`;
                                    } else {
                                        // 如果已过截止日期
                                        subTimeProgressPercent = 100;
                                        subTimeProgressText = '已过期';
                                    }
                                    
                                    // 时间进度条的颜色类
                                    const subTimeProgressClass = subTimeProgressPercent >= 100 ? 'time-expired' : 
                                                               subTimeProgressPercent >= 80 ? 'time-warning' : '';
                                    
                                    return `
                                    <div class="subgoal-deadline">
                                        <span>截止日期: ${new Date(subgoal.deadline).toLocaleDateString()}</span>
                                        <div class="subgoal-time-progress">
                                            <div class="progress-text time-progress-text">
                                                <span>时间进度:</span>
                                                <span class="progress-time">${subTimeProgressText} (${subTimeProgressPercent}%)</span>
                                            </div>
                                            <div class="progress-bar-bg">
                                                <div class="progress-bar time-progress-bar ${subTimeProgressClass}" style="width: ${subTimeProgressPercent}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                    `;
                                })() : ''}
                            </div>
                            <div class="subgoal-actions">
                                <button class="action-btn add-subgoal-money-btn" title="存钱">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                                <button class="action-btn edit-subgoal-btn" title="编辑子目标">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-subgoal-btn" title="删除子目标">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>` : ''}
                <button class="add-subgoal-btn">
                    <i class="fas fa-plus"></i> 添加子目标
                </button>
            </div>` : ''}
        `;
        
        // 添加事件监听器
        this.addGoalCardEventListeners(goalCard, goal);
        
        return goalCard;
    }

    // 为目标卡片添加事件监听器
    addGoalCardEventListeners(goalCard, goal) {
        // 编辑目标按钮
        goalCard.querySelector('.edit-goal-btn').addEventListener('click', () => {
            this.showEditGoalModal(goal.id);
        });
        
        // 删除目标按钮
        goalCard.querySelector('.delete-goal-btn').addEventListener('click', () => {
            this.showDeleteGoalConfirmation(goal.id);
        });
        
        // 切换展开/折叠按钮
        goalCard.querySelector('.toggle-btn').addEventListener('click', () => {
            this.toggleGoalExpanded(goal.id);
        });
        
        // 添加子目标按钮
        const addSubgoalBtn = goalCard.querySelector('.add-subgoal-btn');
        if (addSubgoalBtn) {
            addSubgoalBtn.addEventListener('click', () => {
                this.showAddSubgoalModal(goal.id);
            });
        }
        
        // 为每个子目标添加事件监听器
        if (goal.isExpanded && goal.subgoals.length > 0) {
            goalCard.querySelectorAll('.subgoal-item').forEach(subgoalItem => {
                const subgoalId = parseInt(subgoalItem.dataset.subgoalId);
                
                // 编辑子目标按钮
                subgoalItem.querySelector('.edit-subgoal-btn').addEventListener('click', () => {
                    this.showEditSubgoalModal(goal.id, subgoalId);
                });
                
                // 删除子目标按钮
                subgoalItem.querySelector('.delete-subgoal-btn').addEventListener('click', () => {
                    this.showDeleteSubgoalConfirmation(goal.id, subgoalId);
                });
                
                // 子目标存钱按钮
                subgoalItem.querySelector('.add-subgoal-money-btn').addEventListener('click', () => {
                    this.showAddSubgoalMoneyModal(goal.id, subgoalId);
                });
            });
        }
        
        // 存钱按钮
        goalCard.querySelector('.add-money-btn').addEventListener('click', () => {
            this.showAddMoneyModal(goal.id);
        });
    }

    // 更新仪表盘
    updateDashboard() {
        const stats = this.goalTracker.getStats();
        
        this.totalGoalsEl.textContent = stats.totalGoals;
        this.inProgressEl.textContent = stats.inProgressGoals;
        this.completedEl.textContent = stats.completedGoals;
        this.overallProgressEl.textContent = `${stats.overallProgress}%`;
    }

    // 显示添加目标模态框
    showAddGoalModal() {
        this.goalIdInput.value = '';
        this.parentGoalIdInput.value = '';
        this.isSubgoalInput.value = 'false';
        this.goalNameInput.value = '';
        this.goalAmountInput.value = '';
        this.currentAmountInput.value = '0';
        this.goalDeadlineInput.value = '';
        this.goalNotesInput.value = '';
        
        this.modalTitle.textContent = '添加新目标';
        this.goalModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 防止iOS上的弹性滚动影响
        this.preventBackgroundScroll();
    }

    // 显示编辑目标模态框
    showEditGoalModal(goalId) {
        const goal = this.goalTracker.getGoal(goalId);
        if (!goal) return;
        
        this.modalTitle.textContent = '编辑目标';
        this.goalIdInput.value = goal.id;
        this.parentGoalIdInput.value = '';
        this.isSubgoalInput.value = 'false';
        this.goalNameInput.value = goal.name;
        this.goalAmountInput.value = goal.targetAmount;
        this.currentAmountInput.value = goal.currentAmount;
        this.goalDeadlineInput.value = goal.deadline || '';
        this.goalNotesInput.value = goal.notes || '';
        
        this.goalModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 防止iOS上的弹性滚动影响
        this.preventBackgroundScroll();
    }

    // 显示添加子目标模态框
    showAddSubgoalModal(goalId) {
        const goal = this.goalTracker.getGoal(goalId);
        if (!goal) return;
        
        this.modalTitle.textContent = `为"${goal.name}"添加子目标`;
        this.goalIdInput.value = '';
        this.parentGoalIdInput.value = goal.id;
        this.isSubgoalInput.value = 'true';
        this.goalNameInput.value = '';
        this.goalAmountInput.value = '';
        this.currentAmountInput.value = '0';
        this.goalDeadlineInput.value = '';
        this.goalNotesInput.value = '';
        
        this.goalModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 防止iOS上的弹性滚动影响
        this.preventBackgroundScroll();
    }

    // 显示编辑子目标模态框
    showEditSubgoalModal(goalId, subgoalId) {
        const goal = this.goalTracker.getGoal(goalId);
        if (!goal) return;
        
        const subgoal = goal.subgoals.find(sub => sub.id === subgoalId);
        if (!subgoal) return;
        
        this.modalTitle.textContent = `编辑"${goal.name}"的子目标`;
        this.goalIdInput.value = subgoalId;
        this.parentGoalIdInput.value = goal.id;
        this.isSubgoalInput.value = 'true';
        this.goalNameInput.value = subgoal.name;
        this.goalAmountInput.value = subgoal.targetAmount;
        this.currentAmountInput.value = subgoal.currentAmount;
        this.goalDeadlineInput.value = subgoal.deadline || '';
        this.goalNotesInput.value = subgoal.notes || '';
        
        this.goalModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 防止iOS上的弹性滚动影响
        this.preventBackgroundScroll();
    }

    // 隐藏目标模态框
    hideGoalModal() {
        if (!this.goalModal) return;
        
        // 确保使用与显示时相同的属性
        this.goalModal.style.display = 'none';
        document.body.style.overflow = '';
        
        // 清除表单值，防止再次打开时显示旧数据
        setTimeout(() => {
            // 使用setTimeout确保模态框完全关闭后再清除数据
            this.goalIdInput.value = '';
            this.parentGoalIdInput.value = '';
            this.isSubgoalInput.value = 'false';
            this.goalNameInput.value = '';
            this.goalAmountInput.value = '';
            this.currentAmountInput.value = '0';
            this.goalDeadlineInput.value = '';
            this.goalNotesInput.value = '';
        }, 100);
        
        // 清除iOS弹性滚动修复
        this.restoreBackgroundScroll();
    }

    // 处理目标表单提交
    handleGoalFormSubmit() {
        const goalData = {
            name: this.goalNameInput.value,
            targetAmount: this.goalAmountInput.value,
            currentAmount: this.currentAmountInput.value,
            deadline: this.goalDeadlineInput.value || null,
            notes: this.goalNotesInput.value
        };
        
        const isSubgoal = this.isSubgoalInput.value === 'true';
        
        if (isSubgoal) {
            // 子目标处理
            const goalId = parseInt(this.parentGoalIdInput.value);
            const subgoalId = this.goalIdInput.value ? parseInt(this.goalIdInput.value) : null;
            
            if (subgoalId) {
                // 更新现有子目标
                this.goalTracker.updateSubgoal(goalId, subgoalId, goalData);
            } else {
                // 添加新子目标
                this.goalTracker.addSubgoal(goalId, goalData);
            }
        } else {
            // 主目标处理
            const goalId = this.goalIdInput.value ? parseInt(this.goalIdInput.value) : null;
            
            if (goalId) {
                // 更新现有目标
                this.goalTracker.updateGoal(goalId, goalData);
            } else {
                // 添加新目标
                this.goalTracker.addGoal(goalData);
            }
        }
        
        this.hideGoalModal();
        this.renderGoals();
        this.updateDashboard();
    }

    // 显示删除目标确认框
    showDeleteGoalConfirmation(goalId) {
        this.tempGoalId = goalId;
        this.tempSubgoalId = null;
        this.confirmMessage.textContent = '确定要删除这个目标吗？所有相关的子目标也将被删除。';
        
        // 设置确认按钮事件
        this.confirmYesBtn.onclick = () => {
            const success = this.goalTracker.deleteGoal(this.tempGoalId);
            if (success) {
                this.renderGoals();
                this.updateDashboard();
                this.hideConfirmModal();
            }
        };
        
        this.confirmModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.preventBackgroundScroll();
    }

    // 显示删除子目标确认框
    showDeleteSubgoalConfirmation(goalId, subgoalId) {
        this.tempGoalId = goalId;
        this.tempSubgoalId = subgoalId;
        this.confirmMessage.textContent = '确定要删除这个子目标吗？';
        
        // 设置确认按钮事件
        this.confirmYesBtn.onclick = () => {
            const success = this.goalTracker.deleteSubgoal(this.tempGoalId, this.tempSubgoalId);
            if (success) {
                this.renderGoals();
                this.updateDashboard();
                this.hideConfirmModal();
            }
        };
        
        this.confirmModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.preventBackgroundScroll();
    }

    // 隐藏确认模态框
    hideConfirmModal() {
        if (!this.confirmModal) return;
        
        this.confirmModal.style.display = 'none';
        document.body.style.overflow = '';
        
        // 清除临时存储的ID
        setTimeout(() => {
            this.tempGoalId = null;
            this.tempSubgoalId = null;
            
            // 移除确认按钮的事件处理器，防止重复触发
            if (this.confirmYesBtn) {
                this.confirmYesBtn.onclick = null;
            }
        }, 100);
        
        // 清除iOS弹性滚动修复
        this.restoreBackgroundScroll();
    }

    // 切换目标展开/折叠状态
    toggleGoalExpanded(goalId) {
        this.goalTracker.toggleGoalExpanded(goalId);
        this.renderGoals();
    }

    // 显示添加金额模态框
    showAddMoneyModal(goalId) {
        this.moneyGoalIdInput.value = goalId;
        this.moneySubgoalIdInput.value = '';
        this.moneyModalTitle.textContent = '添加存款';
        this.moneyAmountInput.value = '';
        this.moneyInputModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.preventBackgroundScroll();
        
        setTimeout(() => this.moneyAmountInput.focus(), 100);
    }
    
    // 显示添加金额到子目标的模态框
    showAddSubgoalMoneyModal(goalId, subgoalId) {
        this.moneyGoalIdInput.value = goalId;
        this.moneySubgoalIdInput.value = subgoalId;
        this.moneyModalTitle.textContent = '添加存款到子目标';
        this.moneyAmountInput.value = '';
        this.moneyInputModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.preventBackgroundScroll();
        
        setTimeout(() => this.moneyAmountInput.focus(), 100);
    }
    
    // 隐藏存钱模态框
    hideMoneyModal() {
        if (!this.moneyInputModal) return;
        
        this.moneyInputModal.style.display = 'none';
        document.body.style.overflow = '';
        
        // 清除输入值
        setTimeout(() => {
            this.moneyGoalIdInput.value = '';
            this.moneySubgoalIdInput.value = '';
            this.moneyAmountInput.value = '';
        }, 100);
        
        // 清除iOS弹性滚动修复
        this.restoreBackgroundScroll();
    }
    
    // 处理金额保存
    handleMoneySave() {
        const amount = parseFloat(this.moneyAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效的金额');
            return;
        }
        
        const goalId = parseInt(this.moneyGoalIdInput.value);
        const subgoalId = this.moneySubgoalIdInput.value ? parseInt(this.moneySubgoalIdInput.value) : null;
        
        if (subgoalId) {
            // 添加金额到子目标
            this.goalTracker.addMoneyToSubgoal(goalId, subgoalId, amount);
        } else {
            // 添加金额到主目标
            this.goalTracker.addMoneyToGoal(goalId, amount);
        }
        
        this.hideMoneyModal();
        this.renderGoals();
        this.updateDashboard();
    }

    // 防止iOS背景滚动问题的辅助方法
    preventBackgroundScroll() {
        // 保存当前滚动位置
        this.scrollPosition = window.pageYOffset;
        
        // 设置固定位置
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.scrollPosition}px`;
        document.body.style.width = '100%';
        
        // 为所有可滚动元素添加 overscroll-behavior: contain
        const scrollElements = document.querySelectorAll('.modal-content, textarea, input');
        scrollElements.forEach(el => {
            if (el.style) {
                el.dataset.originalOverscroll = el.style.overscrollBehavior || '';
                el.style.overscrollBehavior = 'contain';
            }
        });
    }

    // 恢复背景滚动
    restoreBackgroundScroll() {
        // 恢复滚动
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, this.scrollPosition || 0);
        
        // 恢复所有可滚动元素的原始行为
        const scrollElements = document.querySelectorAll('.modal-content, textarea, input');
        scrollElements.forEach(el => {
            if (el.style && el.dataset.originalOverscroll !== undefined) {
                el.style.overscrollBehavior = el.dataset.originalOverscroll;
                delete el.dataset.originalOverscroll;
            }
        });
    }
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('应用初始化中...');
    
    // 增强移动设备兼容性
    if ('ontouchstart' in window) {
        // 添加触摸点击事件处理
        document.addEventListener('touchstart', function() {
            // 确保iOS上的点击事件正常激活，不需要实际功能
        }, {passive: true});
        
        // 阻止iOS上的双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd < 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, {passive: false});
        
        // 禁用长按展示上下文菜单，这可能干扰按钮点击
        document.addEventListener('contextmenu', function(e) {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                e.preventDefault();
            }
        }, {passive: false});
    }
    
    try {
        // 初始化应用
        const goalTracker = new GoalTracker();
        const uiController = new UIController(goalTracker);
        
        // 加载并渲染目标
        uiController.renderGoals();
        uiController.updateDashboard();
        
        console.log('应用初始化成功');
    } catch (error) {
        console.error('应用初始化失败:', error);
        // 显示错误消息给用户
        alert(`初始化失败: ${error.message}\n请尝试刷新页面或清除浏览器缓存。`);
    }
});
