// Thanh tiến trình màn hình tải — từ js/app/guest/progress.js của dewanakl/undangan v3.14.0.
// Khác bản gốc: một mục lỗi (ảnh hỏng, mạng chậm) KHÔNG làm kẹt thiệp; có hạn chờ tối đa,
// quá hạn thì vẫn mở bìa thư cho khách.

export const progress = (() => {

    /** @type {HTMLElement|null} */
    let info = null;
    /** @type {HTMLElement|null} */
    let bar = null;

    let total = 0;
    let loaded = 0;
    let isDone = false;

    const add = () => {
        total += 1;
    };

    const finish = () => {
        if (isDone) {
            return;
        }
        isDone = true;
        bar.style.width = '100%';
        document.dispatchEvent(new Event('undangan.progress.done'));
    };

    const step = () => {
        if (isDone) {
            return;
        }
        loaded += 1;
        bar.style.width = `${Math.min((loaded / Math.max(total, 1)) * 100, 100)}%`;
        if (loaded >= total) {
            finish();
        }
    };

    /** @param {string} _type */
    const complete = (_type) => step();

    /** @param {string} type */
    const invalid = (type) => {
        console.warn(`[thiệp] không tải được: ${type}`);
        step();
    };

    /**
     * @param {number} [maxWaitMs=10000]
     */
    const init = (maxWaitMs = 10000) => {
        info = document.getElementById('progress-info');
        bar = document.getElementById('progress-bar');
        info.classList.remove('d-none');
        setTimeout(finish, maxWaitMs);
    };

    /** Gọi sau khi đã add() hết các mục, phòng khi tổng = 0. */
    const check = () => {
        if (loaded >= total) {
            finish();
        }
    };

    return {
        init,
        add,
        check,
        invalid,
        complete,
    };
})();
