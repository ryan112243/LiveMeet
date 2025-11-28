
import React, { useState, useRef, useEffect } from 'react';
import { MeetingStatus, UserRole, RecordingItem } from './types';
import { useWebRTC } from './hooks/useGeminiLive';
import ControlBar from './components/ControlBar';
import VideoGrid from './components/VideoGrid';
import ParticipantSidebar from './components/ParticipantSidebar';

const TimeDisplay = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <span className="text-gray-400 text-lg font-medium">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
}

const RecordingControls = ({ 
    isVideoRecording, 
    isAudioRecording, 
    onToggleVideoRec, 
    onToggleAudioRec,
    canRecord 
}: {
    isVideoRecording: boolean,
    isAudioRecording: boolean,
    onToggleVideoRec: () => void,
    onToggleAudioRec: () => void,
    canRecord: boolean
}) => {
    if (!canRecord) return null;

    return (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
            <button
                onClick={onToggleVideoRec}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-lg ${
                    isVideoRecording ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-gray-800/80 text-gray-200 hover:bg-gray-700 border border-gray-600'
                }`}
            >
                 <div className={`w-2.5 h-2.5 rounded-full ${isVideoRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                 <span>{isVideoRecording ? "停止錄影" : "錄影"}</span>
            </button>

            <button
                onClick={onToggleAudioRec}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-lg ${
                    isAudioRecording ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-gray-800/80 text-gray-200 hover:bg-gray-700 border border-gray-600'
                }`}
            >
                 <div className={`w-2.5 h-2.5 rounded-full ${isAudioRecording ? 'bg-white' : 'bg-blue-500'}`}></div>
                 <span>{isAudioRecording ? "停止錄音" : "錄音"}</span>
            </button>
        </div>
    )
}

// Toasts
const MeetingInfoToast = ({ roomId, onClose }: { roomId: string, onClose: () => void }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="fixed bottom-24 left-6 z-40 bg-[#202124] border border-gray-600 p-4 rounded-lg shadow-xl w-80 animate-slide-up">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-medium">會議已就緒</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-gray-400 mb-3">與其他人分享此代碼即可邀請他們加入。</p>
            <div className="flex bg-[#3c4043] rounded p-2 items-center justify-between">
                <span className="text-sm text-white font-mono select-all">{roomId}</span>
                <button onClick={copy} className="text-blue-300 hover:text-white">
                    {copied ? <span className="text-green-400 text-xs">已複製</span> : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                </button>
            </div>
        </div>
    )
}

const NewMessageToast = ({ onClick }: { onClick: () => void }) => (
    <div 
        onClick={onClick}
        className="fixed bottom-24 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-xl cursor-pointer flex items-center gap-3 animate-bounce transition-transform hover:scale-105"
    >
        <div className="p-2 bg-white/20 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </div>
        <div>
            <p className="font-bold">新留言</p>
            <p className="text-xs opacity-90">點擊查看</p>
        </div>
    </div>
)


export default function App() {
  const [status, setStatus] = useState<MeetingStatus>(MeetingStatus.LOBBY);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState(''); // Nickname state
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInfoToast, setShowInfoToast] = useState(false);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const { 
    startLocalStream, 
    connect, 
    disconnect, 
    remoteStreams, 
    peerStates, 
    localStream, 
    error, 
    roomId, 
    toggleMic, 
    toggleCam,
    isScreenSharing,
    toggleScreenShare,
    myRole,
    assignRole,
    kickPeer,
    banPeer,
    adminAction,
    endMeetingForAll,
    transferCreatorRole,
    chatHistory,
    sendMessage,
    togglePinMessage,
    deleteMessage,
    hasUnreadMsg,
    setHasUnreadMsg,
    sharedFiles,
    shareFile,
    deleteSharedFile,
    isVideoRecording,
    startVideoRecording,
    stopVideoRecording,
    isAudioRecording,
    startAudioRecording,
    stopAudioRecording,
    videoRecordings,
    audioRecordings,
    isHandRaised,
    toggleHand,
    isMicDisabled,
    isChatDisabled
  } = useWebRTC({
    onStatusChange: (s) => {
        setStatus(s);
        if (s === MeetingStatus.CONNECTED) {
            setShowInfoToast(true);
        }
    }
  });

  useEffect(() => {
    startLocalStream();
  }, [startLocalStream]);

  useEffect(() => {
      toggleMic(isMicOn);
      toggleCam(isCamOn);
  }, [isMicOn, isCamOn, toggleMic, toggleCam]);

  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  const generateRoomCode = () => {
      const code = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 5);
      setRoomCode(code);
      setCopySuccess(false);
      setIsInitiator(true);
  };

  const handleCopyCode = () => {
      if (!roomCode) return;
      navigator.clipboard.writeText(roomCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleJoin = () => {
    if (!roomCode) return;
    const finalName = displayName.trim() || `Guest-${Math.floor(Math.random()*1000)}`;
    connect(roomCode, finalName, isMicOn, isCamOn, isInitiator);
  };

  const handleLeaveAttempt = () => {
    if (myRole === 'CREATOR' && remoteStreams.length > 0) {
        setShowTransferModal(true);
    } else {
        disconnect();
    }
  };

  const handleTransferAndLeave = (targetPeerId: string) => {
      transferCreatorRole(targetPeerId);
      setShowTransferModal(false);
      disconnect();
  };
  
  const handleReturnToLobby = () => {
      setStatus(MeetingStatus.LOBBY);
      setRoomCode('');
      setCopySuccess(false);
      setIsMicOn(true);
      setIsCamOn(true);
      setIsSidebarOpen(false);
      setIsInitiator(false);
      setShowInfoToast(false);
      setDisplayName('');
  }
  
  const downloadChat = () => {
      const textContent = chatHistory.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName}: ${m.text}`).join('\n');
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-chat-${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const downloadRecording = (item: RecordingItem) => {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date(item.timestamp).toLocaleTimeString();
      a.download = `meeting-${item.type}-${dateStr}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  // --- Views ---

  if (status === MeetingStatus.ENDED || status === MeetingStatus.ENDED_BY_HOST || status === MeetingStatus.KICKED || status === MeetingStatus.BANNED || status === MeetingStatus.ROOM_NOT_FOUND) {
      let title = "你已離開會議";
      let desc = "";
      let isError = false;
      const isHostEnd = status === MeetingStatus.ENDED && isInitiator;

      if (status === MeetingStatus.ENDED_BY_HOST) {
          title = "會議已由主持人結束";
          desc = "感謝您的參與。";
      } else if (status === MeetingStatus.KICKED) {
          title = "你已被移除";
          desc = "你已被移出此會議。";
      } else if (status === MeetingStatus.BANNED) {
          title = "你已被封鎖";
          desc = "你無法再次加入此會議。";
      } else if (status === MeetingStatus.ROOM_NOT_FOUND) {
          title = "找不到會議";
          desc = "該會議代碼不存在或會議尚未開始。請確認代碼或聯繫發起人。";
          isError = true;
      } else if (isHostEnd) {
          title = "會議已結束";
          desc = "你可以下載會議記錄或錄影檔案。";
      }

      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#202124] text-white space-y-6 p-4">
              {isError && <div className="bg-red-500/20 p-4 rounded-full mb-4"><svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>}
              <h1 className="text-4xl font-normal">{title}</h1>
              {desc && <p className="text-gray-400 max-w-md text-center leading-relaxed">{desc}</p>}
              
              {isHostEnd && (
                  <div className="flex flex-col gap-4 w-full max-w-lg mt-4">
                      {chatHistory.length > 0 && (
                          <button onClick={downloadChat} className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center gap-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              下載聊天記錄
                          </button>
                      )}

                      {videoRecordings.length > 0 && (
                          <div className="bg-black/30 p-4 rounded border border-gray-700">
                              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">錄影檔案</h3>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {videoRecordings.map((item, idx) => (
                                      <button 
                                        key={item.id} 
                                        onClick={() => downloadRecording(item)}
                                        className="w-full flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700 rounded transition"
                                      >
                                          <div className="flex items-center gap-2">
                                              <span className="bg-red-900/50 text-red-200 text-xs px-2 py-0.5 rounded">Video</span>
                                              <span className="text-sm">錄影 #{idx + 1}</span>
                                          </div>
                                          <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {audioRecordings.length > 0 && (
                          <div className="bg-black/30 p-4 rounded border border-gray-700">
                              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">錄音檔案</h3>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {audioRecordings.map((item, idx) => (
                                      <button 
                                        key={item.id} 
                                        onClick={() => downloadRecording(item)}
                                        className="w-full flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700 rounded transition"
                                      >
                                          <div className="flex items-center gap-2">
                                              <span className="bg-blue-900/50 text-blue-200 text-xs px-2 py-0.5 rounded">Audio</span>
                                              <span className="text-sm">錄音 #{idx + 1}</span>
                                          </div>
                                          <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              <button 
                onClick={handleReturnToLobby}
                className="px-6 py-3 bg-blue-300 text-blue-900 font-semibold rounded hover:bg-blue-200 transition mt-4"
              >
                  返回首頁
              </button>
          </div>
      )
  }

  if (status === MeetingStatus.LOBBY || status === MeetingStatus.JOINING) {
    return (
      <div className="min-h-screen flex flex-col bg-[#202124] text-white">
        <header className="p-4 flex justify-between items-center">
             <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M14 17h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm2 9c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v14z"/></svg>
                </div>
                <span className="text-xl text-gray-300">Live Meet</span>
             </div>
             <div className="flex items-center space-x-4">
                 <TimeDisplay />
             </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-12">
           <div className="flex flex-col space-y-8 max-w-lg">
               <div className="space-y-4">
                   <h1 className="text-4xl md:text-5xl font-normal leading-tight">
                       優質免登入視訊會議，供所有人使用。
                   </h1>
                   <p className="text-gray-400 text-lg">
                       請輸入您的暱稱並加入會議。
                   </p>
               </div>

               <div className="flex flex-col gap-4 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                   <label className="text-sm text-gray-400 font-bold uppercase">您的顯示名稱</label>
                   <input
                        type="text"
                        placeholder="例如：王小明"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-gray-500 focus:border-blue-500 py-2 text-white text-lg focus:outline-none transition-colors"
                   />
               </div>
               
               <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-2">
                   <button 
                    onClick={generateRoomCode}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition flex items-center justify-center space-x-2 shadow-lg"
                   >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                       <span>發起新會議</span>
                   </button>
                   
                   <div className="flex items-center space-x-2">
                       <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                           <input 
                            type="text" 
                            placeholder="輸入會議代碼"
                            value={roomCode}
                            onChange={(e) => {
                                setRoomCode(e.target.value);
                                setIsInitiator(false);
                            }}
                            className="pl-10 pr-12 py-3 bg-transparent border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           />
                       </div>
                       <button 
                        onClick={handleJoin}
                        disabled={!roomCode || status === MeetingStatus.JOINING}
                        className="text-blue-300 font-medium hover:bg-blue-900/30 px-4 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           {status === MeetingStatus.JOINING ? '加入中...' : '加入'}
                       </button>
                   </div>
               </div>
               
               <div className="h-px bg-gray-700 w-full"></div>
               {error && (
                 <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200 text-sm">
                    <p className="mb-2 font-bold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      錯誤
                    </p>
                    <p>{error}</p>
                 </div>
               )}
           </div>

           <div className="relative w-full max-w-xl aspect-video bg-[#202124] rounded-lg overflow-hidden shadow-2xl border border-gray-700">
                {localStream && (
                    <video 
                        ref={videoPreviewRef} 
                        autoPlay 
                        muted 
                        playsInline
                        className={`w-full h-full object-cover transform scale-x-[-1] ${!isCamOn ? 'hidden' : ''}`}
                    />
                )}
                {!isCamOn && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        相機已關閉
                    </div>
                )}
                {!localStream && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        正在啟動相機...
                    </div>
                )}
                {error && !localStream && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-800">
                        <svg className="w-12 h-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        <span>無法使用相機</span>
                    </div>
                )}
                
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-6 z-10">
                    <button 
                        onClick={() => setIsMicOn(!isMicOn)}
                        className={`p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${isMicOn ? 'bg-[#3c4043] hover:bg-[#434649] text-white border border-gray-500' : 'bg-[#ea4335] text-white border-transparent'}`}
                    >
                        {isMicOn ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 5.02L12.02 19l.98 2.02c3.39-.49 6-3.39 6-6.92h-1.7c0 1.1-.41 2.1-1.12 2.88l-1.16-1.16zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l2.97 2.97c-.85.39-1.8.63-2.8.63-2.76 0-5-2.24-5-5H6c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3zM12 4c1.66 0 3 1.34 3 3v3.28l-2-2V5c0-.55-.45-1-1-1-.55 0-1 .45-1 1v.01l-2-2V5c0-1.66 1.34-3 3-3z"/>
                            </svg>
                        )}
                    </button>
                     <button 
                        onClick={() => setIsCamOn(!isCamOn)}
                        className={`p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${isCamOn ? 'bg-[#3c4043] hover:bg-[#434649] text-white border border-gray-500' : 'bg-[#ea4335] text-white border-transparent'}`}
                    >
                         {isCamOn ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>
                            </svg>
                         ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                            </svg>
                         )}
                    </button>
                </div>
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#202124]">
      <main className="flex-1 flex relative overflow-hidden">
          
         <RecordingControls 
            isVideoRecording={isVideoRecording}
            isAudioRecording={isAudioRecording}
            onToggleVideoRec={() => isVideoRecording ? stopVideoRecording() : startVideoRecording()}
            onToggleAudioRec={() => isAudioRecording ? stopAudioRecording() : startAudioRecording()}
            canRecord={myRole === 'CREATOR' || myRole === 'ADMIN'}
         />
          
          <div className="flex-1 flex flex-col relative">
             
             {isScreenSharing && (
                <div className="bg-blue-100 text-blue-800 px-4 py-2 text-center text-sm font-medium flex items-center justify-center space-x-2 relative z-10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>你正在向所有人分享螢幕</span>
                </div>
             )}
             
             <VideoGrid 
                localStream={localStream}
                remoteStreams={remoteStreams}
                peerStates={peerStates}
                isCamOn={isCamOn && !isScreenSharing} 
                myRole={myRole}
                isHandRaised={isHandRaised}
                isScreenSharing={isScreenSharing}
                displayName={displayName}
             />
             
             <div className="absolute bottom-4 left-6 p-2 bg-[#202124]/80 backdrop-blur rounded text-white font-medium flex items-center space-x-3 shadow-lg border border-gray-700 z-10 text-sm">
                <span>{roomId}</span>
                <div className="w-px h-3 bg-gray-500"></div>
                 <span className="text-gray-300 text-xs">{remoteStreams.length + 1} 位參與者</span>
             </div>
          </div>

          <ParticipantSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            remoteStreams={remoteStreams}
            peerStates={peerStates}
            localStream={localStream}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            myRole={myRole}
            isHandRaised={isHandRaised}
            onAssignRole={assignRole}
            onKick={kickPeer}
            onBan={banPeer}
            adminAction={adminAction}
            chatMessages={chatHistory}
            onSendMessage={sendMessage}
            onTogglePin={togglePinMessage}
            onDeleteMessage={deleteMessage}
            hasUnreadMsg={hasUnreadMsg}
            onReadMsg={() => setHasUnreadMsg(false)}
            isChatDisabled={isChatDisabled}
            displayName={displayName}
            roomId={roomId}
            sharedFiles={sharedFiles}
            onShareFile={shareFile}
            onDeleteFile={deleteSharedFile}
          />
      </main>
      
      <ControlBar 
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        isSidebarOpen={isSidebarOpen}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        hasUnreadMsg={hasUnreadMsg}
        myRole={myRole}
        isMicDisabled={isMicDisabled}
        onToggleMic={() => setIsMicOn(!isMicOn)}
        onToggleCam={() => setIsCamOn(!isCamOn)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleScreenShare={toggleScreenShare}
        onToggleHand={toggleHand}
        onEndCall={handleLeaveAttempt}
        onEndMeetingForAll={endMeetingForAll}
      />

      {/* Toasts */}
      {showInfoToast && (
          <MeetingInfoToast 
            roomId={roomId} 
            onClose={() => setShowInfoToast(false)} 
          />
      )}
      
      {hasUnreadMsg && !isSidebarOpen && (
          <NewMessageToast onClick={() => setIsSidebarOpen(true)} />
      )}

      {/* Host Transfer Modal */}
      {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-[#202124] p-6 rounded-lg shadow-xl max-w-sm w-full border border-gray-600">
                  <h3 className="text-xl font-semibold mb-4 text-white">移交主持人權限</h3>
                  <p className="text-gray-400 mb-4 text-sm">您是此會議的建立者。離開前，請選擇一位參與者成為新的主持人。</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                      {remoteStreams.map(peer => (
                          <button
                              key={peer.peerId}
                              onClick={() => handleTransferAndLeave(peer.peerId)}
                              className="w-full flex items-center p-3 rounded hover:bg-blue-900/30 border border-transparent hover:border-blue-500 transition"
                          >
                              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold text-white mr-3">
                                  {peer.peerId.substring(0, 1).toUpperCase()}
                              </div>
                              <span className="text-gray-200">使用者 {peer.peerId.substring(0, 4)}</span>
                          </button>
                      ))}
                  </div>
                  <button 
                      onClick={() => setShowTransferModal(false)}
                      className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                      取消
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
