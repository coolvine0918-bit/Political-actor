import React, { useState } from 'react';
import { Copy, Check, ExternalLink, FileCode, Layers, HelpCircle, X, Globe, Save, Download } from 'lucide-react';
import { CODE_GS_TEMPLATE, INDEX_HTML_TEMPLATE } from '../data/gasTemplates';

interface GasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
}

export const GasExportModal: React.FC<GasExportModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'html' | 'settings'>('guide');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveUrl = () => {
    onSaveGasUrl(inputUrl.trim());
    setIsUrlSaved(true);
    setTimeout(() => setIsUrlSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              GAS
            </div>
            <div>
              <h2 className="text-xl font-bold">구글 앱스 스크립트(GAS) 배포 센터</h2>
              <p className="text-xs text-slate-300">
                요청하신 단 1개의 백엔드(Code.gs)와 1개의 프론트엔드(Index.html) 파일입니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>3분 배포 가이드</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            <span>백엔드 파일 (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'html'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>프론트엔드 파일 (Index.html)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-600" />
            <span>현재 앱과 구글 시트 URL 연동</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-800 text-sm">
          
          {/* TAB 1: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                  <strong>선생님을 위한 단 3단계 배포 요약:</strong><br />
                  구글 스프레드시트 하나만 만드시면, 별도의 유료 서버나 복잡한 설정 없이 <strong>Google Apps Script</strong>를 통해 학생들에게 웹 퀴즈를 공유하고 학번, 이름, 점수를 자동으로 누적 기록할 수 있습니다!
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      새 구글 스프레드시트 생성 및 Apps Script 열기
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      구글 드라이브(<a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="w-3 h-3" /></a>)에서 새 시트를 만듭니다.<br />
                      상단 메뉴에서 <strong>[확장 프로그램] ➔ [Apps Script]</strong>를 클릭하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      Code.gs 와 Index.html 파일 붙여넣기
                    </h4>
                    <div className="text-slate-600 text-xs sm:text-sm leading-relaxed space-y-2">
                      <p>
                        ① 기본 생성된 <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-xs">Code.gs</code>에 [백엔드 파일] 탭의 코드를 모두 복사하여 붙여넣고 저장(Ctrl+S)합니다.
                      </p>
                      <p>
                        ② 왼쪽 파일 목록의 <strong>[+] 버튼 ➔ [HTML]</strong>을 클릭하고 파일명으로 <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-xs">Index</code>를 입력합니다.
                      </p>
                      <p>
                        ③ 생성된 <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-xs">Index.html</code>에 [프론트엔드 파일] 탭의 코드를 모두 복사하여 붙여넣고 저장합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      웹 앱으로 배포하기 (★권한 설정 중요)
                    </h4>
                    <div className="text-slate-600 text-xs sm:text-sm leading-relaxed space-y-1.5">
                      <p>Apps Script 우측 상단의 <strong>[배포] ➔ [새 배포]</strong>를 클릭합니다.</p>
                      <p>유형 선택(톱니바퀴 아이콘)에서 <strong>[웹 앱]</strong>을 선택합니다.</p>
                      <ul className="list-disc list-inside bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1 font-medium">
                        <li><strong>다음 사용자 권한으로 실행:</strong> <span className="text-blue-700 font-bold">나(내 계정)</span></li>
                        <li><strong>액세스 권한이 있는 사용자:</strong> <span className="text-red-700 font-bold">모든 사용자(Anyone)</span> (로그인 없이 학생 응시 가능)</li>
                      </ul>
                      <p className="mt-1">
                        [배포]를 누르면 생성되는 <strong>웹 앱 URL</strong>을 복사하여 학생들에게 공유하면 끝납니다!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE.GS */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">Code.gs (Apps Script 백엔드)</h3>
                  <p className="text-xs text-slate-500">Google 스프레드시트의 시트 행에 학번, 이름, 점수, 세부 채점 내역을 기록합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile('Code.gs', CODE_GS_TEMPLATE, 'application/javascript')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Code.gs 다운로드</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(CODE_GS_TEMPLATE, 'codegs')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedType === 'codegs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedType === 'codegs' ? '복사 완료!' : 'Code.gs 전체 복사'}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto max-h-[460px] leading-relaxed select-all">
                {CODE_GS_TEMPLATE}
              </pre>
            </div>
          )}

          {/* TAB 3: INDEX.HTML */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">Index.html (Apps Script 프론트엔드 단일 파일)</h3>
                  <p className="text-xs text-slate-500">
                    반응형 3단 선긋기 인터랙티브 캔버스, 자동 채점, 정답/오답 해설 모달이 단 1개의 HTML 파일에 모두 내장되어 있습니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile('Index.html', INDEX_HTML_TEMPLATE, 'text/html')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Index.html 다운로드</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(INDEX_HTML_TEMPLATE, 'indexhtml')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedType === 'indexhtml' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedType === 'indexhtml' ? '복사 완료!' : 'Index.html 전체 복사'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                💡 구글 스프레드시트 Apps Script에서 <strong>[+] ➔ [HTML]</strong> 생성 후 이름을 <code>Index</code>로 적고, 위 <strong>[Index.html 전체 복사]</strong>를 눌러 붙여넣으시면 됩니다.
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto max-h-[460px] leading-relaxed select-all">
                {INDEX_HTML_TEMPLATE}
              </pre>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  현재 AI Studio 웹 앱에서 실제 내 구글 시트로 직접 점수 전송하기
                </h3>
                <p className="text-xs text-slate-600">
                  선생님께서 구글 앱스 스크립트를 배포하고 얻은 <strong>웹 앱 URL</strong> (예: <code className="font-mono text-blue-600">https://script.google.com/macros/s/.../exec</code>)을 아래에 입력하시면, 현재 이 웹 페이지에서 학생들이 제출한 결과도 선생님의 구글 시트로 바로 전송됩니다!
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  구글 앱스 스크립트 웹 앱 URL (Web App URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-blue-500 font-mono"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shrink-0"
                  >
                    {isUrlSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{isUrlSaved ? '저장됨!' : 'URL 저장'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  * URL을 입력하지 않아도 로컬 시뮬레이션 모드로 즉시 채점 및 결과 보기가 완벽하게 작동합니다.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
