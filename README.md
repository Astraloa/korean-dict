# korean-dict
> [국립국어원](https://www.korean.go.kr/) 사전 파서
>
> # Support Dicts
> [표준국어대사전](https://stdict.korean.go.kr/)
>
> [우리말샘](https://opendict.korean.go.kr/)
>
> # How to use?
> 1. 사용할 사전들을 `전체 내려받기 > json 으로 내려받기` 로 내려받습니다.
> 2. 다운 받은 사전들의 압축을 해제합니다.
> 3. 해당 사전의 형식을 `${dict_name}_json/${file_name}.json` 꼴이 되게 정렬합니다.
> 4. 형식의 예시는 다음과 같습니다. `표준국어대사전_json/1415050_5000.json`, `우리말샘_json/1413531_50000.json`
> 5. 그 다음 `국립국어원.zip` 을 내려받은 후에 압축을 해제합니다.
> 6. 국립국어원 폴더 내의 `index.js` 파일이 있는 위치에 해당 사전 데이터의 폴더들을 옮깁니다.
> 7. `node 국립국어원` 혹은 `node 국립국어원/index.js` 로 파일을 실행합니다.
> 8. 실행이 끝난 후 `index.js` 파일의 위치에 `dicts_${Date.now}.db` 가 있으면 성공입니다.
>
> # Required node packages
> 1. `node:fs` (default)
> 2. `better-sqlite3@lastest` (npm)
  ```bash
npm i better-sqlite3@lastest
  ```
