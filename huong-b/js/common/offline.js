// Báo mất mạng — từ js/common/offline.js của dewanakl/undangan v3.14.0 (Việt hóa, không dùng innerHTML).
import { util } from './util.js';

export const offline = (() => {

    /** @type {HTMLElement|null} */
    let alert = null;
    let pill = null;
    let online = true;

    const isOnline = () => online;

    const setText = (ok) => {
        pill.classList.toggle('bg-success', ok);
        pill.classList.toggle('bg-danger', !ok);
        pill.replaceChildren(
            util.icon(ok ? 'fa-cloud' : 'fa-ban', 'me-2'),
            ok ? 'Đã có mạng trở lại' : 'Mất kết nối mạng',
        );
    };

    const changeState = () => {
        document.querySelectorAll('[data-offline-disabled]').forEach((e) => {
            e.setAttribute('data-offline-disabled', online ? 'false' : 'true');
            e.disabled = !online;
        });
    };

    const onOffline = () => {
        online = false;
        setText(false);
        util.changeOpacity(alert, true);
        changeState();
    };

    const onOnline = () => {
        online = true;
        setText(true);
        changeState();
        util.timeOut(() => util.changeOpacity(alert, false), 3000);
    };

    const init = () => {
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        pill = util.h('small', { class: 'text-center rounded-pill py-1 px-3 my-2 text-white shadow bg-danger', style: { fontSize: '0.8rem' } });
        alert = util.h('div', { class: 'fixed-top pe-none d-flex justify-content-center', style: { opacity: '0', zIndex: '1057' } }, pill);
        document.body.appendChild(alert);
    };

    return {
        init,
        isOnline,
    };
})();
