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

  console.log(`[Seed] 문제 ${inserted}개 삽입, ${skipped}개 스킵`);

  // 2. 문제집 시드
  seedProblemSets();

  // 3. 데모 데이터 삽입
  await seedDemoData();

  // DB를 디스크에 즉시 저장 후 종료
  saveDatabase();
  console.log('[Seed] 시딩 완료!');
  process.exit(0);
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

  // 문제 목록 가져오기
  const problems = queryAll('SELECT id, title FROM problems WHERE status = ?', ['approved']);

  // 교실에 문제 할당
  for (let i = 0; i < problems.length; i++) {
    execute(
      `INSERT OR IGNORE INTO classroom_problems (classroom_id, problem_id, ai_level, gallery_enabled, is_active, sort_order)
       VALUES (?, ?, 2, 1, 1, ?)`,
      [classroomId, problems[i].id, i]
    );
  }

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

  // 데모 제출 데이터
  const sampleCodes = [
    [
      { code: '# for + if문 풀이\ntotal = 0\nfor card in cards:\n    if card % 2 == 0:\n        total += card\nprint(total)', passed: 1, tag: 'for+if' },
      { code: '# 리스트 컴프리헨션\nresult = sum([c for c in cards if c % 2 == 0])\nprint(result)', passed: 1, tag: '리스트컴프리헨션' },
      { code: '# filter + sum\nprint(sum(filter(lambda x: x%2==0, cards)))', passed: 1, tag: 'filter+lambda' },
      { code: '# while문\ni = 0\ntotal = 0\nwhile i < len(cards):\n    if cards[i] % 2 == 0:\n        total += cards[i]\n    i += 1\nprint(total)', passed: 1, tag: 'while문' },
      { code: 'total = 0\nfor c in cards:\n    total += c\nprint(total)', passed: 0, tag: 'for문-오답' },
    ],
    [
      { code: '# 그리디\nremain = n\nbags = 0\nwhile remain > 0:\n    if remain % 5 == 0:\n        bags += remain // 5\n        remain = 0\n    else:\n        remain -= 3\n        bags += 1\nprint(bags)', passed: 1, tag: '그리디' },
      { code: '# 수학\nfor i in range(n//5, -1, -1):\n    rest = n - 5*i\n    if rest % 3 == 0:\n        print(i + rest//3)\n        break', passed: 1, tag: '수학' },
      { code: '# DP\ndp = [float("inf")]*(n+1)\ndp[0] = 0\nfor i in range(1,n+1):\n    if i>=3: dp[i]=min(dp[i],dp[i-3]+1)\n    if i>=5: dp[i]=min(dp[i],dp[i-5]+1)\nprint(dp[n])', passed: 1, tag: 'DP' },
      { code: 'bags = n // 5\nrest = n % 5\nprint(bags + rest // 3)', passed: 0, tag: '단순나눗셈-오답' },
      { code: '# 재귀\ndef f(n):\n    if n==0: return 0\n    if n<0: return 999\n    return min(f(n-5),f(n-3))+1\nprint(f(n))', passed: 1, tag: '재귀' },
    ],
    [
      { code: '# 시뮬레이션\npos = 0\nfor a, b in moves:\n    if pos == a: pos = b\n    elif pos == b: pos = a\nprint(pos)', passed: 1, tag: '위치추적' },
      { code: '# 리스트 swap\nshells = [1,0,0]\nfor a,b in moves:\n    shells[a],shells[b]=shells[b],shells[a]\nprint(shells.index(1))', passed: 1, tag: '리스트swap' },
      { code: 'pos = 0\nfor m in moves:\n    pos = m[1] if pos==m[0] else m[0] if pos==m[1] else pos\nprint(pos)', passed: 1, tag: '한줄if' },
      { code: '# 아직 풀이 중...\nprint(0)', passed: 0, tag: '미완성' },
      { code: 'result = 0\nfor a, b in moves:\n    if result == a: result = b\n    elif result == b: result = a\nprint(result)', passed: 1, tag: 'if-elif' },
    ],
  ];

  const now = new Date();
  for (let pi = 0; pi < Math.min(problems.length, sampleCodes.length); pi++) {
    const problemId = problems[pi].id;
    const codes = sampleCodes[pi];

    for (let si = 0; si < studentIds.length; si++) {
      const studentId = studentIds[si];
      const code = codes[si % codes.length]; // 30명을 코드 풀로 순환
      const subTime = new Date(now.getTime() - (90 - si * 2 - pi * 3) * 60000);

      execute(
        `INSERT INTO submissions (id, user_id, problem_id, classroom_id, code, passed, approach_tag, is_final, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [generateId(), studentId, problemId, classroomId, code.code, code.passed ? 1 : 0, code.tag, subTime.toISOString()]
      );

      // 코드 스냅샷 (코드 여정용)
      for (let snap = 0; snap < 2; snap++) {
        const snapTime = new Date(subTime.getTime() - (8 - snap * 4) * 60000);
        const snapCode = snap === 0
          ? `# ${demoStudents[si].name}의 첫 시도\nprint("아직 모르겠다")`
          : code.code.split('\n').slice(0, 2).join('\n') + '\n# 작성 중...';
        execute(
          `INSERT INTO code_snapshots (id, user_id, problem_id, classroom_id, code, snapshot_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [generateId(), studentId, problemId, classroomId, snapCode, snapTime.toISOString()]
        );
      }
    }
  }

  // 데모 AI 대화
  const aiChats = [
    {
      student: 0, problem: 0,
      messages: [
        { role: 'user', content: '이 문제 어떻게 시작해야 해요?' },
        { role: 'assistant', content: '좋은 질문이야! 카드를 하나씩 살펴보면서 조건에 맞는 걸 골라내는 건 어떨까? for문으로 시작해봐!' },
        { role: 'user', content: 'for문 쓰면 되나요?' },
        { role: 'assistant', content: '맞아! for문으로 카드를 하나씩 보면서, 짝수인지 확인하고 더하면 돼. 짝수인지 어떻게 확인할 수 있을까?' },
      ],
      summary: 'for문과 조건문 기초 질문. 짝수 판별 방법까지 유도 완료.'
    },
    {
      student: 14, problem: 1,
      messages: [
        { role: 'user', content: '설탕 배달이 너무 어려워요ㅠ' },
        { role: 'assistant', content: '괜찮아! 작은 수로 생각해보자 — 설탕 8kg을 3kg, 5kg 봉지로 나눈다면?' },
        { role: 'user', content: '5+3 = 8이니까 봉지 2개요!' },
        { role: 'assistant', content: '정확해! 5kg을 최대한 많이 쓰는 게 힌트야!' },
      ],
      summary: '설탕 배달 문제에서 그리디 접근법 유도. 5kg 우선 사용 힌트 제공.'
    },
    {
      student: 7, problem: 2,
      messages: [
        { role: 'user', content: '조개가 어디로 가는지 어떻게 추적해요?' },
        { role: 'assistant', content: '조개 위치를 변수 하나로 기억하면 돼! 컵이 바뀔 때마다 "내 조개가 거기에 있나?" 확인하면 끝!' },
      ],
      summary: '위치 추적 변수 사용법 질문. 단일 변수 추적 방법 유도.'
    },
    {
      student: 22, problem: 0,
      messages: [
        { role: 'user', content: '리스트 컴프리헨션이 뭔가요?' },
        { role: 'assistant', content: '리스트 컴프리헨션은 반복문을 한 줄로 압축하는 파이썬의 강력한 기능이야! [x for x in 리스트 if 조건] 형태야.' },
        { role: 'user', content: '오 신기하다! 그럼 짝수만 골라내는 건요?' },
        { role: 'assistant', content: '[c for c in cards if c % 2 == 0] — 이렇게! 2로 나눈 나머지가 0이면 짝수지.' },
      ],
      summary: '리스트 컴프리헨션 개념 질문. 짝수 필터링 예시로 이해 완료.'
    },
  ];

  for (const chat of aiChats) {
    if (!problems[chat.problem]) continue;
    const convTime = new Date(now.getTime() - 20 * 60000);
    execute(
      `INSERT INTO ai_conversations (id, user_id, problem_id, classroom_id, messages_json, summary, message_count, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        studentIds[chat.student],
        problems[chat.problem].id,
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
  seed().catch(err => {
    console.error('[Seed] 오류:', err);
    process.exit(1);
  });
}

export { seed, seedProblemSets };
