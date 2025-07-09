const SQL3 = require('better-sqlite3');
const db = new SQL3('./dicts_1739602343788.db');

let rows = end_search('로켓');

let results = [];
rows.forEach(data => {
    results.push(pretty_data(data));
});
console.log(results.join('\n\n'));

function pretty_data(res) {
    if ('undefined' === typeof res) return '단어를 찾을 수 없습니다.';
    return `${res.word} [${res.sort}] - ${res.type}\n${res.mean.split('\n').map(x => '  ' + x).join('\n')}`
}

function exact_search(query) {
    const stmt = db.prepare('SELECT * FROM dicts WHERE word = ? LIMIT 1');
    return stmt.all(query);
}

function likely_search(query) {
    const stmt = db.prepare('SELECT * FROM dicts WHERE word LIKE ?');
    return stmt.all(`%${query}%`);
}

function end_search(query) {
    const stmt = db.prepare('SELECT * FROM dicts WHERE word LIKE ?');
    return stmt.all(`%${query}`);
}

function start_search(query) {
    const stmt = db.prepare('SELECT * FROM dicts WHERE word LIKE ?');
    return stmt.all(`${query}%`);
}
