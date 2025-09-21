 // Initial chords
        const initialChords = ['C', 'G', 'Am', 'F'];
        const allChords = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Am', 'A#', 'B', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'];
        
        // App state
        let state = {
            playing: false,
            bpm: 120,
            currentBeat: 0,
            currentChordIndex: 0,
            chords: [...initialChords],
            audioContext: null,
            timer: null,
            editingBlockIndex: null,
            activeOscillators: [],
            currentChordOscillators: [],
            playPiano: true,
            playDrums: true
        };
        
        // DOM elements
        const playButton = document.getElementById('playButton');
        const bpmInput = document.getElementById('bpm');
        const chordGrid = document.getElementById('chordGrid');
        const chordModal = document.getElementById('chordModal');
        const chordOptions = document.getElementById('chordOptions');
        const closeModal = document.querySelector('.close-modal');
        const pianoToggle = document.getElementById('pianoToggle');
        const drumsToggle = document.getElementById('drumsToggle');
        
        // Initialize the app
        function init() {
            renderChordGrid();
            setupEventListeners();
        }
        
        // Render the chord grid
        function renderChordGrid() {
            chordGrid.innerHTML = '';
            
            state.chords.forEach((chord, index) => {
                const chordBlock = document.createElement('div');
                chordBlock.className = 'chord-block';
                chordBlock.dataset.index = index;
                
                chordBlock.innerHTML = `
                    <div class="chord-name">${chord}</div>
                    <div class="beats">4 beats</div>
                    <div class="current-beat"><div class="current-beat-indicator"></div></div>
                `;
                
                chordGrid.appendChild(chordBlock);
            });
        }
        
        // Setup event listeners
        function setupEventListeners() {
            playButton.addEventListener('click', togglePlay);
            bpmInput.addEventListener('change', updateBpm);
            
            // Toggle buttons
            pianoToggle.addEventListener('click', () => {
                state.playPiano = !state.playPiano;
                pianoToggle.classList.toggle('active', state.playPiano);
                if (!state.playPiano) {
                    stopAllChordOscillators();
                }
            });
            
            drumsToggle.addEventListener('click', () => {
                state.playDrums = !state.playDrums;
                drumsToggle.classList.toggle('active', state.playDrums);
            });
            
            // Click on chord block to edit
            chordGrid.addEventListener('click', (e) => {
                const chordBlock = e.target.closest('.chord-block');
                if (chordBlock) {
                    state.editingBlockIndex = parseInt(chordBlock.dataset.index);
                    openChordModal();
                }
            });
            
            // Close modal
            closeModal.addEventListener('click', closeChordModal);
            chordModal.addEventListener('click', (e) => {
                if (e.target === chordModal) {
                    closeChordModal();
                }
            });
        }
        
        // Open chord selection modal
        function openChordModal() {
            chordOptions.innerHTML = '';
            
            allChords.forEach(chord => {
                const option = document.createElement('div');
                option.className = 'chord-option';
                option.textContent = chord;
                option.addEventListener('click', () => {
                    state.chords[state.editingBlockIndex] = chord;
                    renderChordGrid();
                    closeChordModal();
                });
                chordOptions.appendChild(option);
            });
            
            chordModal.style.display = 'flex';
        }
        
        // Close chord selection modal
        function closeChordModal() {
            chordModal.style.display = 'none';
            state.editingBlockIndex = null;
        }
        
        // Toggle play/pause
        function togglePlay() {
            if (state.playing) {
                pause();
            } else {
                play();
            }
        }
        
        // Start playback
        function play() {
            if (!state.audioContext) {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            state.playing = true;
            playButton.textContent = 'Pause';
            
            const beatLength = 60 / state.bpm;
            
            // Start the timer
            state.timer = setInterval(() => {
                updatePlayback();
            }, beatLength * 1000);
            
            // Play immediately
            updatePlayback();
        }
        
        // Pause playback
        function pause() {
            state.playing = false;
            playButton.textContent = 'Play';
            clearInterval(state.timer);
            
            // Stop all oscillators
            stopAllOscillators();
            stopAllChordOscillators();
            
            // Reset visual indicators
            document.querySelectorAll('.current-beat-indicator').forEach(indicator => {
                indicator.style.width = '0%';
            });
            
            document.querySelectorAll('.chord-block').forEach(block => {
                block.classList.remove('active');
            });
            
            state.currentBeat = 0;
            state.currentChordIndex = 0;
        }
        
        // Stop all active oscillators
        function stopAllOscillators() {
            state.activeOscillators.forEach(osc => {
                osc.stop();
                osc.disconnect();
            });
            state.activeOscillators = [];
        }
        
        // Stop all chord oscillators
        function stopAllChordOscillators() {
            state.currentChordOscillators.forEach(osc => {
                osc.stop();
                osc.disconnect();
            });
            state.currentChordOscillators = [];
        }
        
        // Update playback state - FIXED PROGRESS BAR
        function updatePlayback() {
            // Update current beat indicator (now properly aligned)
            const beatProgress = ((state.currentBeat % 4) + 1) / 4 * 100;
            const chordBlocks = document.querySelectorAll('.chord-block');
            
            // Reset all active states
            chordBlocks.forEach(block => {
                block.classList.remove('active');
                block.querySelector('.current-beat-indicator').style.width = '0%';
            });
            
            // Set active chord
            const currentBlock = chordBlocks[state.currentChordIndex];
            if (currentBlock) {
                currentBlock.classList.add('active');
                currentBlock.querySelector('.current-beat-indicator').style.width = `${beatProgress}%`;
            }
            
            // Start new chord on beat 0 (now properly aligned)
            if (state.currentBeat % 4 === 0) {
                stopAllChordOscillators();
                if (state.playPiano) {
                    playSustainedChord(state.chords[state.currentChordIndex]);
                }
            }
            
            // Play beat sound on every beat
            if (state.playDrums) {
                playBeatSound();
            }
            
            // Update counters
            state.currentBeat++;
            if (state.currentBeat % 4 === 0) {
                state.currentChordIndex = (state.currentChordIndex + 1) % state.chords.length;
            }
        }
        
        // Play a sustained chord in the background
        function playSustainedChord(chord) {
            if (!state.audioContext) return;
            
            // Define chord frequencies (simplified for demonstration)
            const chordFrequencies = {
                'C': [261.63, 329.63, 392.00], // C-E-G
                'G': [392.00, 493.88, 587.33], // G-B-D
                'Am': [220.00, 261.63, 329.63], // A-C-E
                'F': [349.23, 440.00, 523.25], // F-A-C
                'D': [293.66, 369.99, 440.00], // D-F#-A
                'E': [329.63, 415.30, 493.88], // E-G#-B
                'A': [220.00, 277.18, 329.63], // A-C#-E
                'B': [246.94, 311.13, 369.99], // B-D#-F#
                'C#': [277.18, 349.23, 415.30], // C#-F-G#
                'D#': [311.13, 392.00, 466.16], // D#-G-A#
                'F#': [369.99, 466.16, 554.37], // F#-A#-C#
                'G#': [415.30, 523.25, 622.25], // G#-C-D#
                'A#': [466.16, 587.33, 698.46], // A#-D-F
                'Bm': [246.94, 293.66, 369.99], // B-D-F#
                'Cm': [261.63, 311.13, 392.00], // C-E♭-G
                'Dm': [293.66, 349.23, 440.00], // D-F-A
                'Em': [329.63, 392.00, 493.88], // E-G-B
                'Fm': [349.23, 415.30, 523.25], // F-A♭-C
                'Gm': [392.00, 466.16, 587.33]  // G-B♭-D
            };
            
            const frequencies = chordFrequencies[chord] || chordFrequencies['C'];
            
            // Create oscillators for each note in the chord
            frequencies.forEach(freq => {
                const osc = state.audioContext.createOscillator();
                const gain = state.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, state.audioContext.currentTime);
                
                // Set up gain envelope for sustained sound
                gain.gain.setValueAtTime(0, state.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, state.audioContext.currentTime + 0.1);
                
                osc.connect(gain);
                gain.connect(state.audioContext.destination);
                
                osc.start();
                
                // These will be stopped when the chord changes
                state.currentChordOscillators.push(osc);
            });
        }
        
        // Play a percussive beat sound
        function playBeatSound() {
            if (!state.audioContext) return;
            
            // Create noise for the beat
            const bufferSize = state.audioContext.sampleRate * 0.1;
            const noiseBuffer = state.audioContext.createBuffer(1, bufferSize, state.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = state.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const gain = state.audioContext.createGain();
            gain.gain.setValueAtTime(0.5, state.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + 0.1);
            
            const filter = state.audioContext.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.value = 1000;
            
            noise.connect(gain);
            gain.connect(filter);
            filter.connect(state.audioContext.destination);
            
            noise.start();
            noise.stop(state.audioContext.currentTime + 0.1);
            
            state.activeOscillators.push(noise);
        }
        
        // Update BPM
        function updateBpm() {
            const newBpm = parseInt(bpmInput.value);
            if (newBpm >= 40 && newBpm <= 200) {
                state.bpm = newBpm;
                
                // If currently playing, restart with new BPM
                if (state.playing) {
                    pause();
                    play();
                }
            }
        }
        
        // Initialize the app when the page loads
        window.addEventListener('load', init);