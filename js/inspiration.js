/**
 * inspiration.js - 灵感笔记相关功能
 */

import { appData, saveData } from './core.js';
import { showToast, formatDate } from './utils.js';

// 显示灵感笔记
function displayInspirations(container) {
    container.innerHTML = '';
    
    // 如果没有灵感笔记
    if (!appData.inspirations || appData.inspirations.length === 0) {
        container.innerHTML = '<div class="text-center p-4 text-muted">暂无灵感笔记</div>';
        return;
    }
    
    // 创建筛选和排序工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'inspiration-toolbar mb-3';
    toolbar.innerHTML = `
        <div class="filter-tags mb-2">
            <button class="btn btn-sm btn-outline-primary active" data-tag="all">全部</button>
            ${createTagButtons()}
        </div>
        <div class="sort-options">
            <label>排序方式：</label>
            <select id="inspiration-sort" class="form-select form-select-sm">
                <option value="newest">最新优先</option>
                <option value="oldest">最早优先</option>
            </select>
        </div>
    `;
    
    // 添加事件监听器
    toolbar.querySelectorAll('.filter-tags button').forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            toolbar.querySelectorAll('.filter-tags button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 给当前按钮添加active类
            button.classList.add('active');
            
            // 筛选灵感笔记
            filterInspirations(container, button.dataset.tag);
        });
    });
    
    toolbar.querySelector('#inspiration-sort').addEventListener('change', (e) => {
        // 获取当前选中的标签
        const activeTag = toolbar.querySelector('.filter-tags button.active').dataset.tag;
        
        // 重新筛选和排序
        filterInspirations(container, activeTag, e.target.value);
    });
    
    container.appendChild(toolbar);
    
    // 创建灵感笔记容器
    const inspirationList = document.createElement('div');
    inspirationList.className = 'inspiration-list';
    container.appendChild(inspirationList);
    
    // 显示灵感笔记（默认显示全部，按最新排序）
    filterInspirations(container, 'all', 'newest');
    
    // 添加按钮
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-primary fixed-bottom-right';
    addButton.innerHTML = '<i class="fas fa-plus"></i>';
    addButton.addEventListener('click', () => showAddInspirationModal());
    container.appendChild(addButton);
}

// 创建标签按钮
function createTagButtons() {
    // 获取所有唯一标签
    const tags = getUniqueTags();
    
    return tags.map(tag => `
        <button class="btn btn-sm btn-outline-primary" data-tag="${tag}">${tag}</button>
    `).join('');
}

// 获取唯一标签列表
function getUniqueTags() {
    // 从所有灵感笔记中提取标签
    const allTags = [];
    appData.inspirations.forEach(inspiration => {
        if (inspiration.tags && inspiration.tags.length > 0) {
            allTags.push(...inspiration.tags);
        }
    });
    
    // 去重
    return [...new Set(allTags)];
}

// 筛选灵感笔记
function filterInspirations(container, tag = 'all', sortBy = 'newest') {
    const inspirationList = container.querySelector('.inspiration-list');
    inspirationList.innerHTML = '';
    
    // 筛选灵感笔记
    let filteredInspirations = [...appData.inspirations];
    
    if (tag !== 'all') {
        filteredInspirations = filteredInspirations.filter(inspiration => 
            inspiration.tags && inspiration.tags.includes(tag)
        );
    }
    
    // 如果筛选后没有灵感笔记
    if (filteredInspirations.length === 0) {
        inspirationList.innerHTML = '<div class="text-center p-4 text-muted">暂无符合条件的灵感笔记</div>';
        return;
    }
    
    // 排序灵感笔记
    if (sortBy === 'newest') {
        filteredInspirations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
        filteredInspirations.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    // 显示灵感笔记
    filteredInspirations.forEach((inspiration, index) => {
        const card = createInspirationCard(inspiration, index);
        inspirationList.appendChild(card);
    });
}

// 创建灵感笔记卡片
function createInspirationCard(inspiration, index) {
    const card = document.createElement('div');
    card.className = 'inspiration-card';
    card.innerHTML = `
        <div class="inspiration-header">
            <div class="inspiration-date">${formatDate(inspiration.createdAt)}</div>
            <div class="inspiration-actions">
                <button class="btn btn-sm btn-outline-secondary" onclick="editInspiration(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteInspiration(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="inspiration-content">${inspiration.content}</div>
        <div class="inspiration-tags">
            ${inspiration.tags ? inspiration.tags.map(tag => `
                <span class="badge bg-primary">${tag}</span>
            `).join('') : ''}
        </div>
    `;
    
    return card;
}

// 显示添加灵感笔记模态框
function showAddInspirationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addInspirationModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">添加灵感笔记</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="addInspirationForm">
                        <div class="mb-3">
                            <label for="inspirationContent" class="form-label">内容</label>
                            <textarea class="form-control" id="inspirationContent" rows="4" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="inspirationTags" class="form-label">标签（用逗号分隔）</label>
                            <input type="text" class="form-control" id="inspirationTags">
                            <div class="existing-tags mt-2">
                                ${createExistingTagsButtons()}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="saveInspirationBtn">保存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 添加标签点击事件
    modal.querySelectorAll('.existing-tags button').forEach(button => {
        button.addEventListener('click', () => {
            const tagInput = document.getElementById('inspirationTags');
            const currentTags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            const tag = button.textContent.trim();
            if (!currentTags.includes(tag)) {
                currentTags.push(tag);
                tagInput.value = currentTags.join(', ');
            }
        });
    });
    
    // 保存灵感笔记
    document.getElementById('saveInspirationBtn').addEventListener('click', () => {
        const content = document.getElementById('inspirationContent').value.trim();
        const tagsInput = document.getElementById('inspirationTags').value.trim();
        
        if (!content) {
            alert('请输入灵感笔记内容');
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
        
        // 添加灵感笔记
        addInspiration(content, tags);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 创建现有标签按钮
function createExistingTagsButtons() {
    const tags = getUniqueTags();
    
    if (tags.length === 0) {
        return '<div class="text-muted small">暂无标签</div>';
    }
    
    return tags.map(tag => `
        <button type="button" class="btn btn-sm btn-outline-primary me-1 mb-1">${tag}</button>
    `).join('');
}

// 添加灵感笔记
function addInspiration(content, tags = []) {
    const newInspiration = {
        content,
        tags,
        createdAt: new Date().toISOString()
    };
    
    if (!appData.inspirations) {
        appData.inspirations = [];
    }
    
    appData.inspirations.push(newInspiration);
    saveData();
    
    // 更新灵感笔记标签
    updateInspirationTags();
    
    // 重新渲染灵感笔记列表
    const container = document.querySelector('.inspiration-container');
    if (container) {
        displayInspirations(container);
    }
    
    showToast('灵感笔记已添加');
}

// 编辑灵感笔记
function editInspiration(index) {
    if (!appData.inspirations || !appData.inspirations[index]) {
        return;
    }
    
    const inspiration = appData.inspirations[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editInspirationModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">编辑灵感笔记</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editInspirationForm">
                        <div class="mb-3">
                            <label for="editInspirationContent" class="form-label">内容</label>
                            <textarea class="form-control" id="editInspirationContent" rows="4" required>${inspiration.content}</textarea>
                        </div>
                        <div class="mb-3">
                            <label for="editInspirationTags" class="form-label">标签（用逗号分隔）</label>
                            <input type="text" class="form-control" id="editInspirationTags" value="${inspiration.tags ? inspiration.tags.join(', ') : ''}">
                            <div class="existing-tags mt-2">
                                ${createExistingTagsButtons()}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="updateInspirationBtn" data-index="${index}">更新</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 添加标签点击事件
    modal.querySelectorAll('.existing-tags button').forEach(button => {
        button.addEventListener('click', () => {
            const tagInput = document.getElementById('editInspirationTags');
            const currentTags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            const tag = button.textContent.trim();
            if (!currentTags.includes(tag)) {
                currentTags.push(tag);
                tagInput.value = currentTags.join(', ');
            }
        });
    });
    
    // 更新灵感笔记
    document.getElementById('updateInspirationBtn').addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const content = document.getElementById('editInspirationContent').value.trim();
        const tagsInput = document.getElementById('editInspirationTags').value.trim();
        
        if (!content) {
            alert('请输入灵感笔记内容');
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
        
        // 更新灵感笔记
        updateInspiration(index, content, tags);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 更新灵感笔记
function updateInspiration(index, content, tags = []) {
    if (!appData.inspirations || !appData.inspirations[index]) {
        return;
    }
    
    appData.inspirations[index].content = content;
    appData.inspirations[index].tags = tags;
    saveData();
    
    // 更新灵感笔记标签
    updateInspirationTags();
    
    // 重新渲染灵感笔记列表
    const container = document.querySelector('.inspiration-container');
    if (container) {
        displayInspirations(container);
    }
    
    showToast('灵感笔记已更新');
}

// 删除灵感笔记
function deleteInspiration(index) {
    if (!appData.inspirations || !appData.inspirations[index]) {
        return;
    }
    
    if (confirm('确定要删除这条灵感笔记吗?')) {
        appData.inspirations.splice(index, 1);
        saveData();
        
        // 更新灵感笔记标签
        updateInspirationTags();
        
        // 重新渲染灵感笔记列表
        const container = document.querySelector('.inspiration-container');
        if (container) {
            displayInspirations(container);
        }
        
        showToast('灵感笔记已删除');
    }
}

// 更新灵感笔记标签
function updateInspirationTags() {
    // 更新标签数据
    appData.inspirationTags = getUniqueTags();
    saveData();
}

// 导出灵感笔记相关功能
export {
    displayInspirations,
    createTagButtons,
    getUniqueTags,
    filterInspirations,
    createInspirationCard,
    showAddInspirationModal,
    createExistingTagsButtons,
    addInspiration,
    editInspiration,
    updateInspiration,
    deleteInspiration,
    updateInspirationTags
}; 