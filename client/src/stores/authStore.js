import { create } from 'zustand';
import { apiFetch } from '../api/client.js';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  classroom: JSON.parse(localStorage.getItem('classroom') || 'null'),
  loading: false,

  // 구글 로그인
  loginWithGoogle: async (credential, role) => {
    set({ loading: true });
    try {
      const { token, user } = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, role }),
      });
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // 데모 로그인 (개발용)
  loginDemo: async (name, role) => {
    set({ loading: true });
    try {
      const { token, user } = await apiFetch('/auth/demo', {
        method: 'POST',
        body: JSON.stringify({ name, role }),
      });
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // 교실 참여
  joinClassroom: async (joinCode, studentNumber) => {
    const { classroom } = await apiFetch('/classrooms/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode, studentNumber }),
    });
    localStorage.setItem('classroom', JSON.stringify(classroom));
    set({ classroom });
    return classroom;
  },

  // 교실 생성 (교사)
  createClassroom: async (name) => {
    const classroom = await apiFetch('/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    const stored = { id: classroom.id, name: classroom.name, joinCode: classroom.join_code };
    localStorage.setItem('classroom', JSON.stringify(stored));
    set({ classroom: stored });
    return classroom;
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('classroom');
    set({ user: null, token: null, classroom: null });
  },

  // 유저 정보 복원 (앱 시작 시)
  isLoggedIn: () => !!get().token,
}));

export default useAuthStore;
