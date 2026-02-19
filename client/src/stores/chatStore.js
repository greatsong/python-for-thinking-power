import { create } from 'zustand';
import { apiFetch, apiStreamPost } from '../api/client.js';

const useChatStore = create((set, get) => ({
  messages: [],
  conversationId: null,
  isStreaming: false,
  streamingText: '',
  aiDisabled: false,
  aiNoKey: false,  // API 키 미설정

  // 대화 초기화 (문제 변경 시)
  resetChat: () => set({
    messages: [],
    conversationId: null,
    isStreaming: false,
    streamingText: '',
    aiDisabled: false,
    aiNoKey: false,
  }),

  // 기존 대화 로드
  loadConversation: async (problemId, classroomId) => {
    try {
      const params = new URLSearchParams({ problemId });
      if (classroomId) params.set('classroomId', classroomId);
      const conversations = await apiFetch(`/ai/conversations?${params}`);
      if (conversations.length > 0) {
        const latest = conversations[0];
        set({
          conversationId: latest.id,
          messages: latest.messages || [],
        });
      }
    } catch {
      // 대화 없으면 무시
    }
  },

  // AI에게 메시지 전송 (스트리밍)
  sendMessage: async ({ problemId, classroomId, message, code }) => {
    const { conversationId, messages } = get();

    // 사용자 메시지 추가
    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    set({
      messages: [...messages, userMsg],
      isStreaming: true,
      streamingText: '',
    });

    let fullText = '';
    let newConvId = conversationId;

    await apiStreamPost('/ai/chat', {
      problemId,
      classroomId,
      message,
      code,
      conversationId,
    }, {
      onText: (text) => {
        fullText += text;
        set({ streamingText: fullText });
      },
      onDone: (data) => {
        if (data?.conversationId) newConvId = data.conversationId;
      },
      onError: (errMsg) => {
        if (errMsg?.includes('비활성화')) {
          set({ aiDisabled: true, isStreaming: false });
          return;
        }
        if (errMsg?.includes('API 키를 설정해야') || errMsg?.includes('API 키가 설정되지')) {
          set({ aiNoKey: true, isStreaming: false });
          return;
        }
        fullText = `오류가 발생했습니다: ${errMsg}`;
      },
    });

    // AI 응답 메시지 추가
    const aiMsg = { role: 'assistant', content: fullText, timestamp: new Date().toISOString() };
    set((state) => ({
      messages: [...state.messages, aiMsg],
      conversationId: newConvId,
      isStreaming: false,
      streamingText: '',
    }));
  },
}));

export default useChatStore;
