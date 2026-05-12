import { Suspense } from 'react'
import type { Metadata } from 'next'
import Home from '@/components/pages/Home'
import Feature from '@/components/Feature'
import FeatureSkeleton from '@/components/skeletons/FeatureSkeleton'

/**
 * 首页數據 - 用於 SEO 和 爬蟲
 */
export const metadata: Metadata = {
  title: 'MIKE Travel App - 预订酒店、航班、体验',
  description: '一站式旅行预订平台，发现世界各地的酒店、航班和体验',
  openGraph: {
    title: 'MIKE Travel App - 预订酒店、航班、体验',
    description: '一站式旅行预订平台，发现世界各地的酒店、航班和体验',
    type: 'website',
    images: [
      {
        url: 'https://ak-d.tripcdn.com/images/1mc2l12000aopzdl6A071_R_960_660_R5_D.jpg',
        width: 1200,
        height: 630,
        alt: 'MIKE Travel App',
      }
    ]
  }
}

/**
 * 首页
 * 
 * 架构：
 * 1. Home 组件（包含 Navbar, Header 等）
 * 2. Suspense 包裹 Feature 组件
 *    - fallback: 显示加载骨架（立即显示）
 *    - Feature: 异步服务器组件，在后台获取数据
 */
export default function HomePage() {
  return (
    <div className='home'>
      <Home>
        <Suspense fallback={<FeatureSkeleton />}>
          <Feature />
        </Suspense>
      </Home>
    </div>
  )
}
