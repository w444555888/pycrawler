'use client'

import React from 'react'
import Announcement from '@/components/Announcement'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Navbar from '@/components/Navbar'
import "./home.scss"

/**
 * Home 组件-首頁
 * 
 * 
 * 结构：
 * 1. Navbar - 导航栏（客户端）
 * 2. Header - 搜索框（客户端）
 * 3. Announcement（上半部分）- 公告（客户端）
 * 4. children - Feature（服务器组件 + Suspense）- 占位符 
 * 5. Announcement（下半部分）
 * 6. Footer
 */
const Home = ({ children }) => {
  return (
    <div className='home'>
      <Navbar />
      <Header />
      <Announcement type={"Upper half"} />
      {children}
      <Announcement type={"Lower half"} />
      <Footer />
    </div>
  )
}

export default Home