import React from 'react'
import { Outlet } from 'react-router';
import { Navbar } from './../Navbar/Navbar';



export default function Layout() {
  return (
    <main>
    <Navbar />
    <div className='min-h-screen'>
      <Outlet />
    </div>
    </main>
  )
}
