/**
 * utils.js - 通用工具函数
 */

// 日期计算的辅助函数
function calculateDaysBetweenDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 日期格式化函数
function formatDateToYYYYMMDD(date) {
    const d = new Date(date);
    return d.getFullYear().toString() +
           (d.getMonth() + 1).toString().padStart(2, '0') +
           d.getDate().toString().padStart(2, '0');
}

// 解析日期字符串
function parseDateString(dateStr) {
    if (!dateStr || !/^\d{8}$/.test(dateStr)) {
        return new Date();
    }
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
}

// 格式化金额显示
function formatMoney(amount) {
    return '￥' + parseFloat(amount).toFixed(2);
}

// 格式化日期显示
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

// 错误处理函数
function handleError(error) {
    console.error('Error:', error);
    showToast('发生错误：' + error.message);
}

// 创建模态框
function createModal({ id, title, content, onSave }) {
    const modalHtml = `
        <div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}Label" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${id}Label">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="${id}SaveBtn">保存</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHtml;
    document.body.appendChild(tempDiv.firstElementChild);
    
    const modal = new bootstrap.Modal(document.getElementById(id));
    
    document.getElementById(`${id}SaveBtn`).addEventListener('click', () => {
        onSave();
        modal.hide();
    });
    
    return modal;
}

// 通用显示模态框函数
function showModal(config) {
    createModal(config).show();
}

// 导出工具函数
export {
    calculateDaysBetweenDates,
    formatDateToYYYYMMDD,
    parseDateString,
    formatMoney,
    formatDate,
    showToast,
    handleError,
    createModal,
    showModal
}; 