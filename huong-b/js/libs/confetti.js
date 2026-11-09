// Hiệu ứng pháo giấy khi mở thiệp — từ js/libs/confetti.js của dewanakl/undangan v3.14.0.
// Khác bản gốc: màu lấy theo bảng màu thiệp, thời gian rơi tim ngắn hơn (6 giây).
const zIndex = 1057;

const themeColors = () => {
    const css = window.getComputedStyle(document.documentElement);
    return ['--c-primary', '--c-accent', '--c-soft']
        .map((v) => css.getPropertyValue(v).trim())
        .filter(Boolean);
};

const heartShape = () => window.confetti.shapeFromPath({
    path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
    matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333],
});

export const basicAnimation = () => {
    if (window.confetti) {
        window.confetti({ origin: { y: 1 }, zIndex, colors: themeColors() });
    }
};

/**
 * @param {number} [until=6] số giây
 */
export const openAnimation = (until = 6) => {
    if (!window.confetti) {
        return;
    }

    const duration = until * 1000;
    const animationEnd = Date.now() + duration;
    const heart = heartShape();
    const colors = themeColors();
    const rand = (min, max) => Math.random() * (max - min) + min;

    const frame = () => {
        const timeLeft = animationEnd - Date.now();

        colors.forEach((color) => {
            window.confetti({
                particleCount: 1,
                startVelocity: 0,
                ticks: Math.max(50, 75 * (timeLeft / duration)),
                origin: { x: Math.random(), y: Math.abs(Math.random() - (timeLeft / duration)) },
                zIndex,
                colors: [color],
                shapes: [heart],
                drift: rand(-0.5, 0.5),
                gravity: rand(0.5, 1),
                scalar: rand(0.5, 1),
            });
        });

        if (timeLeft > 0) {
            requestAnimationFrame(frame);
        }
    };

    requestAnimationFrame(frame);
};

/**
 * @param {HTMLElement} div
 * @param {number} [duration=80]
 */
export const tapTapAnimation = (div, duration = 80) => {
    if (!window.confetti) {
        return;
    }

    const end = Date.now() + duration;
    const rect = div.getBoundingClientRect();
    const y = Math.max(0.3, Math.min(1, (rect.top / window.innerHeight) + 0.1));
    const heart = heartShape();
    const colors = themeColors().slice(0, 2);

    const frame = () => {
        colors.forEach((color) => {
            window.confetti({ particleCount: 2, angle: 60, spread: 55, shapes: [heart], origin: { x: rect.left / window.innerWidth, y }, zIndex, colors: [color] });
            window.confetti({ particleCount: 2, angle: 120, spread: 55, shapes: [heart], origin: { x: rect.right / window.innerWidth, y }, zIndex, colors: [color] });
        });
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    requestAnimationFrame(frame);
};
