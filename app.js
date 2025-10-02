const startStopButton = document.getElementById('start-stop-button');
const delaySlider = document.getElementById('delay-slider');
const delayValue = document.getElementById('delay-value');

let audioContext;
let source;
let delayNode;
let gainNode;
let mediaStream;
let isJamming = false;

// 遅延スライダーの値を表示に反映
delaySlider.addEventListener('input', () => {
    const delayTime = delaySlider.value;
    delayValue.textContent = delayTime;
    if (delayNode) {
        // Web Audio APIのdelayTimeは秒単位なので、ミリ秒から変換
        delayNode.delayTime.setValueAtTime(delayTime / 1000, audioContext.currentTime);
    }
});

startStopButton.addEventListener('click', () => {
    isJamming = !isJamming;
    if (isJamming) {
        startJamming();
    } else {
        stopJamming();
    }
});

async function startJamming() {
    try {
        // AudioContextの初期化（ユーザーの操作後に開始する必要がある）
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // マイクへのアクセスを要求
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // オーディオソースを作成
        source = audioContext.createMediaStreamSource(mediaStream);

        // 遅延ノードを作成
        delayNode = audioContext.createDelay();
        const delayTime = delaySlider.value;
        delayNode.delayTime.value = delayTime / 1000;

        // ゲインノードを作成（音量調整用だが今回はそのまま）
        gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        // ノードを接続: マイク -> 遅延 -> ゲイン -> スピーカー
        source.connect(delayNode);
        delayNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // UIの更新
        startStopButton.textContent = '停止 / Stop';
        startStopButton.classList.add('active');

    } catch (err) {
        console.error('Error starting speech jammer:', err);
        alert('マイクの取得に失敗しました。マイクへのアクセスを許可してください。');
        isJamming = false; // エラーが発生した場合は状態をリセット
    }
}

function stopJamming() {
    if (mediaStream) {
        // マイクのトラックを停止して、マイク使用中のインジケータを消す
        mediaStream.getTracks().forEach(track => track.stop());
    }

    if (audioContext && audioContext.state !== 'closed') {
        // オーディオコンテキストを閉じる
        audioContext.close().then(() => {
            console.log('AudioContext closed.');
        });
    }

    // UIの更新
    startStopButton.textContent = '開始 / Start';
    startStopButton.classList.remove('active');
}
