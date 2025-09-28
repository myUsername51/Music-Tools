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

//NOT IN USE
class Particle {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.element = null;
        this.audioReactive = false;
        //this.createParticle();
    }
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

    update() {
        if (this.audioReactive && audioData) {
            const audioIndex = Math.floor((this.x / window.innerWidth) * audioData.length);
            const audioValue = audioData[audioIndex] || 0;
            const scale = 1 + (audioValue / 255) * 2;
            this.element.style.transform = `scale(${scale})`;
        } else {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            this.x += dx * 0.01;
            this.y += dy * 0.01;
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 50;
        this.init();
    }

    init() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.createParticle();
        }
        
        setInterval(() => {
            if (this.particles.length < this.maxParticles) {
                this.createParticle();
            }
        }, 2000);
    }

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

    update() {
        this.particles.forEach(particle => {
            particle.update();
        });
    }

    setAudioReactive(reactive) {
        this.particles.forEach(particle => {
            particle.audioReactive = reactive;
        });
    }
}

// Audio visualizer
class AudioVisualizer {
    constructor() {
        this.spectrumCanvas = document.getElementById('spectrum-canvas');
        this.waveformCanvas = document.getElementById('waveform-canvas');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.visualizer = document.getElementById('audio-visualizer');
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    //resize canvas
    resizeCanvas() {
        this.spectrumCanvas.width = window.innerWidth;
        this.spectrumCanvas.height = window.innerHeight;
        this.waveformCanvas.width = window.innerWidth;
        this.waveformCanvas.height = window.innerHeight;
    }

    startVisualization(audioContext, analyser) {
        this.analyser = analyser;
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.visualizer.classList.add('active');
        this.animate();
    }

    stopVisualization() {
        this.visualizer.classList.remove('active');
    }

    //animate
    animate() {
        if (!this.analyser) return;

        const spectrumCtx = this.spectrumCtx;
        const waveformCtx = this.waveformCtx;
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;

        //clear canvas
        spectrumCtx.clearRect(0, 0, width, height);
        waveformCtx.clearRect(0, 0, width, height);

        //get data for drawing
        this.analyser.getByteFrequencyData(this.dataArray);
        audioData = this.dataArray; //for particle system

        //draw spectrum
        this.drawSpectrum(spectrumCtx, width, height);
        
        //draw waveoform
        this.drawWaveform(waveformCtx, width, height);

        requestAnimationFrame(() => this.animate());
    }

    //draw spectrum
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

    //draw waveform
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

// Liquid text effect
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
        
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
}

//tile effect
class TiltEffect {
    constructor() {
        this.cards = document.querySelectorAll('[data-tilt]');
        this.init();
    }

    //slant effect
    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
        });
    }

    //move with mouse
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

//modal cards
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

//modal frame
function initToolModals() {
    //modal formate
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
    modal.querySelector('.tool-mini').innerHTML = toolInfo.mini;
    
    const linksContainer = modal.querySelector('.tool-links');
    linksContainer.innerHTML = '';
    
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
    
    modal.style.display = 'block';
    
    modal.classList.add('modal-show');
    
    //rid old animation
    setTimeout(() => {
        modal.classList.remove('modal-show');
    }, 1000);
}

function closeToolModal() {
    const modal = document.getElementById('toolModal');
    modal.style.display = 'none';
}

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function handleAudioFileUpload() {
    const fileInput = document.getElementById('audioFile');
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            
            //check file type
            if (!file.type.startsWith('audio/')) {
                alert('Please select an audio file.');
                return;
            }
            
            //check file size
            if (file.size > 100 * 1024 * 1024) { // 100MB
                alert('File is too large. Please select a file under 100MB.');
                return;
            }
            
            initAudio();
            
            //read file
            const arrayBuffer = await file.arrayBuffer();
            
            // 解码音频
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            //update UI
            const playButton = document.getElementById('playButton');
            playButton.classList.remove('audio-playing');
            document.querySelector('.sample-info').textContent = `Ready to play: ${file.name}`;
            
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
    
    //clean audio
    if (audioSource) {
        currentAudioTime = audioContext.currentTime;
        
        //stop music
        audioSource.stop(0);
        audioSource.disconnect();
        audioSource = null;
    }
    
    //reset state
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
    
    //create audio analyzer
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    
    const playButton = document.getElementById('playButton');
    playButton.classList.add('audio-playing');
    
    //start audio visualization
    audioVisualizer.startVisualization(audioContext, analyser);
    
    particleSystem.setAudioReactive(true);
    
    //create audio source
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    
    //start music
    audioSource.start(0, currentAudioTime);
    
    //stop music
    audioSource.onended = () => {
        stopMusicSample();
    };
}

//Text wave animation
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


let particleSystem;
let audioVisualizer;
let liquidEffect;
let tiltEffect;

//Starting page
document.addEventListener('DOMContentLoaded', function() {
    particleSystem = new ParticleSystem();
    audioVisualizer = new AudioVisualizer();
    liquidEffect = new LiquidEffect();
    tiltEffect = new TiltEffect();
    
    const waveTexts = document.querySelectorAll('.wave-text');
    waveTexts.forEach(text => {
        text.addEventListener('click', () => {
            createWaveAnimation(text);
        });
    });
    
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
    
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const waveText = card.querySelector('.wave-text');
            if (waveText) {
                createWaveAnimation(waveText);
            }
        });
    });
    
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
        bubble.addEventListener('mouseenter', () => {
            bubble.style.animationPlayState = 'paused';
        });
        
        bubble.addEventListener('mouseleave', () => {
            bubble.style.animationPlayState = 'running';
        });
    });
    
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
    
    document.addEventListener('mousemove', (e) => {
        if (Math.random() < 0.1) { // 10% 概率创建涟漪
            liquidEffect.createRipple(e.clientX, e.clientY);
        }
    });
    
    setTimeout(() => {
        const mainTitle = document.querySelector('.main-title');
        createWaveAnimation(mainTitle);
    }, 1000);
    
    setTimeout(() => {
        const subtitle = document.querySelector('.subtitle');
        createWaveAnimation(subtitle);
    }, 2000);
    
    /*
    function animateParticles() {
        particleSystem.update();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
    */
    
    initToolModals();
    
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