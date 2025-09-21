let modelURL = "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models@main/models/pitch-detection/crepe";
let pitch;
let audioContext;
let freq=0;
let threashold = 1; //how close to the target frequency to be considered "in tune"

let ukeNotes = [
  {note: 'A', freq: 440},
  {note: 'E', freq: 329.6276},
  {note: 'C', freq: 261.6256}, 
  {note: 'G', freq: 391.9954}
]


function setup() {
  createCanvas(400, 400);
const c = createCanvas(400, 500); // size of the “usable” glass area in the PNG
c.parent('tunerFrame');          // put the canvas inside the frame
// No need to call position(); CSS places it via #tuner-frame canvas { left/top }.

  //user gesture needed to start audio context
    let button = createButton('START TUNER');
    button.class('startButton'); // attach CSS class
    button.parent('tunerFrame');        
    button.mousePressed(async () => {
        await userStartAudio();          // <- satisfies the gesture requirement
        audioContext = getAudioContext();
    });

  audioContext = getAudioContext();
  mic = new p5.AudioIn();
  mic.start(listening);
}

function listening() {
  console.log("listening");
  pitch = ml5.pitchDetection(modelURL, audioContext, mic.stream, modelLoaded);
}

function modelLoaded() {
  console.log("Model Loaded!");
  pitch.getPitch(gotPitch);
}

function gotPitch(err, frequency) {
  if (err) {
    console.error(err);
  } else {
    //gets rid of null frequency
    if (frequency) {
      freq=frequency;     
    }
    //console.log(frequency);
  }
  pitch.getPitch(gotPitch);

}

function draw() {
  background(0);
  textAlign(CENTER);
  fill(255);
  textSize(32);
  text(freq.toFixed(2), width/2, height-150);

  let closestNote = -1;
    let recordDiff = Infinity;
    for (let i=0; i<ukeNotes.length; i++) {
        let diff = freq - ukeNotes[i].freq;
        if (abs(diff) < abs(recordDiff)) {
            closestNote = ukeNotes[i];
            recordDiff = diff;
        }
    }

    textSize(64);
      text(closestNote.note, width/2, height-50);

    let diff = recordDiff;

  /*
  let amt = map(abs(diff), 0, 100, 0, 1);
  let r = color(255, 0, 0);
  let g = color(0, 255, 0);
  let col = lerpColor(g, r, amt);//gradient from green to red
  fill(col);
  rect(200, 100, diff, 50);
  */

  let alpha = map(abs(diff), 0, 100, 0, 255);
  rectMode(CENTER);
  fill(255, alpha);
  stroke(255);
  strokeWeight(1);
  if (abs(diff) < threashold) {
    fill(0, 255, 0);
  }
  rect(200, 100, 200, 50);
  
  stroke(255);
  strokeWeight(4);
  line(200, 0, 200, 200);
  
  noStroke();
  fill(255, 0, 0);
  if (abs(diff) < threashold) {
    fill(0, 255, 0);
  }
  rect(200 + diff / 2, 100, 10, 75);
}