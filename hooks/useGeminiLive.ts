import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MeetingStatus, PeerStream, PeerMetadata, UserRole } from '../types';

interface UseWebRTCProps {
  onStatusChange: (status: MeetingStatus) => void;
}

// Global config for the P2P app
const CONFIG = { appId: 'live-meet-clone-v1' };

export const useWebRTC = ({ onStatusChange }: UseWebRTCProps) => {
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [peerStates, setPeerStates] = useState<Record<string, PeerMetadata>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [myRole, setMyRole] = useState<UserRole>('MEMBER');
  
  const roomRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sendStateRef = useRef<any>(null); // Function to broadcast state
  const sendRoleCmdRef = useRef<any>(null); // Function to send role change commands
  const initializingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Keep track of current local state to send to new peers
  const localStateRef = useRef<PeerMetadata>({ isMicOn: true, isCamOn: true, role: 'MEMBER' });

  // Track mount status to prevent setting state/streams on unmounted components
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup tracks on unmount to prevent "Device in use" errors on reload/strict-mode
      if (streamRef.current) {
        console.log("Cleaning up local stream on unmount");
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const cleanup = useCallback(() => {
    if (roomRef.current) {
      try { 
        roomRef.current.leave(); 
      } catch(e) {
        console.error("Error leaving room:", e);
      }
      roomRef.current = null;
    }
    setRemoteStreams([]);
    setPeerStates({});
    setIsScreenSharing(false);
    sendStateRef.current = null;
    sendRoleCmdRef.current = null;
  }, []);

  const startLocalStream = useCallback(async () => {
    // Prevent double-init
    if (streamRef.current || initializingRef.current) return;

    initializingRef.current = true;
    setError(null);

    try {
      console.log("Requesting user media...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });

      // If component unmounted while waiting for permission, stop immediately
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      setLocalStream(stream);
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      if (isMountedRef.current) {
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
             setError("Camera/Mic is in use by another app. Please close it and retry.");
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             setError("Permission denied. Please allow camera/mic access in your browser settings.");
        } else {
             setError(`Could not access device: ${err.message}`);
        }
      }
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const broadcastState = useCallback(() => {
    if (sendStateRef.current) {
      sendStateRef.current(localStateRef.current);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop sharing: Switch back to Camera
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Restore mic status based on state
        cameraStream.getAudioTracks().forEach(t => t.enabled = localStateRef.current.isMicOn);
        // Camera should be on by default when returning, or we can respect previous state
        // For simplicity, let's turn it on, but respect the toggle variable
        cameraStream.getVideoTracks().forEach(t => t.enabled = true); 
        localStateRef.current.isCamOn = true;

        if (roomRef.current && streamRef.current) {
          // @ts-ignore
          roomRef.current.replaceStream(streamRef.current, cameraStream);
        }

        // Stop the screen share tracks
        streamRef.current?.getTracks().forEach(t => t.stop());

        streamRef.current = cameraStream;
        setLocalStream(cameraStream);
        setIsScreenSharing(false);
        broadcastState();

      } catch (err) {
        console.error("Error switching back to camera:", err);
        setError("無法切換回相機");
      }
    } else {
      // Start sharing
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }); // We use mic for audio
        const screenTrack = displayStream.getVideoTracks()[0];

        // Handle user clicking "Stop Sharing" via browser UI
        screenTrack.onended = () => {
            console.log("Screen share stopped by browser");
            // We need to fetch camera again
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(cameraStream => {
                cameraStream.getAudioTracks().forEach(t => t.enabled = localStateRef.current.isMicOn);
                
                if (roomRef.current && streamRef.current) {
                     // @ts-ignore
                    roomRef.current.replaceStream(streamRef.current, cameraStream);
                }
                streamRef.current = cameraStream;
                setLocalStream(cameraStream);
                setIsScreenSharing(false);
                localStateRef.current.isCamOn = true;
                broadcastState();
            });
        };

        // Combine Screen Video + Mic Audio
        const audioTrack = streamRef.current?.getAudioTracks()[0];
        
        let newStream: MediaStream;
        if (audioTrack) {
            newStream = new MediaStream([screenTrack, audioTrack]);
        } else {
            newStream = new MediaStream([screenTrack]);
        }

        if (roomRef.current && streamRef.current) {
           // @ts-ignore
           roomRef.current.replaceStream(streamRef.current, newStream);
        }

        streamRef.current = newStream;
        setLocalStream(newStream);
        setIsScreenSharing(true);
        
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    }
  }, [isScreenSharing, broadcastState]);


  const connect = useCallback(async (selectedRoomId: string, isMicOn: boolean, isCamOn: boolean, isInitiator: boolean = false) => {
    if (!selectedRoomId) return;

    try {
      console.log("Connecting to room:", selectedRoomId);
      onStatusChange(MeetingStatus.JOINING);
      setRoomId(selectedRoomId);
      setError(null);

      // Initialize role
      const initialRole: UserRole = isInitiator ? 'CREATOR' : 'MEMBER';
      setMyRole(initialRole);

      // Update ref with initial state
      localStateRef.current = { isMicOn, isCamOn, role: initialRole };

      // Ensure we have a stream
      let stream = streamRef.current;
      if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            streamRef.current = stream;
            setLocalStream(stream);
          } catch(err: any) {
             setError("Could not start call: Camera/Mic inaccessible.");
             onStatusChange(MeetingStatus.LOBBY);
             return;
          }
      }
      
      // Apply initial mute states immediately
      stream.getAudioTracks().forEach(t => t.enabled = isMicOn);
      stream.getVideoTracks().forEach(t => t.enabled = isCamOn);

      // Dynamically import Trystero
      // @ts-ignore
      const { joinRoom } = await import('trystero/torrent');

      if (!isMountedRef.current) return;

      // Join P2P Room
      const room = joinRoom(CONFIG, selectedRoomId);
      roomRef.current = room;

      // 1. Data Channel: Sync State (Mic, Cam, Role)
      // @ts-ignore
      const [sendState, getState] = room.makeAction('peerState');
      sendStateRef.current = sendState;

      // @ts-ignore
      getState((data: PeerMetadata, peerId: string) => {
        setPeerStates(prev => ({
          ...prev,
          [peerId]: data
        }));
      });

      // 2. Data Channel: Role Commands (e.g., Host promoting someone)
      // @ts-ignore
      const [sendRoleCmd, getRoleCmd] = room.makeAction('roleCmd');
      sendRoleCmdRef.current = sendRoleCmd;

      // @ts-ignore
      getRoleCmd((newRole: UserRole, peerId: string) => {
          // The sender (Host) calls this action. The receiver (Target) executes it.
          // Since actions in Trystero are broadcast or targeted, we need to verify we are the target.
          // Wait, simple actions in Trystero are just messages.
          // Protocol: sendRoleCmd({ targetPeerId: 'me', role: 'ADMIN' })
          // But Trystero's makeAction returns (data, senderId).
          // We will assume the data IS the role, but we need to know WHO it's for.
          // Actually, 'makeAction' sends to everyone by default unless a target is specified.
          // But to simplify, let's just use "If I receive a role command from the Creator, I update myself".
          // *Correction*: We can't trust just any sender. But for this MVP, we will trust the UI state.
          // Ideally, we check if peerStates[senderId].role === 'CREATOR'.
      });
      
      // We need a specific action listener that updates MY local role if I am the target
      // @ts-ignore
      room.onMessage((data, peerId) => {
         // Fallback or generic messaging if needed
      });

      // Let's implement specific "target update" logic inside the getRoleCmd callback
      // We will send an object { targetId: string, role: UserRole }
      // @ts-ignore
      getRoleCmd((cmd: { targetId: string, role: UserRole }, senderId: string) => {
          // Check if I am the target
          // Note: We don't have easy access to "my own peerId" in Trystero 0.22 without a workaround or self-generation.
          // BUT, Trystero doesn't expose self-ID easily in the main object.
          // Workaround: We will use a "broadcast to all" strategy for state, but for commands...
          // Actually, Trystero `sendAction(data, targetPeerId)` exists.
          
          // If I receive this message, and it was sent specifically to me (or broadcast), I should update.
          // Since we can target specific peers in sendRoleCmd, if this callback fires, it means it was sent to me (or everyone).
          
          // Security check: Is sender a Creator or Admin?
          setPeerStates(currentStates => {
              const senderState = currentStates[senderId];
              if (senderState && (senderState.role === 'CREATOR')) {
                   // If I am the one receiving this, I update my role
                   console.log(`Received role update from ${senderId}: ${cmd.role}`);
                   localStateRef.current.role = cmd.role;
                   setMyRole(cmd.role);
                   // Broadcast my new state to everyone
                   setTimeout(() => {
                       if(sendStateRef.current) sendStateRef.current(localStateRef.current);
                   }, 100);
              }
              return currentStates;
          });
      });

      // Add local stream to the room
      // @ts-ignore
      room.addStream(stream);

      // Handle incoming streams
      // @ts-ignore
      room.onPeerStream((remoteStream: MediaStream, peerId: string) => {
        console.log(`Received stream from ${peerId}`);
        setRemoteStreams(prev => {
           if (prev.find(p => p.peerId === peerId)) return prev;
           return [...prev, { peerId, stream: remoteStream }];
        });
        
        setTimeout(() => {
            if (sendStateRef.current) sendStateRef.current(localStateRef.current);
        }, 500);
      });

      // Handle peer leaving
      // @ts-ignore
      room.onPeerLeave((peerId: string) => {
        console.log(`Peer ${peerId} left`);
        setRemoteStreams(prev => prev.filter(p => p.peerId !== peerId));
        setPeerStates(prev => {
            const newState = { ...prev };
            delete newState[peerId];
            return newState;
        });
      });
      
      // Broadcast initial state after joining
      setTimeout(() => {
          if (sendStateRef.current) sendStateRef.current(localStateRef.current);
      }, 1000);

      onStatusChange(MeetingStatus.CONNECTED);

    } catch (err: any) {
      console.error("WebRTC Error:", err);
      setError("Failed to connect. Check your connection or permissions.");
      onStatusChange(MeetingStatus.ERROR);
      cleanup();
    }
  }, [onStatusChange, cleanup]);

  const toggleMic = useCallback((isOn: boolean) => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = isOn);
      localStateRef.current.isMicOn = isOn;
      broadcastState();
    }
  }, [broadcastState]);

  const toggleCam = useCallback((isOn: boolean) => {
    if (isScreenSharing) {
        localStateRef.current.isCamOn = isOn;
        broadcastState();
        return;
    }

    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = isOn);
      localStateRef.current.isCamOn = isOn;
      broadcastState();
    }
  }, [broadcastState, isScreenSharing]);

  const assignRole = useCallback((targetPeerId: string, newRole: UserRole) => {
      if (sendRoleCmdRef.current) {
          // Send command to specific peer
          // Format: sendRoleCmd(data, targetPeerId)
          sendRoleCmdRef.current({ role: newRole }, targetPeerId);
          
          // Optimistically update local view of that peer (optional, but good for UI response)
          setPeerStates(prev => ({
              ...prev,
              [targetPeerId]: {
                  ...prev[targetPeerId],
                  role: newRole
              }
          }));
      }
  }, []);

  return {
    startLocalStream,
    connect,
    disconnect: () => {
        cleanup();
        onStatusChange(MeetingStatus.ENDED);
    },
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
  };
};