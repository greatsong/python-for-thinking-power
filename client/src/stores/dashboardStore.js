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
}));

export default useDashboardStore;
