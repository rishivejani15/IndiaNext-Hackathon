import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Kavach | Securing the Digital Human Experience',
  description: 'AI-driven digital armor designed to restore privacy and security to the modern internet user.',
  icons: {
    icon: '/kavach-logo.svg',
    shortcut: '/kavach-logo.svg',
    apple: '/kavach-logo.svg',
  },
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black min-h-screen text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
