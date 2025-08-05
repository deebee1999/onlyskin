import './globals.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // ✅ Add Footer

export const metadata = {
  title: 'OnlySkins',
  description: 'OnlySkins platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-black text-white">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer /> {/* ✅ Footer after content */}
        </AuthProvider>
      </body>
    </html>
  );
}


