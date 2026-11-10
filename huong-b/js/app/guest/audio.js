// Nhạc nền — dựa trên js/app/guest/audio.js của dewanakl/undangan v3.14.0.
// Nhạc bắt đầu khi khách chạm "Mở thiệp" (trình duyệt điện thoại chỉ cho phát sau một cú chạm).
// Khác bản gốc: phát thẳng từ URL (không tải trước qua Cache API), không chặn màn hình tải.
import { util } from '../../common/util.js';

export const audio = (() => {

    /** @type {HTMLAudioElement|null} */
    let el = null;
    let isPlay = false;
    /** @type {HTMLButtonElement|null} */
    let button = null;
    const listeners = new Set();

    const setIcon = () => {
        button?.replaceChildren(isPlay ? util.icon('fa-circle-pause', 'spin-button') : util.icon('fa-circle-play'));
        listeners.forEach((fn) => fn(isPlay));
    };

    const play = async () => {
        if (!el) {
            return;
        }
        try {
            await el.play();
            isPlay = true;
        } catch {
            isPlay = false;
        }
        setIcon();
    };

    const pause = () => {
        if (!el) {
            return;
        }
        el.pause();
        isPlay = false;
        setIcon();
    };

    const toggle = () => (isPlay ? pause() : play());

    /**
     * @param {string} src
     */
    const init = (src) => {
        button = document.getElementById('button-music');
        if (!src) {
            button?.remove();
            button = null;
            return;
        }

        el = new Audio();
        // Chưa có file nhạc (hoặc tải lỗi): bỏ nút nhạc thay vì để nút bấm không phát được
        el.addEventListener('error', () => {
            isPlay = false;
            button?.remove();
            button = null;
            el = null;
        });
        el.src = src;
        el.loop = true;
        el.preload = 'auto';

        button.addEventListener('click', toggle);
        document.addEventListener('undangan.open', () => {
            button?.classList.remove('d-none');
            play();
        });
        // Tạm dừng khi khách chuyển sang app khác.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && isPlay) {
                el.pause();
            } else if (!document.hidden && isPlay) {
                el.play().catch(() => undefined);
            }
        });
    };

    return {
        init,
        play,
        pause,
        toggle,
        hasMusic: () => el !== null,
        isPlaying: () => isPlay,
        onChange: (fn) => listeners.add(fn),
    };
})();
