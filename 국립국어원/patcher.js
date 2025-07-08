const Database = require('better-sqlite3');
const fs = require('fs');

let list = fs.readdirSync('.');
let dict_db = list.find(x => x.startsWith('dicts_') && x.endsWith('.db'));
let thread = 0;

console.log('Found DB File | ' + dict_db);

const db = new Database(dict_db);
const total = db.prepare('SELECT COUNT(*) AS total FROM dicts').get().total;
const rows = db.prepare('SELECT id, mean FROM dicts').all();

const updateStmt = db.prepare('UPDATE dicts SET mean = ? WHERE id = ?');
console.log('Processing..');

const updateAll = db.transaction((rows) => {
  for (const row of rows) {
    let mean_arr = row.mean.split('\n');
    thread++;
    if(mean_arr.length > 1) {
        mean_arr = mean_arr.map(str => {
            let str2 = str.replace(/[^0-9.,!\sA-Za-z가-힣]/g, '');
            if(!isNaN(Number(str2[0])) str2 = str2.split(' ').slice(1).join(' '));
            return str2;
        });
        mean_arr = [...new Set(mean_arr)];
        let newMean = mean_arr.length > 2 ? mean_arr.map((x, int) => (int + 1) + '. ' + x).join('\n') : mean_arr[0];
        updateStmt.run(newMean, row.id);
    }
    process.title = `[${Math.floor(thread / total * 10000) / 100}%] assets loading..`;
  }
});

updateAll(rows);

console.log('DB File Updated');