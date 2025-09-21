// ===== 工具数据 =====
const toolData = {
    keyboard: {
        id: 'keyboard-card',
        title: 'Metronome',
        description: '<iframe src="moreTools/metronome/index.html" width="1000" height="300" style="border: none;"></iframe>',
        type: 'web',
        link: 'metronome.html'
        
    },
    tuner: {
        id: 'tuner-card',
        title: 'Tuner',
        description: '<iframe src="moreTools/ml5tuner/index.html" width="1000" height="300" style="border: none;"></iframe>',
        type: 'web',
        link: 'tuner.html'
    }
};

// ===== 模态框功能 =====
function initToolModals() {
    // 创建模态框模板
    const modalTemplate = `
        <div class="tool-modal" id="toolModal">
            <div class="tool-modal-content">
                <div class="tool-modal-header">
                    <h2 class="tool-modal-title"></h2>
                    <span class="close-modal" onclick="closeToolModal()">&times;</span>
                </div>
                <div class="tool-modal-body">
                    <div class="tool-description"></div>
                    <div class="tool-links"></div>
                </div>
            </div>
        </div>
    `;
    
    // 将模态框添加到body
    document.body.insertAdjacentHTML('beforeend', modalTemplate);

    // 为工具卡片添加点击事件
    Object.entries(toolData).forEach(([key, tool]) => {
        const card = document.getElementById(tool.id);
        if (card) {
            card.addEventListener('click', () => {
                showToolModal(key);
            });
        }
    });
}

function showToolModal(toolId) {
    const modal = document.getElementById('toolModal');
    const toolInfo = toolData[toolId];
    
    if (!toolInfo) return;

    // 更新模态框内容
    modal.querySelector('.tool-modal-title').textContent = toolInfo.title;
    modal.querySelector('.tool-description').innerHTML = toolInfo.description;
    
    // 清除旧的链接
    const linksContainer = modal.querySelector('.tool-links');
    linksContainer.innerHTML = '';
    
    // 添加新的链接
    const link = document.createElement('a');
    link.className = 'tool-link';
    link.href = toolInfo.link;
    link.target = '_blank';  // 在新标签页打开
    
    if (toolInfo.type === 'extension') {
        link.textContent = 'Download Extension';
        link.download = true;
    } else {
        link.textContent = 'Open Tool';
    }
    
    linksContainer.appendChild(link);
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 添加动画效果
    modal.classList.add('modal-show');
    
    // 移除之前的动画类
    setTimeout(() => {
        modal.classList.remove('modal-show');
    }, 1000);
}

function closeToolModal() {
    const modal = document.getElementById('toolModal');
    modal.style.display = 'none';
}

// ===== 3D 变换系统 =====
class TiltEffect {
    constructor() {
        this.cards = document.querySelectorAll('[data-tilt]');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
        });
    }

    handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / centerY * -10;
        const rotateY = (x - centerX) / centerX * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    }

    handleMouseLeave(e, card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
}

// ===== 初始化 =====
function init() {
    // 初始化3D变换效果
    new TiltEffect();
    
    // 初始化工具模态框
    initToolModals();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
