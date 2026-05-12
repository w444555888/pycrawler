'use client'

import './featureSkeleton.scss'

/**
 * 加载骨架组件 - Feature 的加载状态
 * 结构与 Feature.jsx 完全相同，只是用骨架替代真实内容
 * 
 * 优势：
 *   - 页面不会空白（用户知道在加载）
 *   - 提升用户体验和感知速度
 *   - SEO 不受影响（只显示给用户，不是最终 HTML）
 */
export default function FeatureSkeleton() {
  return (
    <div className='feature'>
      <div className="container">
        <div className="listTitle">
          <span className="skeleton-text skeleton-text-title" />
        </div>

        <div className="listItems">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={`category-${i}`} className="skeleton-item">
              <div className="skeleton-image" />
              <div className="skeleton-text skeleton-item-text-1" />
              <div className="skeleton-text skeleton-item-text-2" />
            </div>
          ))}
        </div>

        <div className="listTitle listTitle-second">
          <span className="skeleton-text skeleton-text-title skeleton-text-title-large" />
        </div>

        <div className="listItems">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={`popular-${i}`} className="skeleton-item">
              <div className="skeleton-image" />
              <div className="skeleton-text skeleton-item-text-1" />
              <div className="skeleton-text skeleton-item-text-2" />
              <div className="skeleton-text skeleton-item-text-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
