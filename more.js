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

function initToolModals() {
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
    
    document.body.insertAdjacentHTML('beforeend', modalTemplate);

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

    modal.querySelector('.tool-modal-title').textContent = toolInfo.title;
    modal.querySelector('.tool-description').innerHTML = toolInfo.description;
    
    const linksContainer = modal.querySelector('.tool-links');
    linksContainer.innerHTML = '';
    
    
    const link = document.createElement('a');
    link.className = 'tool-link';
    link.href = toolInfo.link;
    link.target = '_blank';  
    
    /*
    if (toolInfo.type === 'extension') {
        link.textContent = 'Download Extension';
        link.download = true;
    } else {
        link.textContent = 'Open Tool';
    }*/
    
    linksContainer.appendChild(link);
    
    modal.style.display = 'block';
    
    modal.classList.add('modal-show');
    
    setTimeout(() => {
        modal.classList.remove('modal-show');
    }, 1000);
}

function closeToolModal() {
    const modal = document.getElementById('toolModal');
    modal.style.display = 'none';
}

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

function init() {
    new TiltEffect();
    
    initToolModals();
}

document.addEventListener('DOMContentLoaded', init);
