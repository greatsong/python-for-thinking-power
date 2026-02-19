import { create } from 'zustand';
import { apiFetch } from '../api/client.js';

const useDashboardStore = create((set) => ({
  overview: null,
  students: [],
  aiSummaries: [],
  matrix: null,
  loading: false,
  matrixLoading: false,

  fetchOverview: async (classroomId) => {
    set({ loading: true });
    try {
      const data = await apiFetch(`/dashboard/overview/${classroomId}`);
      set({ overview: data, loading: false });
      return data;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  fetchStudents: async (classroomId) => {
    try {
      const data = await apiFetch(`/dashboard/students/${classroomId}`);
      set({ students: data });
      return data;
    } catch {
      return [];
    }
  },

  fetchAISummaries: async (classroomId) => {
    try {
      const data = await apiFetch(`/dashboard/ai-summaries/${classroomId}`);
      set({ aiSummaries: data });
      return data;
    } catch {
      return [];
    }
  },

  fetchMatrix: async (classroomId) => {
    set({ matrixLoading: true });
    try {
      const data = await apiFetch(`/dashboard/matrix/${classroomId}`);
      set({ matrix: data, matrixLoading: false });
      return data;
    } catch {
      set({ matrixLoading: false });
      return null;
    }
  },

  // 셀 상세 (학생+문제)
  cellDetail: null,
  cellDetailLoading: false,
  fetchCellDetail: async (classroomId, studentId, problemId) => {
    set({ cellDetailLoading: true });
    try {
      const data = await apiFetch(`/dashboard/cell-detail/${classroomId}/${studentId}/${problemId}`);
      set({ cellDetail: data, cellDetailLoading: false });
      return data;
    } catch {
      set({ cellDetailLoading: false });
      return null;
    }
  },

  // 학생 전체 요약
  studentDetail: null,
  studentDetailLoading: false,
  fetchStudentDetail: async (classroomId, studentId) => {
    set({ studentDetailLoading: true });
    try {
      const data = await apiFetch(`/dashboard/student-detail/${classroomId}/${studentId}`);
      set({ studentDetail: data, studentDetailLoading: false });
      return data;
    } catch {
      set({ studentDetailLoading: false });
      return null;
    }
  },

  // 피드백 저장
  saveFeedback: async (submissionId, { score, grade, feedback }) => {
    try {
      await apiFetch(`/dashboard/feedback/${submissionId}`, {
        method: 'PUT',
        body: JSON.stringify({ score, grade, feedback }),
      });
      return true;
    } catch {
      return false;
    }
  },

  clearCellDetail: () => set({ cellDetail: null }),
  clearStudentDetail: () => set({ studentDetail: null }),
}));

export default useDashboardStore;
