/**
 * todo.js - 待办事项相关功能
 */

import { appData, saveData } from './core.js';
import { showToast } from './utils.js';

// 显示待办事项
function displayTodos(container) {
    container.innerHTML = '';
    
    const quadrantGrid = document.createElement('div');
    quadrantGrid.className = 'quadrant-grid';
    
    // 创建四个象限
    const quadrants = [
        { id: '1', title: '紧急且重要', key: 'q1' },
        { id: '2', title: '重要不紧急', key: 'q2' },
        { id: '3', title: '紧急不重要', key: 'q3' },
        { id: '4', title: '不紧急不重要', key: 'q4' }
    ];
    
    quadrants.forEach(quadrant => {
        const quadrantElement = createQuadrant(quadrant);
        quadrantGrid.appendChild(quadrantElement);
    });
    
    container.appendChild(quadrantGrid);
    
    // 初始化拖拽功能
    initDragAndDrop();
}

// 创建象限
function createQuadrant({ id, title, key }) {
    const quadrant = document.createElement('div');
    quadrant.className = `quadrant quadrant-${id}`;
    quadrant.setAttribute('data-quadrant', key);
    
    quadrant.innerHTML = `
        <div class="quadrant-header quadrant-${id}">
            <h5 class="quadrant-title">${title}</h5>
        </div>
        <div class="todo-list" data-quadrant="${key}">
            ${renderTodoItems(key)}
        </div>
        <div class="add-todo-container">
            <input type="text" class="add-todo-input" placeholder="添加待办事项...">
            <button class="add-todo-btn" onclick="addTodo('${key}')">添加</button>
        </div>
    `;
    
    // 添加事件监听
    quadrant.querySelector('.add-todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo(key);
        }
    });
    
    return quadrant;
}

// 渲染待办事项
function renderTodoItems(quadrantKey) {
    if (!appData.todos[quadrantKey] || appData.todos[quadrantKey].length === 0) {
        return '<div class="text-muted small text-center p-3">暂无待办事项</div>';
    }
    
    return appData.todos[quadrantKey].map((todo, index) => `
        <div class="todo-item" draggable="true" data-index="${index}" data-quadrant="${quadrantKey}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                onclick="toggleTodo('${quadrantKey}', ${index})">
            <div class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</div>
            <div class="todo-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteTodo('${quadrantKey}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 添加待办事项
function addTodo(quadrant) {
    const input = document.querySelector(`.quadrant[data-quadrant="${quadrant}"] .add-todo-input`);
    const text = input.value.trim();
    
    if (!text) {
        return;
    }
    
    if (!appData.todos[quadrant]) {
        appData.todos[quadrant] = [];
    }
    
    appData.todos[quadrant].push({
        text,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    saveData();
    input.value = '';
    
    // 更新UI
    const todoList = document.querySelector(`.todo-list[data-quadrant="${quadrant}"]`);
    todoList.innerHTML = renderTodoItems(quadrant);
    
    // 重新初始化拖拽
    initDragAndDrop();
    
    showToast('待办事项已添加');
}

// 切换待办事项状态
function toggleTodo(quadrant, index) {
    if (!appData.todos[quadrant] || !appData.todos[quadrant][index]) {
        return;
    }
    
    appData.todos[quadrant][index].completed = !appData.todos[quadrant][index].completed;
    saveData();
    
    // 更新UI
    const todoText = document.querySelector(`.todo-item[data-quadrant="${quadrant}"][data-index="${index}"] .todo-text`);
    if (todoText) {
        todoText.classList.toggle('completed');
    }
}

// 删除待办事项
function deleteTodo(quadrant, index) {
    if (!appData.todos[quadrant] || !appData.todos[quadrant][index]) {
        return;
    }
    
    if (confirm('确定要删除这个待办事项吗?')) {
        appData.todos[quadrant].splice(index, 1);
        saveData();
        
        // 更新UI
        const todoList = document.querySelector(`.todo-list[data-quadrant="${quadrant}"]`);
        todoList.innerHTML = renderTodoItems(quadrant);
        
        // 重新初始化拖拽
        initDragAndDrop();
        
        showToast('待办事项已删除');
    }
}

// 初始化拖拽功能
function initDragAndDrop() {
    const todoItems = document.querySelectorAll('.todo-item');
    const todoLists = document.querySelectorAll('.todo-list');
    
    todoItems.forEach(item => {
        item.addEventListener('dragstart', dragTodo);
        item.addEventListener('dragend', dragEnd);
    });
    
    todoLists.forEach(list => {
        list.addEventListener('dragover', allowDrop);
        list.addEventListener('drop', dropTodo);
    });
}

// 拖拽开始
function dragTodo(event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
        quadrant: event.currentTarget.dataset.quadrant,
        index: parseInt(event.currentTarget.dataset.index)
    }));
    
    event.currentTarget.classList.add('dragging');
}

// 拖拽结束
function dragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    
    // 移除所有放置指示器
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

// 允许放置
function allowDrop(event) {
    event.preventDefault();
}

// 放置待办事项
function dropTodo(event) {
    event.preventDefault();
    
    try {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const sourceQuadrant = data.quadrant;
        const sourceIndex = data.index;
        
        // 获取目标象限
        const targetQuadrant = event.currentTarget.dataset.quadrant;
        
        // 如果没有有效数据，或者源和目标相同且没有其他待办事项，则不执行操作
        if (!data || (sourceQuadrant === targetQuadrant && appData.todos[targetQuadrant].length <= 1)) {
            return;
        }
        
        // 获取被拖拽的待办事项
        const todoItem = appData.todos[sourceQuadrant][sourceIndex];
        
        // 如果目标象限与源象限相同，则重新排序
        if (sourceQuadrant === targetQuadrant) {
            // 获取放置位置
            const targetIndex = getDragPosition(event);
            
            // 避免放置在自己上面
            if (targetIndex === sourceIndex || targetIndex === sourceIndex + 1) {
                return;
            }
            
            // 移除原位置
            appData.todos[sourceQuadrant].splice(sourceIndex, 1);
            
            // 计算新位置
            const newIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
            
            // 插入新位置
            appData.todos[sourceQuadrant].splice(newIndex, 0, todoItem);
        } else {
            // 不同象限，则移动到新象限
            
            // 移除原位置
            appData.todos[sourceQuadrant].splice(sourceIndex, 1);
            
            // 添加到新象限
            if (!appData.todos[targetQuadrant]) {
                appData.todos[targetQuadrant] = [];
            }
            
            // 获取放置位置
            const targetIndex = getDragPosition(event);
            
            // 插入新位置
            appData.todos[targetQuadrant].splice(targetIndex, 0, todoItem);
        }
        
        saveData();
        
        // 更新两个象限的UI
        document.querySelector(`.todo-list[data-quadrant="${sourceQuadrant}"]`).innerHTML = renderTodoItems(sourceQuadrant);
        document.querySelector(`.todo-list[data-quadrant="${targetQuadrant}"]`).innerHTML = renderTodoItems(targetQuadrant);
        
        // 重新初始化拖拽
        initDragAndDrop();
        
    } catch (error) {
        console.error('Drop error:', error);
    }
}

// 获取拖拽位置
function getDragPosition(event) {
    const todoList = event.currentTarget;
    const todoItems = Array.from(todoList.querySelectorAll('.todo-item:not(.dragging)'));
    
    if (todoItems.length === 0) {
        return 0;
    }
    
    // 鼠标Y坐标
    const mouseY = event.clientY;
    
    for (let i = 0; i < todoItems.length; i++) {
        const item = todoItems[i];
        const rect = item.getBoundingClientRect();
        const itemMiddle = rect.top + rect.height / 2;
        
        if (mouseY < itemMiddle) {
            return parseInt(item.dataset.index);
        }
    }
    
    // 如果鼠标位置在所有项之后，则返回最后位置
    return todoItems.length;
}

// 导出待办事项相关功能
export {
    displayTodos,
    createQuadrant,
    renderTodoItems,
    addTodo,
    toggleTodo,
    deleteTodo,
    initDragAndDrop,
    dragTodo,
    dragEnd,
    allowDrop,
    dropTodo,
    getDragPosition
}; 