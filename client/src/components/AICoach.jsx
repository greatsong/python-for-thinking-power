import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageCircleOff, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useChatStore from '../stores/chatStore.js';

export default function AICoach({ problemId, classroomId, code }) {
  const [input, setInput] = useState('');
  const isComposingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const { messages, isStreaming, streamingText, aiDisabled, aiNoKey, sendMessage, loadConversation, resetChat } = useChatStore();

  useEffect(() => {
    resetChat();
    if (problemId) {
      loadConversation(problemId, classroomId);
    }
  }, [problemId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    await sendMessage({ problemId, classroomId, message: trimmed, code });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  if (aiDisabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center gap-3">
        <MessageCircleOff size={32} />
        <p className="text-sm">이 문제에서는 AI 코치가 비활성화되어 있어요.</p>
        <p className="text-xs text-slate-500">선생님이 스스로 풀어보길 원하고 있어요!</p>
      </div>
    );
  }

  if (aiNoKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center gap-3">
        <MessageCircleOff size={32} />
        <p className="text-sm">AI 코치를 사용할 수 없어요.</p>
        <p className="text-xs text-slate-500">선생님이 아직 API 키를 설정하지 않았어요.</p>
      </div>
    );
  }

  const quickPrompts = ['이 문제 어떻게 시작해?', '내 코드 뭐가 잘못됐어?', '힌트 좀 줘!', '다른 방법은 없어?'];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4 dark-scroll">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center mt-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
              <Sparkles size={22} className="text-violet-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">AI 코치에게 물어보세요!</p>
            <p className="text-xs text-slate-600">코드를 작성하다 막히면 언제든 도움을 요청하세요</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors border border-slate-700/50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/20">
                <Bot size={13} className="text-violet-400" />
              </div>
            )}
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/50'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="markdown-dark">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
                <User size={13} className="text-blue-400" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming */}
        {isStreaming && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/20">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm bg-slate-800/80 text-slate-200 max-w-[85%] border border-slate-700/50">
              {streamingText ? (
                <div className="markdown-dark">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 py-1">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">생각하는 중...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder="질문을 입력하세요..."
            rows={1}
            className="flex-1 bg-slate-800/50 text-slate-200 text-sm rounded-xl px-4 py-2.5 resize-none placeholder-slate-600 border border-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            style={{ minHeight: '40px', maxHeight: '100px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 transition-all shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
