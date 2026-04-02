import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api', // 基础URL，会被Vite代理到后端服务
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加认证信息，如token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一处理响应数据
    return response.data;
  },
  (error: AxiosError) => {
    // 统一处理错误
    if (error.response) {
      // 服务器返回错误
      const status = error.response.status;
      const data = error.response.data as any;
      
      // 提取详细错误信息
      const errorMessage = data?.message || data?.error || 'An error occurred';
      const errorDetails = data?.details || data?.errors || null;
      
      // 构建完整错误对象
      const errorObj = {
        ...error,
        response: {
          ...error.response,
          data: {
            ...data,
            message: errorMessage,
            details: errorDetails
          }
        },
        errorMessage,
        errorDetails
      };
      
      console.error('API Error:', {
        status,
        message: errorMessage,
        details: errorDetails
      });
      
      return Promise.reject(errorObj);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      const networkError = {
        ...error,
        errorMessage: 'Network Error',
        errorDetails: 'No response received from server'
      };
      console.error('Network Error:', 'No response received from server');
      return Promise.reject(networkError);
    } else {
      // 请求配置错误
      const requestError = {
        ...error,
        errorMessage: 'Request Error',
        errorDetails: error.message
      };
      console.error('Request Error:', error.message);
      return Promise.reject(requestError);
    }
  }
);

export default axiosInstance;
