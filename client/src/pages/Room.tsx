import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
// import { useAuth } from "@/_core/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { Mic, MicOff, Video, VideoOff, Phone, MessageCircle, Users, Settings, Copy, Share, AlertCircle, Home } from "lucide-react";
import { toast } from "sonner";

export default function Room() {
  const [, params] = useRoute("/room/:code");
  const roomCode = params?.code || "";
  const [, setLocation] = useLocation();
  
  // Загружаем пользователя из localStorage
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<Array<{ socketId: string, userName: string }>>([]); // Ожидающие подключения пользователи
  
  // Загружаем пользователя при монтировании компонента
  useEffect(() => {
    // Функция для загрузки пользователя
    const loadUser = () => {
      const savedUser = localStorage.getItem("conference_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        // Автоматически подставляем имя из профиля пользователя
        if (userData.isDemo) {
          setUserName("Гость");
        } else {
          setUserName(userData.name || "");
        }
      }
    };

    // Загружаем пользователя при монтировании
    loadUser();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "conference_user") {
        loadUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Периодически проверяем изменения (для синхронизации в рамках одного окна)
    const interval = setInterval(() => {
      loadUser();
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  const [message, setMessage] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remotePeers, setRemotePeers] = useState<Map<string, { stream: MediaStream, userName: string, hasVideo: boolean, hasAudio: boolean }>>(new Map());
  const [localMessages, setLocalMessages] = useState<Array<{id: string, userName: string, message: string, timestamp: Date, isEdited?: boolean}>>([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const tracksAddedRef = useRef<Map<string, boolean>>(new Map()); // Отслеживаем добавленные треки
  
  const roomQuery = trpc.room.get.useQuery({ roomCode }, { 
    enabled: !!roomCode,
    retry: false,
    refetchOnWindowFocus: false
  });
  const joinMutation = trpc.room.join.useMutation();
  const sendMessageMutation = trpc.chat.send.useMutation();
  const messagesQuery = trpc.chat.messages.useQuery(
    { roomId: roomQuery.data?.id || 0 },
    { enabled: !!roomQuery.data?.id && joined, refetchInterval: 2000 }
  );

  // Демо-режим: если API недоступен (но не если комната не найдена), используем локальные данные
  const isRoomNotFound = roomQuery.error?.message?.includes("Room not found") || roomQuery.error?.message?.includes("not found");
  const isDemoMode = roomQuery.error && roomCode && !isRoomNotFound;
  const demoRoom = isDemoMode ? { 
    id: 1, 
    name: `Демо комната ${roomCode}`, 
    roomCode,
    ownerId: 1 
  } : roomQuery.data;

  // Показываем toast уведомление если комната не найдена
  useEffect(() => {
    if (isRoomNotFound && roomCode) {
      toast.error("Комната не найдена", {
        description: `Комната с кодом "${roomCode}" не существует. Создайте новую комнату или проверьте правильность ссылки.`,
        duration: 5000,
      });
      // Не перенаправляем на главную - пусть пользователь сам решит, что делать
    }
  }, [isRoomNotFound, roomCode]);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]
  };

  // Все хуки должны быть перед условными возвратами
  useEffect(() => {
    if (!joined) return;

    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("join-room", roomCode, userName);
    });

    // Получаем список существующих участников при присоединении
    socket.on("existing-users", async (users: Array<{ socketId: string, userName: string }>) => {
      console.log("Received existing users:", users);
      
      if (localStream && users.length > 0) {
        for (const user of users) {
          if (!peerConnectionsRef.current.has(user.socketId)) {
            console.log(`Creating peer connection for existing user ${user.userName} (${user.socketId})`);
            await createPeerConnection(user.socketId, user.userName, true);
          }
        }
      } else if (users.length > 0) {
        // Сохраняем пользователей для подключения позже
        console.log("Local stream not ready, saving users for later:", users);
        setPendingUsers(users);
      }
    });

    socket.on("user-joined", async ({ socketId, userName: remoteUserName }: { socketId: string, userName: string }) => {
      console.log("User joined:", socketId, remoteUserName);
      
      // Показываем уведомление о присоединении
      toast.success(`${remoteUserName} присоединился к комнате`, {
        duration: 3000,
      });
      
      // НЕ создаем соединение здесь - новый пользователь сам создаст соединения со всеми существующими
      // Мы просто ждем его offer
      console.log(`Waiting for offer from ${remoteUserName} (${socketId})`);
    });

    socket.on("offer", async (offer: RTCSessionDescriptionInit, fromSocketId: string, fromUserName: string) => {
      console.log("Received offer from:", fromSocketId, fromUserName);
      const pc = await createPeerConnection(fromSocketId, fromUserName, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", roomCode, answer, fromSocketId);
    });

    socket.on("answer", async (answer: RTCSessionDescriptionInit, fromSocketId: string, fromUserName: string) => {
      console.log("Received answer from:", fromSocketId, fromUserName);
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async (candidate: RTCIceCandidateInit, fromSocketId: string, fromUserName: string) => {
      console.log("Received ICE candidate from:", fromSocketId, fromUserName);
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("chat-message", (data: { messageId: string, userName: string, message: string, timestamp: Date }) => {
      console.log("Received chat message:", data);
      const newMessage = {
        id: data.messageId,
        userName: data.userName,
        message: data.message,
        timestamp: new Date(data.timestamp),
        isEdited: false
      };
      setLocalMessages(prev => {
        // Проверяем, не добавлено ли уже это сообщение
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    });

    socket.on("chat-message-update", (data: { messageId: string, message: string }) => {
      console.log("Received message update:", data);
      setLocalMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, message: data.message, isEdited: true }
          : msg
      ));
    });

    socket.on("chat-message-delete", (data: { messageId: string }) => {
      console.log("Received message delete:", data);
      setLocalMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    socket.on("user-left", ({ socketId, userName }: { socketId: string, userName: string }) => {
      console.log("User left:", socketId, userName);
      
      // Показываем уведомление о выходе
      toast.info(`${userName} покинул комнату`, {
        duration: 3000,
      });
      
      // Закрываем peer connection
      const pc = peerConnectionsRef.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(socketId);
        tracksAddedRef.current.delete(socketId);
      }
      
      // Удаляем пользователя из списка удаленных участников
      setRemotePeers(prev => {
        if (prev.has(socketId)) {
          const newMap = new Map(prev);
          newMap.delete(socketId);
          return newMap;
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      tracksAddedRef.current.clear();
    };
  }, [joined, roomCode, userName, localStream]);

  // Обработка закрытия вкладки/браузера
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Второй useEffect для получения медиа-потока
  useEffect(() => {
    if (joined && localVideoRef.current && !localStream) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }, 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
        .then(stream => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Error accessing media devices:", err));
    }
  }, [joined, localStream]);

  // Создаем соединения с ожидающими пользователями когда localStream готов
  useEffect(() => {
    if (localStream && pendingUsers.length > 0) {
      console.log("Creating connections with pending users:", pendingUsers);
      const createConnections = async () => {
        for (const user of pendingUsers) {
          if (!peerConnectionsRef.current.has(user.socketId)) {
            console.log(`Creating peer connection for pending user ${user.userName} (${user.socketId})`);
            try {
              await createPeerConnection(user.socketId, user.userName, true);
            } catch (error) {
              console.error(`Failed to create connection with ${user.userName}:`, error);
            }
          }
        }
        setPendingUsers([]);
      };
      createConnections();
    }
  }, [localStream, pendingUsers]);

  // Добавляем треки к существующим соединениям когда localStream становится доступным
  useEffect(() => {
    if (localStream && peerConnectionsRef.current.size > 0) {
      console.log("Adding tracks to existing peer connections");
      const addTracksAndRenegotiate = async () => {
        const promises: Promise<void>[] = [];
        
        peerConnectionsRef.current.forEach((pc, socketId) => {
          // Проверяем, были ли уже добавлены треки к этому соединению
          if (!tracksAddedRef.current.get(socketId)) {
            console.log(`Adding tracks to peer connection ${socketId}`);
            localStream.getTracks().forEach(track => {
              try {
                pc.addTrack(track, localStream);
                console.log(`Added track to ${socketId}: kind=${track.kind}`);
              } catch (error) {
                console.error(`Failed to add track to ${socketId}:`, error);
              }
            });
            tracksAddedRef.current.set(socketId, true);
            
            // Отправляем новый offer с добавленными треками
            const promise = (async () => {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                if (socketRef.current) {
                  socketRef.current.emit("offer", roomCode, offer, socketId);
                  console.log(`Sent offer to ${socketId} after adding tracks`);
                }
              } catch (error) {
                console.error(`Failed to send offer to ${socketId}:`, error);
              }
            })();
            
            promises.push(promise);
          }
        });
        
        await Promise.all(promises);
      };
      addTracksAndRenegotiate();
    }
  }, [localStream, roomCode]);

  // Синхронизация локального видео с состоянием videoEnabled
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localStream.getVideoTracks().forEach(track => {
        if (track.enabled !== videoEnabled) {
          console.log(`Syncing local video track: ${track.enabled} -> ${videoEnabled}`);
          track.enabled = videoEnabled;
        }
      });
    }
  }, [videoEnabled, localStream]);

  // Установка srcObject когда включается видео
  useEffect(() => {
    if (videoEnabled && localVideoRef.current && localStream) {
      console.log('Setting srcObject for local video');
      localVideoRef.current.srcObject = localStream;
    }
  }, [videoEnabled, localStream]);

  // Периодическая проверка статуса треков для всех удаленных пользователей
  useEffect(() => {
    if (!joined || remotePeers.size === 0) return;

    const interval = setInterval(() => {
      setRemotePeers(prev => {
        let changed = false;
        const newMap = new Map(prev);
        
        prev.forEach((peer, socketId) => {
          const videoTrack = peer.stream.getVideoTracks()[0];
          const audioTrack = peer.stream.getAudioTracks()[0];
          
          // Для видео: включен, если трек включен и не замьючен
          const hasVideo = videoTrack && videoTrack.enabled && !videoTrack.muted;
          
          // Для аудио: включен, только если трек включен (track.enabled)
          // НЕ проверяем track.muted, потому что track.enabled = false не вызывает onmute
          const hasAudio = audioTrack && audioTrack.enabled;
          
          if (peer.hasVideo !== hasVideo || peer.hasAudio !== hasAudio) {
            console.log(`Status changed for ${socketId}: video=${hasVideo} (was ${peer.hasVideo}), audio=${hasAudio} (was ${peer.hasAudio})`);
            console.log(`  Audio track: enabled=${audioTrack?.enabled}, muted=${audioTrack?.muted}`);
            console.log(`  Video track: enabled=${videoTrack?.enabled}, muted=${videoTrack?.muted}`);
            newMap.set(socketId, {
              stream: peer.stream,
              userName: peer.userName,
              hasVideo,
              hasAudio
            });
            changed = true;
          }
        });
        
        return changed ? newMap : prev;
      });
    }, 500); // Проверяем каждые 500мс

    return () => clearInterval(interval);
  }, [joined, remotePeers.size]);

  // Функция для получения layout видео
  const getVideoLayout = () => {
    const totalParticipants = 1 + remotePeers.size; // локальный + удаленные
    const participantsWithVideo = (videoEnabled ? 1 : 0) + Array.from(remotePeers.values()).filter(p => p.hasVideo).length;
    const participantsWithoutVideo = totalParticipants - participantsWithVideo;
    
    return {
      totalParticipants,
      participantsWithVideo,
      participantsWithoutVideo,
      hasLocalVideo: videoEnabled,
      remoteWithVideo: Array.from(remotePeers.entries()).filter(([_, peer]) => peer.hasVideo),
      remoteWithoutVideo: Array.from(remotePeers.entries()).filter(([_, peer]) => !peer.hasVideo)
    };
  };

  // Создаем ключ для кеширования на основе socketId всех участников
  const participantsKey = useMemo(() => {
    const hasLocal = 'local';
    const remoteIds = Array.from(remotePeers.entries())
      .map(([socketId]) => socketId)
      .sort()
      .join(',');
    return `${hasLocal}|${remoteIds}`;
  }, [remotePeers]);

  const videoParticipants = useMemo(() => {
    const participants = [];
    
    // Всегда добавляем локального пользователя
    participants.push({ isLocal: true, userName, socketId: 'local' });
    
    // Добавляем всех удаленных участников
    Array.from(remotePeers.entries()).forEach(([socketId, peer]) => {
      participants.push({ isLocal: false, userName: peer.userName, socketId });
    });
    
    return participants;
  }, [participantsKey, userName]);

  // Условные возвраты после всех хуков
  if (roomQuery.isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!demoRoom && !isDemoMode) {
    // Комната не найдена - показываем страницу с ошибкой
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg mx-4 bg-gray-800 border-gray-700">
          <div className="pt-8 pb-8 text-center px-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
                <AlertCircle className="relative h-16 w-16 text-red-500" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Комната не найдена</h1>

            <h2 className="text-xl font-semibold text-gray-300 mb-4">
              Код комнаты: {roomCode}
            </h2>

            <p className="text-gray-300 mb-8 leading-relaxed">
              Комната с таким кодом не существует.
              <br />
              Проверьте правильность ссылки или создайте новую комнату.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setLocation('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Вернуться на главную
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const createPeerConnection = async (socketId: string, remoteUserName: string, isInitiator: boolean): Promise<RTCPeerConnection> => {
    // Проверяем, не существует ли уже подключение для этого пользователя
    if (peerConnectionsRef.current.has(socketId)) {
      console.log("Peer already exists, skipping duplicate connection", socketId);
      return peerConnectionsRef.current.get(socketId)!;
    }
    
    console.log(`Creating new peer connection: socketId=${socketId}, userName=${remoteUserName}, isInitiator=${isInitiator}`);
    const pc = new RTCPeerConnection(configuration);
    peerConnectionsRef.current.set(socketId, pc);

    if (localStream) {
      console.log(`Adding ${localStream.getTracks().length} tracks to peer connection for ${remoteUserName}`);
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log(`Added track: kind=${track.kind}, enabled=${track.enabled}, id=${track.id}`);
      });
      tracksAddedRef.current.set(socketId, true);
    } else {
      console.warn("Local stream is not available yet");
      tracksAddedRef.current.set(socketId, false);
    }

    pc.ontrack = (event) => {
      console.log("Received remote track from:", socketId);
      const stream = event.streams[0];
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      // Для видео: включен, если трек включен и не замьючен
      const hasVideo = videoTrack && videoTrack.enabled && !videoTrack.muted;
      
      // Для аудио: включен, только если трек включен (track.enabled)
      // НЕ проверяем track.muted
      const hasAudio = audioTrack && audioTrack.enabled;
      
      setRemotePeers(prev => {
        // Проверяем, если stream уже установлен для этого socketId
        if (prev.has(socketId) && prev.get(socketId)!.stream === stream) {
          console.log("Stream already set for", socketId, "- skipping update");
          return prev;
        }
        
        const existingPeer = prev.get(socketId);
        // Если stream уже существует и не изменился, только обновляем статусы
        if (existingPeer && existingPeer.stream === stream) {
          // Если статусы не изменились, не обновляем
          if (existingPeer.hasVideo === hasVideo && existingPeer.hasAudio === hasAudio) {
            return prev;
          }
          // Создаем новый объект с обновленными статусами, но тем же stream
          const newMap = new Map(prev);
          newMap.set(socketId, { 
            stream: existingPeer.stream, 
            userName: existingPeer.userName, 
            hasVideo, 
            hasAudio 
          });
          return newMap;
        }
        
        // Новый stream - создаем новый peer
        const newMap = new Map(prev);
        newMap.set(socketId, { 
          stream, 
          userName: remoteUserName, 
          hasVideo, 
          hasAudio 
        });
        return newMap;
      });
      
      // Отслеживаем изменения состояния треков только через события
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setRemotePeers(prev => {
            const peer = prev.get(socketId);
            if (peer && peer.hasVideo) {
              const newMap = new Map(prev);
              newMap.set(socketId, { 
                stream: peer.stream, 
                userName: peer.userName, 
                hasVideo: false, 
                hasAudio: peer.hasAudio 
              });
              return newMap;
            }
            return prev;
          });
        };
        
        track.onmute = () => {
          setRemotePeers(prev => {
            const peer = prev.get(socketId);
            if (peer && peer.hasVideo) {
              const newMap = new Map(prev);
              newMap.set(socketId, { 
                stream: peer.stream, 
                userName: peer.userName, 
                hasVideo: false, 
                hasAudio: peer.hasAudio 
              });
              return newMap;
            }
            return prev;
          });
        };
        
        track.onunmute = () => {
          setRemotePeers(prev => {
            const peer = prev.get(socketId);
            if (peer && !peer.hasVideo) {
              const newMap = new Map(prev);
              newMap.set(socketId, { 
                stream: peer.stream, 
                userName: peer.userName, 
                hasVideo: true, 
                hasAudio: peer.hasAudio 
              });
              return newMap;
            }
            return prev;
          });
        };
      });
      
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          setRemotePeers(prev => {
            const peer = prev.get(socketId);
            if (peer && peer.hasAudio) {
              const newMap = new Map(prev);
              newMap.set(socketId, { 
                stream: peer.stream, 
                userName: peer.userName, 
                hasVideo: peer.hasVideo, 
                hasAudio: false 
              });
              return newMap;
            }
            return prev;
          });
        };
        
        track.onmute = () => {
          console.log(`Audio muted for ${socketId}`);
          setRemotePeers(prev => {
            const peer = prev.get(socketId);
            if (peer && peer.hasAudio) {
              const newMap = new Map(prev);
              newMap.set(socketId, { 
                stream: peer.stream, 
                userName: peer.userName, 
                hasVideo: peer.hasVideo, 
                hasAudio: false 
              });
              return newMap;
            }
            return prev;
          });
        };
        
        track.onunmute = () => {
          console.log(`Audio unmuted for ${socketId}`);
          setRemotePeers(prev => {
            const peer = prev.get(socketId);
            if (peer && !peer.hasAudio) {
              const newMap = new Map(prev);
              newMap.set(socketId, { 
                stream: peer.stream, 
                userName: peer.userName, 
                hasVideo: peer.hasVideo, 
                hasAudio: true 
              });
              return newMap;
            }
            return prev;
          });
        };
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", roomCode, event.candidate, socketId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state changed for ${socketId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        console.log(`Removing user ${socketId} due to connection state: ${pc.connectionState}`);
        
        // Удаляем пользователя из списка удаленных участников
        setRemotePeers(prev => {
          if (prev.has(socketId)) {
            const newMap = new Map(prev);
            newMap.delete(socketId);
            return newMap;
          }
          return prev;
        });
        
        // Удаляем peer connection
        peerConnectionsRef.current.delete(socketId);
        tracksAddedRef.current.delete(socketId);
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (socketRef.current) {
        socketRef.current.emit("offer", roomCode, offer, socketId);
      }
    }

    return pc;
  };

  const handleJoin = async () => {
    if (!userName.trim()) return;
    
    // Проверяем, что комната существует
    if (isRoomNotFound) {
      toast.error("Нельзя присоединиться к несуществующей комнате", {
        description: "Комната не была найдена. Проверьте правильность ссылки.",
        duration: 5000,
      });
      return;
    }
    
    if (isDemoMode) {
      // Демо-режим: просто входим в комнату
      setJoined(true);
      return;
    }
    
    if (!roomQuery.data) {
      toast.error("Комната недоступна", {
        description: "Не удалось загрузить информацию о комнате.",
        duration: 5000,
      });
      return;
    }
    
    try {
      await joinMutation.mutateAsync({
        roomCode,
        userName,
        userId: 0, // В демо-режиме используем ID 0
      });
      setJoined(true);
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Не удалось присоединиться к комнате", {
        description: "Попробуйте обновить страницу.",
        duration: 5000,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const messageId = Date.now().toString();
    
    // Добавляем сообщение в локальный чат
    const newMessage = {
      id: messageId,
      userName: userName,
      message: message.trim(),
      timestamp: new Date(),
      isEdited: false
    };
    
    setLocalMessages(prev => [...prev, newMessage]);
    
    // Отправляем через Socket.io для других участников
    if (socketRef.current) {
      socketRef.current.emit("chat-message", {
        roomCode,
        messageId,
        userName: userName,
        message: message.trim(),
        timestamp: newMessage.timestamp
      });
    }
    
    setMessage("");
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = () => {
    if (!editText.trim() || !editingMessageId) return;
    
    setLocalMessages(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, message: editText.trim(), isEdited: true }
        : msg
    ));
    
    // Отправляем обновленное сообщение через Socket.io
    if (socketRef.current) {
      socketRef.current.emit("chat-message-update", {
        roomCode,
        messageId: editingMessageId,
        message: editText.trim()
      });
    }
    
    setEditingMessageId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDeleteMessage = (messageId: string) => {
    setLocalMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Отправляем удаление через Socket.io
    if (socketRef.current) {
      socketRef.current.emit("chat-message-delete", {
        roomCode,
        messageId
      });
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const newState = !audioEnabled;
      console.log(`Toggling audio to: ${newState}`);
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
        console.log(`Audio track enabled: ${track.enabled}, muted: ${track.muted}`);
      });
      setAudioEnabled(newState);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const newState = !videoEnabled;
      console.log(`Toggling video to: ${newState}`);
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
        console.log(`Video track enabled: ${track.enabled}, muted: ${track.muted}`);
      });
      setVideoEnabled(newState);
    }
  };

  const renderVideoGrid = () => {
    // Определяем количество колонок в зависимости от количества участников
    const getGridCols = (count: number) => {
      if (count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count <= 4) return 'grid-cols-2';
      if (count <= 6) return 'grid-cols-3';
      return 'grid-cols-3';
    };
    
    return (
      <div className={`h-full grid ${getGridCols(videoParticipants.length)} gap-4`}>
        {videoParticipants.map((participant) => {
          const remotePeer = participant.isLocal ? undefined : remotePeers.get(participant.socketId);
          
          // Пропускаем если нет удаленного пользователя
          if (!participant.isLocal && !remotePeer) {
            return null;
          }
          
          const hasVideo = participant.isLocal ? videoEnabled : (remotePeer?.hasVideo ?? false);
          
          return (
            <div key={participant.socketId} className="relative bg-black rounded-xl overflow-hidden shadow-lg">
              {/* Видео элемент - всегда в DOM, видимость контролируется через CSS */}
              {participant.isLocal ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
                />
              ) : (
                <div className={`w-full h-full ${hasVideo ? 'block' : 'hidden'}`}>
                  <RemoteVideo 
                    key={`remote-${participant.socketId}`}
                    remotePeer={remotePeer}
                    socketId={participant.socketId}
                  />
                </div>
              )}
              
              {/* Черный фон с именем и иконкой, когда камера отключена */}
              {!hasVideo && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black absolute inset-0">
                  {/* Иконка отключенной камеры */}
                  <div className="mb-4">
                    <VideoOff className="w-20 h-20 text-gray-400" />
                  </div>
                  
                  {/* Имя пользователя */}
                  <div className="text-white text-lg font-medium flex items-center gap-2">
                    {participant.userName}
                    {/* Индикатор отключенного микрофона */}
                    {participant.isLocal && !audioEnabled && (
                      <MicOff className="w-5 h-5 text-red-400" />
                    )}
                    {!participant.isLocal && remotePeer && !remotePeer.hasAudio && (
                      <MicOff className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  {/* Индикатор что это вы */}
                  {participant.isLocal && (
                    <div className="text-gray-400 text-sm mt-1">
                      (Вы)
                    </div>
                  )}
                </div>
              )}
              
              {/* Имя пользователя и индикатор микрофона внизу - показываем только когда есть видео */}
              {hasVideo && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
                  {participant.userName} {participant.isLocal ? '(Вы)' : ''}
                  {/* Значок отключенного микрофона рядом с именем */}
                  {participant.isLocal && !audioEnabled && (
                    <MicOff className="w-4 h-4 text-red-400" />
                  )}
                  {!participant.isLocal && remotePeer && !remotePeer.hasAudio && (
                    <MicOff className="w-4 h-4 text-red-400" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Компонент для удаленного видео
  const RemoteVideo = memo(({ remotePeer, socketId }: { remotePeer?: { stream: MediaStream, userName: string, hasVideo: boolean, hasAudio: boolean }, socketId: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Устанавливаем srcObject только если изменился сам поток
    useEffect(() => {
      if (videoRef.current && remotePeer && remotePeer.stream && streamRef.current !== remotePeer.stream) {
        console.log(`Setting stream for ${socketId} - stream changed`);
        videoRef.current.srcObject = remotePeer.stream;
        streamRef.current = remotePeer.stream;
      }
    }, [remotePeer?.stream, socketId]);
    
    // Очистка при размонтировании
    useEffect(() => {
      return () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }, []);
    
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
    );
  }, (prevProps, nextProps) => {
    // Сравниваем socketId и stream - предотвращаем ненужные ререндеры
    const prevStream = prevProps.remotePeer?.stream;
    const nextStream = nextProps.remotePeer?.stream;
    
    // True означает "не ререндерить" - компонент одинаковый
    // False означает "ререндерить" - компонент изменился
    const streamsEqual = prevStream === nextStream;
    const socketIdsEqual = prevProps.socketId === nextProps.socketId;
    
    // Ререндерим только если изменился stream или socketId
    // НЕ ререндерим если изменились только hasVideo/hasAudio
    return streamsEqual && socketIdsEqual;
  });

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Card className="w-96 p-8 space-y-6 bg-gray-800 border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Присоединиться к встрече</h2>
            <p className="text-gray-300 text-sm">{demoRoom?.name || `Комната ${roomCode}`}</p>
            {isDemoMode && (
              <span className="inline-block mt-2 text-xs bg-yellow-900 text-yellow-200 px-3 py-1 rounded-full font-medium">
                ГОСТЕВОЙ РЕЖИМ
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder={currentUser ? "Ваше имя (можно изменить)" : "Введите ваше имя"}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Button 
              onClick={handleJoin} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!userName.trim()}
            >
              Присоединиться
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            <p>Код комнаты: <span className="font-mono font-bold text-white">{roomCode}</span></p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{demoRoom?.name || `Комната ${roomCode}`}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Код: {roomCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <span className="text-gray-500">•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {1 + remotePeers.size} {1 + remotePeers.size === 1 ? 'участник' : remotePeers.size < 5 ? 'участника' : 'участников'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isDemoMode && (
              <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded-full font-medium">
                ГОСТЕВОЙ РЕЖИМ
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className={showParticipants ? "text-white bg-white/20 hover:bg-white/30" : "text-gray-400 hover:text-white hover:bg-white/10"}
            >
              <Users className={`w-5 h-5 ${showParticipants ? "text-white" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={showChat ? "text-white bg-white/20 hover:bg-white/30" : "text-gray-400 hover:text-white hover:bg-white/10"}
            >
              <MessageCircle className={`w-5 h-5 ${showChat ? "text-white" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-6">
            {renderVideoGrid()}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`w-12 h-12 rounded-full ${
                  audioEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>
              
              <Button
                onClick={toggleVideo}
                size="lg"
                className={`w-12 h-12 rounded-full ${
                  videoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
              
              <Button
                size="lg"
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => window.location.href = '/'}
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Chat */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white">Чат</h3>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {localMessages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Пока нет сообщений
                    </div>
                  ) : (
                    localMessages.map((msg) => {
                      const isOwnMessage = msg.userName === userName;
                      const isEditing = editingMessageId === msg.id;
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`bg-white rounded-lg p-3 shadow-sm relative max-w-[80%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'} ${isOwnMessage ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
                            onClick={() => {
                              if (!isEditing && isOwnMessage) {
                                handleEditMessage(msg.id, msg.message);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-blue-600 text-sm">
                                {msg.userName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {msg.timestamp.toLocaleTimeString()}
                              </span>
                              {msg.isEdited && (
                                <span className="text-xs text-gray-400 italic">
                                  (изменено)
                                </span>
                              )}
                            </div>
                            
                            {isEditing ? (
                              // Режим редактирования
                              <div className="space-y-2">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-800 text-sm bg-white border-gray-300"
                                  autoFocus
                                />
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveEdit();
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7"
                                  >
                                    Сохранить
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelEdit();
                                    }}
                                    className="text-xs px-3 py-1 h-7"
                                  >
                                    Отмена
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(msg.id);
                                    }}
                                    className="text-xs px-3 py-1 h-7"
                                  >
                                    Удалить
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Обычный режим отображения
                              <p className="text-gray-800 text-sm">{msg.message}</p>
                            )}
                            
                            {/* Треугольный хвостик - только когда не редактируем */}
                            {!isEditing && (
                              isOwnMessage ? (
                                // Хвостик справа (мои сообщения)
                                <div className="absolute bottom-0 right-[-8px] w-0 h-0 border-t-[12px] border-t-transparent border-r-[12px] border-r-white border-b-[12px] border-b-transparent"></div>
                              ) : (
                                // Хвостик слева (сообщения других)
                                <div className="absolute bottom-0 left-[-8px] w-0 h-0 border-t-[12px] border-t-transparent border-l-[12px] border-l-white border-b-[12px] border-b-transparent"></div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Написать сообщение..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Отправить
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {showParticipants && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white">Участники</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt={userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-white">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{userName}</p>
                      <p className="text-gray-400 text-xs">Вы</p>
                    </div>
                    <div className="flex space-x-1">
                      {audioEnabled ? (
                        <Mic className="w-4 h-4 text-green-400" />
                      ) : (
                        <MicOff className="w-4 h-4 text-red-400" />
                      )}
                      {videoEnabled ? (
                        <Video className="w-4 h-4 text-green-400" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  {Array.from(remotePeers.entries()).map(([socketId, peer]) => (
                    <div key={socketId} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {peer.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{peer.userName}</p>
                        <p className="text-gray-400 text-xs">Участник</p>
                      </div>
                      <div className="flex space-x-1">
                        {peer.hasAudio ? (
                          <Mic className="w-4 h-4 text-green-400" />
                        ) : (
                          <MicOff className="w-4 h-4 text-red-400" />
                        )}
                        {peer.hasVideo ? (
                          <Video className="w-4 h-4 text-green-400" />
                        ) : (
                          <VideoOff className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

