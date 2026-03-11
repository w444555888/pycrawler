import { request } from '../utils/apiService';


// 驗證是否登入
export const checkLogin = async () => {
  const result = await request('GET', '/auth/me');
  return result.success ? result.data : null;
};


// 登出
export const logout = async () => {
  await request('POST', '/auth/logout');
};

export default {
  checkLogin,
  logout,
};


