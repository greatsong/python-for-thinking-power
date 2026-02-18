import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import {
  ListChecks, Send, Check, Loader2, School, Eye, EyeOff,
  ChevronDown, ChevronRight, Package, SendHorizonal,
} from 'lucide-react';
import { AI_LEVEL_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_LABELS } from 'shared/constants.js';

export default function ProblemAssign() {
  const { user } = useAuthStore();
  const [problemSets, setProblemSets] = useState([]);
  const [ungrouped, setUngrouped] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignSettings, setAssignSettings] = useState({});
  const [assigning, setAssigning] = useState({});
  const [assignedMap, setAssignedMap] = useState({});
  const [expandedSets, setExpandedSets] = useState({});
  const [bulkAssigning, setBulkAssigning] = useState({});

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProblems, setsData, classroomsData] = await Promise.all([
          apiFetch('/problems/library/all'),
          apiFetch('/problems/sets'),
          apiFetch('/classrooms/my'),
        ]);

        const approved = allProblems.filter((p) => p.status === 'approved');
        setClassrooms(classroomsData);

        // 문제집에 포함된 문제 ID 수집
        const inSet = new Set();
        const enrichedSets = setsData.map((s) => {
          const setProblems = (s.problems || []).map((sp) => {
            inSet.add(sp.id);
            return approved.find((p) => p.id === sp.id) || sp;
          }).filter(Boolean);
          return { ...s, problems: setProblems };
        });

        setProblemSets(enrichedSets);
        setUngrouped(approved.filter((p) => !inSet.has(p.id)));

        // 기본 설정 초기화
        const defaults = {};
        approved.forEach((p) => {
          defaults[p.id] = { aiLevel: 2, galleryEnabled: false };
        });
        setAssignSettings(defaults);

        // 첫 번째 문제집 펼치기
        if (enrichedSets.length > 0) {
          setExpandedSets({ [enrichedSets[0].id]: true });
        }
      } catch (err) {
        console.error('데이터 조회 실패:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 교실 선택 시 이미 배정된 문제 확인
  useEffect(() => {
    if (!selectedClassroom) {
      setAssignedMap({});
      return;
    }
    const fetchAssigned = async () => {
      try {
        const data = await apiFetch(`/problems/classroom/${selectedClassroom}`);
        const map = {};
        data.forEach((p) => {
          map[p.id] = true;
          setAssignSettings((prev) => ({
            ...prev,
            [p.id]: {
              aiLevel: p.ai_level ?? 2,
              galleryEnabled: !!p.gallery_enabled,
            },
          }));
        });
        setAssignedMap(map);
      } catch {
        setAssignedMap({});
      }
    };
    fetchAssigned();
  }, [selectedClassroom]);

  const handleAiLevelChange = (problemId, level) => {
    setAssignSettings((prev) => ({
      ...prev,
      [problemId]: { ...prev[problemId], aiLevel: Number(level) },
    }));
  };

  const handleGalleryToggle = (problemId) => {
    setAssignSettings((prev) => ({
      ...prev,
      [problemId]: { ...prev[problemId], galleryEnabled: !prev[problemId]?.galleryEnabled },
    }));
  };

  const handleAssign = async (problemId) => {
    if (!selectedClassroom) {
      alert('교실을 먼저 선택해주세요.');
      return;
    }
    setAssigning((prev) => ({ ...prev, [problemId]: true }));
    try {
      const settings = assignSettings[problemId] || { aiLevel: 2, galleryEnabled: false };
      await apiFetch(`/problems/${problemId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          classroomId: selectedClassroom,
          aiLevel: settings.aiLevel,
          galleryEnabled: settings.galleryEnabled,
        }),
      });
      setAssignedMap((prev) => ({ ...prev, [problemId]: true }));
    } catch (err) {
      alert('배정 실패: ' + err.message);
    } finally {
      setAssigning((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  // 문제집 전체 배정
  const handleBulkAssign = async (set) => {
    if (!selectedClassroom) {
      alert('교실을 먼저 선택해주세요.');
      return;
    }
    const unassigned = set.problems.filter((p) => !assignedMap[p.id]);
    if (unassigned.length === 0) {
      alert('이 문제집의 모든 문제가 이미 배정되어 있습니다.');
      return;
    }
    setBulkAssigning((prev) => ({ ...prev, [set.id]: true }));
    try {
      for (const p of unassigned) {
        const settings = assignSettings[p.id] || { aiLevel: 2, galleryEnabled: false };
        await apiFetch(`/problems/${p.id}/assign`, {
          method: 'POST',
          body: JSON.stringify({
            classroomId: selectedClassroom,
            aiLevel: settings.aiLevel,
            galleryEnabled: settings.galleryEnabled,
          }),
        });
        setAssignedMap((prev) => ({ ...prev, [p.id]: true }));
      }
    } catch (err) {
      alert('배정 실패: ' + err.message);
    } finally {
      setBulkAssigning((prev) => ({ ...prev, [set.id]: false }));
    }
  };

  const toggleSet = (setId) => {
    setExpandedSets((prev) => ({ ...prev, [setId]: !prev[setId] }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const renderProblemRow = (problem) => {
    const settings = assignSettings[problem.id] || { aiLevel: 2, galleryEnabled: false };
    const isAssigned = assignedMap[problem.id];
    const isAssigningNow = assigning[problem.id];

    return (
      <div
        key={problem.id}
        className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-b-0 transition-colors ${
          isAssigned ? 'bg-green-50/50' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-800 truncate">{problem.title}</h4>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white shrink-0"
            style={{ backgroundColor: DIFFICULTY_COLORS[problem.difficulty] || '#6b7280' }}
          >
            {DIFFICULTY_LABELS[problem.difficulty] || `Lv.${problem.difficulty}`}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-500 shrink-0">
            {CATEGORY_LABELS[problem.category] || problem.category}
          </span>
          {isAssigned && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 shrink-0">
              <Check size={10} /> 배정됨
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={settings.aiLevel}
            onChange={(e) => handleAiLevelChange(problem.id, e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(AI_LEVEL_LABELS).map(([level, label]) => (
              <option key={level} value={level}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleGalleryToggle(problem.id)}
            className={`p-1.5 rounded transition-colors ${
              settings.galleryEnabled
                ? 'bg-blue-100 text-blue-600'
                : 'bg-slate-100 text-slate-400'
            }`}
            title={settings.galleryEnabled ? '갤러리 공개' : '갤러리 비공개'}
          >
            {settings.galleryEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <button
            onClick={() => handleAssign(problem.id)}
            disabled={!selectedClassroom || isAssigningNow}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isAssigned
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAssigningNow ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isAssigned ? (
              <Check size={12} />
            ) : (
              <Send size={12} />
            )}
            {isAssigned ? '수정' : '배정'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <ListChecks size={24} />
        문제 배정
      </h1>

      {/* 교실 선택 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-4">
          <School size={20} className="text-slate-500" />
          <label className="text-sm font-medium text-slate-700">교실 선택:</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">교실을 선택하세요</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.student_count || 0}명)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 문제집별 문제 목록 */}
      <div className="space-y-4">
        {problemSets.map((set) => {
          const isExpanded = expandedSets[set.id];
          const assignedCount = set.problems.filter((p) => assignedMap[p.id]).length;
          const totalCount = set.problems.length;
          const allAssigned = assignedCount === totalCount && totalCount > 0;
          const isBulkAssigning = bulkAssigning[set.id];

          return (
            <div key={set.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* 문제집 헤더 */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleSet(set.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                  <span className="text-xl">{set.emoji}</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{set.title}</h2>
                    <p className="text-xs text-slate-500">{set.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    allAssigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {assignedCount}/{totalCount} 배정
                  </span>
                  {selectedClassroom && !allAssigned && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBulkAssign(set); }}
                      disabled={isBulkAssigning}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isBulkAssigning ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <SendHorizonal size={12} />
                      )}
                      전체 배정
                    </button>
                  )}
                </div>
              </div>

              {/* 문제 목록 */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {set.problems.length > 0 ? (
                    set.problems.map(renderProblemRow)
                  ) : (
                    <div className="px-5 py-4 text-sm text-slate-400 text-center">
                      문제가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 문제집에 포함되지 않은 문제 */}
        {ungrouped.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleSet('__ungrouped')}
            >
              <div className="flex items-center gap-3">
                {expandedSets['__ungrouped'] ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                <Package size={20} className="text-slate-400" />
                <div>
                  <h2 className="text-base font-bold text-slate-600">기타 문제</h2>
                  <p className="text-xs text-slate-400">문제집에 포함되지 않은 문제</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                {ungrouped.filter((p) => assignedMap[p.id]).length}/{ungrouped.length} 배정
              </span>
            </div>
            {expandedSets['__ungrouped'] && (
              <div className="border-t border-slate-100">
                {ungrouped.map(renderProblemRow)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
