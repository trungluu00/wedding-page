// Lưu trữ nhỏ trong localStorage — từ js/common/storage.js của dewanakl/undangan v3.14.0.
// Khác bản gốc: không lỗi khi trình duyệt chặn localStorage (chế độ riêng tư, một số webview),
// lúc đó dữ liệu chỉ giữ trong bộ nhớ của trang.

const memory = new Map();

const read = (table) => {
    try {
        const raw = window.localStorage.getItem(table);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return memory.get(table) ?? {};
    }
};

const write = (table, data) => {
    try {
        window.localStorage.setItem(table, JSON.stringify(data));
    } catch {
        memory.set(table, data);
    }
};

export const storage = (table) => {
    const name = `thiep:${table}`;

    /**
     * @param {string|null} [key=null]
     * @returns {any}
     */
    const get = (key = null) => {
        const data = read(name);
        return key ? data[String(key)] : data;
    };

    /**
     * @param {string} key
     * @param {any} value
     */
    const set = (key, value) => {
        const data = read(name);
        data[String(key)] = value;
        write(name, data);
    };

    const has = (key) => Object.prototype.hasOwnProperty.call(read(name), String(key));

    const unset = (key) => {
        const data = read(name);
        delete data[String(key)];
        write(name, data);
    };

    const clear = () => write(name, {});

    return {
        set,
        get,
        has,
        clear,
        unset,
    };
};
