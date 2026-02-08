// refactored - v1.4
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

const word = Object.create(null);
let total = 0;
let thread = 0;
let lastRender = 0;

(async function () {
    await delay(1500);
    process.title = 'Dictionary [Utils]';

    const folders = fs.readdirSync('./국립국어원').filter(p => !p.includes('.'));
    console.log(`Found Folders: ${folders.length}\n`);

    await delay(1500);

    const file_dirs = [];

    for (const name of folders) {
        if (!name.endsWith('_json')) continue;

        if (name.includes('근현대사전')) {
            console.log('[ ? ] 해당 서비스는 `근현대사전` 을 지원하지 않습니다.');
            continue;
        }
        if (name.includes('한국어기초사전')) {
            console.log('[ ? ] 해당 서비스는 `한국어기초사전` 을 지원하지 않습니다.');
            continue;
        }

        const dictionary = name.slice(0, -5);
        console.log('[ ! ] 사전 발견 | ' + dictionary);

        const files = fs.readdirSync(`./국립국어원/${dictionary}_json`)
            .filter(f => f.endsWith('.json'))
            .map(f => `./국립국어원/${dictionary}_json/${f}`);

        file_dirs.push(...files);
    }

    if (file_dirs.length === 0) {
        console.log('[ # ] 발견된 사전이 없어 서비스가 종료됩니다..');
        process.exit(0);
    }

    console.log('\n[ ! ] 사전 데이터 파일: ' + file_dirs.length + '개');

    for (const path of file_dirs) {
        const items = JSON.parse(fs.readFileSync(path)).channel.item;
        total += items.length;

        for (const x of items) {
            let Xword = (x.wordinfo || x.word_info).word.replace(/[^가-힣ㄱ-ㅎ0-9]/g, '');
            const Xmean = (x.senseinfo || x.word_info.pos_info[0].comm_pattern_info[0].sense_info.at(-1)).definition;
            const Xsort = (x.senseinfo || x.word_info.pos_info[0]).pos;
            const Xtype = x.wordinfo
                ? x.wordinfo.word_type
                : x.word_info.pos_info[0].comm_pattern_info[0].sense_info.at(-1).type;

            let num = null;
            if (/\d$/.test(Xword)) num = Xword.match(/\d+$/)[0];

            const prefix = Xword.slice(0, 1);
            if (!word[prefix]) word[prefix] = new Map();
            const map = word[prefix];

            if (num && Number(num) > 1) {
                for (const v of map.values()) {
                    if (Xword.startsWith(v.word)) {
                        if (!v.mean.includes(Xmean)) v.mean.push(Xmean);
                        break;
                    }
                }
                continue;
            }

            if (num && Number(num) === 1) {
                Xword = Xword.replace(num, '');
            }

            if (map.has(Xword)) {
                const obj = map.get(Xword);
                if (!obj.mean.includes(Xmean)) obj.mean.push(Xmean);
                continue;
            }

            map.set(Xword, {
                word: Xword,
                mean: [Xmean],
                sort: Xsort,
                type: Xtype,
                prefix,
                suffix: Xword.slice(-1)
            });
        }
    }

    console.log('[ ! ] 사전 데이터 | ' + total + '개\n');

    const db_path = `./국립국어원/dicts_${Date.now()}.db`;
    fs.writeFileSync(db_path, '');

    const db = new Database(db_path);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    db.exec(`
        CREATE TABLE IF NOT EXISTS dicts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            mean TEXT NOT NULL,
            sort TEXT NOT NULL,
            type TEXT NOT NULL,
            prefix TEXT,
            suffix TEXT
        );
        CREATE TABLE IF NOT EXISTS info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            build_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data TEXT NOT NULL,
            creator TEXT NOT NULL
        );
    `);

    console.log('DB 구축 완료!\n');

    const insertDict = db.prepare(`
        INSERT INTO dicts (word, mean, sort, type, prefix, suffix)
        VALUES (@word, @mean, @sort, @type, @prefix, @suffix)
    `);

    const insertMany = db.transaction(rows => {
        for (const row of rows) insertDict.run(row);
    });

    const rows = [];
    const keys = Object.keys(word).sort((a, b) => a.localeCompare(b));
    const startTime = Date.now();

    for (const prefix of keys) {
        const arr = Array.from(word[prefix].values());
        arr.sort((a, b) => a.word.localeCompare(b.word));

        for (const W of arr) {
            thread++;
            renderProgress(thread, total);

            rows.push({
                word: W.word,
                mean: W.mean.length === 1
                    ? W.mean[0]
                    : W.mean.map((s, i) => `${i + 1}. ${s}`).join('\n'),
                sort: W.sort || '없음',
                type: W.type || '없음',
                prefix: W.prefix,
                suffix: W.suffix
            });
        }
    }

    insertMany(rows);

    db.prepare(`
        INSERT INTO info (build_time, data, creator)
        VALUES (?, ?, ?)
    `).run(new Date().toLocaleString(), total, 'Astraloa');

    process.stdout.write(`assets loaded! ${thread.toLocaleString()}/${total.toLocaleString()}\n`);
    console.log(`\n사전이 완성되었습니다!\n소요 시간 | ${formatDuration(startTime)}`);
    process.exit(0);
})();

function renderProgress(current, total) {
    const now = Date.now();
    if (now - lastRender < 200) return;
    lastRender = now;

    const percent = Math.floor(current / total * 10000) / 100;
    process.stdout.write(
        `assets | ${current.toLocaleString()}/${total.toLocaleString()} (${percent}%)\r`
    );
    process.title = `[${percent}%] assets loading..`;
}

function formatDuration(past) {
    const diff = Date.now() - past;
    const ms = diff % 1000;
    const s = Math.floor(diff / 1000) % 60;
    const m = Math.floor(diff / 60000) % 60;
    const h = Math.floor(diff / 3600000);
    return `${h}시간 ${m}분 ${s}초 ${ms}ms`;
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}
