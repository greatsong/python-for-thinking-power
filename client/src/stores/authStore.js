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

  // 데모 로그인 (체험용)
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

  // 새로고침 시 user 상태 복원
  restoreUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const user = await apiFetch('/auth/me');
      set({ user });
    } catch {
      // 토큰 만료 시 로그아웃
      localStorage.removeItem('token');
      localStorage.removeItem('classroom');
      set({ user: null, token: null, classroom: null });
    }
  },

  // 프로필 수정 (이름 변경)
  updateProfile: async (name) => {
    const user = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    set({ user });
    return user;
  },

  // 학번 수정
  updateStudentNumber: async (classroomId, studentNumber) => {
    const { user } = get();
    await apiFetch(`/classrooms/${classroomId}/members/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ studentNumber }),
    });
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

  // 레벨업 (현재 레벨 문제집 완료 시)
  levelUp: async () => {
    const result = await apiFetch('/auth/level-up', { method: 'POST' });
    set((state) => ({ user: state.user ? { ...state.user, currentLevel: result.currentLevel } : state.user }));
    return result;
  },

  // 교사가 학생 레벨 조정
  setStudentLevel: async (classroomId, userId, level) => {
    await apiFetch(`/classrooms/${classroomId}/members/${userId}/level`, {
      method: 'PUT',
      body: JSON.stringify({ level }),
    });
  },

  // 교실 나가기 (다른 교실 입장 전)
  leaveClassroom: () => {
    localStorage.removeItem('classroom');
    set({ classroom: null });
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('classroom');
    set({ user: null, token: null, classroom: null });
  },

  isLoggedIn: () => !!get().token,
}));

export default useAuthStore;
