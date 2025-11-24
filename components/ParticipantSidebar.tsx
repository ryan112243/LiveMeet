import React, { useState } from 'react';
import { PeerStream, PeerMetadata, UserRole } from '../types';

interface ParticipantSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    remoteStreams: PeerStream[];
    peerStates: Record<string, PeerMetadata>;
    localStream: MediaStream | null;
    isMicOn: boolean;
    isCamOn: boolean;
    myRole: UserRole;
    onAssignRole: (peerId: string, role: UserRole) => void;
}

const RoleIcon = ({ role }: { role: UserRole }) => {
    if (role === 'CREATOR') {
        return (
            <div title="建立者" className="text-yellow-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
        );
    }
    if (role === 'ADMIN') {
        return (
            <div title="管理者" className="text-blue-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
            </div>
        );
    }
    return null; // Member has no icon
};

const ParticipantItem: React.FC<{ 
    name: string; 
    isMicOn: boolean; 
    isCamOn: boolean;
    role: UserRole;
    isLocal?: boolean;
    canManage?: boolean;
    onPromote?: () => void;
    onDemote?: () => void;
}> = ({ name, isMicOn, isCamOn, role, isLocal, canManage, onPromote, onDemote }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-[#3c4043] rounded-md transition-colors cursor-default group relative">
            <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${isLocal ? 'bg-purple-600' : 'bg-orange-600'}`}>
                    {name.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-200">{name} {isLocal ? '(你)' : ''}</span>
                        <RoleIcon role={role} />
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {/* Mic Status */}
                {!isMicOn ? (
                     <div className="p-1.5 rounded-full bg-red-500/20 text-red-400">
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 5.02L12.02 19l.98 2.02c3.39-.49 6-3.39 6-6.92h-1.7c0 1.1-.41 2.1-1.12 2.88l-1.16-1.16zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l2.97 2.97c-.85.39-1.8.63-2.8.63-2.76 0-5-2.24-5-5H6c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3zM12 4c1.66 0 3 1.34 3 3v3.28l-2-2V5c0-.55-.45-1-1-1-.55 0-1 .45-1 1v.01l-2-2V5c0-1.66 1.34-3 3-3z"/>
                         </svg>
                     </div>
                ) : (
                    <div className="p-1.5 text-gray-400">
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                         </svg>
                    </div>
                )}
                
                {/* Management Menu Button */}
                {canManage && !isLocal && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full"
                        >
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                        </button>
                        
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-[#202124] border border-gray-600 rounded shadow-xl z-20 flex flex-col py-1">
                                    {role === 'MEMBER' && (
                                        <button 
                                            onClick={() => { onPromote?.(); setShowMenu(false); }}
                                            className="text-left px-4 py-2 hover:bg-[#3c4043] text-sm text-white"
                                        >
                                            設為管理者
                                        </button>
                                    )}
                                    {role === 'ADMIN' && (
                                        <button 
                                            onClick={() => { onDemote?.(); setShowMenu(false); }}
                                            className="text-left px-4 py-2 hover:bg-[#3c4043] text-sm text-white"
                                        >
                                            降級為成員
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const ParticipantSidebar: React.FC<ParticipantSidebarProps> = ({
    isOpen,
    onClose,
    remoteStreams,
    peerStates,
    localStream,
    isMicOn,
    isCamOn,
    myRole,
    onAssignRole
}) => {
    if (!isOpen) return null;

    const totalParticipants = remoteStreams.length + (localStream ? 1 : 0);
    const canManage = myRole === 'CREATOR';

    return (
        <div className="w-[360px] bg-white bg-opacity-[0.02] border-l border-gray-700 flex flex-col h-full transition-all">
            <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-normal text-white">成員 ({totalParticipants})</h2>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2">
                <div className="space-y-1">
                    {/* Local User */}
                    <ParticipantItem 
                        name="你" 
                        isMicOn={isMicOn} 
                        isCamOn={isCamOn} 
                        isLocal={true}
                        role={myRole}
                    />

                    {/* Remote Users */}
                    {remoteStreams.map(peer => {
                        const state = peerStates[peer.peerId] || { isMicOn: true, isCamOn: true, role: 'MEMBER' };
                        return (
                            <ParticipantItem
                                key={peer.peerId}
                                name={`使用者 ${peer.peerId.substring(0, 4)}`}
                                isMicOn={state.isMicOn}
                                isCamOn={state.isCamOn}
                                role={state.role}
                                canManage={canManage}
                                onPromote={() => onAssignRole(peer.peerId, 'ADMIN')}
                                onDemote={() => onAssignRole(peer.peerId, 'MEMBER')}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ParticipantSidebar;