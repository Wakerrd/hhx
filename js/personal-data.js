/**
 * personal-data.js - 个人数据管理相关功能
 */

import { appData, saveData } from './core.js';
import { showToast, formatDate } from './utils.js';

// 显示个人数据
function displayPersonalData(container) {
    container.innerHTML = '';
    
    // 创建个人数据UI
    const personalDataElement = document.createElement('div');
    personalDataElement.className = 'personal-data-wrapper';
    personalDataElement.innerHTML = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>个人数据</h5>
                <button id="addDataCategoryBtn" class="btn btn-sm btn-primary">
                    <i class="fas fa-plus"></i> 添加数据类别
                </button>
            </div>
            <div class="card-body">
                <div id="personalDataCategories" class="personal-data-categories">
                    <!-- 数据类别将在这里显示 -->
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5>数据可视化</h5>
            </div>
            <div class="card-body">
                <div class="form-group mb-3">
                    <label for="dataVisualizationSelect" class="form-label">选择数据类别</label>
                    <select id="dataVisualizationSelect" class="form-select">
                        <option value="">-- 请选择 --</option>
                        <!-- 数据类别选项将在这里添加 -->
                    </select>
                </div>
                <div id="dataVisualizationChart" style="height: 300px;">
                    <!-- 数据可视化图表将在这里显示 -->
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(personalDataElement);
    
    // 添加事件监听
    document.getElementById('addDataCategoryBtn').addEventListener('click', () => {
        showAddDataCategoryModal();
    });
    
    // 显示数据类别
    displayDataCategories();
    
    // 初始化数据可视化选择器
    initDataVisualizationSelect();
    
    // 添加选择器事件监听
    document.getElementById('dataVisualizationSelect').addEventListener('change', (e) => {
        const categoryId = e.target.value;
        if (categoryId) {
            displayDataVisualization(categoryId);
        } else {
            document.getElementById('dataVisualizationChart').innerHTML = 
                '<div class="text-center p-4 text-muted">请选择一个数据类别进行可视化</div>';
        }
    });
}

// 显示数据类别
function displayDataCategories() {
    const categoriesContainer = document.getElementById('personalDataCategories');
    if (!categoriesContainer) return;
    
    if (!appData.personalData || !appData.personalData.categories || appData.personalData.categories.length === 0) {
        categoriesContainer.innerHTML = '<div class="text-center p-4 text-muted">暂无数据类别，添加一个新类别吧!</div>';
        return;
    }
    
    let categoriesHTML = '';
    
    appData.personalData.categories.forEach((category, index) => {
        // 获取最新的数据点
        const latestDataPoint = getLatestDataPoint(category.id);
        
        categoriesHTML += `
            <div class="data-category-card card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="category-name">${category.name}</h5>
                            <div class="category-description text-muted small">${category.description || ''}</div>
                            <div class="category-meta mt-2">
                                <div class="unit small text-muted">单位: ${category.unit}</div>
                                ${latestDataPoint ? `
                                    <div class="latest-data mt-1">
                                        <span class="badge bg-primary">最新: ${latestDataPoint.value} ${category.unit}</span>
                                        <span class="text-muted small ms-2">${formatDate(latestDataPoint.date)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="category-actions">
                            <button class="btn btn-sm btn-success me-1" onclick="addDataPoint('${category.id}')">
                                <i class="fas fa-plus"></i> 添加数据
                            </button>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editDataCategory(${index})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteDataCategory(${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="category-data-preview mt-3">
                        ${generateDataPointsPreview(category.id)}
                    </div>
                </div>
            </div>
        `;
    });
    
    categoriesContainer.innerHTML = categoriesHTML;
}

// 生成数据点预览
function generateDataPointsPreview(categoryId) {
    if (!appData.personalData || !appData.personalData.dataPoints || !appData.personalData.dataPoints[categoryId]) {
        return '<div class="text-muted small">暂无数据点</div>';
    }
    
    const dataPoints = appData.personalData.dataPoints[categoryId];
    
    // 只显示最近5个数据点
    const recentDataPoints = [...dataPoints]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentDataPoints.length === 0) {
        return '<div class="text-muted small">暂无数据点</div>';
    }
    
    // 查找对应的类别以获取单位
    const category = appData.personalData.categories.find(c => c.id === categoryId);
    const unit = category ? category.unit : '';
    
    return `
        <div class="recent-data-points">
            <div class="text-muted small mb-2">最近数据:</div>
            <div class="data-points-list">
                ${recentDataPoints.map(dataPoint => `
                    <div class="data-point-item d-flex justify-content-between align-items-center mb-1">
                        <div class="data-point-value">${dataPoint.value} ${unit}</div>
                        <div class="data-point-date text-muted small">${formatDate(dataPoint.date)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="text-end mt-2">
                <button class="btn btn-sm btn-link" onclick="viewAllDataPoints('${categoryId}')">
                    查看所有数据 &raquo;
                </button>
            </div>
        </div>
    `;
}

// 获取最新的数据点
function getLatestDataPoint(categoryId) {
    if (!appData.personalData || !appData.personalData.dataPoints || !appData.personalData.dataPoints[categoryId]) {
        return null;
    }
    
    const dataPoints = appData.personalData.dataPoints[categoryId];
    
    if (dataPoints.length === 0) {
        return null;
    }
    
    // 查找日期最新的数据点
    return dataPoints.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date) ? current : latest;
    }, dataPoints[0]);
}

// 初始化数据可视化选择器
function initDataVisualizationSelect() {
    const select = document.getElementById('dataVisualizationSelect');
    if (!select) return;
    
    // 清空当前选项
    select.innerHTML = '<option value="">-- 请选择 --</option>';
    
    if (!appData.personalData || !appData.personalData.categories || appData.personalData.categories.length === 0) {
        return;
    }
    
    // 添加数据类别选项
    appData.personalData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// 显示数据可视化
function displayDataVisualization(categoryId) {
    const chartContainer = document.getElementById('dataVisualizationChart');
    if (!chartContainer) return;
    
    if (!appData.personalData || !appData.personalData.dataPoints || !appData.personalData.dataPoints[categoryId]) {
        chartContainer.innerHTML = '<div class="text-center p-4 text-muted">暂无数据可显示</div>';
        return;
    }
    
    const dataPoints = appData.personalData.dataPoints[categoryId];
    
    if (dataPoints.length < 2) {
        chartContainer.innerHTML = '<div class="text-center p-4 text-muted">数据点不足，至少需要2个数据点来绘制图表</div>';
        return;
    }
    
    // 查找对应的类别以获取名称和单位
    const category = appData.personalData.categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : '';
    const unit = category ? category.unit : '';
    
    // 准备图表数据
    const sortedDataPoints = [...dataPoints].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const labels = sortedDataPoints.map(dp => formatDate(dp.date, { short: true }));
    const values = sortedDataPoints.map(dp => dp.value);
    
    // 绘制图表
    chartContainer.innerHTML = '<canvas id="dataChart"></canvas>';
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    // 如果已存在图表实例，先销毁
    if (window.dataChartInstance) {
        window.dataChartInstance.destroy();
    }
    
    // 创建新图表
    window.dataChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${categoryName} (${unit})`,
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

// 显示添加数据类别模态框
function showAddDataCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addDataCategoryModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">添加数据类别</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="addDataCategoryForm">
                        <div class="mb-3">
                            <label for="categoryName" class="form-label">类别名称</label>
                            <input type="text" class="form-control" id="categoryName" required>
                        </div>
                        <div class="mb-3">
                            <label for="categoryDescription" class="form-label">描述 (可选)</label>
                            <textarea class="form-control" id="categoryDescription" rows="2"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="categoryUnit" class="form-label">单位</label>
                            <input type="text" class="form-control" id="categoryUnit" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="saveDataCategoryBtn">保存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 保存数据类别
    document.getElementById('saveDataCategoryBtn').addEventListener('click', () => {
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDescription').value.trim();
        const unit = document.getElementById('categoryUnit').value.trim();
        
        if (!name) {
            alert('请输入类别名称');
            return;
        }
        
        if (!unit) {
            alert('请输入单位');
            return;
        }
        
        // 添加数据类别
        addDataCategory(name, description, unit);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 添加数据类别
function addDataCategory(name, description = '', unit) {
    // 初始化个人数据结构
    if (!appData.personalData) {
        appData.personalData = {
            categories: [],
            dataPoints: {}
        };
    }
    
    // 创建唯一ID
    const id = 'cat_' + Date.now();
    
    // 创建新数据类别
    const newCategory = {
        id,
        name,
        description,
        unit,
        createdAt: new Date().toISOString()
    };
    
    // 添加到类别列表
    appData.personalData.categories.push(newCategory);
    
    // 初始化该类别的数据点数组
    appData.personalData.dataPoints[id] = [];
    
    // 保存数据
    saveData();
    
    // 更新UI
    displayDataCategories();
    initDataVisualizationSelect();
    
    showToast('数据类别已添加');
}

// 编辑数据类别
function editDataCategory(index) {
    if (!appData.personalData || !appData.personalData.categories || !appData.personalData.categories[index]) {
        return;
    }
    
    const category = appData.personalData.categories[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editDataCategoryModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">编辑数据类别</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editDataCategoryForm">
                        <div class="mb-3">
                            <label for="editCategoryName" class="form-label">类别名称</label>
                            <input type="text" class="form-control" id="editCategoryName" value="${category.name}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCategoryDescription" class="form-label">描述 (可选)</label>
                            <textarea class="form-control" id="editCategoryDescription" rows="2">${category.description || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label for="editCategoryUnit" class="form-label">单位</label>
                            <input type="text" class="form-control" id="editCategoryUnit" value="${category.unit}" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="updateDataCategoryBtn" data-index="${index}">更新</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 更新数据类别
    document.getElementById('updateDataCategoryBtn').addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const name = document.getElementById('editCategoryName').value.trim();
        const description = document.getElementById('editCategoryDescription').value.trim();
        const unit = document.getElementById('editCategoryUnit').value.trim();
        
        if (!name) {
            alert('请输入类别名称');
            return;
        }
        
        if (!unit) {
            alert('请输入单位');
            return;
        }
        
        // 更新数据类别
        updateDataCategory(index, name, description, unit);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 更新数据类别
function updateDataCategory(index, name, description = '', unit) {
    if (!appData.personalData || !appData.personalData.categories || !appData.personalData.categories[index]) {
        return;
    }
    
    appData.personalData.categories[index].name = name;
    appData.personalData.categories[index].description = description;
    appData.personalData.categories[index].unit = unit;
    
    // 保存数据
    saveData();
    
    // 更新UI
    displayDataCategories();
    initDataVisualizationSelect();
    
    // 如果当前正在查看该类别的可视化，则更新图表
    const select = document.getElementById('dataVisualizationSelect');
    if (select && select.value === appData.personalData.categories[index].id) {
        displayDataVisualization(select.value);
    }
    
    showToast('数据类别已更新');
}

// 删除数据类别
function deleteDataCategory(index) {
    if (!appData.personalData || !appData.personalData.categories || !appData.personalData.categories[index]) {
        return;
    }
    
    if (confirm('确定要删除这个数据类别吗? 所有相关的数据点也将被删除。')) {
        const categoryId = appData.personalData.categories[index].id;
        
        // 删除类别
        appData.personalData.categories.splice(index, 1);
        
        // 删除相关的数据点
        if (appData.personalData.dataPoints[categoryId]) {
            delete appData.personalData.dataPoints[categoryId];
        }
        
        // 保存数据
        saveData();
        
        // 更新UI
        displayDataCategories();
        initDataVisualizationSelect();
        
        // 如果当前正在查看该类别的可视化，则清空图表
        const select = document.getElementById('dataVisualizationSelect');
        if (select) {
            select.value = '';
            document.getElementById('dataVisualizationChart').innerHTML = 
                '<div class="text-center p-4 text-muted">请选择一个数据类别进行可视化</div>';
        }
        
        showToast('数据类别已删除');
    }
}

// 添加数据点
function addDataPoint(categoryId) {
    // 查找类别
    if (!appData.personalData || !appData.personalData.categories) {
        return;
    }
    
    const category = appData.personalData.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addDataPointModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">添加数据点 - ${category.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="addDataPointForm">
                        <div class="mb-3">
                            <label for="dataPointValue" class="form-label">数值 (${category.unit})</label>
                            <input type="number" step="any" class="form-control" id="dataPointValue" required>
                        </div>
                        <div class="mb-3">
                            <label for="dataPointDate" class="form-label">日期</label>
                            <input type="date" class="form-control" id="dataPointDate" 
                                   value="${new Date().toISOString().slice(0, 10)}" required>
                        </div>
                        <div class="mb-3">
                            <label for="dataPointNote" class="form-label">备注 (可选)</label>
                            <textarea class="form-control" id="dataPointNote" rows="2"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="saveDataPointBtn" data-category-id="${categoryId}">保存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 保存数据点
    document.getElementById('saveDataPointBtn').addEventListener('click', (e) => {
        const categoryId = e.target.dataset.categoryId;
        const valueInput = document.getElementById('dataPointValue');
        const dateInput = document.getElementById('dataPointDate');
        const noteInput = document.getElementById('dataPointNote');
        
        const value = parseFloat(valueInput.value);
        const date = dateInput.value;
        const note = noteInput.value.trim();
        
        if (isNaN(value)) {
            alert('请输入有效的数值');
            return;
        }
        
        if (!date) {
            alert('请选择日期');
            return;
        }
        
        // 保存数据点
        saveDataPoint(categoryId, value, date, note);
        
        // 关闭模态框
        modalInstance.hide();
        
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 保存数据点
function saveDataPoint(categoryId, value, date, note = '') {
    // 初始化数据点数组（如果不存在）
    if (!appData.personalData.dataPoints) {
        appData.personalData.dataPoints = {};
    }
    
    if (!appData.personalData.dataPoints[categoryId]) {
        appData.personalData.dataPoints[categoryId] = [];
    }
    
    // 创建数据点对象
    const dataPoint = {
        id: 'dp_' + Date.now(),
        value,
        date,
        note,
        createdAt: new Date().toISOString()
    };
    
    // 添加到数据点列表
    appData.personalData.dataPoints[categoryId].push(dataPoint);
    
    // 保存数据
    saveData();
    
    // 更新UI
    displayDataCategories();
    
    // 如果当前正在查看该类别的可视化，则更新图表
    const select = document.getElementById('dataVisualizationSelect');
    if (select && select.value === categoryId) {
        displayDataVisualization(categoryId);
    }
    
    showToast('数据点已添加');
}

// 查看所有数据点
function viewAllDataPoints(categoryId) {
    // 查找类别
    if (!appData.personalData || !appData.personalData.categories) {
        return;
    }
    
    const category = appData.personalData.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // 获取数据点
    const dataPoints = appData.personalData.dataPoints[categoryId] || [];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'viewDataPointsModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${category.name} - 所有数据</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${dataPoints.length === 0 ? 
                        '<div class="text-center p-4 text-muted">暂无数据点</div>' :
                        `<div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>日期</th>
                                        <th>数值 (${category.unit})</th>
                                        <th>备注</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${dataPoints.sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(dp => `
                                        <tr>
                                            <td>${formatDate(dp.date)}</td>
                                            <td>${dp.value}</td>
                                            <td>${dp.note || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-danger" 
                                                        onclick="deleteDataPoint('${categoryId}', '${dp.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`
                    }
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 初始化模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 在模态框关闭后移除它
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// 删除数据点
function deleteDataPoint(categoryId, dataPointId) {
    if (!appData.personalData || !appData.personalData.dataPoints || !appData.personalData.dataPoints[categoryId]) {
        return;
    }
    
    if (confirm('确定要删除这个数据点吗?')) {
        // 查找数据点索引
        const index = appData.personalData.dataPoints[categoryId].findIndex(dp => dp.id === dataPointId);
        
        if (index !== -1) {
            // 删除数据点
            appData.personalData.dataPoints[categoryId].splice(index, 1);
            
            // 保存数据
            saveData();
            
            // 关闭当前模态框
            bootstrap.Modal.getInstance(document.getElementById('viewDataPointsModal')).hide();
            
            // 更新UI
            displayDataCategories();
            
            // 如果当前正在查看该类别的可视化，则更新图表
            const select = document.getElementById('dataVisualizationSelect');
            if (select && select.value === categoryId) {
                displayDataVisualization(categoryId);
            }
            
            // 重新打开数据点列表
            setTimeout(() => {
                viewAllDataPoints(categoryId);
            }, 300);
            
            showToast('数据点已删除');
        }
    }
}

// 导出个人数据相关功能
export {
    displayPersonalData,
    displayDataCategories,
    generateDataPointsPreview,
    getLatestDataPoint,
    initDataVisualizationSelect,
    displayDataVisualization,
    showAddDataCategoryModal,
    addDataCategory,
    editDataCategory,
    updateDataCategory,
    deleteDataCategory,
    addDataPoint,
    saveDataPoint,
    viewAllDataPoints,
    deleteDataPoint
}; 