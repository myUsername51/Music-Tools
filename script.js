// ===== 全局变量和初始化 =====
let audioContext;
let oscillator;
let isPlaying = false;
let particles = [];
let mouseX = 0;
let mouseY = 0;
let audioData = null;
let analyser = null;
let dataArray = null;
let audioBuffer = null; // 用于存储音频文件
let audioSource = null; // 用于存储音频源
let currentAudioTime = 0; // 用于记录当前播放时间

// ===== 粒子系统类 =====
class Particle {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.element = null;
        this.audioReactive = false;
        this.createParticle();
    }

    // 创建粒子DOM元素
    createParticle() {
        this.element = document.createElement('div');
        this.element.className = 'particle';
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.width = this.size + 'px';
        this.element.style.height = this.size + 'px';
        this.element.style.background = this.color;
        document.getElementById('particles-container').appendChild(this.element);
    }

    // 更新粒子位置（跟随鼠标）
    update() {
        if (this.audioReactive && audioData) {
            // 音频反应模式：根据音频数据调整粒子
            const audioIndex = Math.floor((this.x / window.innerWidth) * audioData.length);
            const audioValue = audioData[audioIndex] || 0;
            const scale = 1 + (audioValue / 255) * 2;
            this.element.style.transform = `scale(${scale})`;
        } else {
            // 鼠标跟随模式：粒子缓慢向鼠标位置移动
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            this.x += dx * 0.01;
            this.y += dy * 0.01;
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }

    // 销毁粒子
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}

// ===== 粒子系统管理器 =====
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 50;
        this.init();
    }

    // 初始化粒子系统
    init() {
        // 创建初始粒子
        for (let i = 0; i < this.maxParticles; i++) {
            this.createParticle();
        }
        
        // 定期创建新粒子
        setInterval(() => {
            if (this.particles.length < this.maxParticles) {
                this.createParticle();
            }
        }, 2000);
    }

    // 创建单个粒子
    createParticle() {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const size = Math.random() * 4 + 2;
        const speed = Math.random() * 2 + 1;
        const colors = [
            'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
            'radial-gradient(circle, rgba(0, 255, 255, 0.8) 0%, rgba(0, 255, 255, 0.2) 50%, transparent 100%)',
            'radial-gradient(circle, rgba(255, 0, 255, 0.8) 0%, rgba(255, 0, 255, 0.2) 50%, transparent 100%)'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const particle = new Particle(x, y, size, speed, color);
        this.particles.push(particle);
    }

    // 更新所有粒子
    update() {
        this.particles.forEach(particle => {
            particle.update();
        });
    }

    // 切换到音频反应模式
    setAudioReactive(reactive) {
        this.particles.forEach(particle => {
            particle.audioReactive = reactive;
        });
    }
}

// ===== 音频可视化系统 =====
class AudioVisualizer {
    constructor() {
        this.spectrumCanvas = document.getElementById('spectrum-canvas');
        this.waveformCanvas = document.getElementById('waveform-canvas');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.visualizer = document.getElementById('audio-visualizer');
        this.init();
    }

    // 初始化画布
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // 调整画布大小
    resizeCanvas() {
        this.spectrumCanvas.width = window.innerWidth;
        this.spectrumCanvas.height = window.innerHeight;
        this.waveformCanvas.width = window.innerWidth;
        this.waveformCanvas.height = window.innerHeight;
    }

    // 开始音频可视化
    startVisualization(audioContext, analyser) {
        this.analyser = analyser;
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.visualizer.classList.add('active');
        this.animate();
    }

    // 停止音频可视化
    stopVisualization() {
        this.visualizer.classList.remove('active');
    }

    // 动画循环
    animate() {
        if (!this.analyser) return;

        const spectrumCtx = this.spectrumCtx;
        const waveformCtx = this.waveformCtx;
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;

        // 清除画布
        spectrumCtx.clearRect(0, 0, width, height);
        waveformCtx.clearRect(0, 0, width, height);

        // 获取音频数据
        this.analyser.getByteFrequencyData(this.dataArray);
        audioData = this.dataArray; // 供粒子系统使用

        // 绘制频谱
        this.drawSpectrum(spectrumCtx, width, height);
        
        // 绘制波形
        this.drawWaveform(waveformCtx, width, height);

        requestAnimationFrame(() => this.animate());
    }

    // 绘制频谱
    drawSpectrum(ctx, width, height) {
        const barWidth = width / this.dataArray.length;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.5;
            const x = i * barWidth;
            const y = height - barHeight;
            
            // 根据频率设置颜色
            const hue = (i / this.dataArray.length) * 360;
            const color = `hsl(${hue}, 70%, 50%)`;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }

    // 绘制波形
    drawWaveform(ctx, width, height) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sliceWidth = width / this.dataArray.length;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }
}

// ===== 液体效果系统 =====
class LiquidEffect {
    constructor() {
        this.container = document.getElementById('liquid-container');
    }

    // 创建涟漪效果
    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'liquid-ripple';
        ripple.style.left = (x - 25) + 'px';
        ripple.style.top = (y - 25) + 'px';
        ripple.style.width = '50px';
        ripple.style.height = '50px';
        
        this.container.appendChild(ripple);
        
        // 动画结束后移除元素
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
}

// ===== 3D 变换系统 =====
class TiltEffect {
    constructor() {
        this.cards = document.querySelectorAll('[data-tilt]');
        this.init();
    }

    // 初始化3D倾斜效果
    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
        });
    }

    // 处理鼠标移动
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

    // 处理鼠标离开
    handleMouseLeave(e, card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
}

// ===== 工具数据 =====
const toolData = {
    keyboard: {
        id: 'keyboard-card',
        title: 'Keyboard Player',
        description: 'Perfect timing for practice. Stay in rhythm with our precise metronome.',
        mini: '<iframe src="player/keyboardPlayer/keyboard.html" width="1000" height="800" style="border: none;"></iframe>',
        type: 'web',
        link: 'player/keyboardPlayer/keyboard.html'
    },
    chordPlayer: {
        id: 'chord-card',
        title: 'Chord Player',
        description: 'Stay in tune with our accurate tuner. Perfect for all instruments.',
        mini: '<iframe src="player/chordPlayer/index.html" width="1000" height="400" style="border: none;"></iframe>',
        type: 'web',
        link: 'player/chordPlayer/index.html'
    },
    drumPlayer: {
        id: 'drums-card',
        title: 'Drum Player',
        description: 'Discover new chord progressions and learn different voicings.',
        mini: '<iframe src="player/drumPlayer/drumPlayer.html" width="1000" height="800" style="border: none;"></iframe>',
        type: 'web',
        link: 'player/drumPlayer/drumPlayer.html'
    },
    pitchTrainer: {
        id: 'pitch-card',
        title: 'Pitch Trainer',
        description: 'Become pitch perfect',
        mini: '<iframe src="trainer/pitchTrainer/pitchTrainer.html" width="1000" height="300" style="border: none;"></iframe>',
        type: 'web',
        link: 'trainer/pitchTrainer/index.html'
    },
    scaleTrainer: {
        id: 'scale-card',
        title: 'Scale Trainer',
        description: 'Familiarize yourself with scales in any key and mode.',
        mini: '<iframe src="trainer/scaleTrainer/v3.html" width="1000" height="300" style="border: none;"></iframe>',
        type: 'web',
        link: 'trainer/scaleTrainer/index.html'
    },
    memoryTrainer: {
        id: 'memory-card',
        title: 'Notes\' Memory Trainer',
        description: 'Memorize notes on the keyboard.',
        mini: '<iframe src="trainer/memoryTrainer/noteMemoryTrainer.html" width="1000" height="300" style="border: none;"></iframe>',
        type: 'web',
        link: 'trainer/memoryTrainer/noteMemoryTrainer.html'
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
                    <div class="tool-mini"></div>
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
    modal.querySelector('.tool-mini').innerHTML = toolInfo.mini;

    
    // 清除旧的链接
    const linksContainer = modal.querySelector('.tool-links');
    linksContainer.innerHTML = '';
    
    // 添加新的链接
    const link = document.createElement('a');
    link.className = 'tool-link';
    link.href = toolInfo.link;
    link.target = '_blank';
    
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

// ===== 音频系统增强 =====
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('音频上下文已初始化');
    }
}

function handleAudioFileUpload() {
    const fileInput = document.getElementById('audioFile');
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            console.log('开始加载音频文件:', file.name);
            
            // 检查文件类型
            if (!file.type.startsWith('audio/')) {
                alert('Please select an audio file.');
                return;
            }
            
            // 检查文件大小
            if (file.size > 100 * 1024 * 1024) { // 100MB
                alert('File is too large. Please select a file under 100MB.');
                return;
            }
            
            // 确保音频上下文已初始化
            initAudio();
            
            // 读取文件
            const arrayBuffer = await file.arrayBuffer();
            console.log('文件读取成功，大小:', arrayBuffer.byteLength);
            
            // 解码音频
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log('音频解码成功，通道数:', audioBuffer.numberOfChannels);
            
            // 更新UI
            const playButton = document.getElementById('playButton');
            playButton.classList.remove('audio-playing');
            document.querySelector('.sample-info').textContent = `Ready to play: ${file.name}`;
            
            // 如果正在播放，停止当前播放
            if (isPlaying) {
                stopMusicSample();
            }
        } catch (error) {
            console.error('Error loading audio file:', error);
            let errorMessage = 'Failed to load audio file. Please try again.';
            if (error.code === 'AudioContextNotSupportedError') {
                errorMessage = 'Your browser does not support audio playback.';
            } else if (error.code === 'AudioContextNotInitializedError') {
                errorMessage = 'Audio context is not initialized. Please try again.';
            } else if (error.message.includes('decodeAudioData')) {
                errorMessage = 'Failed to decode audio file. Please make sure it is a valid audio file.';
            }
            alert(errorMessage);
        }
    });
}

function stopMusicSample() {
    if (!isPlaying) return;
    
    // 清理音频源
    if (audioSource) {
        // 记录当前播放时间
        currentAudioTime = audioContext.currentTime;
        
        // 停止音频源
        audioSource.stop(0);
        audioSource.disconnect();
        audioSource = null;
    }
    
    // 重置状态
    isPlaying = false;
    const playButton = document.getElementById('playButton');
    playButton.classList.remove('audio-playing');
    audioVisualizer.stopVisualization();
    particleSystem.setAudioReactive(false);
}

function playMusicSample() {
    if (isPlaying) return;
    
    initAudio();
    isPlaying = true;
    
    // 创建音频分析器
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    
    // 视觉反馈
    const playButton = document.getElementById('playButton');
    playButton.classList.add('audio-playing');
    
    // 启动音频可视化
    audioVisualizer.startVisualization(audioContext, analyser);
    
    // 切换到音频反应模式
    particleSystem.setAudioReactive(true);
    
    // 创建音频源
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // 开始播放
    audioSource.start(0, currentAudioTime);
    
    // 音乐结束后清理
    audioSource.onended = () => {
        stopMusicSample();
    };
}

// ===== 波文字动画 =====
function createWaveAnimation(element) {
    const chars = element.querySelectorAll('.char');
    chars.forEach((char, index) => {
        char.style.animationDelay = `${index * 0.05}s`;
    });
    
    element.classList.add('animate');
    
    setTimeout(() => {
        element.classList.remove('animate');
    }, 1000);
}

// ===== 全局实例 =====
let particleSystem;
let audioVisualizer;
let liquidEffect;
let tiltEffect;

// ===== 页面加载初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    // 初始化各个系统
    particleSystem = new ParticleSystem();
    audioVisualizer = new AudioVisualizer();
    liquidEffect = new LiquidEffect();
    tiltEffect = new TiltEffect();
    
    // 波文字动画
    const waveTexts = document.querySelectorAll('.wave-text');
    waveTexts.forEach(text => {
        text.addEventListener('click', () => {
            createWaveAnimation(text);
        });
    });
    
    // 播放按钮功能
    const playButton = document.getElementById('playButton');
    playButton.addEventListener('click', () => {
        console.log('Button clicked, current state:', isPlaying);
        
        if (isPlaying) {
            console.log('Pausing music...');
            stopMusicSample();
        } else {
            console.log('Playing music...');
            playMusicSample();
        }
    });
    
    // 工具卡片波动画
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const waveText = card.querySelector('.wave-text');
            if (waveText) {
                createWaveAnimation(waveText);
            }
        });
    });
    
    // 气泡交互效果
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
        bubble.addEventListener('mouseenter', () => {
            bubble.style.animationPlayState = 'paused';
        });
        
        bubble.addEventListener('mouseleave', () => {
            bubble.style.animationPlayState = 'running';
        });
    });
    
    // 鼠标移动视差效果
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        const mouseXNormalized = e.clientX / window.innerWidth;
        const mouseYNormalized = e.clientY / window.innerHeight;
        
        bubbles.forEach((bubble, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseXNormalized - 0.5) * speed * 20;
            const y = (mouseYNormalized - 0.5) * speed * 20;
            
            bubble.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
    
    // 鼠标移动液体涟漪效果
    document.addEventListener('mousemove', (e) => {
        if (Math.random() < 0.1) { // 10% 概率创建涟漪
            liquidEffect.createRipple(e.clientX, e.clientY);
        }
    });
    
    // 页面加载时的初始动画
    setTimeout(() => {
        const mainTitle = document.querySelector('.main-title');
        createWaveAnimation(mainTitle);
    }, 1000);
    
    setTimeout(() => {
        const subtitle = document.querySelector('.subtitle');
        createWaveAnimation(subtitle);
    }, 2000);
    
    // 粒子系统动画循环
    function animateParticles() {
        particleSystem.update();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
    
    // 初始化工具模态框
    initToolModals();
    
    // 初始化音频文件上传
    handleAudioFileUpload();
});

// ===== 键盘快捷键 =====
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        playMusicSample();
    }
});

// ===== 触摸支持 =====
document.addEventListener('touchstart', (e) => {
    // 触摸涟漪效果
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';
    
    const rect = e.target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.touches[0].clientX - rect.left - size / 2;
    const y = e.touches[0].clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    e.target.style.position = 'relative';
    e.target.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
    
    // 触摸时创建液体涟漪
    liquidEffect.createRipple(e.touches[0].clientX, e.touches[0].clientY);
});

// ===== 涟漪动画CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);