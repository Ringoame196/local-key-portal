const userIdTextBox = document.getElementById('userid');
const registBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const downloadURL = document.getElementById('downloadUrl');

function getUserId() {
    if (userIdTextBox.value.trim() === "") {
        alert('idを入力してください');
        return null;
    }
    return userIdTextBox.value.trim();
}

// SHA-256 ハッシュ生成関数
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 256桁の乱数を生成し、ブロック形式（PEM風）の文字列にする
function generateBlockKey() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+=';
    const keyLength = 256;
    const array = new Uint8Array(keyLength);
    window.crypto.getRandomValues(array);
    
    let rawKey = '';
    for (let i = 0; i < keyLength; i++) {
        rawKey += chars[array[i] % chars.length];
    }

    const chunkSize = 64;
    const chunks = [];
    for (let i = 0; i < rawKey.length; i += chunkSize) {
        chunks.push(rawKey.slice(i, i + chunkSize));
    }

    return [
        "-----BEGIN CUSTOM AUTH KEY-----",
        ...chunks,
        "-----END CUSTOM AUTH KEY-----"
    ].join("\n");
}

// ファイルダウンロード処理
function makeKeyFile(id, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}_Key.key`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    downloadURL.href = url;
    downloadURL.download = `${id}_Key.key`;
    downloadURL.textContent = `${id}_Key.key をもう一度ダウンロード`;
    downloadURL.style.display = "block";
}

// 【新規登録ボタン】
registBtn.addEventListener('click', async () => {
    const userId = getUserId();
    if (!userId) return;
    
    const db = JSON.parse(localStorage.getItem('auth_db') || '{}');
    
    // すでに同じIDが登録されているかチェック
    if (db[userId]) {
        alert("このIDはすでに登録されています。別のIDを使用するか、ログインを行ってください。");
        return;
    }
    
    // ブロック形式の鍵を生成し、全文ハッシュ化
    const blockKey = generateBlockKey();
    const keyHash = await sha256(blockKey);
    
    // 新規登録として保存
    db[userId] = [keyHash];
    localStorage.setItem('auth_db', JSON.stringify(db));
    
    // ファイルをダウンロード
    makeKeyFile(userId, blockKey);
    alert(`「${userId}」用の鍵ファイルを発行し、登録しました！`);
});

// 【ログインボタン】
loginBtn.addEventListener('click', async () => {
    const userId = getUserId();
    if (!userId) return;

    const db = JSON.parse(localStorage.getItem('auth_db') || '{}');
    const allowedHashes = db[userId];

    if (!allowedHashes || allowedHashes.length === 0) {
        alert("このIDは登録されていません。");
        return;
    }

    try {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const fileText = await file.text();

        const normalizedText = fileText.replace(/\r\n/g, '\n').trim();
        const inputHash = await sha256(normalizedText);

        if (allowedHashes.includes(inputHash)) {
            alert(`認証成功！ようこそ、${userId} さん。`);
        } else {
            alert("認証失敗：ファイルに改変が加えられているか、無効な鍵ファイルです。");
        }
    } catch (err) {
        console.log("ファイル選択がキャンセルされました", err);
    }
});