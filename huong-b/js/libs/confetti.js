// Hiệu ứng pháo giấy khi mở thiệp — dựa trên js/libs/confetti.js của dewanakl/undangan v3.14.0.
// Khác bản gốc (vốn rơi tim liên tục 15 giây, mỗi khung hình 3 hạt, vẽ trên luồng chính):
//  - vẽ trên canvas riêng bằng Web Worker (useWorker) nên cuộn trang không khựng;
//  - một đợt bắn + tim rơi 3,5 giây, cứ 6 khung hình mới thả 1 hạt, tối đa ~35 hạt tim;
//  - dừng ngay khi tab bị ẩn, tắt hẳn khi người dùng bật "giảm chuyển động";
//  - màu theo bảng màu thiệp; xong thì gỡ canvas.
const zIndex = 1057;

/** @type {any} */
let instance = null;
/** @type {HTMLCanvasElement|null} */
let canvas = null;
let stopAt = 0;

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const themeColors = () => {
    const css = window.getComputedStyle(document.documentElement);
    return ['--c-primary', '--c-accent', '--c-soft']
        .map((v) => css.getPropertyValue(v).trim())
        .filter(Boolean);
};

const getInstance = () => {
    if (!window.confetti || reduced()) {
        return null;
    }
    if (!instance) {
        canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: String(zIndex),
        });
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);
        instance = window.confetti.create(canvas, { resize: true, useWorker: true, disableForReducedMotion: true });
    }
    return instance;
};

const cleanup = (delay) => setTimeout(() => {
    if (Date.now() < stopAt) {
        return;
    }
    instance?.reset();
    canvas?.remove();
    instance = null;
    canvas = null;
}, delay);

const heartShape = () => window.confetti.shapeFromPath({
    path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
    matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333],
});

export const basicAnimation = () => {
    const fire = getInstance();
    if (fire) {
        fire({ origin: { y: 1 }, particleCount: 60, spread: 70, ticks: 160, colors: themeColors() });
    }
};

/**
 * @param {number} [seconds=3.5]
 */
export const openAnimation = (seconds = 3.5) => {
    const fire = getInstance();
    if (!fire) {
        return;
    }
    const duration = seconds * 1000;
    stopAt = Date.now() + duration;
    const heart = heartShape();
    const colors = themeColors();
    const rand = (min, max) => Math.random() * (max - min) + min;
    let frameNo = 0;

    const frame = () => {
        const timeLeft = stopAt - Date.now();
        if (timeLeft <= 0 || document.hidden) {
            cleanup(4000);
            return;
        }
        if (frameNo++ % 6 === 0) {
            fire({
                particleCount: 1,
                startVelocity: 0,
                ticks: 200,
                origin: { x: Math.random(), y: -0.05 },
                colors: [colors[frameNo % colors.length]],
                shapes: [heart],
                drift: rand(-0.4, 0.4),
                gravity: rand(0.4, 0.7),
                scalar: rand(0.7, 1.1),
            });
        }
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    // Dự phòng: webview hãm requestAnimationFrame thì vẫn gỡ canvas đúng hạn.
    cleanup(duration + 4500);
};

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAt = 0;
        instance?.reset();
    }
});
