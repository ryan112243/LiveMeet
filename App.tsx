import React, { useState, useRef, useEffect } from 'react';
import { MeetingStatus } from './types';
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

export default function App() {
  const [status, setStatus] = useState<MeetingStatus>(MeetingStatus.LOBBY);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false); // Track if user created the room
  
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
    assignRole
  } = useWebRTC({
    onStatusChange: setStatus
  });

  // Initialize Local Stream on Mount (Lobby)
  useEffect(() => {
    startLocalStream();
  }, [startLocalStream]);

  // Sync controls with WebRTC hook
  useEffect(() => {
      toggleMic(isMicOn);
      toggleCam(isCamOn);
  }, [isMicOn, isCamOn, toggleMic, toggleCam]);

  // Attach local stream to preview video when available
  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  const generateRoomCode = () => {
      const code = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 5);
      setRoomCode(code);
      setCopySuccess(false);
      setIsInitiator(true); // User generated code, so they are the initiator/host
  };

  const handleCopyCode = () => {
      if (!roomCode) return;
      navigator.clipboard.writeText(roomCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleJoin = () => {
    if (!roomCode) return;
    // Connect passing the isInitiator flag to determine initial role
    connect(roomCode, isMicOn, isCamOn, isInitiator);
  };

  const handleEndCall = () => {
    disconnect();
    setStatus(MeetingStatus.ENDED);
  };
  
  const handleReturnToLobby = () => {
      setStatus(MeetingStatus.LOBBY);
      setRoomCode('');
      setCopySuccess(false);
      setIsMicOn(true);
      setIsCamOn(true);
      setIsSidebarOpen(false);
      setIsInitiator(false); // Reset initiator status
  }

  // --- Views ---

  if (status === MeetingStatus.ENDED) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#202124] text-white space-y-6">
              <h1 className="text-4xl font-normal">你已離開會議</h1>
              <button 
                onClick={handleReturnToLobby}
                className="px-6 py-3 bg-blue-300 text-blue-900 font-semibold rounded hover:bg-blue-200 transition"
              >
                  重新加入
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
           {/* Left Side: Pitch & Inputs */}
           <div className="flex flex-col space-y-8 max-w-lg">
               <div className="space-y-4">
                   <h1 className="text-4xl md:text-5xl font-normal leading-tight">
                       優質視訊會議，現在免費供所有人使用。
                   </h1>
                   <p className="text-gray-400 text-lg">
                       我們重新設計了這項服務，提供安全的商務會議，並免費開放給所有人使用。
                   </p>
               </div>
               
               <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                   <button 
                    onClick={generateRoomCode}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition flex items-center justify-center space-x-2"
                   >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                       <span>發起會議</span>
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
                            placeholder="輸入代碼或連結"
                            value={roomCode}
                            onChange={(e) => {
                                setRoomCode(e.target.value);
                                setIsInitiator(false); // Typing code means joining, not creating
                            }}
                            className="pl-10 pr-12 py-3 bg-transparent border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           />
                           {roomCode && (
                               <button 
                                 onClick={handleCopyCode}
                                 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                 title="複製會議代碼"
                               >
                                 {copySuccess ? (
                                   <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                   </svg>
                                 ) : (
                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                   </svg>
                                 )}
                               </button>
                           )}
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
                    <button 
                      onClick={() => startLocalStream()}
                      className="mt-3 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded uppercase tracking-wide transition"
                    >
                      重試相機
                    </button>
                 </div>
               )}
           </div>

           {/* Right Side: Preview */}
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
                
                {/* Lobby Controls Overlay */}
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

  // Meeting View
  return (
    <div className="h-screen flex flex-col bg-[#202124]">
      {/* Main Content Area: Video Grid + Sidebar */}
      <main className="flex-1 flex relative overflow-hidden">
          
          {/* Video Grid Section */}
          <div className="flex-1 flex flex-col relative">
             
             {/* Screen Share Notification */}
             {isScreenSharing && (
                <div className="bg-blue-100 text-blue-800 px-4 py-2 text-center text-sm font-medium flex items-center justify-center space-x-2">
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
                isCamOn={isCamOn && !isScreenSharing} // Hide local cam placeholder if screen sharing (or mirror logic)
                myRole={myRole}
             />
             
             {/* Floating Info Badge (Room ID) */}
             <div className="absolute top-6 left-6 p-3 bg-[#202124]/90 backdrop-blur rounded-lg text-white font-medium flex items-center space-x-3 shadow-lg border border-gray-700 z-10">
                <span>{roomId}</span>
                <div className="w-px h-4 bg-gray-500"></div>
                {remoteStreams.length === 0 ? (
                    <span className="text-gray-400 text-sm">等待其他人加入...</span>
                ) : (
                    <span className="text-green-400 text-sm">{remoteStreams.length + 1} 位參與者</span>
                )}
             </div>
          </div>

          {/* Collapsible Sidebar */}
          <ParticipantSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            remoteStreams={remoteStreams}
            peerStates={peerStates}
            localStream={localStream}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            myRole={myRole}
            onAssignRole={assignRole}
          />
      </main>
      
      {/* Footer Control Bar */}
      <ControlBar 
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        isSidebarOpen={isSidebarOpen}
        isScreenSharing={isScreenSharing}
        onToggleMic={() => setIsMicOn(!isMicOn)}
        onToggleCam={() => setIsCamOn(!isCamOn)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleScreenShare={toggleScreenShare}
        onEndCall={handleEndCall}
      />
    </div>
  );
}