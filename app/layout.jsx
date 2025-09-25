// app/layout.js - Update your existing layout
import './globals.css'
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: 'Team Workout Tracker',
  description: 'Track and analyze team fitness activities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}