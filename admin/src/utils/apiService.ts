
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
