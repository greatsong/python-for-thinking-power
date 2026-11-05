// 교실 권한 회귀 시험. 서버를 JWT_SECRET=test-secret PORT=4997 으로 띄운 뒤
//   node scripts/security-test.mjs   (데모 로그인을 쓰므로 프로덕션에서는 실행되지 않는다)
import { createRequire } from 'module';
const require = createRequire(new URL('../server/package.json', import.meta.url));
const jwt = require('jsonwebtoken');

const BASE = process.env.TEST_HOST || 'http://localhost:4997/api';
const SECRET = process.env.JWT_SECRET || 'test-secret';
let failed = 0;
const check = (name, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) failed += 1; };
async function api(method, path, token, body) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
const demo = async (name) => (await api('POST', '/auth/demo', null, { name })).data;
const asTeacher = (user) => jwt.sign({ id: user.user.id, role: 'teacher', email: user.user.email }, SECRET, { expiresIn: '1h' });

const stamp = Date.now().toString(36);
const ownerUser = await demo(`교사A${stamp}`);
const otherUser = await demo(`교사B${stamp}`);
const student = await demo(`학생${stamp}`);
const outsider = await demo(`외부${stamp}`);
const owner = asTeacher(ownerUser);
const other = asTeacher(otherUser);

const classroom = (await api('POST', '/classrooms', owner, { name: `시험반${stamp}` })).data;
check('교실 생성', Boolean(classroom.id));
check('참여 코드 다섯 자리', /^\d{5}$/.test(classroom.join_code));
check('학생 교실 참여', (await api('POST', '/classrooms/join', student.token, { joinCode: classroom.join_code, studentNumber: '10101' })).status === 200);

const problems = (await api('GET', '/problems')).data;
const problemId = problems[0].id;
const submitted = await api('POST', '/submissions', student.token, { problemId, classroomId: classroom.id, code: 'print("시험")', output: '시험', passed: true, isFinal: true });
check('제출 저장', submitted.status < 300);

const q = `/submissions/problem/${problemId}?classroomId=${classroom.id}`;
check('외부 학생은 이름·코드 목록을 못 본다', (await api('GET', q, outsider.token)).status === 403);
check('같은 교실 학생도 이름·코드 목록을 못 본다', (await api('GET', q, student.token)).status === 403);
check('다른 교사는 못 본다', (await api('GET', q, other)).status === 403);
check('교실 지정 없이는 못 본다', (await api('GET', `/submissions/problem/${problemId}`, owner)).status === 403);
check('담당 교사는 본다', (await api('GET', q, owner)).status === 200);

check('다른 교사는 소감을 못 본다', (await api('GET', `/submissions/reflections/${classroom.id}`, other)).status === 403);
check('담당 교사는 소감을 본다', (await api('GET', `/submissions/reflections/${classroom.id}`, owner)).status === 200);

const g = `/gallery/${problemId}?classroomId=${classroom.id}`;
check('외부 학생은 갤러리를 못 본다', (await api('GET', g, outsider.token)).status === 403);
check('교실 없이 전체 갤러리 불가', (await api('GET', `/gallery/${problemId}`, outsider.token)).status === 403);
check('같은 교실 학생은 갤러리를 본다', (await api('GET', g, student.token)).status === 200);
check('담당 교사는 갤러리를 본다', (await api('GET', g, owner)).status === 200);

const m = `/classrooms/${classroom.id}/members/${student.user.id}`;
check('다른 교사는 학번을 못 고친다', (await api('PUT', m, other, { studentNumber: '99999' })).status === 403);
check('본인은 학번을 고친다', (await api('PUT', m, student.token, { studentNumber: '10102' })).status === 200);
check('담당 교사는 학번을 고친다', (await api('PUT', m, owner, { studentNumber: '10103' })).status === 200);

let status = 0;
for (let i = 0; i < 21; i += 1) status = (await api('POST', '/classrooms/join', outsider.token, { joinCode: 'x' + i })).status;
check('참여 코드 추측 제한', status === 429);
check('다른 학생의 정상 입장은 막히지 않는다', (await api('POST', '/classrooms/join', student.token, { joinCode: classroom.join_code })).status === 200);

console.log(failed ? `실패 ${failed}건` : '모두 통과');
process.exit(failed ? 1 : 0);
