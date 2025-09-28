//(function() {
    // Get references to all necessary DOM elements.
    const mainActionButton = document.getElementById('mainActionButton');
    const resetButton = document.getElementById('resetButton');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const keyboardContainer = document.getElementById('keyboard');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalButton = document.getElementById('modalButton');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const instrumentSelect = document.getElementById('instrumentSelect');
    const octaveToggle = document.getElementById('octaveToggle');
    const octaveToggleLabel = document.getElementById('octaveToggleLabel');

    // Define the notes for one and two octaves.
    const twoOctaveNotes = [
        "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
        "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
        "C6"
    ];
    const oneOctaveNotes = twoOctaveNotes.slice(0, 13); // C4 to C5
    console.log(oneOctaveNotes);

    // State variables for the app's logic.
    let synth; // The Tone.js synthesizer.
    let currentNote = null;
    let isWaitingForGuess = false;
    let score = 0;
    let totalRounds = 0;
    let octaveRange = 'one';

    // Function to dynamically render the keyboard based on the octave range.
    function renderKeyboard(notes) {
        keyboardContainer.innerHTML = ''; // Clear existing keys
        const whiteKeys = notes.filter(note => !note.includes('#'));//no # if white
        const blackKeys = notes.filter(note => note.includes('#'));

        // Render white keys first
        whiteKeys.forEach(note => {
            const keyElement = document.createElement('div');
            keyElement.className = 'white-key';
            keyElement.dataset.note = note;
            keyboardContainer.appendChild(keyElement);
        });

        // Render black keys
        blackKeys.forEach(note => {
            const keyElement = document.createElement('div');
            keyElement.className = 'black-key';
            keyElement.dataset.note = note;
            
            // Manually position black keys based on their note.
            const keyMap = {
                "C#4": "calc(3rem - 1rem)", "D#4": "calc(6rem - 1rem)",
                "F#4": "calc(12rem - 1rem)", "G#4": "calc(15rem - 1rem)", "A#4": "calc(18rem - 1rem)",
                "C#5": "calc(24rem - 1rem)", "D#5": "calc(27rem - 1rem)",
                "F#5": "calc(33rem - 1rem)", "G#5": "calc(36rem - 1rem)", "A#5": "calc(39rem - 1rem)",
            };
            if (keyMap[note]) {
                keyElement.style.left = keyMap[note];
                keyboardContainer.appendChild(keyElement);
            }
        });

        // Re-attach the event listener to the new keys.
        keyboardContainer.addEventListener('click', handleKeyClick);
    }

    // Function to update the score display.
    function updateScoreDisplay() {
        scoreDisplay.textContent = `${score} / ${totalRounds}`;
    }

    // Function to reset the score and rounds.
    function resetScore() {
        score = 0;
        totalRounds = 0;
        updateScoreDisplay();
        resetButton.style.display = 'none';
    }

    // Function to initialize or switch the Tone.js synthesizer based on the selected instrument.
    function initializeSynth(instrument) {
        // Dispose of the old synth to prevent memory leaks and overlapping sounds.
        if (synth) {
            synth.dispose();
        }

        switch (instrument) {
            case 'AMSynth':
                synth = new Tone.AMSynth().toDestination();
                break;
            case 'FMSynth':
                synth = new Tone.FMSynth().toDestination();
                break;
            case 'PluckSynth':
                // Initialize a PluckSynth for a guitar-like sound
                synth = new Tone.PluckSynth({
                    attackNoise: 1, // Add more noise for a plucked sound
                    dampening: 8000, // Make the sound decay faster
                    resonance: 0.9, // Add some resonance
                }).toDestination();
                break;
            case 'Synth':
            default:
                synth = new Tone.Synth().toDestination();
                break;
        }
    }

    // Show the modal to get user interaction and enable audio.
    function showModal() {
        modalOverlay.classList.remove('hidden');
        modalButton.addEventListener('click', async () => {
            await Tone.start();
            console.log("Audio context started.");
            modalOverlay.classList.add('hidden');
            mainActionButton.disabled = false;
        });
    }

    // Function to get a random note from the `notes` array based on octave range.
    function getRandomNote() {
        const notesToUse = octaveRange === 'one' ? oneOctaveNotes : twoOctaveNotes;
        const randomIndex = Math.floor(Math.random() * notesToUse.length);
        return notesToUse[randomIndex];
    }

    // Function to play a specified note.
    function playNote(note) {
        if (synth) {
            synth.triggerAttackRelease(note, "2n");
        }
    }

    // Function to reset the state of the keyboard.
    function resetKeyboard() {
        document.querySelectorAll('.white-key, .black-key').forEach(key => {
            key.classList.remove('correct', 'wrong', 'active');
            key.disabled = false;
        });
    }

    // Function to disable the keyboard to prevent multiple clicks.
    function disableKeyboard() {
        document.querySelectorAll('.white-key, .black-key').forEach(key => key.disabled = true);
    }


    // Handler for the combined "Start" and "Next" button.
    function handleMainActionButtonClick() {
        // If we're not currently waiting for a guess, it's a new round.
        if (!isWaitingForGuess) {
            // Start a new round.
            isWaitingForGuess = true;
            mainActionButton.textContent = 'Next';
            mainActionButton.disabled = true; // Disable until a guess is made
            feedbackMessage.textContent = 'Listen carefully...';
            resetKeyboard();
            
            currentNote = getRandomNote();
            playNote(currentNote);
        } else {
            // If we are waiting for a guess, this button acts as "Next".
            // Reset UI and prepare for the next round.
            mainActionButton.textContent = 'Start';
            mainActionButton.disabled = false;
            feedbackMessage.textContent = '';
            resetKeyboard();
            isWaitingForGuess = false;
            
            // Immediately start the next round
            handleMainActionButtonClick();
        }
    }

    // Handler for a key click on the keyboard.
    function handleKeyClick(event) {
        if (!isWaitingForGuess) return;

        const selectedKey = event.target.closest('.white-key, .black-key');
        if (!selectedKey) return;

        const guessedNote = selectedKey.dataset.note;
        
        // Add active class for immediate feedback, then check the guess.
        selectedKey.classList.add('active');
        totalRounds++;

        // Check if the guess is correct.
        if (guessedNote === currentNote) {
            feedbackMessage.textContent = 'Correct!';
            selectedKey.classList.add('correct');
            score++;
        } else {
            feedbackMessage.textContent = 'Wrong!';
            selectedKey.classList.add('wrong');
            // Highlight the correct note.
            const correctKey = document.querySelector(`[data-note="${currentNote}"]`);
            if (correctKey) {
                correctKey.classList.add('correct');
            }
        }
        
        // Display the correct note regardless of the answer.
        feedbackMessage.innerHTML += `<div class="note-name">The correct note was: <strong>${currentNote}</strong></div>`;
        updateScoreDisplay();

        // Update state and UI after the guess.
        isWaitingForGuess = false;
        disableKeyboard();
        mainActionButton.disabled = false;
        resetButton.style.display = 'block';
    }

    // Handler for the instrument selection change.
    function handleInstrumentChange(event) {
        initializeSynth(event.target.value);
    }
    
    // Handler for the octave toggle.
    function handleOctaveToggle() {
        if (octaveToggle.checked) {
            octaveRange = 'two';
            octaveToggleLabel.textContent = '2 Octaves';
            renderKeyboard(twoOctaveNotes);
        } else {
            octaveRange = 'one';
            octaveToggleLabel.textContent = '1 Octave';
            renderKeyboard(oneOctaveNotes);
        }
        
        // Reset the game when the octave range changes.
        resetScore();
        handleMainActionButtonClick();
    }


    // Wait for the window to load before initializing Tone.js.
    window.addEventListener('load', () => {
        // Initialize the synthesizer with the default instrument.
        initializeSynth(instrumentSelect.value);

        // Dynamically render the initial one-octave keyboard by default.
        renderKeyboard(oneOctaveNotes);

        // Set up event listeners.
        mainActionButton.addEventListener('click', handleMainActionButtonClick);
        resetButton.addEventListener('click', resetScore);
        instrumentSelect.addEventListener('change', handleInstrumentChange);
        octaveToggle.addEventListener('change', handleOctaveToggle);

        // Show the modal to prompt for audio context activation.
        showModal();
    });

//})();