/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2025-06-05 20:51:55
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2025-06-05 22:37:42
 * @FilePath: \my-app\admin\src\utils\apiService.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios, { AxiosRequestConfig, Method } from 'axios';

type SetLoadingFn = (value: boolean) => void;

interface RequestResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const request = async <T = any>(
  method: Method,
  endpoint: string,
  data: any = {},
  setLoading?: SetLoadingFn
): Promise<RequestResult<T>> => {
  if (typeof setLoading === 'function') setLoading(true);

  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${process.env.REACT_APP_API_URL}${endpoint}`,
      ...(method.toUpperCase() === 'GET' ? { params: data } : { data }),
      withCredentials: true,
    };

    const response = await axios(config);
    return { success: true, data: response.data.data as T };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '請求失敗';
    return { success: false, message: errorMessage };
  } finally {
    if (typeof setLoading === 'function') setLoading(false);
  }
};
