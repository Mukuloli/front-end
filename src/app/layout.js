import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Firebase Auth App',
  description: 'Authentication with Firebase and Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}