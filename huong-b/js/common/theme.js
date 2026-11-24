// Chuyển sáng/tối — dựa trên js/common/theme.js của dewanakl/undangan v3.14.0.
// Khác bản gốc: mỗi lần mở thiệp luôn bắt đầu bằng giao diện sáng (ngày), kể cả khi lần trước khách
// đã chuyển sang tối — nút sáng/tối chỉ có tác dụng trong lần xem đó; màu thanh trạng thái
// điện thoại lấy từ bảng màu thiệp (xanh khi đang ở bìa thư, kem sau khi mở thiệp) thay cho đen/trắng.
import { storage } from './storage.js';

export const theme = (() => {

    /** @type {ReturnType<typeof storage>|null} */
    let themes = null;

    /** @type {HTMLMetaElement|null} */
    let metaTheme = null;

    let statusVar = '--c-bg';

    const isDarkMode = () => themes.get('active') === 'dark';

    const syncMeta = () => {
        const c = window.getComputedStyle(document.documentElement).getPropertyValue(statusVar).trim();
        if (metaTheme && c) {
            metaTheme.setAttribute('content', c);
        }
    };

    /** @param {string} cssVar vd "--c-primary" */
    const setStatusBar = (cssVar) => {
        statusVar = cssVar;
        syncMeta();
    };

    const apply = (mode) => {
        themes.set('active', mode);
        document.documentElement.setAttribute('data-bs-theme', mode);
        syncMeta();
    };

    const change = () => apply(isDarkMode() ? 'light' : 'dark');

    const init = () => {
        themes = storage('theme');
        metaTheme = document.querySelector('meta[name="theme-color"]');
        apply('light'); // mặc định giao diện ngày (ghi đè lựa chọn tối đã lưu từ lần trước)
    };

    return {
        init,
        change,
        isDarkMode,
        setStatusBar,
    };
})();
