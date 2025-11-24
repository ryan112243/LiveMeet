import React, { useEffect, useRef } from 'react';
import { PeerStream, PeerMetadata, UserRole } from '../types';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: PeerStream[];
  peerStates: Record<string, PeerMetadata>;
  isCamOn: boolean;
  myRole: UserRole;
}

const RoleBadge: React.FC<{ role?: UserRole }> = ({ role }) => {
    if (role === 'CREATOR') {
        return (
            <div title="建立者" className="bg-yellow-500/80 p-1 rounded-full text-white ml-2">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
        )
    }
    if (role === 'ADMIN') {
        return (
            <div title="管理者" className="bg-blue-500/80 p-1 rounded-full text-white ml-2">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
            </div>
        )
    }
    return null;
}

const VideoTile: React.FC<{ stream: MediaStream | null; label: string; isMirrored?: boolean; isMuted?: boolean; role?: UserRole }> = ({ stream, label, isMirrored, isMuted, role }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-[#3c4043] rounded-xl overflow-hidden flex-1 min-w-[300px] aspect-video shadow-lg border border-[#5f6368]">
      {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted} // Mute local video to prevent echo, remote videos should play audio
            className={`w-full h-full object-cover ${isMirrored ? 'transform scale-x-[-1]' : ''}`}
          />
      ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#202124]">
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {label.charAt(0)}
            </div>
          </div>
      )}
      <div className="absolute bottom-3 left-3 flex items-center bg-black/50 px-2 py-1 rounded">
        <span className="text-white text-xs font-medium">{label}</span>
        <RoleBadge role={role} />
      </div>
    </div>
  );
};

const VideoGrid: React.FC<VideoGridProps> = ({ 
  localStream, 
  remoteStreams,
  peerStates,
  isCamOn,
  myRole
}) => {
  
  // Calculate grid columns based on participant count
  const total = remoteStreams.length + 1;
  const gridClass = total === 1 ? 'flex items-center justify-center' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className={`flex-1 p-4 w-full h-full overflow-y-auto ${gridClass}`}>
      {/* Remote Peers */}
      {remoteStreams.map((peer) => {
        const state = peerStates[peer.peerId] || { isMicOn: true, isCamOn: true, role: 'MEMBER' };
        return (
            <VideoTile 
                key={peer.peerId} 
                stream={peer.stream} 
                label={`使用者 ${peer.peerId.substring(0, 4)}`} 
                isMuted={false}
                role={state.role}
            />
        )
      })}

      {/* Local User */}
      <VideoTile 
        stream={isCamOn ? localStream : null} 
        label="你" 
        isMirrored={true} 
        isMuted={true}
        role={myRole}
      />
    </div>
  );
};

export default VideoGrid;