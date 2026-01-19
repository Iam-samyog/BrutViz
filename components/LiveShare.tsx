"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Users, X, Copy, Check, Radio, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import Peer, { DataConnection } from 'peerjs';

interface LiveShareProps {
    isOpen: boolean;
    onClose: () => void;
    onDataReceived: (payload: any) => void;
    currentState: any;
}

export const LiveShare: React.FC<LiveShareProps> = ({ isOpen, onClose, onDataReceived, currentState }) => {
    const [peerId, setPeerId] = useState<string>('');
    const [peer, setPeer] = useState<Peer | null>(null);
    const [connections, setConnections] = useState<DataConnection[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [remotePeerId, setRemotePeerId] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const newPeer = new Peer();
        
        newPeer.on('open', (id) => {
            setPeerId(id);
        });

        newPeer.on('connection', (conn) => {
            conn.on('open', () => {
                setConnections(prev => [...prev, conn]);
                // Send initial state to new connection
                conn.send({ type: 'SYNC_STATE', ...currentState });
            });

            conn.on('data', (data: any) => {
                onDataReceived(data);
            });
        });

        newPeer.on('error', (err) => {
            setError(err.message);
        });

        setPeer(newPeer);

        return () => {
            newPeer.destroy();
        };
    }, []);

    // Broadcast state changes
    useEffect(() => {
        if (connections.length > 0) {
            connections.forEach(conn => {
                if (conn.open) {
                    conn.send({ type: 'UPDATE_STATE', ...currentState });
                }
            });
        }
    }, [currentState]);

    const connectToPeer = () => {
        if (!peer || !remotePeerId) return;
        setIsConnecting(true);
        setError('');

        const conn = peer.connect(remotePeerId);
        conn.on('open', () => {
            setConnections(prev => [...prev, conn]);
            setIsConnecting(false);
        });

        conn.on('data', (data: any) => {
            onDataReceived(data);
        });

        conn.on('error', (err) => {
            setError('Failed to connect to peer');
            setIsConnecting(false);
        });
    };

    const copyId = () => {
        navigator.clipboard.writeText(peerId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border-4 border-black z-[101] shadow-neo p-8 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary text-white border-2 border-black rounded-xl">
                                    <Radio className="w-6 h-6 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Live Share</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-black text-white rounded-2xl border-4 border-black relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Your Session ID</p>
                                    <div className="flex items-center justify-between gap-4">
                                        <code className="text-xl font-black tracking-wider truncate">{peerId || 'Generating...'}</code>
                                        <button 
                                            onClick={copyId}
                                            className="p-2 bg-primary text-white border-2 border-white rounded-lg hover:translate-y-[-2px] transition-all"
                                        >
                                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Wifi className="w-24 h-24" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-black/40">Join a Session</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={remotePeerId}
                                        onChange={(e) => setRemotePeerId(e.target.value)}
                                        placeholder="Enter Peer ID..."
                                        className="flex-1 px-4 py-3 border-4 border-black rounded-xl font-bold placeholder:text-black/20 outline-none focus:ring-4 ring-primary/20 transition-all"
                                    />
                                    <button 
                                        onClick={connectToPeer}
                                        disabled={isConnecting}
                                        className="px-6 py-3 bg-primary text-white border-4 border-black rounded-xl font-black uppercase tracking-widest shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo transition-all disabled:opacity-50"
                                    >
                                        {isConnecting ? '...' : 'Connect'}
                                    </button>
                                </div>
                                {error && <p className="text-xs font-bold text-destructive">{error}</p>}
                            </div>

                            <div className="pt-4 border-t-2 border-black/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full animate-pulse", connections.length > 0 ? "bg-green-500" : "bg-black/20")} />
                                    <span className="text-xs font-black uppercase tracking-widest text-black/60">
                                        {connections.length} Connected {connections.length === 1 ? 'Peer' : 'Peers'}
                                    </span>
                                </div>
                                {connections.length > 0 && (
                                    <button 
                                        onClick={() => setConnections([])}
                                        className="text-[10px] font-black uppercase text-destructive hover:underline"
                                    >
                                        End Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
