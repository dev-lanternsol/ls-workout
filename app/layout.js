// app/layout.js - Update your existing layout
import './globals.css'

export const metadata = {
  title: 'Team Workout Tracker',
  description: 'Track and analyze team fitness activities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}