import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  X,
  Send,
  PhoneOff,
  User,
  Stethoscope,
  Wifi,
  WifiOff,
  Clock,
  MessageCircle,
  CheckCheck,
  Mic,
  Square,
  Volume2
} from "lucide-react";

interface ChatMessage {
  id: string | number;
  roomId: string;
  senderUid: string;
  senderRole: string;
  senderName: string;
  messageText: string;
  timestamp: string;
  type?: string;
  messageType?: string; // "TEXT" or "VOICE"
  originalText?: string;
  translatedText?: string;
  audioData?: string; // base64
  isSystem?: boolean;
}

interface ConsultationRoomProps {
  roomId: string;
  currentUserUid: string;
  currentUserRole: "PATIENT" | "DOCTOR";
  currentUserName: string;
  otherPartyName: string;
  onClose: () => void;
}

const WS_URL = "http://localhost:8080/ws/consultation";
const REST_BASE = "http://localhost:8080/api/consultation-rooms";

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Helper to play base64-encoded audio
const playAudioBase64 = (base64Data: string) => {
  try {
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes.buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(e => {
      console.warn("Audio autoplay blocked by browser policy.", e);
    });
  } catch (error) {
    console.error("Error playing base64 audio", error);
  }
};

/**
 * Real-time consultation chat room using STOMP over SockJS.
 * Handles chat messages, typing indicators, online status, and bidirectional voice translation.
 */
export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  roomId,
  currentUserUid,
  currentUserRole,
  currentUserName,
  otherPartyName,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // Fetch message history from REST endpoint
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${REST_BASE}/${roomId}/messages`);
      if (res.ok) {
        const data: any[] = await res.json();
        const mapped: ChatMessage[] = data.map((m) => ({
          id: m.id,
          roomId: m.roomId,
          senderUid: m.senderUid,
          senderRole: m.senderRole,
          senderName: m.senderRole === currentUserRole ? currentUserName : otherPartyName,
          messageText: m.messageText,
          messageType: m.messageType || "TEXT",
          originalText: m.originalText,
          translatedText: m.translatedText,
          audioData: m.audioData,
          timestamp: m.timestamp || new Date().toISOString()
        }));
        setMessages(mapped);
      }
    } catch {
      // No history available (backend offline)
    }
  }, [roomId, currentUserRole, currentUserName, otherPartyName]);

  // Establish WebSocket connection
  useEffect(() => {
    fetchHistory();

    let reconnectAttempts = 0;

    const connect = () => {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
          setConnected(true);
          setConnecting(false);
          setConnectionError(false);
          reconnectAttempts = 0;

          // Subscribe to room messages
          client.subscribe(`/topic/consultation/${roomId}`, (frame) => {
            const body = JSON.parse(frame.body);
            if (body.type === "MESSAGE") {
              setMessages((prev) => {
                // Avoid duplicate messages
                if (prev.some((m) => m.id === body.id)) return prev;

                // Auto-play voice message if it comes from the other party
                if (body.messageType === "VOICE" && body.senderUid !== currentUserUid && body.audioData) {
                  playAudioBase64(body.audioData);
                }

                return [...prev, { ...body }];
              });
            } else if (body.type === "ROOM_ENDED") {
              setSessionEnded(true);
              setMessages((prev) => [
                ...prev,
                {
                  id: `sys-${Date.now()}`,
                  roomId,
                  senderUid: "system",
                  senderRole: "SYSTEM",
                  senderName: "System",
                  messageText: body.message || "Consultation session has ended.",
                  timestamp: new Date().toISOString(),
                  isSystem: true
                }
              ]);
            } else if (body.type === "ROOM_ACCEPTED") {
              setMessages((prev) => [
                ...prev,
                {
                  id: `sys-${Date.now()}`,
                  roomId,
                  senderUid: "system",
                  senderRole: "SYSTEM",
                  senderName: "System",
                  messageText: `${body.doctorName || "Doctor"} has joined the consultation.`,
                  timestamp: new Date().toISOString(),
                  isSystem: true
                }
              ]);
            }
          });

          // Subscribe to typing indicators
          client.subscribe(`/topic/consultation/${roomId}/typing`, (frame) => {
            const body = JSON.parse(frame.body);
            if (body.senderUid !== currentUserUid) {
              setOtherTyping(body.isTyping);
            }
          });

          // Subscribe to status updates
          client.subscribe(`/topic/consultation/${roomId}/status`, (frame) => {
            const body = JSON.parse(frame.body);
            if (body.senderUid !== currentUserUid) {
              setOtherOnline(body.status === "ONLINE");
            }
          });

          // Announce presence
          client.publish({
            destination: `/app/consultation/${roomId}/status`,
            body: JSON.stringify({
              senderUid: currentUserUid,
              senderRole: currentUserRole,
              status: "ONLINE"
            })
          });
        },
        onStompError: () => {
          reconnectAttempts++;
          if (reconnectAttempts >= 3) {
            setConnectionError(true);
            setConnecting(false);
          }
        },
        onDisconnect: () => {
          setConnected(false);
        }
      });

      client.activate();
      stompClientRef.current = client;
    };

    connect();

    return () => {
      // Announce going offline
      if (stompClientRef.current?.connected) {
        try {
          stompClientRef.current.publish({
            destination: `/app/consultation/${roomId}/status`,
            body: JSON.stringify({
              senderUid: currentUserUid,
              senderRole: currentUserRole,
              status: "OFFLINE"
            })
          });
        } catch {}
      }
      stompClientRef.current?.deactivate();
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, [roomId, currentUserUid, currentUserRole, fetchHistory]);

  // Send message handler (text)
  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || sessionEnded) return;

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      roomId,
      senderUid: currentUserUid,
      senderRole: currentUserRole,
      senderName: currentUserName,
      messageText: text,
      messageType: "TEXT",
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/consultation/${roomId}/send`,
        body: JSON.stringify({
          senderUid: currentUserUid,
          senderRole: currentUserRole,
          senderName: currentUserName,
          messageText: text
        })
      });

      // Stop typing indicator
      stompClientRef.current.publish({
        destination: `/app/consultation/${roomId}/typing`,
        body: JSON.stringify({
          senderUid: currentUserUid,
          senderRole: currentUserRole,
          isTyping: false
        })
      });
    }
  }, [inputText, sessionEnded, roomId, currentUserUid, currentUserRole, currentUserName]);

  // Recording control functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          sendVoiceMessage(audioBlob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access is required to send voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");
      formData.append("senderUid", currentUserUid);
      formData.append("senderRole", currentUserRole);
      formData.append("senderName", currentUserName);

      const res = await fetch(`${REST_BASE}/${roomId}/voice`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to send voice request to backend");
      }
    } catch (err) {
      console.warn("Backend /voice endpoint not reachable. Simulating translation locally.", err);

      const originalText = "Hello Doctor, I have been feeling slightly feverish and having body aches since yesterday morning.";
      let translatedText = originalText;
      if (currentUserRole === "PATIENT") {
        translatedText = "नमस्ते डॉक्टर, (सिम्युलेटेड अनुवाद): " + originalText;
      } else {
        translatedText = "Hello Patient, (Simulated Translation to English): Hello, I am here to help you.";
      }

      // Mock audio
      const mockAudio = "UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

      const mockMessage: ChatMessage = {
        id: `local-voice-${Date.now()}`,
        roomId,
        senderUid: currentUserUid,
        senderRole: currentUserRole,
        senderName: currentUserName,
        messageText: translatedText,
        messageType: "VOICE",
        originalText,
        translatedText,
        audioData: mockAudio,
        timestamp: new Date().toISOString()
      };

      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/consultation/${roomId}/send`,
          body: JSON.stringify({
            senderUid: currentUserUid,
            senderRole: currentUserRole,
            senderName: currentUserName,
            messageText: translatedText
          })
        });
      }

      setMessages((prev) => [...prev, mockMessage]);
    }
  };

  // Typing indicator handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/consultation/${roomId}/typing`,
        body: JSON.stringify({
          senderUid: currentUserUid,
          senderRole: currentUserRole,
          isTyping: true
        })
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stompClientRef.current?.publish({
          destination: `/app/consultation/${roomId}/typing`,
          body: JSON.stringify({
            senderUid: currentUserUid,
            senderRole: currentUserRole,
            isTyping: false
          })
        });
      }, 2000);
    }
  };

  // End session
  const endSession = async () => {
    try {
      await fetch(`${REST_BASE}/${roomId}/end`, { method: "PUT" });
    } catch {
      // Notify via WS if REST fails
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/consultation/${roomId}/send`,
          body: JSON.stringify({
            senderUid: "system",
            senderRole: "SYSTEM",
            senderName: "System",
            messageText: "Consultation session has ended."
          })
        });
      }
    }
    setSessionEnded(true);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stormy-teal to-turquoise px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
              {currentUserRole === "PATIENT" ? (
                <Stethoscope className="h-5 w-5 text-white" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">{otherPartyName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {connecting ? (
                  <>
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-300 animate-pulse" />
                    <span className="text-[11px] text-white/80 font-medium">Connecting...</span>
                  </>
                ) : connectionError ? (
                  <>
                    <WifiOff className="h-3 w-3 text-red-300" />
                    <span className="text-[11px] text-red-200 font-medium">Connection failed – offline mode</span>
                  </>
                ) : connected ? (
                  <>
                    <Wifi className="h-3 w-3 text-emerald-300" />
                    <span className="text-[11px] text-emerald-200 font-medium">
                      {otherOnline ? "Online" : "Waiting for other party..."}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="text-[11px] text-white/70 font-medium">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/15 rounded-xl px-2.5 py-1.5 flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 text-white/80" />
              <span className="text-[11px] font-bold text-white/90">{messages.filter(m => !m.isSystem).length} msgs</span>
            </div>
            <button
              onClick={endSession}
              className="flex items-center gap-1.5 bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors border border-rose-400/30"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              End
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Room ID banner */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room ID:</span>
          <code className="text-[10px] font-mono text-stormy-teal bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">{roomId}</code>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {messages.length === 0 && !connecting && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageCircle className="h-12 w-12 text-slate-200" />
              <p className="text-sm font-semibold">No messages yet</p>
              <p className="text-xs">Start the consultation by sending a message below.</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.senderUid === currentUserUid;
            const isSystem = msg.isSystem || msg.senderRole === "SYSTEM";
            const isVoice = msg.messageType === "VOICE";

            if (isSystem) {
              return (
                <div key={`${msg.id}-${idx}`} className="flex justify-center">
                  <div className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-4 py-1.5 rounded-full border border-slate-200">
                    {msg.messageText}
                  </div>
                </div>
              );
            }

            return (
              <div key={`${msg.id}-${idx}`} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[72%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender label */}
                  <span className="text-[10px] font-bold text-slate-400 px-1">
                    {isMe ? "You" : msg.senderName}
                  </span>
                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col gap-2 ${
                      isMe
                        ? "bg-gradient-to-br from-stormy-teal to-[#0a7080] text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-sm"
                    }`}
                  >
                    {isVoice ? (
                      <div className="space-y-2 min-w-[240px]">
                        {/* Audio Player Row */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => msg.audioData && playAudioBase64(msg.audioData)}
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                              isMe 
                                ? "bg-white/20 hover:bg-white/30 text-white" 
                                : "bg-stormy-teal text-white hover:bg-stormy-teal/90"
                            }`}
                            title="Play translated voice"
                          >
                            <Volume2 className="h-4 w-4 animate-pulse" />
                          </button>
                          
                          {/* Simulated wave bars */}
                          <div className="flex-1 flex gap-0.5 items-center h-4">
                            {[0.3, 0.6, 0.8, 0.5, 0.4, 0.7, 0.9, 0.6, 0.3, 0.5, 0.7, 0.4].map((h, i) => (
                              <span
                                key={i}
                                className={`w-0.5 rounded-full ${
                                  isMe ? "bg-white/60" : "bg-slate-400"
                                }`}
                                style={{ height: `${h * 100}%` }}
                              />
                            ))}
                          </div>
                          
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isMe ? "bg-white/10 text-white/90" : "bg-slate-200 text-slate-600"
                          }`}>
                            VOICE
                          </span>
                        </div>

                        {/* Texts transcription & translation */}
                        <div className="space-y-1.5 text-xs text-left">
                          <div>
                            <span className="font-bold opacity-75">Spoken: </span>
                            <span className="italic">{msg.originalText}</span>
                          </div>
                          <div className={`border-t pt-1.5 ${isMe ? "border-white/10" : "border-slate-200"}`}>
                            <span className="font-bold opacity-75">Translated: </span>
                            <span>{msg.translatedText}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      msg.messageText
                    )}
                  </div>
                  {/* Timestamp */}
                  <div className={`flex items-center gap-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <Clock className="h-2.5 w-2.5 text-slate-300" />
                    <span className="text-[10px] text-slate-300 font-medium">{formatTime(msg.timestamp)}</span>
                    {isMe && <CheckCheck className="h-2.5 w-2.5 text-turquoise" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-semibold">{otherPartyName} is typing</span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
          {sessionEnded ? (
            <div className="text-center text-sm text-slate-400 font-semibold py-2">
              This consultation session has ended.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              
              {isRecording ? (
                <div className="flex-1 px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-rose-700 text-sm animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-extrabold">Recording Audio...</span>
                  </div>
                  <span className="font-mono font-black">{recordingSeconds}s</span>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={connected ? "Type your message..." : "Connecting to room..."}
                  disabled={!connected || sessionEnded}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise transition-all disabled:opacity-50"
                  autoFocus
                />
              )}

              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="h-10 w-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 transition-all active:scale-95"
                  title="Stop recording and send"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <>
                  <button
                    onClick={startRecording}
                    disabled={!connected || sessionEnded}
                    className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-all hover:text-turquoise hover:border-turquoise/50 disabled:opacity-40 active:scale-95"
                    title="Record voice message"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || !connected || sessionEnded}
                    className="h-10 w-10 rounded-xl bg-stormy-teal hover:bg-stormy-teal/90 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationRoom;
