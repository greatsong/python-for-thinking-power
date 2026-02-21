import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Key, AlertTriangle, CheckCircle, ExternalLink,
  ChevronDown, ChevronRight, ArrowRight, DollarSign, HelpCircle,
  LayoutDashboard, ListChecks, Settings,
  Play, Loader2, Zap
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">사고력을 위한 파이썬 — 핵심 안내</h1>
        <p className="text-slate-500">처음 방문하신 선생님을 위한 핵심 가이드입니다.</p>
      </div>

      {/* 빠른 시작 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
        <h2 className="text-lg font-bold mb-3">3단계로 시작하기</h2>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
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
        <Section icon={Zap} title="이 플랫폼은?" defaultOpen>
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p>
              학생이 파이썬으로 <strong>문제 해결력</strong>을 키우는 교육 플랫폼입니다.
              핵심 철학은 <strong>"하나의 문제, 다양한 사고의 경로"</strong> —
              하나의 문제를 여러 방식으로 풀며 사고력을 기릅니다.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 font-mono text-xs">
              <p className="text-slate-500 mb-2">[문제] 100만 개의 데이터에서 중복된 값을 모두 찾으세요</p>
              <p>학생A: 하나씩 전부 비교 — 확실하지만 느림</p>
              <p>학생B: 정렬하면 같은 값이 옆에! — 2초</p>
              <p>학생C: 본 걸 기억하면 된다 (set) — 0.3초</p>
              <p className="text-blue-600 mt-2">→ 같은 문제, 세 가지 아이디어. 어떤 생각을 떠올리느냐가 실력.</p>
            </div>
            <p className="text-xs text-slate-500">
              학생은 브라우저에서 코드 작성·실행·제출하고, AI 코치에게 힌트를 받습니다.
              교사는 대시보드에서 실시간 모니터링, 피드백, 성적 관리를 합니다.
            </p>
          </div>
        </Section>

        {/* ===== 시작 가이드 (통합) ===== */}
        <Section icon={Settings} title="시작 가이드" badge="필수" defaultOpen>
          <div className="text-sm text-slate-600 mt-4 space-y-5">

            {/* 교실 만들기 */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                교실 만들기 & 학생 초대
              </h3>
              <p><strong>교실 설정</strong>에서 교실 이름을 입력하면 <strong>5자리 참여 코드</strong>가 자동 생성됩니다.</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-2">
                <p className="text-xs font-medium text-slate-700 mb-1">학생에게 안내:</p>
                <div className="bg-white rounded p-2 text-xs text-slate-600 border border-slate-300">
                  <p>1. 사이트 접속 → <strong>학생 입장</strong> 클릭</p>
                  <p>2. 이름 입력 후 Google 로그인</p>
                  <p>3. 참여 코드 입력: <code className="bg-blue-50 px-1 rounded">XXXXX</code></p>
                </div>
              </div>
              <button
                onClick={() => navigate('/teacher/classroom')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                교실 설정으로 이동 <ArrowRight size={12} />
              </button>
            </div>

            {/* 문제 배정 */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                문제 배정 & AI 레벨 설정
              </h3>
              <p>교실 생성 시 <strong>Lv.1 입문 문제</strong>가 자동 배정됩니다. <strong>문제 배정</strong>에서 추가 문제를 배정하고, 문제별 AI 도움 수준을 설정하세요.</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-1.5 pr-3">AI 레벨</th>
                      <th className="pb-1.5">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-mono font-bold text-red-600">0</td><td>AI 비활성 (스스로 풀기)</td></tr>
                    <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-mono font-bold text-orange-600">1</td><td>질문으로만 유도</td></tr>
                    <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-mono font-bold text-blue-600">2</td><td>개념 힌트 제공 (기본값, 권장)</td></tr>
                    <tr className="border-b border-slate-100"><td className="py-1 pr-3 font-mono font-bold text-emerald-600">3</td><td>수도코드 설명</td></tr>
                    <tr><td className="py-1 pr-3 font-mono font-bold text-purple-600">4</td><td>유사 코드 예시</td></tr>
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => navigate('/teacher/assign')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                문제 배정으로 이동 <ArrowRight size={12} />
              </button>
            </div>

            {/* API 키 */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold">3</span>
                AI 코치 API 키 설정
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">선택</span>
              </h3>
              <InfoBox type="info">
                API 키 없이도 <strong>문제 풀이·코드 실행·제출</strong>은 정상 작동합니다. AI 코치만 비활성화됩니다.
              </InfoBox>
              <ol className="list-decimal list-inside space-y-1 mt-3 text-xs">
                <li>
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline">console.anthropic.com</a>에서
                  회원가입 → Billing에 카드 등록 → API Keys에서 키 생성
                </li>
                <li><strong>교실 설정 &gt; AI 코치 설정</strong>에서 키 붙여넣기</li>
                <li><strong>키 테스트</strong> 버튼으로 확인</li>
              </ol>
              <InfoBox type="warning">
                API 키는 생성 순간에만 표시됩니다. 반드시 복사해서 저장하세요.
              </InfoBox>
            </div>
          </div>
        </Section>

        {/* ===== 핵심 기능 ===== */}
        <Section icon={LayoutDashboard} title="핵심 기능: 대시보드 활용" badge="NEW">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <p><strong>교실 라이브</strong>의 매트릭스에서 학생×문제 현황을 실시간으로 확인하세요.</p>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="font-medium text-blue-800 text-sm mb-1">셀 클릭 → 슬라이드 패널</p>
              <p className="text-xs text-blue-700 mb-2">매트릭스의 셀을 클릭하면 오른쪽에 상세 패널이 열립니다:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded p-2 text-xs text-blue-800 border border-blue-100">
                  <strong>코드 보기</strong> — 제출 코드 + 테스트 결과
                </div>
                <div className="bg-white rounded p-2 text-xs text-blue-800 border border-blue-100">
                  <strong>AI 대화</strong> — 대화 원문 전체 열람
                </div>
                <div className="bg-white rounded p-2 text-xs text-blue-800 border border-blue-100">
                  <strong>피드백/평가</strong> — 점수·등급·코멘트 저장
                </div>
                <div className="bg-white rounded p-2 text-xs text-blue-800 border border-blue-100">
                  <strong>코드 여정</strong> — 스냅샷 타임라인
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="font-medium text-blue-800 text-sm mb-1">데이터 내보내기</p>
              <p className="text-xs text-blue-700">매트릭스 상단 <strong>"내보내기"</strong> 버튼에서 <strong>성적표 CSV</strong>(학생×문제 점수/등급)와 <strong>진행 요약 CSV</strong>(학생별 통계)를 다운로드할 수 있습니다. 한글 엑셀에서 바로 열립니다.</p>
            </div>

            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition-colors"
            >
              교실 라이브로 이동 <ArrowRight size={12} />
            </button>
          </div>
        </Section>

        {/* ===== 수업 시나리오 ===== */}
        <Section icon={Play} title="수업 시나리오 예시">
          <div className="text-sm text-slate-600 mt-4 space-y-3">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">첫 수업 (50분)</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
                <li><strong>도입 (5분)</strong>: 사이트 접속, 참여 코드로 교실 입장</li>
                <li><strong>활동 (35분)</strong>: Lv.1 입문 문제 풀기 (AI 레벨 2 권장)</li>
                <li><strong>정리 (10분)</strong>: 교실 라이브에서 진행도 확인, 갤러리로 접근법 비교</li>
              </ol>
            </div>

            <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
              <h3 className="font-semibold text-violet-800 mb-2">평가 & 피드백 수업</h3>
              <ol className="list-decimal list-inside space-y-1 text-violet-700 text-xs">
                <li>학생들이 문제를 풀고 제출</li>
                <li>매트릭스 셀 클릭 → 학생 코드와 AI 대화 확인</li>
                <li>피드백 탭에서 점수·등급·코멘트 저장</li>
                <li>성적표 CSV 내보내기로 학교 시스템에 업로드</li>
              </ol>
            </div>
          </div>
        </Section>

        {/* ===== 비용 & FAQ ===== */}
        <Section icon={DollarSign} title="비용 안내 & 자주 묻는 질문">
          <div className="text-sm text-slate-600 mt-4 space-y-5">

            {/* 비용 */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">AI 코치 비용</h3>
              <p className="text-xs mb-2">Anthropic Claude API는 사용한 만큼만 후불 결제됩니다.</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-1.5">항목</th>
                      <th className="pb-1.5 text-right">비용 (약)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100"><td className="py-1">학생 1명 × AI 대화 1회</td><td className="py-1 text-right font-mono">4~14원</td></tr>
                    <tr className="border-b border-slate-100"><td className="py-1">학생 30명 × 하루 10회</td><td className="py-1 text-right font-mono">1,200~4,200원/일</td></tr>
                    <tr><td className="py-1 font-medium">학생 30명 × 월 20일</td><td className="py-1 text-right font-mono font-medium">24,000~84,000원/월</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">실제로는 훨씬 적게 나옵니다. 교실 설정에서 <strong>일일 사용 제한</strong>을 설정하면 비용 상한 관리도 가능합니다.</p>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">자주 묻는 질문</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-slate-800 text-xs">Q. 학생이 설치해야 하는 프로그램이 있나요?</p>
                  <p className="text-xs mt-0.5">없습니다. 웹 브라우저만 있으면 됩니다. Python도 브라우저에서 실행됩니다.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-xs">Q. API 키를 잃어버렸어요.</p>
                  <p className="text-xs mt-0.5"><a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a>에서 기존 키를 삭제하고 새 키를 만들어 다시 등록하세요.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-xs">Q. AI가 학생에게 정답을 알려주나요?</p>
                  <p className="text-xs mt-0.5">아닙니다. AI 코치는 절대 정답 코드를 제공하지 않도록 설계되어 있습니다. 질문과 힌트로만 유도합니다.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-xs">Q. 학생에게 점수나 피드백을 줄 수 있나요?</p>
                  <p className="text-xs mt-0.5">네. 매트릭스 셀 클릭 → 피드백/평가 탭에서 점수(0~100), 등급(A~F), 코멘트를 저장할 수 있습니다.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-xs">Q. 성적을 엑셀로 내보낼 수 있나요?</p>
                  <p className="text-xs mt-0.5">교실 라이브 상단 "내보내기" 버튼에서 성적표 CSV와 진행 요약 CSV를 다운로드할 수 있습니다.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-xs">Q. 문의/건의는 어디에 하나요?</p>
                  <p className="text-xs mt-0.5"><a href="mailto:greatsong21@gmail.com" className="text-blue-600 hover:underline">greatsong21@gmail.com</a>으로 연락해 주세요.</p>
                </div>
              </div>
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
