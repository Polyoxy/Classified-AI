'use client';

import React, { useState, useEffect } from 'react';
import TitleBar from './TitleBar';
import dynamic from 'next/dynamic';

// Create a client-side only component for title bar to avoid SSR issues
const ElectronTitleBar = dynamic(() => Promise.resolve(TitleBar), { ssr: false });

const ClientTitleBar: React.FC = () => {
  const [isElectron, setIsElectron] = useState(false);
  
  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electron);
  }, []);
  
  if (!isElectron) return null;
  
  return <ElectronTitleBar title="CLASSIFIED AI" />;
};

export default ClientTitleBar; 