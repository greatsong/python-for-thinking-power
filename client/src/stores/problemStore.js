import { create } from 'zustand';
import { apiFetch } from '../api/client.js';

const useProblemStore = create((set) => ({
  problems: [],
  problemSets: [],
  currentProblem: null,
  currentSetProgress: null,
  loading: false,
  setsLoading: false,

  fetchProblems: async () => {
    set({ loading: true });
    try {
      const problems = await apiFetch('/problems');
      set({ problems, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchProblemSets: async () => {
    set({ setsLoading: true });
    try {
      const sets = await apiFetch('/problems/sets');
      set({ problemSets: sets, setsLoading: false });
      return sets;
    } catch (err) {
      set({ setsLoading: false });
      return [];
    }
  },

  fetchSetProgress: async (setId) => {
    try {
      const progress = await apiFetch(`/problems/sets/${setId}/progress`);
      set({ currentSetProgress: progress });
      return progress;
    } catch {
      return null;
    }
  },

  fetchProblem: async (id) => {
    set({ loading: true });
    try {
      const problem = await apiFetch(`/problems/${id}`);
      set({ currentProblem: problem, loading: false });
      return problem;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  clearCurrent: () => set({ currentProblem: null }),
  clearSetProgress: () => set({ currentSetProgress: null }),
}));

export default useProblemStore;
