/**
 * main.js - 应用主入口文件
 * 该文件负责导入所有模块并初始化应用
 */

// 导入核心模块和工具
import { initialize, CONFIG } from './core.js';
import * as utils from './utils.js';

// 导入功能模块
import * as money from './money.js';
import * as age from './age.js';
import * as todo from './todo.js';
import * as inspiration from './inspiration.js';
import * as habit from './habit.js';
import * as timeTracking from './time-tracking.js';
import * as personalData from './personal-data.js';

// DOM元素引用
const containers = {
    money: document.getElementById('moneyContainer'),
    goals: document.getElementById('goalsContainer'),
    ageGoals: document.getElementById('ageGoalsContainer'),
    todo: document.getElementById('todoContainer'),
    inspiration: document.getElementById('inspirationContainer'),
    habit: document.getElementById('habitContainer'),
    timeTracking: document.getElementById('timeTrackingContainer'),
    personalData: document.getElementById('personalDataContainer')
};

// 初始化选项卡功能
function initTabs() {
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-pane');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 移除所有active类
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active', 'show'));
            
            // 添加active类到当前标签
            link.classList.add('active');
            
            // 显示相应的内容
            const targetId = link.getAttribute('href').substring(1);
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active', 'show');
                
                // 保存当前活动的选项卡
                localStorage.setItem('activeTab', targetId);
                
                // 根据活动的选项卡渲染相应的内容
                renderActiveTabContent(targetId);
            }
        });
    });
    
    // 初始化时加载上次活动的选项卡或默认选项卡
    const activeTabId = localStorage.getItem('activeTab') || 'money';
    const activeTabLink = document.querySelector(`.nav-link[href="#${activeTabId}"]`);
    if (activeTabLink) {
        activeTabLink.click();
    } else {
        // 如果没有找到上次活动的选项卡，加载默认选项卡
        document.querySelector('.nav-link[href="#money"]')?.click();
    }
}

// 根据活动的选项卡渲染内容
function renderActiveTabContent(tabId) {
    switch(tabId) {
        case 'money':
            if (containers.money) {
                money.displayMoneyDashboard(containers.money);
            }
            if (containers.goals) {
                money.displayGoals(containers.goals);
            }
            break;
            
        case 'age':
            if (containers.ageGoals) {
                age.displayAgeGoals(containers.ageGoals);
            }
            break;
            
        case 'todo':
            if (containers.todo) {
                todo.displayTodos(containers.todo);
            }
            break;
            
        case 'inspiration':
            if (containers.inspiration) {
                inspiration.displayInspirations(containers.inspiration);
            }
            break;
            
        case 'habit':
            if (containers.habit) {
                habit.displayHabits(containers.habit);
            }
            break;
            
        case 'timeTracking':
            if (containers.timeTracking) {
                timeTracking.displayTimeTracking(containers.timeTracking);
            }
            break;
            
        case 'personalData':
            if (containers.personalData) {
                personalData.displayPersonalData(containers.personalData);
            }
            break;
    }
}

// 初始化应用
function initApp() {
    console.log('正在初始化应用...');
    
    // 初始化核心功能和加载数据
    initialize();
    
    // 初始化选项卡功能
    initTabs();
    
    // 设置事件委托，处理全局事件
    document.addEventListener('click', handleGlobalClick);
    
    console.log('应用初始化完成!');
}

// 处理全局点击事件（事件委托）
function handleGlobalClick(event) {
    // 处理模态框外的点击关闭模态框
    if (event.target.classList.contains('modal')) {
        const modalInstance = bootstrap.Modal.getInstance(event.target);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    
    // 处理 onclick 属性中定义的函数调用
    // 这种方法允许在HTML模板字符串中使用 onclick="functionName()" 语法
    const clickTarget = event.target.closest('[onclick]');
    if (clickTarget) {
        const onclickAttr = clickTarget.getAttribute('onclick');
        if (onclickAttr) {
            // 解析函数名和参数
            const match = onclickAttr.match(/([a-zA-Z0-9_]+)\((.*)\)/);
            if (match) {
                const functionName = match[1];
                const params = match[2].split(',').map(param => {
                    param = param.trim();
                    // 处理字符串参数
                    if (param.startsWith("'") && param.endsWith("'") ||
                        param.startsWith('"') && param.endsWith('"')) {
                        return param.substring(1, param.length - 1);
                    }
                    // 处理数字参数
                    if (!isNaN(param)) {
                        return Number(param);
                    }
                    return param;
                });
                
                // 查找并调用函数
                const modules = { money, age, todo, inspiration, habit, timeTracking, personalData };
                
                for (const moduleName in modules) {
                    const module = modules[moduleName];
                    if (typeof module[functionName] === 'function') {
                        event.preventDefault(); // 阻止默认行为
                        module[functionName](...params);
                        break;
                    }
                }
            }
        }
    }
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出主模块供其他模块使用
export {
    initApp,
    initTabs,
    renderActiveTabContent,
    handleGlobalClick
}; 