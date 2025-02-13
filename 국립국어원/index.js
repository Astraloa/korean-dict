// refactored - v1.1
console.clear();

console.log(`
8888888b.  d8b          888    d8b                                             
888  "Y88b Y8P          888    Y8P                                             
888    888              888                                                    
888    888 888  .d8888b 888888 888  .d88b.  88888b.   8888b.  888d888 888  888 
888    888 888 d88P"    888    888 d88""88b 888 "88b     "88b 888P"   888  888 
888    888 888 888      888    888 888  888 888  888 .d888888 888     888  888 
888  .d88P 888 Y88b.    Y88b.  888 Y88..88P 888  888 888  888 888     Y88b 888 
8888888P"  888  "Y8888P  "Y888 888  "Y88P"  888  888 "Y888888 888      "Y88888 
                                                                           888 
                                                                      Y8b d88P 
                                                                       "Y88P"  `);
console.log('\n  - by Astraloa  [Utils]\n');
process.title = 'Astraloa util services #1';

const Database = require('better-sqlite3');
const fs = require('fs');
const word = {};

let thread = 0;
let total = 0;
let file_list = [];

(async function () {
    await delay(1500);
    process.title = 'Dictionary [Utils]';
    let folders = fs.readdirSync('./국립국어원').filter(path => !path.includes('.'));
    console.log(`Found Folders: ${folders.length}\n`);
    await delay(1500);
    folders.forEach(name => {
        if (!name.endsWith('_json')) return;
        if (name.includes('근현대사전')) {
            console.log('[ ? ] 해당 서비스는 `근현대사전` 을 지원하지 않습니다.');
            return;
        } else if (name.includes('한국어기초사전')) {
            console.log('[ ? ] 해당 서비스는 `한국어기초사전` 을 지원하지 않습니다.');
        } else {
            let dictionary = name.slice(0, -5);
            console.log('[ ! ] 사전 발견 | ' + dictionary);
            let files = fs.readdirSync(`./국립국어원/${dictionary}_json`)
                .filter(x => x.endsWith('.json'))
                .map(k => `./국립국어원/${dictionary}_json/${k}`);
            file_list.push(files);
        }
    });
    if (file_list.length < 1) {
        console.log('[ # ] 발견된 사전이 없어 서비스가 종료됩니다..');
        process.exit(0);
    }
    await delay(1500);
    let file_count = 0;
    file_list.forEach(arr => file_count += arr.length);
    console.log('\n[ ! ] 사전 데이터 파일: ' + file_count + '개');
    let file_dirs = [];
    file_list.forEach(arr => {
        file_dirs = file_dirs.concat(arr);
    });
    let datas = [];
    file_dirs.forEach(path => {
        let X = JSON.parse(fs.readFileSync(path)).channel.item;
        datas = datas.concat(X);
        total += X.length;
    })
    console.log('[ ! ] 사전 데이터 | ' + total + '개\n');
    datas.forEach(x => {
        let Xword = (x.wordinfo || x.word_info).word.replace(/[^가-힣ㄱ-ㅎ0-9]/g, '');
        let Xmean = (x.senseinfo || x.word_info.pos_info[0].comm_pattern_info[0].sense_info.at(-1)).definition;
        let match = /\d$/.test(Xword);
        let num;
        if (match) {
            num = Xword.match(/\d+$/)[0];
        }
        let prefix = Xword.slice(0, 1);
        let Index = -1;
        if (!word[prefix]) word[prefix] = [];
        if (1 < Number(num) && num) {
            Index = word[prefix].findIndex(V => Xword.startsWith(V.word));
            if (Index == -1) return;
            if (word[prefix][Index].mean.includes(Xmean)) return;
            word[prefix][Index].mean.push(Xmean);
            return;
        } else if (1 == Number(num)) {
            Xword = Xword.replace(num, '');
        }
        Index = word[prefix].findIndex(V => V.word == Xword);
        if (Index != -1) {
            if (word[prefix][Index].mean.includes(Xmean)) return;
            word[prefix][Index].mean.push(Xmean);
            return;
        }
        let suffix = Xword.slice(-1);
        word[prefix].push({
            word: Xword,
            mean: [Xmean],
            prefix: prefix,
            suffix: suffix
        });
    });
    const db_path = `./국립국어원/dicts_${Date.now()}.db`;
    fs.writeFileSync(db_path, '');
    const db = new Database(db_path);
    db.exec(`
            CREATE TABLE IF NOT EXISTS dicts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL,
                mean TEXT NOT NULL,
                prefix TEXT,
                suffix TEXT
            );
        `);
    db.exec(`
            CREATE TABLE IF NOT EXISTS info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                build_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data TEXT NOT NULL,
                creator TEXT NOT NULL
            );
        `);
    console.log(`DB 구축 완료!\n\n`);
    let keys = Object.keys(word)
        .sort((a, b) => a.localeCompare(b))
        .map(prefix => {
            word[prefix] = mergeSort(word[prefix]);
            return prefix
        });
    console.log(`데이터 정렬 완료!\n\n`);
    let startTime = Date.now();
    keys.forEach(prefix => {
        word[prefix].forEach(W => {
            thread++;
            write(`assets | ${thread.toLocaleString()}/${total.toLocaleString()}\r`);
            process.title = `[${Math.floor(thread / total * 10000) / 100}%] assets loading..`;
            input({
                db: db,
                table: 'dicts',
                data: {
                    word: W.word,
                    mean: W.mean.length == 1 ? W.mean[0] : W.mean.map((s, i) => (i + 1) + '. ' + s).join('\n'),
                    prefix: W.prefix,
                    suffix: W.suffix
                }
            });
        })
    });
    write(`assets loaded!${'\u200b'.repeat(35)}`);
    input({
        db: db,
        table: 'info',
        data: {
            build_time: (new Date()).toLocaleString(),
            data: total,
            creator: 'Astraloa'
        }
    });
    console.log('\n\n사전이 완성되었습니다!\n소요 시간|' + formatDuration(startTime));
    process.exit(1);
})();

function input({ db, table, data }) {
    if (!['dicts', 'info'].includes(table)) {
        throw new Error(`Invalid table name: ${table}`);
    }

    const keys = Object.keys(data);
    const values = Object.values(data);

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    const stmt = db.prepare(sql);
    const info = stmt.run(...values);

    return info.lastInsertRowid;
}

function formatDuration(past) {
    const diff = Date.now() - past;
    
    const ms = diff % 1000;
    const totalSeconds = Math.floor(diff / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;

    return `${hours}시간 ${minutes}분 ${seconds}초 ${ms}ms`;
}

function write(text) {
    process.stdout.write(String(text));
}

function mergeSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    const mid = Math.floor(arr.length / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);

    return merge(mergeSort(left), mergeSort(right));
}

function merge(left, right) {
    let result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] < right[rightIndex]) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }

    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

async function delay(ms) {
    return await new Promise(resolve => {
        setTimeout(() => resolve(true), ms);
    });
}