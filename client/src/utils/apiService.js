import axios from 'axios'
import { toast } from "react-toastify";
axios.defaults.withCredentials = true;

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true,
});


api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        // 未授權
        if (status === 401) {
            console.warn("未授權，重新導向登入頁");
            toast.error("登入狀態已過期，請重新登入");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        } else if (status === 500) {
            toast.error("伺服器發生錯誤，請稍後再試");
        }

        return Promise.reject(error);
    }
);


export const request = async (method, endpoint, data = {}, setLoading = () => { }) => {
    setLoading(true)
    try {
        const config = {
            method,
            url: endpoint,
            ...(method.toUpperCase() === 'GET' ? { params: data } : { data }),
            withCredentials: true
        }
        const response = await api(config);
        const json = response.data;
        
        if (json.success) {
            return { success: true, data: json.data ?? json, message: json.message ?? "" };
        } else {
            return { success: false, message: json.message, data: json.data };
        }
    } catch (error) {
        const errorMessage =
            error.response?.data?.message ||
            (error.message?.includes('Network Error')
                ? '網路連線錯誤，請檢查您的網路'
                : error.message || '請求失敗');

        toast.error(errorMessage);
        return { success: false, message: errorMessage };
    } finally {
        setLoading(false)
    }
}
