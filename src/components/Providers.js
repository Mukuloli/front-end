'use client';

import { AuthContextProvider } from '@/contexts/AuthContext';

export default function Providers({ children }) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
}


