import { useState } from 'react';

type Project = {
  id: string;
  name: string;
  location: string;
  estimatedValue: number;
  riskSummary: string;
};

export default function AIAnalysisButton({ project }: { project: Project }) {
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    if (!query.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          projectId: project.id
        })
      });

      const data = await res.json();
      if (data.response) {
        setResponse(data.response);
      } else {
        setResponse('분석 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setResponse('AI 분석 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const predefinedQuestions = [
    '이 프로젝트의 투자 장점은 무엇인가요?',
    '주요 리스크 요소를 분석해주세요.',
    '예상 수익률이 합리적인가요?',
    '다른 프로젝트와 비교했을 때 어떤가요?'
  ];

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
      >
        🤖 AI 분석
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🤖 AI 투자 분석</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">분석 대상: {project.name}</p>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  질문을 입력하세요
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="예: 이 프로젝트의 투자 리스크는 무엇인가요?"
                  className="w-full border rounded px-3 py-2 h-20 resize-none"
                />
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">또는 미리 준비된 질문을 선택하세요:</p>
                <div className="grid grid-cols-1 gap-2">
                  {predefinedQuestions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(q)}
                      className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAnalysis}
                disabled={loading}
                className="w-full px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300"
              >
                {loading ? '🤖 분석 중...' : '🤖 AI 분석 요청'}
              </button>
            </div>

            {response && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">🤖 AI 분석 결과:</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              ⚠️ AI 분석은 참고용이며, 실제 투자 결정은 개인의 책임입니다.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

