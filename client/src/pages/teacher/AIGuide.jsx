import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Key, Shield, Users, AlertTriangle, CheckCircle, ExternalLink,
  ChevronDown, ChevronRight, ArrowRight, Zap, DollarSign, Lock, HelpCircle,
  LayoutDashboard, Wrench, ListChecks, MessageSquare, Settings, Hash,
  Code, Bot, Eye, BarChart3, Sparkles, UserPlus, Play, Monitor, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore.js';

function Section({ icon: Icon, title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-800 flex-1">{title}</h2>
        {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{badge}</span>}
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-4 mt-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="text-sm text-slate-600 space-y-2">{children}</div>
      </div>
    </div>
  );
}

function InfoBox({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };
  const icons = { info: HelpCircle, success: CheckCircle, warning: AlertTriangle };
  const IconComp = icons[type];
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm mt-3 ${styles[type]}`}>
      <IconComp size={16} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function NavItem({ icon: Icon, label, desc }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-600" />
      </div>
      <div>
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function AIGuide() {
  const navigate = useNavigate();
  const { loginDemo, loading } = useAuthStore();
  const [demoName, setDemoName] = useState('');

  const handleDemo = async () => {
    if (!demoName.trim()) { toast.error('이름을 입력해 주세요'); return; }
    try {
      const user = await loginDemo(demoName.trim(), 'student');
      toast.success(`${user.name}님, 체험 모드로 입장합니다!`);
      navigate('/join');
    } catch (err) { toast.error(err.message || '데모 로그인에 실패했습니다'); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
          <BookOpen size={16} />
          <span>교사 매뉴얼</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">사고력을 위한 파이썬 — 사용 안내</h1>
        <p className="text-slate-500">
          처음 방문하신 선생님을 위한 전체 서비스 매뉴얼입니다.
          위에서부터 순서대로 따라하시면 됩니다.
        </p>
      </div>

      {/* 빠른 시작 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
        <h2 className="text-lg font-bold mb-3">3단계로 시작하기</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/15 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold mb-1">1</div>
            <p className="text-xs">교실 만들기</p>
            <p className="text-[10px] text-blue-200 mt-0.5">참여 코드 생성</p>
          </div>
          <div className="bg-white/15 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold mb-1">2</div>
            <p className="text-xs">문제 배정</p>
            <p className="text-[10px] text-blue-200 mt-0.5">레벨별 문제 선택</p>
          </div>
          <div className="bg-white/15 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold mb-1">3</div>
            <p className="text-xs">AI 키 설정</p>
            <p className="text-[10px] text-blue-200 mt-0.5">선택사항</p>
          </div>
        </div>
      </div>

      {/* 데모 체험 */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Play size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">먼저 직접 체험해 보세요!</h3>
            <p className="text-sm text-slate-500">설명보다 직접 써보는 게 빠릅니다.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="이름 입력 (예: 홍길동)"
            value={demoName}
            onChange={(e) => setDemoName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDemo()}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={handleDemo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            체험하기
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Google 로그인 없이 이름만으로 학생 화면을 바로 체험할 수 있어요.</p>
      </div>

      <div className="space-y-3">

        {/* ===== 서비스 소개 ===== */}
        <Section icon={Sparkles} title="서비스 소개: 이 플랫폼은 뭔가요?" defaultOpen>
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>
              <strong>사고력을 위한 파이썬</strong>은 고등학생이 파이썬으로 <strong>문제 해결 능력</strong>을 키우는 교육 플랫폼입니다.
            </p>
            <p>핵심 철학은 <strong>"같은 문제, 다른 생각"</strong>입니다:</p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 font-mono text-xs">
              <p className="text-slate-500 mb-2">[문제] 1부터 100까지의 합을 구하세요</p>
              <p>학생A: 1+2+3+... 하나씩 더하기 → 5050 (끈기의 풀이)</p>
              <p>학생B: 양 끝 짝짓기 (1+100)×50 → 5050 (가우스의 발견!)</p>
              <p>학생C: 수학 공식 100×101÷2 → 5050 (공식 활용)</p>
              <p className="text-blue-600 mt-2">→ 3명 다 정답! 하지만 '끈기'와 '통찰'과 '지식'은 다르다.</p>
              <p className="text-blue-600">→ 이 비교 과정에서 사고력이 자란다.</p>
            </div>

            <p className="font-medium text-slate-700 mt-4">학생이 할 수 있는 것:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>브라우저에서 바로 파이썬 코드 작성 및 실행 (설치 불필요)</li>
              <li>자동 채점 (테스트 케이스 통과 여부)</li>
              <li>AI 코치에게 힌트 요청 (정답은 안 알려줌!)</li>
              <li>다른 친구들의 풀이 비교 (갤러리)</li>
              <li>내 코딩 여정 되돌아보기 (스냅샷)</li>
            </ul>

            <p className="font-medium text-slate-700 mt-4">교사가 할 수 있는 것:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>교실을 만들고 학생을 초대</li>
              <li>문제를 AI로 생성하거나 직접 만들기</li>
              <li>교실에 문제를 배정하고, AI 도움 수준 조절</li>
              <li>학생 풀이 진행도를 실시간 모니터링</li>
              <li>AI 대화 리포트로 학생별 고충 파악</li>
            </ul>
          </div>
        </Section>

        {/* ===== 교사 대시보드 메뉴 안내 ===== */}
        <Section icon={Monitor} title="교사 대시보드 메뉴 안내" badge="전체 메뉴">
          <div className="mt-4 space-y-1">
            <NavItem icon={LayoutDashboard} label="교실 라이브" desc="학생별 문제 풀이 현황을 실시간 매트릭스로 확인 + AI 사용량 통계. 총 4개 탭: 현황, 학생 목록, AI 리포트, AI 사용량." />
            <NavItem icon={Wrench} label="문제 공방" desc="AI에게 문제를 생성시키거나 직접 만들기. 생성된 문제를 검토·수정·승인하는 워크숍." />
            <NavItem icon={ListChecks} label="문제 배정" desc="승인된 문제를 교실에 배정. 문제별로 AI 도움 레벨(0~4)과 갤러리 공개 여부를 설정." />
            <NavItem icon={MessageSquare} label="AI 리포트" desc="학생과 AI 코치의 대화 내역을 요약. 학생이 어디서 막혔는지, 교사 개입이 필요한지 파악." />
            <NavItem icon={Settings} label="교실 설정" desc="새 교실 생성, 참여 코드 확인, 학생 목록 관리, API 키 설정, AI 일일 사용 제한 설정." />
            <NavItem icon={BookOpen} label="사용 안내" desc="지금 보고 있는 이 페이지! 전체 서비스 매뉴얼." />
          </div>
        </Section>

        {/* ===== 1단계: 교실 만들기 ===== */}
        <Section icon={UserPlus} title="1단계: 교실 만들기 & 학생 초대" badge="필수" defaultOpen>
          <Step number={1} title="교실 설정 페이지로 이동">
            <p>좌측 사이드바 &gt; <strong>교실 설정</strong>을 클릭합니다.</p>
            <button
              onClick={() => navigate('/teacher/classroom')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              교실 설정으로 이동 <ArrowRight size={14} />
            </button>
          </Step>

          <Step number={2} title="새 교실 만들기">
            <p>교실 이름을 입력합니다 (예: "1학년 3반 정보", "방과후 파이썬").</p>
            <p><strong>생성</strong> 버튼을 누르면 <strong>5자리 참여 코드</strong>가 자동 생성됩니다.</p>
          </Step>

          <Step number={3} title="학생에게 참여 코드 알려주기">
            <p>참여 코드 옆 <strong>복사</strong> 버튼을 눌러 코드를 복사합니다.</p>
            <p>학생들에게 다음과 같이 안내합니다:</p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mt-2">
              <p className="text-sm font-medium text-slate-800 mb-2">학생에게 보낼 안내 예시:</p>
              <div className="bg-white rounded p-3 text-xs text-slate-700 border border-slate-300">
                <p>1. 사이트 접속: <strong>[배포 URL]</strong></p>
                <p>2. <strong>학생 입장</strong> 클릭</p>
                <p>3. 이름 입력 후 Google 로그인 (또는 데모 체험)</p>
                <p>4. <strong>교실 참여</strong>에서 참여 코드 입력: <code className="bg-blue-50 px-1 rounded">XXXXX</code></p>
              </div>
            </div>
          </Step>

          <Step number={4} title="학생 관리">
            <p>교실 카드에서 <strong>학생 수</strong> 버튼을 누르면 학생 목록이 펼쳐집니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>학번 수정: 번호 옆 연필 아이콘 (hover 시 표시)</li>
              <li>레벨 조정: Lv. 옆 화살표로 학생별 난이도 조절</li>
              <li>내보내기: 휴지통 아이콘으로 학생 교실에서 제거</li>
            </ul>
          </Step>

          <Step number={5} title="AI 일일 사용 제한 설정">
            <p>교실 카드에서 <strong>AI 일일 제한</strong> 드롭다운으로 학생당 하루 AI 사용 횟수를 설정합니다.</p>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-1.5 pr-3">설정값</th>
                    <th className="pb-1.5">의미</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-medium">무제한</td><td>제한 없음 (기본값)</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-medium">3~5회</td><td>한정적 사용, 스스로 고민을 유도</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-medium">10~15회</td><td>적당한 사용, 비용 절감 효과</td></tr>
                  <tr><td className="py-1 pr-3 font-medium">20~30회</td><td>자유로운 사용, 고급 문제 풀이에 적합</td></tr>
                </tbody>
              </table>
            </div>
            <InfoBox type="info">
              제한에 도달한 학생에게는 "오늘의 AI 코치 사용 횟수를 모두 사용했어요"라는 안내가 표시되며, 다음 날 자동으로 초기화됩니다.
            </InfoBox>
          </Step>
        </Section>

        {/* ===== 2단계: 문제 배정 ===== */}
        <Section icon={ListChecks} title="2단계: 문제 배정하기" badge="필수">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>교실을 만들면 <strong>Lv.1 입문 문제</strong>가 자동 배정됩니다. 추가 문제를 배정하려면:</p>
          </div>

          <Step number={1} title="문제 배정 페이지로 이동">
            <p>좌측 사이드바 &gt; <strong>문제 배정</strong>을 클릭합니다.</p>
            <button
              onClick={() => navigate('/teacher/assign')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              문제 배정으로 이동 <ArrowRight size={14} />
            </button>
          </Step>

          <Step number={2} title="교실 선택 & 문제 배정">
            <p>상단에서 교실을 선택하고, 문제 목록에서 원하는 문제를 교실에 추가합니다.</p>
          </Step>

          <Step number={3} title="AI 레벨 & 갤러리 설정">
            <p>배정된 각 문제에 대해 설정할 수 있습니다:</p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pr-3">AI 레벨</th>
                    <th className="pb-2">설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-1.5 pr-3 font-mono font-bold text-red-600">0</td><td>AI 코치 비활성화 (스스로 풀기)</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1.5 pr-3 font-mono font-bold text-orange-600">1</td><td>질문으로만 유도 (소크라테스식)</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1.5 pr-3 font-mono font-bold text-blue-600">2</td><td>개념 힌트 제공 (기본값)</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1.5 pr-3 font-mono font-bold text-emerald-600">3</td><td>수도코드 설명 제공</td></tr>
                  <tr><td className="py-1.5 pr-3 font-mono font-bold text-purple-600">4</td><td>유사 코드 예시 제공 (정답은 아님)</td></tr>
                </tbody>
              </table>
            </div>
            <InfoBox type="info">
              처음에는 <strong>레벨 2 (개념 힌트)</strong>로 시작하고, 학생들의 반응을 보며 조절하는 것을 권장합니다.
            </InfoBox>
          </Step>
        </Section>

        {/* ===== 3단계: AI 코치 설정 ===== */}
        <Section icon={Key} title="3단계: AI 코치 API 키 설정" badge="선택">
          <InfoBox type="info">
            API 키를 등록하지 않아도 <strong>문제 풀이, 코드 실행, 제출</strong>은 정상 사용 가능합니다.
            AI 코치 기능만 비활성화됩니다. AI 없이도 충분히 수업 진행 가능합니다.
          </InfoBox>

          <div className="text-sm text-slate-600 mt-4">
            <p className="font-medium text-slate-700">API 키란?</p>
            <p className="mt-1">
              AI 코치는 <strong>Anthropic Claude</strong>를 사용합니다.
              각 학교/교사가 자체 API 키를 등록하면 비용이 분리되어 독립적으로 운영됩니다.
            </p>
          </div>

          <h3 className="font-semibold text-slate-700 mt-5 mb-1">API 키 발급받기</h3>
          <Step number={1} title="Anthropic Console 접속">
            <p>
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline underline-offset-2">
                console.anthropic.com <ExternalLink size={12} />
              </a>에 접속, 회원가입/로그인합니다 (무료).
            </p>
          </Step>
          <Step number={2} title="결제 수단 등록">
            <p>Settings &gt; <strong>Billing</strong>에서 신용카드를 등록합니다. 사용한 만큼만 후불 결제됩니다.</p>
          </Step>
          <Step number={3} title="API 키 생성">
            <p>Settings &gt; <strong>API Keys</strong> &gt; <strong>Create Key</strong>를 클릭합니다.</p>
            <p><code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">sk-ant-api03-...</code> 형태의 키가 표시됩니다.</p>
            <InfoBox type="warning">
              키는 <strong>이 순간에만</strong> 표시됩니다! 반드시 복사해서 안전한 곳에 저장하세요.
            </InfoBox>
          </Step>

          <h3 className="font-semibold text-slate-700 mt-5 mb-1">플랫폼에 등록하기</h3>
          <Step number={4} title="교실 설정에서 키 등록">
            <p><strong>교실 설정</strong> &gt; <strong>AI 코치 설정</strong> &gt; <strong>설정하기</strong>를 클릭합니다.</p>
            <p>복사해둔 API 키를 붙여넣고 <strong>저장</strong>합니다.</p>
            <button
              onClick={() => navigate('/teacher/classroom')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              교실 설정으로 이동 <ArrowRight size={14} />
            </button>
          </Step>
          <Step number={5} title="키 테스트">
            <p><strong>키 테스트</strong> 버튼을 눌러 "API 키가 유효합니다"가 뜨면 완료!</p>
            <InfoBox type="success">
              설정 완료! 내 교실의 학생들이 바로 AI 코치를 사용할 수 있습니다.
            </InfoBox>
          </Step>
        </Section>

        {/* ===== 교실 라이브 대시보드 ===== */}
        <Section icon={LayoutDashboard} title="기능 안내: 교실 라이브 대시보드">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>학생들의 문제 풀이 현황을 <strong>실시간 매트릭스</strong>로 확인합니다. 총 4개 탭으로 구성:</p>

            <div className="space-y-2 mt-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="font-medium text-slate-800 text-sm mb-1">현황 (매트릭스)</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600 ml-1">
                  <li><strong>행</strong> = 학생, <strong>열</strong> = 문제, 각 셀에 통과/진행중/미시도 상태 색상 표시</li>
                  <li>수업 중 프로젝터에 띄워 놓으면 학생들에게 동기부여 효과</li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="font-medium text-slate-800 text-sm mb-1">학생 목록</p>
                <p className="text-xs text-slate-600 ml-1">학생별 풀이 수, 제출 수, AI 대화 수, 최근 활동 확인</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="font-medium text-slate-800 text-sm mb-1">AI 리포트</p>
                <p className="text-xs text-slate-600 ml-1">학생별 AI 대화 내역 요약 및 교사 개입 필요 여부 파악</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="font-medium text-blue-800 text-sm mb-1">AI 사용량 <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full ml-1">NEW</span></p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700 ml-1">
                  <li>기간별(오늘/이번 주/이번 달) AI 호출 수 및 예상 비용</li>
                  <li>일별 사용량 바 차트로 추세 파악</li>
                  <li>학생별 사용량 랭킹으로 과다 사용자 확인</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              교실 라이브로 이동 <ArrowRight size={14} />
            </button>
          </div>
        </Section>

        {/* ===== 문제 공방 ===== */}
        <Section icon={Wrench} title="기능 안내: 문제 공방 (AI 문제 생성)">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>AI에게 문제를 생성시키거나, 직접 문제를 만들 수 있습니다.</p>

            <p className="font-medium text-slate-700 mt-3">AI 문제 생성 방법:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>난이도 (1~5)와 카테고리 선택</li>
              <li>"문제 생성" 버튼 클릭 → AI가 문제·테스트케이스·힌트를 자동 생성</li>
              <li>교사가 검토 후 <strong>승인</strong>하면 문제 라이브러리에 추가</li>
              <li>필요하면 AI에게 수정 지시 (예: "더 쉽게", "예시 추가")</li>
            </ol>

            <InfoBox type="info">
              생성된 문제는 <strong>검토 대기</strong> 상태이므로, 교사가 승인해야 학생에게 배정 가능합니다.
              문제 내용, 테스트 케이스, 힌트를 꼼꼼히 확인해 주세요.
            </InfoBox>

            <button
              onClick={() => navigate('/teacher/workshop')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              문제 공방으로 이동 <ArrowRight size={14} />
            </button>
          </div>
        </Section>

        {/* ===== AI 리포트 ===== */}
        <Section icon={MessageSquare} title="기능 안내: AI 리포트">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>학생과 AI 코치의 대화 내역을 확인하고 요약할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>학생별 AI 대화 횟수 확인</li>
              <li><strong>요약 생성</strong> 버튼으로 AI가 대화를 분석</li>
              <li>학생이 어려워한 개념, 진행 상황, 교사 개입 필요 여부 파악</li>
              <li>수업 후 피드백 자료로 활용</li>
            </ul>

            <button
              onClick={() => navigate('/teacher/ai-reports')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              AI 리포트로 이동 <ArrowRight size={14} />
            </button>
          </div>
        </Section>

        {/* ===== 학생 화면 안내 ===== */}
        <Section icon={Users} title="학생 화면은 어떻게 보이나요?">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p className="font-medium text-slate-700">학생이 보는 화면 구성:</p>

            <div className="space-y-3 mt-2">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <Code size={18} className="text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">코드 에디터</p>
                  <p className="text-xs text-slate-500">좌측에 문제 설명, 우측에 코드 에디터. Python 코드를 작성하고 "실행" 버튼으로 즉시 결과 확인 (브라우저에서 실행, 서버 부하 없음).</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <Play size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">테스트 & 제출</p>
                  <p className="text-xs text-slate-500">"테스트 실행"으로 자동 채점. 모든 테스트 통과 시 "제출" 가능. 여러 번 제출할 수 있으며, 접근법 태그가 자동 분류됩니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <Bot size={18} className="text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">AI 코치</p>
                  <p className="text-xs text-slate-500">우측 "AI 코치" 탭에서 대화. 정답은 절대 알려주지 않고, 교사가 설정한 레벨에 맞춰 힌트/질문으로 유도합니다. 일일 제한이 설정된 경우 "오늘 남은 횟수: 7/10" 형태로 표시됩니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <Eye size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">풀이 갤러리</p>
                  <p className="text-xs text-slate-500">통과한 학생들의 풀이를 비교. AI가 접근법을 자동 분류 (반복문, 재귀, 수학 등). 갤러리 활성화는 문제 배정에서 설정.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">API 키 설정됨</span>
                </div>
                <p className="text-xs text-emerald-700">
                  AI 코치 탭에서 바로 대화 가능. 교사가 설정한 AI 레벨(1~4)에 따라 도움 수준이 조절됩니다.
                </p>
              </div>
              <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">API 키 미설정</span>
                </div>
                <p className="text-xs text-amber-700">
                  "선생님이 아직 API 키를 설정하지 않았어요" 안내 표시. 문제 풀이·코드 실행·제출은 정상.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ===== 수업 시나리오 ===== */}
        <Section icon={Play} title="수업 활용 시나리오 예시">
          <div className="text-sm text-slate-600 mt-4 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">시나리오 1: 첫 수업 (50분)</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
                <li><strong>도입 (5분)</strong>: 사이트 접속, 참여 코드로 교실 입장</li>
                <li><strong>활동 (35분)</strong>: Lv.1 입문 문제 풀기 (AI 레벨 2 권장)</li>
                <li><strong>정리 (10분)</strong>: 교실 라이브에서 진행도 확인, 풀이 갤러리로 접근법 비교 토론</li>
              </ol>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-2">시나리오 2: 심화 수업 (50분)</h3>
              <ol className="list-decimal list-inside space-y-1 text-emerald-700 text-xs">
                <li><strong>도입 (5분)</strong>: 오늘의 문제 소개, AI 레벨 1 (질문만) 설정</li>
                <li><strong>활동 (30분)</strong>: 학생들이 독립적으로 문제 풀이</li>
                <li><strong>중간 점검 (5분)</strong>: 교실 라이브에서 막힌 학생 확인, AI 레벨 2로 상향</li>
                <li><strong>정리 (10분)</strong>: 풀이 갤러리에서 다양한 접근법 비교, AI 리포트로 고충 파악</li>
              </ol>
            </div>

            <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
              <h3 className="font-semibold text-violet-800 mb-2">시나리오 3: AI 없이 수업</h3>
              <ol className="list-decimal list-inside space-y-1 text-violet-700 text-xs">
                <li>문제 배정 시 AI 레벨을 <strong>0</strong>으로 설정</li>
                <li>학생들이 AI 도움 없이 순수하게 풀이</li>
                <li>교사가 직접 순회하며 힌트 제공</li>
                <li>API 키가 없어도 이 방식은 완벽히 작동합니다</li>
              </ol>
            </div>
          </div>
        </Section>

        {/* ===== 보안 ===== */}
        <Section icon={Lock} title="보안 안내">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>API 키는 <strong>AES-256-GCM</strong> 방식으로 암호화되어 저장됩니다 (은행 수준 보안)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>교사 본인만 키를 설정/삭제할 수 있습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>키는 해당 교사의 교실에 속한 학생의 AI 코칭에만 사용됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>다른 교사나 학생은 키 내용을 볼 수 없습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>학생의 Google 로그인 정보는 서버에 비밀번호 없이 저장됩니다 (OAuth 방식)</span>
              </li>
            </ul>
          </div>
        </Section>

        {/* ===== 비용 ===== */}
        <Section icon={DollarSign} title="AI 코치 비용 안내">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>Anthropic Claude API는 <strong>사용한 만큼만</strong> 후불 결제됩니다.</p>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2">항목</th>
                    <th className="pb-2 text-right">비용 (약)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">학생 1명 x AI 대화 1회</td>
                    <td className="py-2 text-right font-mono">4~14원</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">학생 30명 x 하루 10회</td>
                    <td className="py-2 text-right font-mono">1,200~4,200원/일</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">학생 30명 x 주 5일</td>
                    <td className="py-2 text-right font-mono">6,000~21,000원/주</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">학생 30명 x 월 20일</td>
                    <td className="py-2 text-right font-mono font-medium">24,000~84,000원/월</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <InfoBox type="info">
              실제로는 모든 학생이 매일 10회씩 사용하지 않으므로, 위 금액보다 훨씬 적게 나옵니다.
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1">Anthropic Console</a>에서 실시간 사용량을 확인할 수 있습니다.
            </InfoBox>
            <InfoBox type="success">
              <strong>비용 절감 팁:</strong> 교실 설정에서 <strong>AI 일일 제한</strong>을 설정하면 학생당 하루 사용 횟수를 제한할 수 있습니다.
              예를 들어 5회로 설정하면, 학생 30명 기준 하루 최대 150회(약 600~2,100원)로 비용 상한을 관리할 수 있습니다.
              교실 라이브 &gt; AI 사용량 탭에서 실시간 사용 통계도 확인 가능합니다.
            </InfoBox>
          </div>
        </Section>

        {/* ===== FAQ ===== */}
        <Section icon={HelpCircle} title="자주 묻는 질문 (FAQ)">
          <div className="text-sm text-slate-600 mt-4 space-y-4">
            <div>
              <p className="font-semibold text-slate-800">Q. 학생이 설치해야 하는 프로그램이 있나요?</p>
              <p className="mt-1">없습니다. 크롬/엣지/사파리 등 최신 웹 브라우저만 있으면 됩니다. Python도 브라우저에서 실행되므로 별도 설치가 필요 없습니다.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. 스마트폰으로도 사용할 수 있나요?</p>
              <p className="mt-1">기본적으로 PC/태블릿 사용을 권장합니다. 코드 작성에는 키보드가 있는 환경이 적합합니다.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. API 키를 잃어버렸어요.</p>
              <p className="mt-1">Anthropic Console에서 기존 키를 삭제하고 새 키를 만들면 됩니다. 교실 설정에서 새 키로 다시 등록하세요.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. 여러 교실을 운영하는데, 키를 각각 설정해야 하나요?</p>
              <p className="mt-1">아닙니다. 교사 계정에 한 번만 설정하면, 해당 교사의 모든 교실에 자동 적용됩니다.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. 학생이 AI를 너무 많이 쓰면 어떡하나요?</p>
              <p className="mt-1">
                두 가지 방법으로 조절할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                <li><strong>AI 레벨 0</strong>: 문제 배정 시 AI 레벨을 0으로 설정하면 해당 문제에서 AI 코치가 비활성화됩니다.</li>
                <li><strong>일일 사용 제한</strong>: 교실 설정에서 학생당 하루 AI 사용 횟수를 제한할 수 있습니다 (예: 5회, 10회). 제한에 도달하면 학생에게 "오늘의 사용 횟수를 모두 사용했어요"라고 표시됩니다.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. AI가 학생에게 정답을 알려주지는 않나요?</p>
              <p className="mt-1">AI 코치는 <strong>절대 정답 코드를 직접 제공하지 않도록</strong> 설계되어 있습니다. 질문, 힌트, 방향 제시만 합니다. AI 레벨이 높아도 비슷한 문제의 예시만 보여줄 뿐, 해당 문제의 정답은 알려주지 않습니다.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. 다른 AI 서비스 (ChatGPT 등)의 키도 사용할 수 있나요?</p>
              <p className="mt-1">현재는 Anthropic Claude API 키만 지원합니다. <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">sk-ant-</code>로 시작하는 키여야 합니다.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. 키를 삭제하면 기존 AI 대화 기록도 삭제되나요?</p>
              <p className="mt-1">아닙니다. AI 대화 기록은 별도로 저장되어 있어, 키를 삭제해도 기존 대화 내용은 유지됩니다.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Q. 문의/건의는 어디에 하나요?</p>
              <p className="mt-1">
                <a href="mailto:greatsong21@gmail.com" className="text-blue-600 hover:underline">greatsong21@gmail.com</a>으로 연락해 주세요.
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* 하단 CTA */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-center text-white">
        <p className="font-bold text-lg mb-2">준비가 되셨나요?</p>
        <p className="text-blue-200 text-sm mb-4">교실을 만들고, 문제를 배정하고, 수업을 시작하세요!</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/teacher/classroom')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
          >
            <Settings size={16} />
            교실 만들기
          </button>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-lg font-medium hover:bg-white/25 transition-colors text-sm"
          >
            <LayoutDashboard size={16} />
            대시보드 보기
          </button>
        </div>
      </div>
    </div>
  );
}
