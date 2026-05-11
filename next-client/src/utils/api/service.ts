/**
 * 兼容层：旧的 request 函数适配到新的 apiClient
 * 这样可以快速让所有文件运行，然后再逐步迁移
 */
import apiClient from './client'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface RequestOptions {
  params?: Record<string, any>
  headers?: Record<string, string>
}

/**
 * 旧的 request 函数签名：
 * request(method, url, data?, setLoading?)
 */
export const request = async (
  method: RequestMethod,
  url: string,
  data?: Record<string, any> | RequestOptions,
  setLoading?: (loading: boolean) => void
) => {
  try {
    setLoading?.(true)
    
    let response
    const config: RequestOptions = {}
    
    // 如果 data 看起来像 options，则当作 params
    if (data && typeof data === 'object' && !Array.isArray(data) && !data.toString().includes('FormData')) {
      if (method === 'GET') {
        config.params = data
        data = undefined
      }
    }
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await apiClient.get(url, config)
        break
      case 'POST':
        response = await apiClient.post(url, data, config)
        break
      case 'PUT':
        response = await apiClient.put(url, data, config)
        break
      case 'DELETE':
        response = await apiClient.delete(url, config)
        break
      case 'PATCH':
        response = await apiClient.patch(url, data, config)
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
    
    setLoading?.(false)
    return response.data
  } catch (error: any) {
    setLoading?.(false)
    console.error(`API Error [${method} ${url}]:`, error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      data: null
    }
  }
}

export default request
