/**
 * core.js - 应用核心功能和数据结构
 */

import { showToast, handleError } from './utils.js';
import { handleGoalFormSubmit, handleMoneyFormSubmit } from './money.js';
import { handleBirthDateFormSubmit } from './age.js';

// 将关键配置集中管理，便于后期修改
const CONFIG = {
    STORAGE_KEY: 'savingsData',
    CURRENT_DATE: new Date()
};

// 基础数据结构
let appData = {
    totalSaved: 0,
    goals: [],
    ageGoals: [],
    birthDate: null,
    history: [],
    archivedGoals: [],
    archivedAgeGoals: [],
    todos: {
        q1: [], // 重要且紧急
        q2: [], // 重要不紧急
        q3: [], // 紧急不重要
        q4: []  // 不重要不紧急
    },
    inspirations: [],
    inspirationTags: ['工作', '学习', '生活', '其他'],
    timeEvents: [],
    habits: [],
    personalData: {
        categories: []
    }
};

// 初始化应用程序
function initialize() {
    loadData();
    updateDateTime();
    setupEventListeners();
    renderViewMode('savings');
    
    // 自动更新日期时间
    setInterval(updateDateTime, 1000);
}

// 加载数据
function loadData() {
    try {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (savedData) {
            appData = JSON.parse(savedData);
            
            // 确保所有数据字段都存在
            appData.history = appData.history || [];
            appData.archivedGoals = appData.archivedGoals || [];
            appData.archivedAgeGoals = appData.archivedAgeGoals || [];
            appData.todos = appData.todos || { q1: [], q2: [], q3: [], q4: [] };
            appData.inspirations = appData.inspirations || [];
            appData.inspirationTags = appData.inspirationTags || ['工作', '学习', '生活', '其他'];
            appData.timeEvents = appData.timeEvents || [];
            appData.habits = appData.habits || [];
            appData.personalData = appData.personalData || { categories: [] };
        }
    } catch (error) {
        handleError(error);
        resetData();
    }
}

// 保存数据
function saveData() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        handleError(error);
    }
}

// 重置数据
function resetData() {
    appData = {
        totalSaved: 0,
        goals: [],
        ageGoals: [],
        birthDate: null,
        history: [],
        archivedGoals: [],
        archivedAgeGoals: [],
        todos: {
            q1: [],
            q2: [],
            q3: [],
            q4: []
        },
        inspirations: [],
        inspirationTags: ['工作', '学习', '生活', '其他'],
        timeEvents: [],
        habits: [],
        personalData: {
            categories: []
        }
    };
    saveData();
}

// 设置事件监听器
function setupEventListeners() {
    // 表单提交
    document.getElementById('goalForm').addEventListener('submit', handleGoalFormSubmit);
    document.getElementById('birthDateForm').addEventListener('submit', handleBirthDateFormSubmit);
    document.getElementById('moneyForm').addEventListener('submit', handleMoneyFormSubmit);
    
    // 视图模式切换
    const viewModeRadios = document.querySelectorAll('input[name="viewMode"]');
    viewModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const mode = e.target.id.replace('Mode', '');
                renderViewMode(mode);
            }
        });
    });
    
    // 设置初始视图模式
    document.getElementById('savingsMode').checked = true;
}

// 渲染视图模式
function renderViewMode(view) {
    // 在main.js中实现
}

// 更新日期时间显示
function updateDateTime() {
    const now = new Date();
    const currentDateElem = document.getElementById('currentDate');
    const currentTimeElem = document.getElementById('currentTime');
    
    if (currentDateElem) {
        currentDateElem.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
    
    if (currentTimeElem) {
        currentTimeElem.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
    
    // 更新出生日期显示
    updateBirthDateDisplay();
}

// 更新出生日期显示
function updateBirthDateDisplay() {
    // 在age.js中实现
}

// 数据导出功能
function exportData() {
    try {
        const dataStr = JSON.stringify(appData);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `savings_data_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showToast('数据导出成功');
    } catch (error) {
        handleError(error);
    }
}

// 数据导入功能
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 验证导入的数据
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error('无效的数据格式');
                }
                
                // 备份当前数据
                const backupData = JSON.stringify(appData);
                
                // 更新数据
                appData = importedData;
                saveData();
                renderViewMode('savings');
                showToast('数据导入成功');
            } catch (error) {
                handleError(error);
                alert('导入失败：' + error.message);
            }
        };
        reader.readAsText(file);
    }
    event.target.value = '';
}

// 导出核心功能
export {
    CONFIG,
    appData,
    initialize,
    saveData,
    resetData,
    renderViewMode,
    exportData,
    importData,
    updateDateTime
}; 