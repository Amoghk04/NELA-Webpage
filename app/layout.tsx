import type {Metadata} from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import NavBar from '../components/NavBar';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'NELA',
  description: 'A desktop application for local knowledge intelligence. Uncensored, private, and lightning fast.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#050505] text-white font-sans antialiased selection:bg-[#00ffcc] selection:text-black" suppressHydrationWarning>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
