/**
 * 服务器端 API 请求工具
 * 用途：在 Next.js 服务器组件中获取数据
 * 优势：
 *   1. 在服务器内部调用 API（速度快）
 *   2. 可以设置缓存策略（revalidate）
 *   3. 不需要 JS 在浏览器运行
 *   4. SEO 友好
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ServerRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  data?: any
}

interface ApiResponse {
  success: boolean
  data: any
  message?: string
}

/**
 * 服务器端请求函数
 * @param method HTTP 方法
 * @param endpoint API 端点（如 '/hotels'）
 * @param data 请求数据（GET 时作为 query，POST/PUT 时作为 body）
 * @returns Promise<ApiResponse>
 * 
 * @example
 * // GET 请求
 * const result = await serverRequest('GET', '/hotels', {})
 * 
 * // POST 请求
 * const result = await serverRequest('POST', '/users', { name: 'John' })
 */
export async function serverRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<ApiResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/v1${endpoint}`)
    
    // GET 请求把参数放在 query string
    if (method === 'GET' && data && Object.keys(data).length > 0) {
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          url.searchParams.append(key, data[key])
        }
      })
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      // ISR 技术：构建后 1 小时内返回缓存，1 小时后后台重新生成
      next: { revalidate: 3600 }
    }

    // POST/PUT 请求把参数放在 body
    if (['POST', 'PUT'].includes(method) && data) {
      options.body = JSON.stringify(data)
    }

    console.log(`[Server API] ${method} ${url.toString()}`)

    const response = await fetch(url.toString(), options)
    
    if (!response.ok) {
      console.error(`[Server API Error] Status: ${response.status}`)
      return {
        success: false,
        data: null,
        message: `API Error: ${response.status}`
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('[Server Request Failed]', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
