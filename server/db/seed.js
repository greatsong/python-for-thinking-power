import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, execute, queryOne, queryAll, generateId, saveDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROBLEMS_DIR = path.resolve(__dirname, '..', 'data', 'problems');

async function seed(skipInit = false) {
  if (!skipInit) {
    await initDatabase();
    console.log('[Seed] 데이터베이스 초기화 완료');
  }

  // 1. 문제 JSON 파일 로드 및 삽입
  const files = fs.readdirSync(PROBLEMS_DIR).filter(f => f.endsWith('.json'));
  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PROBLEMS_DIR, file), 'utf-8'));
    const existing = queryOne('SELECT id FROM problems WHERE id = ?', [data.id]);
    if (existing) {
      // 기존 문제 업데이트 (JSON 파일 변경 반영)
      execute(
        `UPDATE problems SET title=?, description=?, difficulty=?, category=?, starter_code=?, test_cases_json=?, hints_json=?, expected_approaches_json=?, explanation=?, sort_order=?
         WHERE id=?`,
        [
          data.title,
          data.description,
          data.difficulty,
          data.category,
          data.starter_code || '',
          JSON.stringify(data.test_cases),
          JSON.stringify(data.hints || []),
          JSON.stringify(data.expected_approaches || []),
          data.explanation || null,
          files.indexOf(file),
          data.id,
        ]
      );
      skipped++;
      continue;
    }

    execute(
      `INSERT INTO problems (id, title, description, difficulty, category, starter_code, test_cases_json, hints_json, expected_approaches_json, explanation, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)`,
      [
        data.id,
        data.title,
        data.description,
        data.difficulty,
        data.category,
        data.starter_code || '',
        JSON.stringify(data.test_cases),
        JSON.stringify(data.hints || []),
        JSON.stringify(data.expected_approaches || []),
        data.explanation || null,
        files.indexOf(file),
      ]
    );
    inserted++;
  }

  console.log(`[Seed] 문제 ${inserted}개 삽입, ${skipped}개 업데이트`);

  // 2. 문제집 시드
  seedProblemSets();

  // 3. 데모 데이터 삽입
  await seedDemoData();

  // DB를 디스크에 즉시 저장
  saveDatabase();
  console.log('[Seed] 시딩 완료!');
}

function seedProblemSets() {
  const sets = [
    {
      id: 'set-lv1-beginner',
      title: 'Lv.1 병아리반 🐣',
      description: '파이썬 첫걸음! print, input, 변수, 기초 연산을 배워요.',
      emoji: '🐣',
      color: '#22c55e',
      sort_order: 0,
      problemIds: [
        'beginner-01-hello',
        'beginner-02-namecard',
        'beginner-03-calculator',
        'beginner-04-circle',
        'beginner-05-evenodd',
        'lv1-06-multiprint',
        'lv1-07-fullname',
        'lv1-08-dogAge',
        'lv1-09-candy',
        'lv1-10-clap',
        'lv1-11-emoji',
        'lv1-12-nameTag',
        'lv1-13-promise',
        'lv1-14-levelup',
        'lv1-15-store',
        'lv1-16-strrepeat',
        'lv1-17-fstring',
        'lv1-18-positive',
        'lv1-19-bigger',
        'lv1-21-swap',
        'lv1-22-nameBanner',
        'lv1-23-bus',
        'lv1-24-calories',
        'lv1-25-typing',
        'lv1-26-change',
        'lv1-27-tempDiff',
        'lv1-28-topScore',
        'lv1-29-fizz',
        'lv1-30-grade',
        'lv1-star',
      ],
    },
    {
      id: 'set-lv2-novice',
      title: 'Lv.2 초보자 🛡️',
      description: '조건문, 반복문, 리스트를 자유자재로! if/elif, for문, 문자열 다루기.',
      emoji: '🛡️',
      color: '#3b82f6',
      sort_order: 1,
      problemIds: [
        'lv1-20-leap',
        'beginner-06-grade',
        'beginner-07-stars',
        'beginner-08-timestable',
        'beginner-09-sum',
        'beginner-10-reverse',
        'lv2-01-traffic',
        'lv2-02-season',
        'lv2-03-countdown',
        'lv2-04-nameList',
        'lv2-05-multiplication',
        'lv2-06-sumOdd',
        'lv2-07-multiply',
        'lv2-08-maxMin',
        'lv2-09-staircase',
        'lv2-10-fizzbuzz',
        'lv2-11-palindrome',
        'lv2-12-charCount',
        'lv2-13-upperCount',
        'lv2-14-wordLength',
        'lv2-15-listFilter',
        'lv2-16-average',
        'lv2-17-listSort',
        'lv2-18-dice',
        'lv2-19-ticket',
        'lv2-20-stringReverse',
        'lv2-21-unique',
        'lv2-22-fibonacci',
        'lv2-23-prime',
        'lv2-24-dict',
      ],
    },
    {
      id: 'set-lv3-challenger',
      title: 'Lv.3 도전자 ⚔️',
      description: '문제분해와 추상화! 사고력으로 풀어내는 도전 문제들.',
      emoji: '⚔️',
      color: '#eab308',
      sort_order: 2,
      problemIds: [
        'novice-01-temperature',
        'novice-02-password-checker',
        'novice-03-receipt',
        'demo-01-card-game',
        'demo-02-sugar-delivery',
        'demo-03-shell-game',
        'lv3-01-vending',
        'lv3-02-pattern',
        'lv3-03-caesar',
        'lv3-04-runLength',
        'lv3-05-numberToWord',
        'lv3-06-snake',
        'lv3-07-stock',
        'lv3-08-matrix',
        'lv3-09-anagram',
        'lv3-10-brackets',
        'lv3-11-score',
        'lv3-12-lifeGame',
        'lv3-13-twoSum',
        'lv3-14-calendar',
        'lv3-15-textSplit',
        'lv3-16-pigLatin',
        'lv3-17-bankAccount',
        'lv3-18-textFormat',
        'lv3-19-pyramid',
        'lv3-20-duplicates',
        'lv3-21-elevator',
        'lv3-22-binarySearch',
        'lv3-23-tokenizer',
        'lv3-24-scheduler',
      ],
    },
    {
      id: 'set-lv4-solver',
      title: 'Lv.4 문제해결자',
      description: '중첩 반복, 문자열 처리, 자료구조의 세계로! 진짜 코딩이 시작돼요.',
      emoji: '🧙‍♂️',
      color: '#f97316',
      sort_order: 3,
      problemIds: [
        'lv4-01-recursion',
        'lv4-02-hanoi',
        'lv4-03-sieve',
        'lv4-04-binary',
        'lv4-05-maxSubarray',
        'lv4-06-stack',
        'lv4-07-groupAnagram',
        'lv4-08-roman',
        'lv4-09-queue',
        'lv4-10-permutation',
        'lv4-11-graph',
        'lv4-12-memoize',
        'lv4-13-backtrack',
        'lv4-14-wordSearch',
        'lv4-15-intervals',
        'lv4-16-spiral',
        'lv4-17-palindrome',
        'lv4-18-matrix',
        'lv4-19-twosum',
        'lv4-20-pascal',
        'lv4-21-bracket',
        'lv4-22-decode',
        'lv4-23-schedule',
      ],
    },
    {
      id: 'set-lv5-master',
      title: 'Lv.5 코딩대마왕',
      description: '최고 난이도! 이 문제를 풀면 당신이 진정한 코딩대마왕.',
      emoji: '👑',
      color: '#ef4444',
      sort_order: 4,
      problemIds: [
        'lv5-01-bfs',
        'lv5-02-dfs',
        'lv5-03-dp-lcs',
        'lv5-04-dp-knapsack',
        'lv5-05-dijkstra',
        'lv5-06-trie',
        'lv5-07-topological',
        'lv5-08-kmp',
        'lv5-09-segment',
        'lv5-10-unionfind',
        'lv5-11-dp-lis',
        'lv5-12-backtrack-sudoku',
        'lv5-13-dp-coin',
        'lv5-14-minSpan',
        'lv5-15-editDistance',
        'lv5-16-nqueens',
        'lv5-17-floydWarshall',
        'lv5-18-suffixArray',
        'lv5-19-bipartite',
        'lv5-20-slidingWindow',
        'lv5-21-monotoneStack',
        'lv5-22-treeDp',
        'lv5-23-dp2d',
      ],
    },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const s of sets) {
    const existing = queryOne('SELECT id FROM problem_sets WHERE id = ?', [s.id]);
    if (!existing) {
      execute(
        `INSERT INTO problem_sets (id, title, description, emoji, color, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.id, s.title, s.description, s.emoji, s.color, s.sort_order]
      );
      createdCount++;
    } else {
      // 제목/설명 업데이트 (병아리반 등 이름 변경 반영)
      execute(
        `UPDATE problem_sets SET title = ?, description = ?, emoji = ?, color = ?
         WHERE id = ?`,
        [s.title, s.description, s.emoji, s.color, s.id]
      );
      updatedCount++;
    }

    // 문제 아이템 추가 (이미 있는 건 IGNORE)
    for (let i = 0; i < s.problemIds.length; i++) {
      const prob = queryOne('SELECT id FROM problems WHERE id = ?', [s.problemIds[i]]);
      if (prob) {
        execute(
          `INSERT OR IGNORE INTO problem_set_items (set_id, problem_id, sort_order)
           VALUES (?, ?, ?)`,
          [s.id, s.problemIds[i], i]
        );
      }
    }
  }

  console.log(`[Seed] 문제집 ${createdCount}개 생성, ${updatedCount}개 업데이트`);
}

async function seedDemoData() {
  // 이미 데모 교사가 있으면 스킵
  const existingTeacher = queryOne("SELECT id FROM users WHERE google_id = 'demo-데모교사-teacher'");
  if (existingTeacher) {
    console.log('[Seed] 데모 데이터 이미 존재 — 스킵');
    return;
  }

  console.log('[Seed] 데모 데이터 생성 중...');

  // 데모 교사
  const teacherId = generateId();
  execute(
    `INSERT INTO users (id, google_id, email, name, role) VALUES (?, ?, ?, ?, ?)`,
    [teacherId, 'demo-데모교사-teacher', '데모교사@demo.local', '데모교사', 'teacher']
  );

  // 데모 교실 (고정 참여 코드: 00000)
  const classroomId = generateId();
  execute(
    `INSERT INTO classrooms (id, name, teacher_id, join_code) VALUES (?, ?, ?, ?)`,
    [classroomId, '2학년 3반 정보', teacherId, '00000']
  );

  // 전체 문제 목록 가져오기 (교실에 할당용)
  const allProblems = queryAll('SELECT id, title FROM problems WHERE status = ?', ['approved']);

  // 교실에 모든 문제 할당
  for (let i = 0; i < allProblems.length; i++) {
    execute(
      `INSERT OR IGNORE INTO classroom_problems (classroom_id, problem_id, ai_level, gallery_enabled, is_active, sort_order)
       VALUES (?, ?, 2, 1, 1, ?)`,
      [classroomId, allProblems[i].id, i]
    );
  }

  // 데모 제출용 문제는 ID로 직접 지정 (쿼리 순서에 의존하지 않음)
  const demoProblemIds = ['demo-01-card-game', 'demo-02-sugar-delivery', 'demo-03-shell-game'];
  const demoProblems = demoProblemIds
    .map(id => queryOne('SELECT id, title FROM problems WHERE id = ?', [id]))
    .filter(Boolean);

  // 데모 학생 30명 (다양하고 리얼한 고등학생)
  const demoStudents = [
    { name: '김서준', num: '1' },
    { name: '이지원', num: '2' },
    { name: '박민준', num: '3' },
    { name: '최하은', num: '4' },
    { name: '정도현', num: '5' },
    { name: '강수아', num: '6' },
    { name: '조예준', num: '7' },
    { name: '윤지유', num: '8' },
    { name: '장시우', num: '9' },
    { name: '임예린', num: '10' },
    { name: '한주원', num: '11' },
    { name: '오수빈', num: '12' },
    { name: '서건우', num: '13' },
    { name: '신지아', num: '14' },
    { name: '권재현', num: '15' },
    { name: '황하린', num: '16' },
    { name: '안현우', num: '17' },
    { name: '송채원', num: '18' },
    { name: '류이준', num: '19' },
    { name: '전나연', num: '20' },
    { name: '홍도윤', num: '21' },
    { name: '고서영', num: '22' },
    { name: '문재원', num: '23' },
    { name: '양유진', num: '24' },
    { name: '손민재', num: '25' },
    { name: '배이서', num: '26' },
    { name: '백현준', num: '27' },
    { name: '허소영', num: '28' },
    { name: '유승우', num: '29' },
    { name: '남지현', num: '30' },
  ];

  const studentIds = [];
  for (const s of demoStudents) {
    const id = generateId();
    studentIds.push(id);
    execute(
      `INSERT INTO users (id, google_id, email, name, role) VALUES (?, ?, ?, ?, ?)`,
      [id, `demo-${s.name}-student`, `${s.name}@demo.local`, s.name, 'student']
    );
    execute(
      `INSERT INTO classroom_members (classroom_id, user_id, student_number) VALUES (?, ?, ?)`,
      [classroomId, id, s.num]
    );
  }

  // ── 문제별 코드 샘플 (실제 문제 내용과 정확히 일치, 문제당 8개 변형) ──
  const sampleCodes = [
    // Problem 0: 카드 게임 전략 — 내림차순 정렬 후 앨리스/밥 번갈아 가져가기, 점수 차이 출력
    [
      { code: '# 정렬 + 슬라이싱\ncards.sort(reverse=True)\nalice = sum(cards[::2])\nbob = sum(cards[1::2])\nprint(alice - bob)', passed: 1, tag: '정렬+슬라이싱' },
      { code: '# 정렬 + for문 인덱스\ncards.sort(reverse=True)\nalice = 0\nbob = 0\nfor i in range(n):\n    if i % 2 == 0:\n        alice += cards[i]\n    else:\n        bob += cards[i]\nprint(alice - bob)', passed: 1, tag: '정렬+인덱스' },
      { code: '# 부호 교대 합산\ncards.sort(reverse=True)\nresult = 0\nfor i in range(n):\n    if i % 2 == 0:\n        result += cards[i]\n    else:\n        result -= cards[i]\nprint(result)', passed: 1, tag: '부호교대' },
      { code: '# 시뮬레이션 max 제거\nalice = 0\nbob = 0\ntemp = cards[:]\nfor i in range(n):\n    biggest = max(temp)\n    temp.remove(biggest)\n    if i % 2 == 0:\n        alice += biggest\n    else:\n        bob += biggest\nprint(alice - bob)', passed: 1, tag: 'max제거' },
      { code: '# sorted 한줄\ns = sorted(cards, reverse=True)\nprint(sum(s[::2]) - sum(s[1::2]))', passed: 1, tag: '한줄풀이' },
      { code: '# 오름차순 실수 (오답)\ncards.sort()\nalice = sum(cards[::2])\nbob = sum(cards[1::2])\nprint(alice - bob)', passed: 0, tag: '오름차순실수' },
      { code: '# 전체 합만 출력 (오답)\nprint(sum(cards))', passed: 0, tag: '문제이해오류' },
      { code: '# 작성 중 (미완성)\ncards.sort(reverse=True)\n# 여기서 어떻게 나눠야 하지...\nprint(cards[0])', passed: 0, tag: '미완성' },
    ],
    // Problem 1: 설탕 배달 — 3kg, 5kg 봉지로 최소 개수, 불가능하면 -1
    [
      { code: '# 그리디 (5부터 감소)\nresult = -1\nfor five in range(n // 5, -1, -1):\n    remain = n - 5 * five\n    if remain % 3 == 0:\n        result = five + remain // 3\n        break\nprint(result)', passed: 1, tag: '그리디' },
      { code: '# 수학적 풀이\nfound = False\nfor i in range(n//5, -1, -1):\n    rest = n - 5*i\n    if rest % 3 == 0:\n        print(i + rest//3)\n        found = True\n        break\nif not found:\n    print(-1)', passed: 1, tag: '수학' },
      { code: '# DP (동적 프로그래밍)\ndp = [float("inf")]*(n+1)\ndp[0] = 0\nfor i in range(1, n+1):\n    if i >= 3: dp[i] = min(dp[i], dp[i-3]+1)\n    if i >= 5: dp[i] = min(dp[i], dp[i-5]+1)\nprint(dp[n] if dp[n] != float("inf") else -1)', passed: 1, tag: 'DP' },
      { code: '# 완전탐색 이중 반복\nmin_bags = -1\nfor three in range(n//3+1):\n    for five in range(n//5+1):\n        if 3*three + 5*five == n:\n            total = three + five\n            if min_bags == -1 or total < min_bags:\n                min_bags = total\nprint(min_bags)', passed: 1, tag: '완전탐색' },
      { code: '# while 감소\nremain = n\nbags = 0\nwhile remain > 0:\n    if remain % 5 == 0:\n        bags += remain // 5\n        remain = 0\n    elif remain >= 3:\n        remain -= 3\n        bags += 1\n    else:\n        bags = -1\n        break\nprint(bags)', passed: 1, tag: 'while감소' },
      { code: '# 단순 나눗셈 (오답: n=11일 때 2 출력)\nbags = n // 5\nrest = n % 5\nprint(bags + rest // 3)', passed: 0, tag: '단순나눗셈오답' },
      { code: '# -1 미처리 재귀 (오답: n=4일 때 999 출력)\ndef f(n):\n    if n==0: return 0\n    if n<0: return 999\n    return min(f(n-5),f(n-3))+1\nprint(f(n))', passed: 0, tag: '재귀미완성' },
      { code: '# 3kg만 사용 (오답: 5kg 미고려)\nif n % 3 == 0:\n    print(n // 3)\nelse:\n    print(-1)', passed: 0, tag: '3kg만사용' },
    ],
    // Problem 2: 조개 게임 — 시작 위치 1,2,3 모두 시뮬레이션하여 최대 정답 횟수 출력
    [
      { code: '# 3가지 시뮬레이션\nbest = 0\nfor start in range(1, 4):\n    ball = start\n    score = 0\n    for a, b, g in swaps:\n        if ball == a:\n            ball = b\n        elif ball == b:\n            ball = a\n        if ball == g:\n            score += 1\n    best = max(best, score)\nprint(best)', passed: 1, tag: '완전탐색' },
      { code: '# 딕셔너리 swap\nbest = 0\nfor start in range(1, 4):\n    cups = {1: False, 2: False, 3: False}\n    cups[start] = True\n    score = 0\n    for a, b, g in swaps:\n        cups[a], cups[b] = cups[b], cups[a]\n        if cups[g]:\n            score += 1\n    best = max(best, score)\nprint(best)', passed: 1, tag: '딕셔너리swap' },
      { code: '# 함수 분리\ndef simulate(swaps, start):\n    ball = start\n    score = 0\n    for a, b, g in swaps:\n        if ball == a: ball = b\n        elif ball == b: ball = a\n        if ball == g: score += 1\n    return score\nprint(max(simulate(swaps, s) for s in range(1, 4)))', passed: 1, tag: '함수분리' },
      { code: '# 삼항연산자 위치 추적\nbest = 0\nfor start in range(1, 4):\n    pos = start\n    cnt = 0\n    for a, b, g in swaps:\n        pos = b if pos == a else (a if pos == b else pos)\n        cnt += (pos == g)\n    best = max(best, cnt)\nprint(best)', passed: 1, tag: '삼항연산자' },
      { code: '# 리스트 결과 취합\nresults = []\nfor start in range(1, 4):\n    ball = start\n    cnt = 0\n    for a, b, g in swaps:\n        if ball == a: ball = b\n        elif ball == b: ball = a\n        cnt += ball == g\n    results.append(cnt)\nprint(max(results))', passed: 1, tag: '리스트취합' },
      { code: '# 시작위치 1만 시도 (오답: 다른 시작위치가 더 좋을 수 있음)\nball = 1\nscore = 0\nfor a, b, g in swaps:\n    if ball == a: ball = b\n    elif ball == b: ball = a\n    if ball == g: score += 1\nprint(score)', passed: 0, tag: '시작1만시도' },
      { code: '# 교환 전 비교 (오답: 교환 후에 비교해야 함)\nbest = 0\nfor start in range(1, 4):\n    ball = start\n    score = 0\n    for a, b, g in swaps:\n        if ball == g: score += 1\n        if ball == a: ball = b\n        elif ball == b: ball = a\n    best = max(best, score)\nprint(best)', passed: 0, tag: '교환전비교' },
      { code: '# if-if 버그 (오답: elif 대신 if 사용하여 이중 교환)\nbest = 0\nfor start in range(1, 4):\n    ball = start\n    score = 0\n    for a, b, g in swaps:\n        if ball == a: ball = b\n        if ball == b: ball = a\n        if ball == g: score += 1\n    best = max(best, score)\nprint(best)', passed: 0, tag: 'if중복버그' },
    ],
  ];

  // 문제별 첫 시도 스냅샷 풀 (다양한 시작 패턴)
  const firstAttempts = [
    // 카드 게임 — 다양한 첫 시도
    [
      'cards = list(map(int, input().split()))\nprint(cards)',
      '# 정렬해볼까?\ncards.sort()\nprint(cards)',
      'total = sum(cards)\nprint(total)',
      '# 큰 수부터 정렬\ncards.sort(reverse=True)\nprint(cards[0])',
      '# 앨리스가 먼저니까...\nprint(max(cards))',
      '# 어떻게 나누지?\nfor i in range(n):\n    print(cards[i])',
    ],
    // 설탕 배달 — 다양한 첫 시도
    [
      'print(n // 5)',
      '# 5kg 먼저?\nbags = n // 5\nprint(bags)',
      '# 3으로 나눠볼까\nprint(n // 3)',
      '# 5와 3으로 나누기\nprint(n % 5, n % 3)',
      'if n % 5 == 0:\n    print(n // 5)',
      '# 반복문으로 해볼까\nfor i in range(n):\n    pass',
    ],
    // 조개 게임 — 다양한 첫 시도
    [
      'pos = 1\nprint(pos)',
      '# 교환을 따라가보자\nfor a, b, g in swaps:\n    print(a, b, g)',
      '# 시작 위치가 1이라면?\nball = 1',
      '# 세 가지 경우를 다 해봐야 하나?\nfor start in [1, 2, 3]:\n    print(start)',
      'print(len(swaps))',
      '# 교환이 뭐지\na, b, g = swaps[0]\nprint(a, b)',
    ],
  ];

  const now = new Date();
  for (let pi = 0; pi < demoProblems.length; pi++) {
    const problemId = demoProblems[pi].id;
    const codes = sampleCodes[pi];
    const firsts = firstAttempts[pi];

    for (let si = 0; si < studentIds.length; si++) {
      const studentId = studentIds[si];
      const code = codes[si % codes.length]; // 30명을 8개 코드 변형으로 순환
      const subTime = new Date(now.getTime() - (90 - si * 2 - pi * 3) * 60000);

      execute(
        `INSERT INTO submissions (id, user_id, problem_id, classroom_id, code, passed, approach_tag, is_final, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [generateId(), studentId, problemId, classroomId, code.code, code.passed ? 1 : 0, code.tag, subTime.toISOString()]
      );

      // 코드 스냅샷 (코드 여정용) — 문제별 다양한 첫 시도 패턴
      for (let snap = 0; snap < 2; snap++) {
        const snapTime = new Date(subTime.getTime() - (8 - snap * 4) * 60000);
        const snapCode = snap === 0
          ? firsts[si % firsts.length]
          : code.code.split('\n').slice(0, Math.min(3, code.code.split('\n').length)).join('\n') + '\n# 작성 중...';
        execute(
          `INSERT INTO code_snapshots (id, user_id, problem_id, classroom_id, code, snapshot_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [generateId(), studentId, problemId, classroomId, snapCode, snapTime.toISOString()]
        );
      }
    }
  }

  // 데모 AI 대화 (실제 문제 내용과 정확히 일치, 6개 대화)
  const aiChats = [
    {
      student: 0, problem: 0,
      messages: [
        { role: 'user', content: '이 문제 어떻게 시작해야 해요?' },
        { role: 'assistant', content: '좋은 질문이야! 앨리스와 밥이 둘 다 최선의 전략을 쓴다면, 매번 남은 카드 중 가장 큰 걸 가져갈 거야. 그럼 카드를 어떤 순서로 정리하면 좋을까?' },
        { role: 'user', content: '큰 수부터 정렬하면 되나요?' },
        { role: 'assistant', content: '맞아! 내림차순으로 정렬한 다음, 앨리스는 0, 2, 4번째... 밥은 1, 3, 5번째 카드를 가져가면 돼. 파이썬 슬라이싱 [::2]를 써보면 어떨까?' },
      ],
      summary: '카드 게임 전략에서 내림차순 정렬 접근법 유도. 슬라이싱 힌트 제공.'
    },
    {
      student: 14, problem: 1,
      messages: [
        { role: 'user', content: '설탕 배달이 너무 어려워요ㅠ' },
        { role: 'assistant', content: '괜찮아! 작은 수로 생각해보자 — 설탕 8kg을 3kg, 5kg 봉지로 나눈다면?' },
        { role: 'user', content: '5+3 = 8이니까 봉지 2개요!' },
        { role: 'assistant', content: '정확해! 봉지 수를 줄이려면 5kg을 최대한 많이 쓰는 게 좋아. 5kg 개수를 최대에서 하나씩 줄여가면서 나머지가 3으로 나눠지는지 확인해봐!' },
      ],
      summary: '설탕 배달 문제에서 그리디 접근법 유도. 5kg 우선 사용 후 3kg 확인 힌트 제공.'
    },
    {
      student: 7, problem: 2,
      messages: [
        { role: 'user', content: '구슬이 어디에서 시작하는지 모르면 어떡해요?' },
        { role: 'assistant', content: '핵심을 잘 짚었어! 시작 위치를 모르니까, 1, 2, 3 세 가지 경우를 전부 시뮬레이션해보는 거야. 각각의 정답 횟수를 구한 다음 최대값을 출력하면 돼!' },
        { role: 'user', content: '교환할 때 구슬 위치는 어떻게 바꿔요?' },
        { role: 'assistant', content: '구슬이 a 위치에 있는데 a와 b가 교환되면, 구슬은 b로 이동해. 구슬이 b에 있으면 a로 가고. 둘 다 아니면 그대로야! if-elif로 표현해봐.' },
      ],
      summary: '조개 게임에서 3가지 시작 위치 완전탐색 유도. 교환 시 위치 추적 방법 설명.'
    },
    {
      student: 22, problem: 0,
      messages: [
        { role: 'user', content: 'cards[::2]가 뭔가요?' },
        { role: 'assistant', content: '파이썬 슬라이싱이야! [::2]는 처음부터 2칸씩 건너뛰면서 선택하는 거야. 예를 들어 [8,5,3,1][::2]는 [8,3]이 돼!' },
        { role: 'user', content: '오 그러면 앨리스 카드를 골라낼 수 있겠네요!' },
        { role: 'assistant', content: '맞아! 내림차순 정렬 후 cards[::2]가 앨리스 카드, cards[1::2]가 밥 카드야. sum()으로 각각 합산해서 빼면 답이 나와!' },
      ],
      summary: '슬라이싱 문법 질문에서 카드 게임 풀이까지 연결. [::2] 활용법 이해 완료.'
    },
    {
      student: 5, problem: 1,
      messages: [
        { role: 'user', content: 'DP로 풀 수 있다고 들었는데 어떻게 해요?' },
        { role: 'assistant', content: 'dp[i]를 "i kg을 만드는 최소 봉지 수"로 정의해봐! dp[0] = 0이고, dp[i]는 dp[i-3]+1과 dp[i-5]+1 중 작은 값이야.' },
        { role: 'user', content: '불가능한 경우는 어떻게 처리해요?' },
        { role: 'assistant', content: '초기값을 아주 큰 수(float("inf"))로 놓으면, 만들 수 없는 무게는 inf가 남아. 마지막에 dp[n]이 inf면 -1을 출력하면 돼!' },
      ],
      summary: 'DP 접근법 질문. dp 배열 정의와 불가능 경우 처리까지 유도 완료.'
    },
    {
      student: 18, problem: 2,
      messages: [
        { role: 'user', content: 'elif를 안 쓰고 if만 두 번 쓰면 안 되나요?' },
        { role: 'assistant', content: '좋은 질문이야! if ball==a: ball=b 다음에 if ball==b: ball=a를 쓰면, 방금 b로 바꾼 값이 다시 a로 돌아가는 버그가 생겨! 반드시 elif를 써야 해.' },
      ],
      summary: 'if-elif 차이점 질문. 교환 시 elif 필수 사용 이유 설명.'
    },
  ];

  for (const chat of aiChats) {
    if (!demoProblems[chat.problem]) continue;
    const convTime = new Date(now.getTime() - (30 - chat.student) * 60000);
    execute(
      `INSERT INTO ai_conversations (id, user_id, problem_id, classroom_id, messages_json, summary, message_count, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        studentIds[chat.student],
        demoProblems[chat.problem].id,
        classroomId,
        JSON.stringify(chat.messages.map(m => ({ ...m, timestamp: convTime.toISOString() }))),
        chat.summary,
        chat.messages.length,
        convTime.toISOString(),
      ]
    );
  }

  console.log('[Seed] 데모 데이터 생성 완료:');
  console.log('  교사: 데모교사 / 교실: 2학년 3반 정보 / 참여 코드: 00000');
  console.log(`  학생: ${demoStudents.map(s => s.name).join(', ')}`);
}

// 직접 실행 시 (node db/seed.js)
const isMain = process.argv[1]?.endsWith('seed.js');
if (isMain) {
  seed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('[Seed] 오류:', err);
    process.exit(1);
  });
}

export { seed, seedProblemSets };
