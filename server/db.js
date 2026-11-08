import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data
const initialData = {
  wedding: {
    groomName: "Nguyễn Duy Phương",
    groomShortName: "Duy Phương",
    groomFather: "Nguyễn Đơn Cương",
    groomMother: "Nguyễn Thị Hương",
    groomAddress: "Tô Hiệu, Bình Gia, Lạng Sơn",
    groomBank: "Vietcombank - CN Lạng Sơn",
    groomAccount: "1018899888",
    groomAccountName: "NGUYEN DUY PHUONG",
    groomQrImage: "",
    brideName: "Lê Thùy Dương",
    brideShortName: "Thùy Dương",
    brideFather: "Nguyễn Văn Nam",
    brideMother: "Phạm Thị Hà",
    brideAddress: "Tô Hiệu, Bình Gia, Lạng Sơn",
    brideBank: "BIDV - CN Lạng Sơn",
    brideAccount: "68899887766",
    brideAccountName: "LE THUY DUONG",
    brideQrImage: "",
    weddingDate: "2026-07-30",
    weddingTime: "18:00",
    weddingDateDisplay: "30 tháng 7, 2026",
    lunarDateDisplay: "17 tháng 06 năm Bính Ngọ",
    venueName: "Sảnh Grand Crystal · GALA CENTER",
    venueAddress: "415 Hoàng Văn Thụ, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh",
    googleMapsUrl: "https://maps.google.com/?q=Gala+Center,+415+Ho%C3%A0ng+V%C4%83n+Th%E1%BB%A5,+Ph%C6%B0%E1%BB%9Dng+2,+T%C3%A2n+B%C3%ACnh,+H%E1%BB%93+Ch%C3%AD+Minh",
    ceremonyName: "Tư Gia Nhà Trai",
    ceremonyTime: "09:00",
    ceremonyAddress: "Tô Hiệu, Huyện Bình Gia, Tỉnh Lạng Sơn",
    loveQuote: "Khoảnh khắc thấy nhau trên lễ đường... Dù bão giông nghèo khó, mình già đi cùng nhau, có nhau.",
    groomPhone: "0988 888 888",
    groomRepName: "Nguyễn Đơn Cương",
    groomRepRole: "Đại diện Nhà trai (Bố chú rể)",
    groomRepPhone: "0912 345 678",
    bridePhone: "0977 777 777",
    brideRepName: "Nguyễn Văn Nam",
    brideRepRole: "Đại diện Nhà gái (Bố cô dâu)",
    brideRepPhone: "0987 654 321"
  },
  guests: [
    {
      id: "guest-1",
      name: "Anh Nguyễn Hoàng Minh",
      phone: "0912345678",
      side: "Nhà Trai",
      relation: "Bạn thân Đại học",
      code: "hoang-minh",
      invited: true,
      rsvpStatus: "attending",
      guestCount: 2,
      notes: "Đi cùng bạn gái",
      createdAt: new Date().toISOString()
    },
    {
      id: "guest-2",
      name: "Chị Trần Thảo My",
      phone: "0987654321",
      side: "Nhà Gái",
      relation: "Đồng nghiệp Cô dâu",
      code: "thao-my",
      invited: true,
      rsvpStatus: "attending",
      guestCount: 1,
      notes: "Tham dự tiệc chiều",
      createdAt: new Date().toISOString()
    },
    {
      id: "guest-3",
      name: "Bác Nguyễn Văn Hùng",
      phone: "0903112233",
      side: "Nhà Trai",
      relation: "Bác ruột Chú rể",
      code: "bac-hung",
      invited: true,
      rsvpStatus: "pending",
      guestCount: 2,
      notes: "",
      createdAt: new Date().toISOString()
    }
  ],
  wishes: [
    {
      id: "wish-1",
      author: "Quỳnh Nga",
      relation: "Bạn cô dâu",
      text: "Chúc hai bạn trăm năm hạnh phúc, mãi ngọt ngào như ngày đầu! 🌸",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: "wish-2",
      author: "Minh Tuấn",
      relation: "Bạn chú rể",
      text: "Phương & Dương xứng đôi vừa lứa nhất quả đất! Chúc mừng hạnh phúc hai bạn ❤️",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "wish-3",
      author: "Bác Ba",
      relation: "Họ hàng",
      text: "Chúc hai cháu trăm năm tình viên mãn, đầu bạc răng long 囍",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  gifts: [
    {
      id: "gift-1",
      senderName: "Nguyễn Hoàng Minh",
      amount: 1000000,
      method: "Chuyển khoản VietQR",
      message: "Chúc hai bạn trăm năm hạnh phúc!",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "gift-2",
      senderName: "Trần Thảo My",
      amount: 500000,
      method: "Chuyển khoản BIDV",
      message: "Mừng ngày trọng đại của Thùy Dương xinh đẹp ❤️",
      createdAt: new Date(Date.now() - 43200000).toISOString()
    }
  ],
  googleConfig: {
    appsScriptUrl: '',
    sheetUrl: '',
    docUrl: '',
    autoSync: true,
    lastSync: null
  },
  rsvps: [
    {
      id: "rsvp-1",
      guestId: "guest-1",
      name: "Anh Nguyễn Hoàng Minh",
      side: "Nhà Trai",
      willAttend: true,
      guestCount: 2,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "rsvp-2",
      guestId: "guest-2",
      name: "Chị Trần Thảo My",
      side: "Nhà Gái",
      willAttend: true,
      guestCount: 1,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]
};

// Database helper functions
export function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveDb(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data.googleConfig) {
      data.googleConfig = {
        appsScriptUrl: '',
        sheetUrl: '',
        docUrl: '',
        autoSync: true,
        lastSync: null
      };
    }
    if (!data.adminPassword) {
      data.adminPassword = 'Peanut@1998';
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return initialData;
  }
}

export function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// Slug generator for guest invite links
export function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
