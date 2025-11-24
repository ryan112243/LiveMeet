export enum MeetingStatus {
  LOBBY = 'LOBBY',
  JOINING = 'JOINING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
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
  role: UserRole;
}

export interface WebRTCState {
  peers: PeerStream[];
  roomId: string;
}