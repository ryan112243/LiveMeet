import React from 'react';

interface ControlBarProps {
  isMicOn: boolean;
  isCamOn: boolean;
  isSidebarOpen: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleSidebar: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ 
  isMicOn, 
  isCamOn, 
  isSidebarOpen,
  isScreenSharing,
  onToggleMic, 
  onToggleCam, 
  onToggleSidebar,
  onToggleScreenShare,
  onEndCall 
}) => {
  return (
    <div className="bg-[#202124] h-20 flex items-center justify-center space-x-4 px-4 relative">
      {/* Microphone Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-4 rounded-full transition-colors ${
          isMicOn 
            ? 'bg-[#3c4043] hover:bg-[#434649] text-white' 
            : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
        }`}
        title={isMicOn ? "關閉麥克風" : "開啟麥克風"}
      >
        {isMicOn ? (
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 5.02L12.02 19l.98 2.02c3.39-.49 6-3.39 6-6.92h-1.7c0 1.1-.41 2.1-1.12 2.88l-1.16-1.16zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l2.97 2.97c-.85.39-1.8.63-2.8.63-2.76 0-5-2.24-5-5H6c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3zM12 4c1.66 0 3 1.34 3 3v3.28l-2-2V5c0-.55-.45-1-1-1-.55 0-1 .45-1 1v.01l-2-2V5c0-1.66 1.34-3 3-3z"/>
          </svg>
        )}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onToggleCam}
        disabled={isScreenSharing}
        className={`p-4 rounded-full transition-colors ${
          isScreenSharing
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : isCamOn 
                ? 'bg-[#3c4043] hover:bg-[#434649] text-white' 
                : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
        }`}
        title={isScreenSharing ? "螢幕分享中無法開啟相機" : isCamOn ? "關閉相機" : "開啟相機"}
      >
         {isCamOn && !isScreenSharing ? (
           <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
            <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>
           </svg>
         ) : (
           <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
           </svg>
         )}
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={onToggleScreenShare}
        className={`p-4 rounded-full transition-colors ${
          isScreenSharing 
            ? 'bg-blue-200 hover:bg-blue-100 text-blue-900' 
            : 'bg-[#3c4043] hover:bg-[#434649] text-white'
        }`}
        title={isScreenSharing ? "停止分享螢幕" : "分享螢幕"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
            {/* Added arrow for visual clarity on "Share" */}
            {!isScreenSharing && <path d="M12 13l-4-4h8z" fill="#9aa0a6" opacity="0.5"/>}
        </svg>
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="px-8 py-3 bg-[#ea4335] hover:bg-[#d93025] text-white rounded-full flex items-center space-x-2"
        title="離開通話"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
           <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.36 7.46 6 12 6s8.66 2.36 11.71 5.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
        </svg>
      </button>

       {/* Sidebar Toggle */}
       <div className="absolute right-4 flex items-center">
            <button
                onClick={onToggleSidebar}
                className={`p-3 rounded-full transition-colors ${
                  isSidebarOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-[#3c4043]'
                }`}
                title="顯示成員"
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
            </button>
       </div>
    </div>
  );
};

export default ControlBar;