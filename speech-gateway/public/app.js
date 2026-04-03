const recordButton = document.getElementById('record-button');
const stopButton = document.getElementById('stop-button');
const useTextButton = document.getElementById('use-text-button');
const transcribeButton = document.getElementById('transcribe-button');
const markTextButton = document.getElementById('mark-text-button');
const respondButton = document.getElementById('respond-button');
const assistantButton = document.getElementById('assistant-button');
const synthesizeButton = document.getElementById('synthesize-button');
const messageInput = document.getElementById('message-input');
const responseInput = document.getElementById('response-input');
const resultLog = document.getElementById('result-log');
const player = document.getElementById('player');
const healthStatus = document.getElementById('health-status');
const healthNote = document.getElementById('health-note');
const inputModeNote = document.getElementById('input-mode-note');

let mediaRecorder = null;
let recordedChunks = [];
let lastRecordingBlob = null;
let lastInputMode = 'text';

function setLog(value) {
  resultLog.textContent = value;
}

function setHealth(ok, note) {
  healthStatus.textContent = ok ? 'Ready' : 'Not Ready';
  healthStatus.className = `status-pill ${ok ? 'ok' : 'error'}`;
  healthNote.textContent = note;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encodeWav(audioBuffer) {
  const numberOfChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  let offset = 0;
  writeString(offset, 'RIFF');
  offset += 4;
  view.setUint32(offset, 36 + samples.length * 2, true);
  offset += 4;
  writeString(offset, 'WAVE');
  offset += 4;
  writeString(offset, 'fmt ');
  offset += 4;
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numberOfChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * numberOfChannels * 2, true);
  offset += 4;
  view.setUint16(offset, numberOfChannels * 2, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString(offset, 'data');
  offset += 4;
  view.setUint32(offset, samples.length * 2, true);
  offset += 4;

  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return buffer;
}

async function blobToWavBase64(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const mono = audioContext.createBuffer(1, decoded.length, decoded.sampleRate);
    const output = mono.getChannelData(0);

    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const input = decoded.getChannelData(channel);
      for (let i = 0; i < input.length; i += 1) {
        output[i] += input[i] / decoded.numberOfChannels;
      }
    }

    return arrayBufferToBase64(encodeWav(mono));
  } finally {
    await audioContext.close();
  }
}

async function loadHealth() {
  try {
    const response = await fetch('/health');
    const data = await response.json();
    const note = [
      data.configured ? 'Azure Speech configured' : 'Azure Speech credentials missing',
      data.assistantConfigured ? 'assistant bridge configured' : 'assistant bridge not configured',
    ].join(' | ');
    setHealth(data.ok, note);
  } catch (error) {
    setHealth(false, error instanceof Error ? error.message : 'Health check failed');
  }
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    lastRecordingBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    transcribeButton.disabled = false;
    stopButton.disabled = true;
    recordButton.disabled = false;
    inputModeNote.textContent = 'Recording captured. Transcribe it or record again.';
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };

  mediaRecorder.start();
  lastInputMode = 'speech';
  recordButton.disabled = true;
  stopButton.disabled = false;
  inputModeNote.textContent = 'Recording in progress...';
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

async function transcribeRecording() {
  if (!lastRecordingBlob) {
    setLog('No recording available to transcribe.');
    return;
  }

  setLog('Transcribing speech...');
  const audioBase64 = await blobToWavBase64(lastRecordingBlob);
  const response = await fetch('/speech/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      contentType: 'audio/wav',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    setLog(`Transcription failed: ${data.error || 'unknown error'}`);
    return;
  }

  messageInput.value = data.text;
  lastInputMode = 'speech';
  inputModeNote.textContent = 'Last input mode: speech. Speech-aware responses will auto-play.';
  setLog(`Transcript:\n${data.text}`);
}

function markTextInput() {
  lastInputMode = 'text';
  inputModeNote.textContent = 'Last input mode: text. Speech-aware responses will stay silent.';
  setLog('Input mode set to text.');
}

async function runSpeechAwareResponse() {
  const text = responseInput.value.trim();
  if (!text) {
    setLog('Enter response text first.');
    return;
  }

  setLog(`Running speech-aware response in ${lastInputMode} mode...`);
  const response = await fetch('/speech/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      inputMode: lastInputMode,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    setLog(`Speech-aware response failed: ${data.error || 'unknown error'}`);
    return;
  }

  if (data.speak && data.audioBase64) {
    player.src = `data:${data.contentType};base64,${data.audioBase64}`;
    await player.play();
    setLog(`Spoken response generated with voice ${data.voiceName || 'default'}.`);
  } else {
    player.removeAttribute('src');
    player.load();
    setLog('Response handled in text mode. No audio generated.');
  }
}

async function askAssistant() {
  const text = messageInput.value.trim();
  if (!text) {
    setLog('Enter or transcribe a message first.');
    return;
  }

  setLog(`Calling assistant in ${lastInputMode} mode...`);
  const response = await fetch('/speech/assistant-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      inputMode: lastInputMode,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    setLog(`Assistant turn failed: ${data.error || 'unknown error'}`);
    return;
  }

  responseInput.value = data.text;

  if (data.speak && data.audioBase64) {
    player.src = `data:${data.contentType};base64,${data.audioBase64}`;
    await player.play();
    setLog(`Assistant replied and audio was generated with voice ${data.voiceName || 'default'}.`);
  } else {
    player.removeAttribute('src');
    player.load();
    setLog('Assistant replied in text mode. No audio generated.');
  }
}

async function forceSynthesize() {
  const text = responseInput.value.trim();
  if (!text) {
    setLog('Enter response text first.');
    return;
  }

  setLog('Synthesizing audio...');
  const response = await fetch('/speech/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    setLog(`Synthesis failed: ${data.error || 'unknown error'}`);
    return;
  }

  player.src = `data:${data.contentType};base64,${data.audioBase64}`;
  await player.play();
  setLog(`Audio synthesized with voice ${data.voiceName}.`);
}

recordButton.addEventListener('click', () => {
  startRecording().catch((error) => {
    setLog(`Recording failed: ${error instanceof Error ? error.message : String(error)}`);
  });
});

stopButton.addEventListener('click', stopRecording);
transcribeButton.addEventListener('click', () => {
  transcribeRecording().catch((error) => {
    setLog(`Transcription error: ${error instanceof Error ? error.message : String(error)}`);
  });
});
useTextButton.addEventListener('click', markTextInput);
markTextButton.addEventListener('click', markTextInput);
respondButton.addEventListener('click', () => {
  runSpeechAwareResponse().catch((error) => {
    setLog(`Response error: ${error instanceof Error ? error.message : String(error)}`);
  });
});
assistantButton.addEventListener('click', () => {
  askAssistant().catch((error) => {
    setLog(`Assistant error: ${error instanceof Error ? error.message : String(error)}`);
  });
});
synthesizeButton.addEventListener('click', () => {
  forceSynthesize().catch((error) => {
    setLog(`Synthesis error: ${error instanceof Error ? error.message : String(error)}`);
  });
});

loadHealth().catch((error) => {
  setLog(`Health check error: ${error instanceof Error ? error.message : String(error)}`);
});
