import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import SolutionGallery from '../../components/SolutionGallery.jsx';

export default function Gallery() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { classroom } = useAuthStore();
  const [submissions, setSubmissions] = useState([]);
  const [problem, setProblem] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [subs, prob] = await Promise.all([
          apiFetch(`/gallery/${problemId}${classroom?.id ? `?classroomId=${classroom.id}` : ''}`),
          apiFetch(`/problems/${problemId}`),
        ]);
        setSubmissions(subs);
        setProblem(prob);
      } catch {
        // 에러 무시
      }
      setLoading(false);
    };
    load();
  }, [problemId, classroom?.id]);

  const handleRequestAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await apiFetch(`/gallery/${problemId}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: classroom?.id || '' }),
      });
      if (result.analysis) {
        setAnalysis(result.analysis);
      }
    } catch {
      // 에러 무시
    }
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">풀이 갤러리</h1>
          {problem && <p className="text-sm text-slate-500">{problem.title}</p>}
        </div>
      </div>

      <SolutionGallery
        submissions={submissions}
        analysis={analysis}
        onRequestAnalysis={handleRequestAnalysis}
        analyzing={analyzing}
      />
    </div>
  );
}
