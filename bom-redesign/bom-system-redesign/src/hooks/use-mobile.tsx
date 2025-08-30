import { useState, useEffect } from 'react';

// 检测是否为移动设备的钩子函数
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 初始检测
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 首次运行
    checkIfMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile);

    // 清理监听器
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
}
