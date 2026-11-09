// Chuyển sáng/tối — dựa trên js/common/theme.js của dewanakl/undangan v3.14.0.
// Khác bản gốc: mặc định luôn là giao diện sáng (thiệp thiết kế cho nền kem), màu thanh trạng thái
// lấy từ biến --c-bg của bảng màu thay cho đen/trắng cố định.
import { storage } from './storage.js';

export const theme = (() => {

    /** @type {ReturnType<typeof storage>|null} */
    let themes = null;

    /** @type {HTMLMetaElement|null} */
    let metaTheme = null;

    const isDarkMode = () => themes.get('active') === 'dark';

    const apply = (mode) => {
        themes.set('active', mode);
        document.documentElement.setAttribute('data-bs-theme', mode);
        const bg = window.getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim();
        if (metaTheme && bg) {
            metaTheme.setAttribute('content', bg);
        }
    };

    const change = () => apply(isDarkMode() ? 'light' : 'dark');

    const init = () => {
        themes = storage('theme');
        metaTheme = document.querySelector('meta[name="theme-color"]');
        apply(isDarkMode() ? 'dark' : 'light');
    };

    return {
        init,
        change,
        isDarkMode,
    };
})();
