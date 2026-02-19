import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Plus, Copy, Users, Check, School, Hash, Key, CheckCircle, AlertCircle, Trash2, Pencil, ChevronUp, ChevronDown as ChevronDownIcon, Bot } from 'lucide-react';

export default function ClassroomSetup() {
  const [classrooms, setClassrooms] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // 학번 인라인 편집
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingNumber, setEditingNumber] = useState('');

  // API 키 관련 상태
  const [apiKeyStatus, setApiKeyStatus] = useState({ configured: false, masked: '', source: 'none' });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [deletingKey, setDeletingKey] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const data = await apiFetch('/classrooms/my');
      setClassrooms(data);
    } catch (err) {
      console.error('교실 목록 조회 실패:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeyStatus = async () => {
    try {
      const data = await apiFetch('/ai/status');
      setApiKeyStatus(data);
    } catch {
      // 무시
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchApiKeyStatus();
  }, []);

  // 새 교실 생성
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/classrooms', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName('');
      await fetchClassrooms();
    } catch (err) {
      alert('교실 생성 실패: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // 교실 삭제
  const handleDeleteClassroom = async (classroom) => {
    if (!confirm(`"${classroom.name}" 교실을 삭제하시겠습니까?\n학생 데이터도 모두 삭제됩니다.`)) return;
    try {
      await apiFetch(`/classrooms/${classroom.id}`, { method: 'DELETE' });
      if (selectedClassroom?.id === classroom.id) {
        setSelectedClassroom(null);
        setStudents([]);
      }
      await fetchClassrooms();
    } catch (err) {
      alert('교실 삭제 실패: ' + err.message);
    }
  };

  // 참여 코드 복사
  const handleCopyCode = async (joinCode, classroomId) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedId(classroomId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = joinCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(classroomId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // API 키 저장
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      const result = await apiFetch('/ai/config', {
        method: 'POST',
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      setApiKeyStatus({ configured: true, masked: result.masked });
      setApiKeyInput('');
      setShowKeyInput(false);
    } catch (err) {
      alert(err.message || 'API 키 저장 실패');
    } finally {
      setSavingKey(false);
    }
  };

  // API 키 테스트
  const handleTestApiKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const result = await apiFetch('/ai/test-key', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({ valid: false, message: err.message || '테스트 실패' });
    } finally {
      setTestingKey(false);
    }
  };

  // API 키 삭제
  const handleDeleteApiKey = async () => {
    if (!confirm('저장된 API 키를 삭제하시겠습니까?\nAI 코치 기능이 비활성화됩니다.')) return;
    setDeletingKey(true);
    try {
      const result = await apiFetch('/ai/config', { method: 'DELETE' });
      setApiKeyStatus({ configured: result.configured, masked: result.masked, source: result.configured ? 'env' : 'none' });
      setTestResult(null);
    } catch (err) {
      alert('API 키 삭제 실패: ' + err.message);
    } finally {
      setDeletingKey(false);
    }
  };

  // 학생 목록 조회
  const handleShowStudents = async (classroom) => {
    if (selectedClassroom?.id === classroom.id) {
      setSelectedClassroom(null);
      setStudents([]);
      return;
    }
    setSelectedClassroom(classroom);
    setStudentsLoading(true);
    try {
      const data = await apiFetch(`/classrooms/${classroom.id}/students`);
      setStudents(data);
    } catch (err) {
      console.error('학생 목록 조회 실패:', err.message);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // 학번 수정 시작
  const handleEditNumber = (student) => {
    setEditingStudentId(student.id);
    setEditingNumber(student.student_number || '');
  };

  // 학번 수정 저장
  const handleSaveNumber = async (student) => {
    try {
      await apiFetch(`/classrooms/${selectedClassroom.id}/members/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ studentNumber: editingNumber }),
      });
      setStudents((prev) =>
        prev.map((s) => s.id === student.id ? { ...s, student_number: editingNumber } : s)
      );
      setEditingStudentId(null);
    } catch (err) {
      alert('학번 수정 실패: ' + err.message);
    }
  };

  // 학생 내보내기
  const handleRemoveStudent = async (student) => {
    if (!confirm(`${student.name} 학생을 교실에서 내보내시겠습니까?`)) return;
    try {
      await apiFetch(`/classrooms/${selectedClassroom.id}/members/${student.id}`, {
        method: 'DELETE',
      });
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      await fetchClassrooms();
    } catch (err) {
      alert('학생 내보내기 실패: ' + err.message);
    }
  };

  // 학생 레벨 조정
  const handleSetLevel = async (student, delta) => {
    const currentLevel = student.current_level || 1;
    const newLevel = Math.max(1, Math.min(5, currentLevel + delta));
    if (newLevel === currentLevel) return;
    try {
      await apiFetch(`/classrooms/${selectedClassroom.id}/members/${student.id}/level`, {
        method: 'PUT',
        body: JSON.stringify({ level: newLevel }),
      });
      setStudents((prev) =>
        prev.map((s) => s.id === student.id ? { ...s, current_level: newLevel } : s)
      );
    } catch (err) {
      alert('레벨 변경 실패: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">교실 설정</h1>

      {/* AI API 키 설정 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Key size={20} />
          AI 코치 설정
        </h2>
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            apiKeyStatus.configured
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {apiKeyStatus.configured ? (
              <><CheckCircle size={16} /><span>API 키 설정됨: <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">{apiKeyStatus.masked}</code></span></>
            ) : (
              <><AlertCircle size={16} /><span>API 키가 설정되지 않았습니다</span></>
            )}
          </div>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
          >
            {showKeyInput ? '닫기' : (apiKeyStatus.configured ? '변경' : '설정하기')}
          </button>
        </div>
        {apiKeyStatus.configured && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleTestApiKey}
              disabled={testingKey}
              className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {testingKey ? '테스트 중...' : '키 테스트'}
            </button>
            {apiKeyStatus.source === 'db' && (
              <button
                onClick={handleDeleteApiKey}
                disabled={deletingKey}
                className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {deletingKey ? '삭제 중...' : '키 삭제'}
              </button>
            )}
            {testResult && (
              <span className={`text-xs ${testResult.valid ? 'text-emerald-600' : 'text-red-600'}`}>
                {testResult.message}
              </span>
            )}
          </div>
        )}
        {showKeyInput && (
          <div className="flex gap-3 mt-3">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              placeholder="sk-ant-api03-..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={savingKey || !apiKeyInput.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {savingKey ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Anthropic Claude API 키가 필요합니다. 키를 설정하지 않으면 AI 코치 기능이 비활성화됩니다.
        </p>
        {apiKeyStatus.source === 'db' && (
          <p className="text-xs text-emerald-500 mt-1">내 API 키가 AES-256으로 암호화되어 저장되어 있습니다.</p>
        )}
      </div>

      {/* 새 교실 생성 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Plus size={20} />
          새 교실 만들기
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="교실 이름 (예: 1학년 3반 정보)"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Plus size={18} />}
            생성
          </button>
        </div>
      </div>

      {/* 교실 목록 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <School size={20} />
          내 교실 목록
          <span className="text-sm font-normal text-slate-400">({classrooms.length}개)</span>
        </h2>

        {classrooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
            아직 생성된 교실이 없습니다. 위에서 새 교실을 만들어보세요.
          </div>
        ) : (
          classrooms.map((classroom) => (
            <div key={classroom.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-800">{classroom.name}</h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                      생성일: {new Date(classroom.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 참여 코드 */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 md:px-4 py-2 rounded-lg border border-slate-200">
                      <Hash size={14} className="text-slate-400" />
                      <span className="font-mono font-bold text-base md:text-lg text-blue-600 tracking-wider">
                        {classroom.join_code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(classroom.join_code, classroom.id)}
                        className="ml-1 p-1 hover:bg-slate-200 rounded transition-colors"
                        title="참여 코드 복사"
                      >
                        {copiedId === classroom.id ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} className="text-slate-500" />
                        )}
                      </button>
                    </div>

                    {/* 학생 수 */}
                    <button
                      onClick={() => handleShowStudents(classroom)}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg border transition-colors ${
                        selectedClassroom?.id === classroom.id
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users size={16} />
                      <span className="font-medium">{classroom.student_count || 0}명</span>
                    </button>

                    {/* 교실 삭제 */}
                    <button
                      onClick={() => handleDeleteClassroom(classroom)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="교실 삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI 일일 제한 설정 */}
              <div className="px-5 pb-4 flex items-center gap-3 text-sm">
                <Bot size={16} className="text-violet-500" />
                <span className="text-slate-600">AI 일일 제한:</span>
                <select
                  value={classroom.daily_ai_limit || 0}
                  onChange={async (e) => {
                    const limit = parseInt(e.target.value, 10);
                    try {
                      await apiFetch(`/classrooms/${classroom.id}/ai-limit`, {
                        method: 'PUT',
                        body: JSON.stringify({ dailyAiLimit: limit }),
                      });
                      setClassrooms((prev) =>
                        prev.map((c) => c.id === classroom.id ? { ...c, daily_ai_limit: limit } : c)
                      );
                    } catch (err) {
                      alert('설정 실패: ' + err.message);
                    }
                  }}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="0">무제한</option>
                  <option value="3">3회</option>
                  <option value="5">5회</option>
                  <option value="10">10회</option>
                  <option value="15">15회</option>
                  <option value="20">20회</option>
                  <option value="30">30회</option>
                </select>
                <span className="text-xs text-slate-400">
                  {(classroom.daily_ai_limit || 0) === 0 ? '학생이 자유롭게 AI 코치 사용' : `학생 1인당 하루 ${classroom.daily_ai_limit}회`}
                </span>
              </div>

              {/* 학생 목록 (펼침) */}
              {selectedClassroom?.id === classroom.id && (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-sm font-semibold text-slate-600 mb-3">
                    학생 목록 <span className="font-normal text-slate-400">(번호 hover → 연필 아이콘으로 수정)</span>
                  </h4>
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">아직 참여한 학생이 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="pb-2 pr-4 w-28">번호</th>
                            <th className="pb-2 pr-4">이름</th>
                            <th className="pb-2 pr-4">이메일</th>
                            <th className="pb-2 pr-3 w-24">레벨</th>
                            <th className="pb-2 pr-4">참여일</th>
                            <th className="pb-2 w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-2 pr-4">
                                {editingStudentId === student.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingNumber}
                                      onChange={(e) => setEditingNumber(e.target.value.replace(/\D/g, ''))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveNumber(student);
                                        if (e.key === 'Escape') setEditingStudentId(null);
                                      }}
                                      className="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      maxLength={4}
                                      inputMode="numeric"
                                      placeholder="1101"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveNumber(student)}
                                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => setEditingStudentId(null)}
                                      className="text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 group">
                                    <span className="text-slate-600">{student.student_number || '-'}</span>
                                    <button
                                      onClick={() => handleEditNumber(student)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-500 transition-opacity"
                                      title="학번 수정"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 pr-4 font-medium text-slate-800">{student.name}</td>
                              <td className="py-2 pr-4 text-slate-500 text-xs">{student.email}</td>
                              {/* 레벨 조정 */}
                              <td className="py-2 pr-3">
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                    (student.current_level || 1) === 1 ? 'bg-green-100 text-green-700' :
                                    (student.current_level || 1) === 2 ? 'bg-blue-100 text-blue-700' :
                                    (student.current_level || 1) === 3 ? 'bg-yellow-100 text-yellow-700' :
                                    (student.current_level || 1) === 4 ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    Lv.{student.current_level || 1}
                                  </span>
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => handleSetLevel(student, 1)}
                                      disabled={(student.current_level || 1) >= 5}
                                      className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
                                      title="레벨 올리기"
                                    >
                                      <ChevronUp size={10} />
                                    </button>
                                    <button
                                      onClick={() => handleSetLevel(student, -1)}
                                      disabled={(student.current_level || 1) <= 1}
                                      className="p-0.5 text-slate-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                                      title="레벨 내리기"
                                    >
                                      <ChevronDownIcon size={10} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 pr-4 text-slate-500 text-xs">
                                {new Date(student.joined_at).toLocaleDateString('ko-KR')}
                              </td>
                              <td className="py-2">
                                <button
                                  onClick={() => handleRemoveStudent(student)}
                                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                  title="내보내기"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
