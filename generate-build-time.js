const fs = require('fs');
const path = require('path');

// 保存先：src/assets/build-time.json
const targetPath = path.join(__dirname, 'src/assets/build-time.json');

// 現在の日時情報を取得
const buildTimeData = {
  timestamp: new Date().getTime(),
  displayTime: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
};

// JSONファイルとして書き出し
fs.writeFileSync(targetPath, JSON.stringify(buildTimeData, null, 2), 'utf8');
console.log(`[Ionic Hook] Build time recorded: ${buildTimeData.displayTime}`);