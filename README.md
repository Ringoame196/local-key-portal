# 🔐 local-key-portal

ハッシュとファイル選択による自作認証システム

※暗号化の勉強のため制作したため、これによるセキュリティを保証しているわけではありません。

## 🛡️ プライバシー ＆ セキュリティについて

* **完全ローカル動作 (Zero External Communication)**
  * 本システムで生成された ID、秘密鍵データ、およびハッシュ値などは**一切外部サーバー等へ送信されません**。
  * すべての処理はお使いのブラウザ内部（ローカル環境）および LocalStorage 内で完結するため、第三者にIDや鍵情報が送信・流出することはありません。

## 🌟 特徴 (Features)

* **完全クライアントサイド動作 (Zero-Server Architecture)**
  * バックエンドサーバーや外部データベース（Supabase等）を使わず、HTML/CSS/JS とブラウザ標準機能（LocalStorage / Web Crypto API）のみで完結します。

* **ファイル選択のみでの自動識別 (Auto-Identification)**
  * 鍵ファイル内部に `ID` と `鍵データ` が一体化されて書き込まれているため、ログイン時に ID を手入力する必要がなく、ファイルを選ぶだけで即座にログインが完了します。

* **256桁の暗号学的乱数 ＆ PEM風ブロック表示**
  * `window.crypto.getRandomValues` を用いた256桁の強力な乱数を生成。64文字ごとに改行を入れたプロフェッショナルなブロック形式（ヘッダー/フッター付き）でファイル出力します。

* **全文ハッシュ化による厳格な改ざん検知 (Full-File SHA-256 Hashing)**
  * ファイルの1文字・改行1つでもユーザーによって手動変更された場合、SHA-256ハッシュが変化してログインを自動的に拒否します。

* **重複登録防止 ＆ マルチキー対応**
  * 同じIDでの新規二重登録をブロックし、安全なID管理とキー照合を実現します。

## 📁 鍵ファイルの構造例 (`username_Key.key`)

```text
ID: your_username
-----BEGIN CUSTOM AUTH KEY-----
9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
x7K9m2LpQz8vN4w1RtY3uI6oP5aS0dF2gHjKlZxCvBnM7qWeRtYuIoPaSdFgHjKl
ZxCvBnM7qWeRtYuIoPaSdFgHjKlZxCvBnM7qWeRtYuIoPaSdFgHjKlZxCvBnM7qW
eRtYuIoPaSdFgHjKlZxCvBnM7qWeRtYuIoPaSdFgHjKlZxCvBnM7qWeRtYuIoPaS
-----END CUSTOM AUTH KEY-----
```

## 🔄 仕組みと認証フロー

### 【新規登録】
1. IDを入力して「新規登録」をクリック。
2. 重複チェック後、256桁のPEM風ブロック鍵を含むテキストデータを生成。
3. ファイル全体（ID ＋ 鍵ブロック）の SHA-256 ハッシュ値を計算。
4. LocalStorage (`auth_db`) に `{ [ID]: [ハッシュ値] }` の形式で保存。
5. 鍵ファイル (`ID_Key.key`) を自動ダウンロード。

### 【ログイン】
1. 「ログイン」ボタンをクリック。
2. ローカルから `.key` ファイルを選択。
3. ファイル内の 1行目 (`ID: xxx`) から ID を自動読み込み。
4. LocalStorage 内のハッシュ値と、選択されたファイル全体の SHA-256 ハッシュ値を照合。
5. ハッシュ値が完全一致すれば認証成功！

## 🛠️ 技術スタック (Tech Stack)

* **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Storage**: Browser LocalStorage
* **Crypto API**: `window.crypto.subtle` (SHA-256), `window.crypto.getRandomValues`
* **File API**: Web File System Access API (`showOpenFilePicker`), Blob, `URL.createObjectURL`

## 🚀 使い方

1. `index.html` をブラウザで直接開くか、GitHub Pages などの静的ホスティングで開きます。
2. ID入力欄に希望のユーザー名を入力し、「新規登録」ボタンを押します。
3. 鍵ファイル (`<ID>_Key.key`) が自動でダウンロードされます。
4. ログイン時は、ID欄を空にしたままでも「ログイン」ボタンを押してダウンロードしたファイルを選択するだけでログインできます。