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

// Web Crypto API を使ったセキュアな SHA-256 ハッシュ生成
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 256桁の暗号学的ランダム文字列をブロック形式（64文字区切り）で生成
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

// ファイル自動ダウンロード＆再ダウンロードリンクの設定
function makeKeyFile(id, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}_Key.key`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (downloadURL) {
        downloadURL.href = url;
        downloadURL.download = `${id}_Key.key`;
        downloadURL.textContent = `📥 ${id}_Key.key をもう一度ダウンロード`;
        downloadURL.style.display = "block";
    }
}

// 【新規登録処理】
registBtn.addEventListener('click', async () => {
    const userId = getUserId();
    if (!userId) return;
    
    // データベースを取得し、重複登録をチェック
    const db = JSON.parse(localStorage.getItem('auth_db') || '{}');
    if (db[userId]) {
        alert("❌ このIDはすでに登録されています。別のIDを指定してください。");
        return;
    }
    
    // 鍵データを生成
    const blockKey = generateBlockKey();
    
    // ファイルの中に ID と 鍵ブロック を一体化させて書き込む
    const fileContent = `ID: ${userId}\n${blockKey}`;
    
    // 改行コードを統一してファイル全体を全文ハッシュ化
    const normalizedContent = fileContent.replace(/\r\n/g, '\n').trim();
    const fileHash = await sha256(normalizedContent);
    
    // LocalStorage に保存
    db[userId] = [fileHash];
    localStorage.setItem('auth_db', JSON.stringify(db));
    
    makeKeyFile(userId, fileContent);
    alert(`🎉 「${userId}」用の鍵ファイルを発行し、登録しました！`);
});

// 【ログイン処理（ファイル選択のみで自動識別）】
loginBtn.addEventListener('click', async () => {
    try {
        // ファイルピッカーで鍵ファイルを選択
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const fileText = await file.text();

        const normalizedText = fileText.replace(/\r\n/g, '\n').trim();

        // ファイルの1行目から ID を自動抽出する
        const lines = normalizedText.split('\n');
        const idLine = lines.find(l => l.startsWith('ID:'));
        
        if (!idLine) {
            alert("❌ 認証失敗：無効な鍵ファイルです（ID情報が見つかりません）。");
            return;
        }
        
        const userId = idLine.replace('ID:', '').trim();

        const db = JSON.parse(localStorage.getItem('auth_db') || '{}');
        const allowedHashes = db[userId];

        if (!allowedHashes || allowedHashes.length === 0) {
            alert(`❌ 認証失敗：登録されていないID「${userId}」のファイルです。`);
            return;
        }

        // ファイル全体をハッシュ化して検証
        const inputHash = await sha256(normalizedText);

        // 照合
        if (allowedHashes.includes(inputHash)) {
            alert(`🎉 認証成功！ようこそ、${userId} さん。`);
        } else {
            alert("❌ 認証失敗：ファイルに改変が加えられているか、無効な鍵ファイルです。");
        }
    } catch (err) {
        console.log("ファイル選択がキャンセルされました", err);
    }
});