// Nạp AOS (hiệu ứng khi cuộn) và canvas-confetti từ jsDelivr — từ js/libs/loader.js của
// dewanakl/undangan v3.14.0. Khác bản gốc: nạp thẳng bằng thẻ <script>/<link> (không qua Cache API),
// và lỗi tải thư viện không chặn việc mở thiệp.

const urlAosCss = 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css';
const urlAosJs = 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js';
const urlConfetti = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js';

const addScript = (src) => new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.onload = res;
    sc.onerror = rej;
    sc.src = src;
    sc.crossOrigin = 'anonymous';
    document.head.appendChild(sc);
});

const addCss = (href) => new Promise((res, rej) => {
    const link = document.createElement('link');
    link.onload = res;
    link.onerror = rej;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
});

const loadAOS = () => Promise.all([addCss(urlAosCss), addScript(urlAosJs)]).then(() => {
    if (typeof window.AOS === 'undefined') {
        throw new Error('AOS không tải được');
    }
    window.AOS.init({ once: true, duration: 1200 });
});

const loadConfetti = () => addScript(urlConfetti).then(() => {
    if (typeof window.confetti === 'undefined') {
        throw new Error('Confetti không tải được');
    }
});

/**
 * @param {{aos?: boolean, confetti?: boolean}} [opt]
 * @returns {Promise<void>}
 */
export const loader = (opt = {}) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tasks = [];
    if ((opt.aos ?? true) && !reduce) {
        tasks.push(loadAOS());
    }
    if ((opt.confetti ?? true) && !reduce) {
        tasks.push(loadConfetti());
    }
    return Promise.allSettled(tasks).then(() => undefined);
};
