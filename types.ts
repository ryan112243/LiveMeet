
export enum MeetingStatus {
  LOBBY = 'LOBBY',
  JOINING = 'JOINING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  ENDED_BY_HOST = 'ENDED_BY_HOST',
  KICKED = 'KICKED',
  BANNED = 'BANNED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ERROR = 'ERROR'
}

export type UserRole = 'CREATOR' | 'ADMIN' | 'MEMBER';

export interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

export interface PeerMetadata {
  displayName?: string;
  isMicOn: boolean;
  isCamOn: boolean;
  isHandRaised: boolean;
  role: UserRole;
  isMicDisabled?: boolean;  // New: Admin disabled mic
  isChatDisabled?: boolean; // New: Admin disabled chat
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  role: UserRole;
  isPinned?: boolean;
}

export interface RecordingItem {
    id: string;
    blob: Blob;
    timestamp: number;
    type: 'video' | 'audio';
}

export interface WebRTCState {
  peers: PeerStream[];
  roomId: string;
}

// Admin Command Payloads
export type AdminCmdType = 
  | 'KICK' 
  | 'BAN' 
  | 'END_MEETING' 
  | 'MUTE_MIC'       // Force mute
  | 'DISABLE_MIC'    // Prevent unmute
  | 'ENABLE_MIC'     // Allow unmute
  | 'DISABLE_CHAT'   // Prevent chat
  | 'ENABLE_CHAT'    // Allow chat
  | 'LOWER_HAND';    // Put down hand

export type ChatActionType = 
  | 'TOGGLE_PIN'
  | 'DELETE_MSG';

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  blob?: Blob;
  progress?: number;
}

export type FileActionType = 'DELETE_FILE';
