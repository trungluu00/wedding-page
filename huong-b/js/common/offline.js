// Báo mất mạng — từ js/common/offline.js của dewanakl/undangan v3.14.0 (Việt hóa, không dùng innerHTML).
import { util } from './util.js';

export const offline = (() => {

    /** @type {HTMLElement|null} */
    let alert = null;
    let pill = null;
    let online = true;

    const isOnline = () => online;

    const setText = (ok) => {
        // Màu theo bảng màu thiệp thay cho xanh lá/đỏ mặc định của Bootstrap.
        pill.style.backgroundColor = ok ? 'var(--c-primary)' : '#9b2c2c';
        pill.style.color = ok ? 'var(--c-on-primary)' : '#ffffff';
        pill.replaceChildren(
            util.icon(ok ? 'fa-cloud' : 'fa-ban', 'me-2'),
            ok ? 'Đã có mạng trở lại' : 'Mất kết nối mạng',
        );
    };

    const changeState = () => {
        document.querySelectorAll('[data-offline-disabled]').forEach((e) => {
            e.setAttribute('data-offline-disabled', online ? 'false' : 'true');
            if (e.dataset.busy === '1') return; // đang gửi: giữ nguyên, nút tự bật lại khi gửi xong
            e.disabled = !online;
        });
    };

    let hideTimer = null;

    const onOffline = () => {
        online = false;
        clearTimeout(hideTimer); // mất mạng lại ngay sau khi vừa có mạng: không ẩn thông báo
        setText(false);
        util.changeOpacity(alert, true);
        changeState();
    };

    const onOnline = () => {
        online = true;
        setText(true);
        changeState();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (online) util.changeOpacity(alert, false);
        }, 3000);
    };

    const init = () => {
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        pill = util.h('small', { class: 'text-center rounded-pill py-1 px-3 my-2 shadow', style: { fontSize: '0.8rem' } });
        alert = util.h('div', { class: 'fixed-top pe-none d-flex justify-content-center', style: { opacity: '0', zIndex: '1057' } }, pill);
        document.body.appendChild(alert);
        // Mở thiệp khi đang không có mạng (trang lấy từ bộ nhớ đệm): báo ngay
        if (navigator.onLine === false) {
            onOffline();
        }
    };

    /** Gọi sau khi dựng xong các form: áp trạng thái mạng hiện tại cho nút gửi vừa tạo. */
    const refresh = () => changeState();

    return {
        init,
        refresh,
        isOnline,
    };
})();
