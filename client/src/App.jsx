import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import TeacherApply from './pages/TeacherApply.jsx';
import JoinClassroom from './pages/JoinClassroom.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import TeacherLayout from './layouts/TeacherLayout.jsx';
import ProblemList from './pages/student/ProblemList.jsx';
import Workspace from './pages/student/Workspace.jsx';
import Gallery from './pages/student/Gallery.jsx';
import MyJourney from './pages/student/MyJourney.jsx';
import ClassroomSetup from './pages/teacher/ClassroomSetup.jsx';
import ProblemWorkshop from './pages/teacher/ProblemWorkshop.jsx';
import ProblemAssign from './pages/teacher/ProblemAssign.jsx';
import LiveDashboard from './pages/teacher/LiveDashboard.jsx';
import AIReports from './pages/teacher/AIReports.jsx';
import ApproachAnalysis from './pages/teacher/ApproachAnalysis.jsx';
import AIGuide from './pages/teacher/AIGuide.jsx';
import ProblemCommunity from './pages/teacher/ProblemCommunity.jsx';
import useAuthStore from './stores/authStore.js';

export default function App() {
  const restoreUser = useAuthStore((s) => s.restoreUser);
  const token = useAuthStore((s) => s.token);

  // 새로고침 시 토큰으로 user 상태 복원
  useEffect(() => {
    if (token) restoreUser();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/guide" element={<AIGuide />} />
      <Route path="/apply" element={<TeacherApply />} />
      <Route path="/join" element={<JoinClassroom />} />

      {/* 학생 라우트 */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<ProblemList />} />
        <Route path="problems" element={<ProblemList />} />
        <Route path="problems/:problemId" element={<Workspace />} />
        <Route path="gallery/:problemId" element={<Gallery />} />
        <Route path="journey" element={<MyJourney />} />
      </Route>

      {/* 교사 라우트 */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<LiveDashboard />} />
        <Route path="classroom" element={<ClassroomSetup />} />
        <Route path="workshop" element={<ProblemWorkshop />} />
        <Route path="community" element={<ProblemCommunity />} />
        <Route path="assign" element={<ProblemAssign />} />
        <Route path="dashboard" element={<LiveDashboard />} />
        <Route path="ai-reports" element={<AIReports />} />
        <Route path="analysis/:problemId" element={<ApproachAnalysis />} />
        <Route path="guide" element={<AIGuide />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
