import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for all requests to make Vercel/Netlify frontend integrations work flawlessly
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Path to durable local storage fallback
const DATA_FILE = path.join(process.cwd(), "data_store.json");

// Core interface definitions matching the React client
interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  calories: string;
  spicyLevel: number;
  plainImage: string;
  dodoImage?: string;
  features: string[];
}

interface OrderItem {
  dishId: string;
  hasPlantain?: boolean;
  selectedToppingIds?: string[];
  toppingQuantities?: Record<string, number>;
  quantity: number;
  ownerName?: string;
}

interface Order {
  id: string;
  name: string;
  phone: string;
  address?: string;
  method: "pickup" | "delivery";
  time: string;
  dietaryNotes?: string;
  totalPrice: number;
  customPlatterns_v2?: OrderItem[];
  customPlatters_v2?: OrderItem[];
  createdAt: string;
  status: "pending" | "processing" | "dispatched" | "completed";
  paymentStatus?: string;
  paymentReference?: string;
}

interface Discount {
  code: string;
  percentage: number;
  active: boolean;
}

// Initial default menu matching InteractiveMenu.tsx
const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'rice_chicken_beef',
    name: 'Jollof/Fried Rice & Chicken/Beef',
    category: 'main_meals',
    description: 'Our award-winning Nigerian firewood-style rice served with your choice of protein.',
    basePrice: 3800,
    calories: '680 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/jollof_plain_1781261864825.jpg',
    dodoImage: '/src/assets/images/jollof_dodo_1781261920626.jpg',
    features: ['Ember-roasted aroma', 'Double pepper slurry', 'Choice of Beef or Chicken']
  },
  {
    id: 'spaghetti_chicken_beef',
    name: 'Spaghetti & Chicken/Beef',
    category: 'main_meals',
    description: 'Savory stir-fried long-strand pasta simmered in rich pepper tomato sauce.',
    basePrice: 3600,
    calories: '610 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/spaghetti_plain_1781261959247.jpg',
    dodoImage: '/src/assets/images/spaghetti_dodo_1781261974936.jpg',
    features: ['Scotch bonnet glaze', 'Stir-fried durum paste', 'Savory seasoning']
  },
  {
    id: 'rice_turkey',
    name: 'Jollof/Fried Rice & Turkey',
    category: 'main_meals',
    description: 'Woodfire long grain rice served with grilled or fried giant seasoned Turkey.',
    basePrice: 7000,
    calories: '890 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/jollof_plain_1781261864825.jpg',
    dodoImage: '/src/assets/images/jollof_dodo_1781261920626.jpg',
    features: ['Crisp golden turkey side', 'Smoky rice base', 'Rich native sauce']
  },
  {
    id: 'spaghetti_turkey',
    name: 'Spaghetti & Turkey',
    category: 'main_meals',
    description: 'Durum tomato spaghetti skillet stir-fry set alongside a portion of our golden-fried Turkey.',
    basePrice: 6800,
    calories: '830 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/spaghetti_plain_1781261959247.jpg',
    dodoImage: '/src/assets/images/spaghetti_dodo_1781261974936.jpg',
    features: ['Hearty Turkey wing', 'Bold bell pepper reduction', 'Dynamic spice profile']
  },
  {
    id: 'yam_egg_sauce',
    name: 'Boiled Yam & Egg Sauce',
    category: 'main_meals',
    description: 'Traditional native white yams boiled fluffy soft, accompanied by seasoned tomato egg scramble.',
    basePrice: 3700,
    calories: '530 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/boiled_yam_eggsauce_1781260539426.jpg',
    dodoImage: '/src/assets/images/yam_egg_dodo_1781261903040.jpg',
    features: ['Buttery yam slices', 'Farm-fresh country egg sauce', 'Scallion garnish']
  },
  {
    id: 'fried_yam_egg_sauce',
    name: 'Fried Yam & Egg Sauce',
    category: 'main_meals',
    description: 'Crispiest hand-sliced sweet organic yams fried golden, with hot tomato scrambled egg sauce.',
    basePrice: 4000,
    calories: '590 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/boiled_yam_eggsauce_1781260539426.jpg',
    dodoImage: '/src/assets/images/yam_egg_dodo_1781261903040.jpg',
    features: ['Crispy crunchy shell', 'Savory onion tomato egg', 'Hot woodside style']
  },
  {
    id: 'small_beef_shawarma',
    name: 'Small Beef Shawarma',
    category: 'shawarma',
    description: 'Toasted flatbread wrap filled with wood-grilled spiced shaved beef and garlic mayo sauce.',
    basePrice: 2800,
    calories: '410 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Woodfire beef slices', 'Garlic paste', 'Toasted flatbread wrap']
  },
  {
    id: 'big_beef_shawarma',
    name: 'Big Beef Shawarma',
    category: 'shawarma',
    description: 'An upgraded size of our classic loaded spiced beef wrap with shredded fresh purple cabbage.',
    basePrice: 3100,
    calories: '550 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Double meat portions', 'Aromatic spices', 'Cabbage shreddings']
  },
  {
    id: 'small_ch_shawarma',
    name: 'Small Chicken Shawarma',
    category: 'shawarma',
    description: 'Toasted flatbread rolled around wood-grilled marinated shaver chicken breasts, with garlic toum.',
    basePrice: 3000,
    calories: '450 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Premium garlic toum', 'Herbaceous marinades', 'Perfect single size']
  },
  {
    id: 'royal_shawarma',
    name: 'Royal Shawarma Wrapper',
    category: 'shawarma',
    description: 'The ultimate size! Chicken, beef, hotdogs, and extra cheese rolled in a premium crispy pita.',
    basePrice: 4000,
    calories: '890 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Double protein hybrid', 'Premium hotdog slice', 'Cheddar cheese core']
  },
  {
    id: 'noodles_egg',
    name: 'Noodles & Egg',
    category: 'noodles',
    description: 'Aromatic express noodles cooked in spice broth, crowned with a fried or boiled farm egg.',
    basePrice: 2500,
    calories: '490 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/noodles_topdown_1781279953591.jpg',
    features: ['Spiced soup glaze', 'Perfect farm egg', 'Scallion garnish']
  },
  {
    id: 'special_chicken_chips',
    name: 'Chicken & Chips (Special)',
    category: 'chips',
    description: 'Our ultimate chip pack with our premium glazed peppered or caramel-roasted giant double chicken.',
    basePrice: 5000,
    calories: '890 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/chicken_chips_topdown_1781279971163.jpg',
    features: ['Peppered or Caramel glazed', 'Wood-roasted aromatics', 'Gourmet packaging']
  },
  {
    id: 'sweet_tooth_smoothie',
    name: 'Sweet Tooth Smoothie',
    category: 'drinks',
    description: 'Blend of pureed strawberries, honey, and Greek yogurt to satisfy sugar cravings.',
    basePrice: 3000,
    calories: '280 kcal',
    spicyLevel: 0,
    plainImage: '/src/assets/images/signature_platter_1781259994332.jpg',
    features: ['All organic honey', 'Vibrant berry extract', 'Served child-cold']
  }
];

// Load local database structured store
const loadData = () => {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse data file, resetting to defaults", e);
    }
  }
  
  // Default Database Schema State
  const defaultState = {
    menu: INITIAL_MENU_ITEMS,
    orders: [] as Order[],
    discounts: [
      { code: "WOODFIRE29", percentage: 15, active: true },
      { code: "DOYL29", percentage: 10, active: true }
    ] as Discount[]
  };
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
  return defaultState;
};

// Save helper for local store
const saveData = (state: any) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to data store file", e);
  }
};

// Database store instance
let dbStore = loadData();

// Get Supabase credentials
const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  return { url, anonKey, configured: !!(url && anonKey) };
};

// Simple Supabase Proxy Client using Native REST endpoints
async function querySupabase(path: string, options: RequestInit = {}) {
  const config = getSupabaseConfig();
  if (!config.configured) return null;

  try {
    const url = `${config.url}/rest/v1/${path}`;
    const defaultHeaders = {
      "apikey": config.anonKey,
      "Authorization": `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };

    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase REST Error (${response.status}): ${text}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Supabase sync failed for target '${path}':`, err);
    return null;
  }
}

// -------------------------------------------------------------
// TELEGRAM BOT STATIC MAPPING & PDF REPORTING HELPERS
// -------------------------------------------------------------
const SIDE_MEALS_TOPPINGS = [
  { id: 'plantain', name: 'Plantain (Dodo)', price: 800 },
  { id: 'salad', name: 'Salad portion', price: 800 },
  { id: 'egg', name: 'Boiled/Fried Egg', price: 400 },
  { id: 'hotdog', name: 'Hotdog', price: 500 },
  { id: 'moimoi', name: 'Moi Moi wrap', price: 900 },
  { id: 'turkey', name: 'Turkey portion', price: 4500 },
  { id: 'chicken', name: 'Chicken portion', price: 1800 },
  { id: 'beef', name: 'A portion of Beef', price: 1800 },
  { id: 'caramel_chicken', name: 'Caramel Chicken', price: 2100 },
  { id: 'peppered_chicken', name: 'Peppered Chicken', price: 2200 },
  { id: 'peppered_beef', name: 'Peppered Beef', price: 2200 },
  { id: 'peppered_turkey', name: 'Peppered Turkey', price: 5000 },
  { id: 'popcorn', name: 'Popcorn', price: 800 }
];

function getPlatterDetailedDescription(item: OrderItem): string {
  const dish = dbStore.menu.find((m: any) => m.id === item.dishId) || { name: item.dishId };
  let desc = `<b>${dish.name}</b> (x${item.quantity})`;
  
  if (item.ownerName) {
    desc += ` [🏷️ Pack for: <b>${item.ownerName}</b>]`;
  }
  
  const toppingsList: string[] = [];
  if (item.hasPlantain) {
    toppingsList.push("Fried Plantain (Dodo)");
  }
  if (item.selectedToppingIds && item.selectedToppingIds.length > 0) {
    item.selectedToppingIds.forEach(tid => {
       const t = SIDE_MEALS_TOPPINGS.find(topping => topping.id === tid);
       if (t) {
         const qty = item.toppingQuantities?.[tid] ?? 1;
         toppingsList.push(`${t.name}${qty > 1 ? ` (x${qty})` : ''}`);
       }
    });
  }
  
  if (toppingsList.length > 0) {
    desc += `\n     └─ <i>Add-ons: ${toppingsList.join(", ")}</i>`;
  }
  return desc;
}

function getTopLovedFeedback(orders: Order[]): string {
  const itemCounts: Record<string, { name: string; count: number }> = {};
  orders.forEach(order => {
    const platters = order.customPlatters_v2 || order.customPlatterns_v2 || [];
    platters.forEach(platter => {
      const dishId = platter.dishId;
      const dish = dbStore.menu.find((m: any) => m.id === dishId) || { name: dishId };
      const qty = platter.quantity || 1;
      if (!itemCounts[dishId]) {
        itemCounts[dishId] = { name: dish.name, count: 0 };
      }
      itemCounts[dishId].count += qty;
    });
  });

  const sorted = Object.values(itemCounts).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) {
    return `📈 <b>No orders placed yet to compute trends!</b> Check back once customers start building custom plats.`;
  }

  let text = `🏆 <b>TOP LOVED MENU ITEMS & PATRON FEEDBACK</b>\n\n`;
  sorted.slice(0, 5).forEach((item, idx) => {
    const medals = ["🥇", "🥈", "🥉", "🏅", "🎖️"];
    const medal = medals[idx] || "•";
    let remark = "Highly demanded combo!";
    if (idx === 0) remark = "Crowd favorite! Chef's signature woodfire choice.";
    else if (idx === 1) remark = "Strong sales momentum! Perfect size combination.";
    else if (idx === 2) remark = "Frequently ordered for group orders and friends' treat.";
    
    text += `${medal} <b>${item.name}</b>\n` +
            `Ordered: <b>${item.count} portions</b>\n` +
            `💬 <i>Feedback: ${remark}</i>\n\n`;
  });
  return text;
}

function generatePdfReport(orders: Order[], dateRangeText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on("data", chunk => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", err => reject(err));

      // Visual Heading styling
      doc.fillColor("#111111").rect(0, 0, 612, 110).fill();

      // Draw the Red Brand Badge Logo
      doc.fillColor("#D62828").rect(50, 25, 42, 42).fill();
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(24).text("29", 58, 33);

      // Heading block
      doc.fillColor("#FFFFFF")
         .font("Helvetica-Bold")
         .fontSize(16)
         .text("foods // Control Room Bot", 102, 30)
         .fontSize(9)
         .font("Helvetica")
         .text(`DEDICATED SALES TRADE ANALYTICS: ${dateRangeText.toUpperCase()}`, 102, 54)
         .text(`Generated at: ${new Date().toLocaleString()} | Secure Host`, 102, 68);

      doc.fillColor("#111111").font("Helvetica").fontSize(10);

      const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === "completed").length;

      // Sales Summary Dashboard Cards representation
      doc.fillColor("#D62828").fontSize(13).font("Helvetica-Bold").text("Performance Snapshot", 50, 135);
      doc.fillColor("#333333").fontSize(9.5).font("Helvetica");

      doc.text(`Total Generated Revenue: NGN ${totalSales.toLocaleString()}`, 50, 155);
      doc.text(`Total Placed Tickets: ${totalOrders} tickets`, 50, 170);
      doc.text(`Completed/Fulfilled: ${completedOrders} orders`, 50, 185);

      // Product popularity
      const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orders.forEach(order => {
        const platters = order.customPlatters_v2 || order.customPlatterns_v2 || [];
        platters.forEach(platter => {
          const dishId = platter.dishId;
          const dish = dbStore.menu.find((m: any) => m.id === dishId) || { name: dishId };
          const qty = platter.quantity || 1;
          if (!itemCounts[dishId]) {
            itemCounts[dishId] = { name: dish.name, count: 0, revenue: 0 };
          }
          itemCounts[dishId].count += qty;
          const basePrice = (dish.basePrice || 0);
          itemCounts[dishId].revenue += qty * basePrice;
        });
      });

      const popularList = Object.values(itemCounts).sort((a, b) => b.count - a.count);

      doc.fillColor("#D62828").fontSize(13).font("Helvetica-Bold").text("Product Popularity Map & Trends", 50, 215);
      doc.fillColor("#333333").fontSize(9.5).font("Helvetica");
      
      let yPos = 235;
      if (popularList.length === 0) {
        doc.text("No items ordered in this period.", 50, yPos);
        yPos += 15;
      } else {
        doc.font("Helvetica-Bold").text("Dish Item / Selection", 50, yPos);
        doc.text("Units Sold", 320, yPos);
        doc.text("Est. Base Revenue", 420, yPos);
        doc.font("Helvetica");
        yPos += 15;

        popularList.forEach(item => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          // subtle border bottom lines
          doc.strokeColor("#F3F4F6").lineWidth(0.5).moveTo(50, yPos + 12).lineTo(550, yPos + 12).stroke();
          doc.text(item.name.substring(0, 45), 50, yPos);
          doc.text(item.count.toString(), 320, yPos);
          doc.text(`NGN ${item.revenue.toLocaleString()}`, 420, yPos);
          yPos += 20;
        });
      }

      // Detailed transaction list
      yPos += 15;
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc.fillColor("#D62828").fontSize(13).font("Helvetica-Bold").text("Individual Order Transaction Log", 50, yPos);
      doc.fillColor("#333333").font("Helvetica").fontSize(9.5);
      yPos += 20;

      orders.forEach((order) => {
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        // Draw a light container card border
        doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(50, yPos).lineTo(550, yPos).stroke();
        yPos += 10;

        doc.font("Helvetica-Bold").text(`Order ID: ${order.id}`, 50, yPos);
        doc.font("Helvetica").text(`Date/Time: ${order.time}`, 220, yPos);
        doc.text(`Status: ${order.status.toUpperCase()}`, 400, yPos);
        yPos += 15;

        doc.text(`Patron: ${order.name} (${order.phone})`, 50, yPos);
        doc.text(`Total Price: ₦${order.totalPrice.toLocaleString()}`, 400, yPos);
        yPos += 15;

        const platters = order.customPlatters_v2 || order.customPlatterns_v2 || [];
        const plattersStr = platters.map((p, idx) => {
          const dish = dbStore.menu.find((m: any) => m.id === p.dishId) || { name: p.dishId };
          let txt = `${p.quantity}x ${dish.name}`;
          if (p.ownerName) txt += ` (Pack for: ${p.ownerName})`;
          return txt;
        }).join(" | ");

        doc.font("Helvetica-Oblique").text(`Custom Assembly: ${plattersStr || "Default Platter Selection"}`, 50, yPos, { width: 450 });
        yPos += 25;
      });

      // Footer signature
      doc.strokeColor("#D62828").lineWidth(1.5).moveTo(50, 745).lineTo(550, 745).stroke();
      doc.fillColor("#999999").fontSize(7.5).font("Helvetica")
         .text("This document is generated instantly from 29foods Live Node Server Database.", 50, 755);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function sendTelegramDocument(chatId: string | number, pdfBuffer: Buffer, fileName: string, captionText: string, token: string) {
  try {
    const formData = new FormData();
    formData.append("chat_id", chatId.toString());
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    formData.append("document", blob, fileName);
    formData.append("caption", captionText);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      console.error("sendDocument Telegram response error:", await response.text());
    } else {
      console.log(`Document sent to chatId ${chatId} successfully.`);
    }
  } catch (err) {
    console.error("Failed to send Document to Telegram:", err);
  }
}

// -------------------------------------------------------------
// TELEGRAM BOT BACKGROUND POLL ENGINE AND DISPATCH LOGIC
// -------------------------------------------------------------
const getTelegramConfig = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
  return { token, chatId, configured: !!token };
};

// Send message to Admin Telegram Account
async function sendTelegramAlert(text: string) {
  const { token, chatId, configured } = getTelegramConfig();
  if (!configured || !chatId) {
    console.log("[Telegram Alert (unconfigured)]: ", text);
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML"
      })
    });
    if (!response.ok) {
      console.error("Telegram API alert returned error:", await response.text());
    }
  } catch (err) {
    console.error("Failed to send Telegram dispatch alert:", err);
  }
}

// Simple background Telegram Updates polling loop (so the bot responds to commands!)
let lastTelegramUpdateId = 0;
async function pollTelegramUpdates() {
  const { token, configured } = getTelegramConfig();
  if (!configured) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastTelegramUpdateId + 1}&timeout=5`);
    if (!response.ok) {
      // Avoid spamming failure logs
      return;
    }

    const body = await response.json();
    if (body.ok && body.result && body.result.length > 0) {
      for (const update of body.result) {
        lastTelegramUpdateId = update.update_id;
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const userText: string = update.message.text.trim();
          const senderName = update.message.from?.first_name || "Admin";

          console.log(`[Telegram User ${senderName} (${chatId}) sent]:`, userText);

          // Handle incoming commands
          await processTelegramMessage(chatId, userText, senderName, token);
        }
      }
    }
  } catch (err) {
    // Avoid spamming logs when connections are transient in dev sandbox
  }
}// Keyboard Layout structures for enhanced admin UI in Telegram
const MAIN_KEYBOARD = {
  keyboard: [
    [{"text": "📦 Active Orders"}, {"text": "📊 Revenue Report"}],
    [{"text": "📈 Top Loved Items"}, {"text": "❓ Get Help"}]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

const REPORT_KEYBOARD = {
  keyboard: [
    [{"text": "📋 Today's PDF Report"}, {"text": "📋 All-Time PDF Report"}],
    [{"text": "🔙 Back to Main"}]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

// Router for Telegram command logic
async function processTelegramMessage(chatId: string | number, text: string, senderName: string, token: string) {
  const reply = async (msg: string, keyboardMarkup?: any) => {
    try {
      const payload: any = {
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML"
      };
      if (keyboardMarkup) {
        payload.reply_markup = keyboardMarkup;
      }
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to reply to Telegram command", e);
    }
  };

  const normInput = text.trim();
  const command = normInput.split(" ")[0].toLowerCase();
  const args = normInput.split(" ").slice(1);

  if (command === "/start" || normInput === "🔙 Back to Main") {
    await reply(
      `🔥 <b>29foods Spot Control Room Bot</b> 🔥\n\n` +
      `Hello <b>${senderName}</b>! Use the persistent tactile keyboard buttons below or direct arguments to manage active woodfire kitchen dispatches.\n\n` +
      `<b>Quick Commands Guide:</b>\n` +
      `📦 <code>/orders</code> - Review live tickets list\n` +
      `🏷️ <code>/discount [CODE] [PERCENT]</code> - Set discount codes\n` +
      `➕ <code>/additem [ID] [NAME] [PRICE]</code> - Add dish\n` +
      `❌ <code>/removeitem [ID]</code> - Delete dish\n` +
      `❓ <code>/help</code> - General guides`,
      MAIN_KEYBOARD
    );
    return;
  }

  if (command === "/help" || normInput === "❓ Get Help") {
    await reply(
      `🛠️ <b>How-to Guide for 29foods Bot:</b>\n\n` +
      `• <b>Set up discounts:</b> <code>/discount MATCH29 20</code>\n` +
      `• <b>Add dishes:</b> <code>/additem sweet_potato_egg Sweet_Potato_Eggs_Dish 3200</code>\n` +
      `• <b>Disable dishes:</b> <code>/removeitem sweet_potato_egg</code>\n` +
      `• <b>View orders:</b> Tap <i>Active Orders</i> or send <code>/orders</code>`,
      MAIN_KEYBOARD
    );
    return;
  }

  if (command === "/orders" || normInput === "📦 Active Orders") {
    const orders: Order[] = dbStore.orders;
    if (orders.length === 0) {
      await reply(`📦 <b>All Sales Trades:</b> No takeaway orders placed right now!`, MAIN_KEYBOARD);
      return;
    }

    let summary = `📦 <b>Live Food Sales & Orders History (${orders.length}):</b>\n\n`;
    // Render the top 5 most recent orders with full visual breakdowns
    orders.slice(0, 5).forEach((order) => {
      const platters = order.customPlatters_v2 || order.customPlatterns_v2 || [];
      const itemBreakdowns = platters.map((item, index) => {
        return `   • <i>Item ${index + 1}:</i> ${getPlatterDetailedDescription(item)}`;
      }).join("\n");

      summary += `🎟️ <b>Ticket:</b> <code>${order.id}</code> | 👤 <b>Patron:</b> ${order.name}\n` +
                 `📞 <b>Phone:</b> ${order.phone}\n` +
                 `💳 <b>Total:</b> ₦${order.totalPrice.toLocaleString()} | ⏰ <b>Time:</b> ${order.time}\n` +
                 `📍 <b>Method:</b> ${order.method.toUpperCase()} ${order.address ? `(${order.address})` : ""}\n` +
                 `💬 <b>Notes:</b> <i>"${order.dietaryNotes || "None"}"</i>\n` +
                 `🛒 <b>Meal Breakdown:</b>\n${itemBreakdowns}\n` +
                 `⚡ <b>Status:</b> 🟡 <i>${order.status.toUpperCase()}</i>\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    await reply(summary, MAIN_KEYBOARD);
    return;
  }

  if (normInput === "📊 Revenue Report") {
    await reply(
      `⏱️ <b>Select Audit Dimension:</b>\n\n` +
      `Choose whether to compile total trade sales into an official PDF document for **Today** or view the **All-Time** historical ledger.`,
      REPORT_KEYBOARD
    );
    return;
  }

  if (normInput === "📋 Today's PDF Report") {
    const orders: Order[] = dbStore.orders;
    const todayDateStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const todayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayDateStr));

    await reply(`⏳ Compiling today's <b>${todayOrders.length} active trades</b> into a formal trade PDF ledger...`, REPORT_KEYBOARD);
    
    try {
      const pdfBuffer = await generatePdfReport(todayOrders, `Today's Trades (${todayDateStr})`);
      await sendTelegramDocument(
        chatId,
        pdfBuffer,
        `29foods_Report_Today_${todayDateStr}.pdf`,
        `📄 Here is your requested 29foods sales trades PDF for Today: ${todayDateStr}.`,
        token
      );
    } catch (err) {
      console.error(err);
      await reply(`❌ Failed to compile PDF report: ${err instanceof Error ? err.message : String(err)}`, REPORT_KEYBOARD);
    }
    return;
  }

  if (normInput === "📋 All-Time PDF Report") {
    const orders: Order[] = dbStore.orders;
    await reply(`⏳ Compiling all-time <b>${orders.length} historical trades</b> into a comprehensive PDF audit ledger...`, REPORT_KEYBOARD);
    
    try {
      const pdfBuffer = await generatePdfReport(orders, "All-Time Historical Trades");
      await sendTelegramDocument(
        chatId,
        pdfBuffer,
        "29foods_Report_AllTime.pdf",
        `📄 Here is your complete requested all-time sales ledger PDF file.`,
        token
      );
    } catch (err) {
      console.error(err);
      await reply(`❌ Failed to compile PDF report: ${err instanceof Error ? err.message : String(err)}`, REPORT_KEYBOARD);
    }
    return;
  }

  if (normInput === "📈 Top Loved Items") {
    const feedbackText = getTopLovedFeedback(dbStore.orders);
    await reply(feedbackText, MAIN_KEYBOARD);
    return;
  }

  if (command === "/discount") {
    if (args.length < 2) {
      await reply(`⚠️ Please use: <code>/discount [CODE] [PERCENT_NUMBER]</code>\nExample: <code>/discount FIRE29 20</code>`, MAIN_KEYBOARD);
      return;
    }
    const code = args[0].toUpperCase();
    const percent = parseInt(args[1], 10);

    if (isNaN(percent) || percent <= 0 || percent > 100) {
      await reply(`⚠️ Percentage must be a valid number between 1 and 100.`, MAIN_KEYBOARD);
      return;
    }

    // Add code
    const existingIndex = dbStore.discounts.findIndex((d: any) => d.code === code);
    const newDiscount: Discount = { code, percentage: percent, active: true };
    if (existingIndex > -1) {
      dbStore.discounts[existingIndex] = newDiscount;
    } else {
      dbStore.discounts.push(newDiscount);
    }

    saveData(dbStore);

    // Sync to Supabase
    await querySupabase("discounts", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ code, percentage: percent, active: true })
    });

    await reply(`✅ <b>Discount Offer Active!</b>\nCode: <code>${code}</code> offers a <b>${percent}% discount</b>. Website users can now utilize this offer instantly!`, MAIN_KEYBOARD);
    return;
  }

  if (command === "/additem") {
    if (args.length < 3) {
      await reply(`⚠️ Please use: <code>/additem [ID] [NAME] [PRICE]</code>\nExample: <code>/additem afang_dodo Afang_Plus_Dodo 4800</code>`, MAIN_KEYBOARD);
      return;
    }
    const id = args[0].toLowerCase();
    const name = args[1].replace(/_/g, " ");
    const price = parseInt(args[2], 10);

    if (isNaN(price) || price <= 0) {
      await reply(`⚠️ Price must be a valid number.`, MAIN_KEYBOARD);
      return;
    }

    const newItem: MenuItem = {
      id,
      name,
      category: "main_meals",
      description: "Delightful high-class dish curated dynamically from our local Telegram Admin controls.",
      basePrice: price,
      calories: "520 kcal",
      spicyLevel: 1,
      plainImage: "/src/assets/images/yam_egg_dodo_1781261903040.jpg",
      features: ["Telegram curated", "Spicy pepper", "Made fresh"]
    };

    // Push into database store
    const existingIdx = dbStore.menu.findIndex((m: any) => m.id === id);
    if (existingIdx > -1) {
      dbStore.menu[existingIdx] = newItem;
    } else {
      dbStore.menu.push(newItem);
    }

    saveData(dbStore);

    // Sync to Supabase
    await querySupabase("menu", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify(newItem)
    });

    await reply(`✅ <b>Dishes Updated!</b>\nItem "<b>${name}</b>" (ID: <code>${id}</code>) is now listed on the menu for ₦${price.toLocaleString()}!`, MAIN_KEYBOARD);
    return;
  }

  if (command === "/removeitem") {
    if (args.length < 1) {
      await reply(`⚠️ Please use: <code>/removeitem [ID]</code>\nExample: <code>/removeitem sweet_potato_egg</code>`, MAIN_KEYBOARD);
      return;
    }
    const id = args[0].toLowerCase();

    const initialLen = dbStore.menu.length;
    dbStore.menu = dbStore.menu.filter((m: any) => m.id !== id);
    
    if (dbStore.menu.length === initialLen) {
      await reply(`⚠️ Dinner item with ID <code>${id}</code> was not found on the menu.`, MAIN_KEYBOARD);
      return;
    }

    saveData(dbStore);

    // Deletion call to Supabase
    await querySupabase(`menu?id=eq.${id}`, {
      method: "DELETE"
    });

    await reply(`❌ <b>Dish Disabled!</b>\nItem with ID <code>${id}</code> was deleted from the website and is no longer available.`, MAIN_KEYBOARD);
    return;
  }

  // Fallback
  await reply(`⚠️ Unrecognized option or command: <i>${text}</i>. Use the quick buttons below or type <code>/help</code>.`, MAIN_KEYBOARD);
}

// Spin up background Telegram updates poller
setInterval(() => {
  pollTelegramUpdates();
}, 2000);


// -------------------------------------------------------------
// REST API SYSTEM ROUTINGS
// -------------------------------------------------------------

// 1. Get entire menu list (loads local, merges with Supabase if online)
app.get("/api/menu", async (req, res) => {
  try {
    const supabaseMenu = await querySupabase("menu?select=*");
    if (supabaseMenu && supabaseMenu.length > 0) {
      // Overwrite or merge with local cache for real-time fidelity
      dbStore.menu = supabaseMenu;
      saveData(dbStore);
    }
    res.json(dbStore.menu);
  } catch (err) {
    res.json(dbStore.menu); // Fail safe fallback
  }
});

// 2. Submit new takeaway ticket order
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body as Order;
    if (!orderData.id) {
      orderData.id = `29F-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    orderData.createdAt = new Date().toISOString();
    orderData.status = "pending";

    // Set payment status if completed from client side checkout
    if (req.body.paymentStatus) {
      orderData.paymentStatus = req.body.paymentStatus;
    }
    if (req.body.paymentReference) {
      orderData.paymentReference = req.body.paymentReference;
    }

    // Save locally
    dbStore.orders.unshift(orderData);
    saveData(dbStore);

    // Sync order to Supabase
    await querySupabase("orders", {
      method: "POST",
      body: JSON.stringify(orderData)
    });

    // Ensure both spellings are populated and synchronized
    const platters = orderData.customPlatters_v2 || orderData.customPlatterns_v2 || [];
    orderData.customPlatters_v2 = platters;
    orderData.customPlatterns_v2 = platters;

    // Format detailed text matching the requested format for Telegram notifications
    let itemBreakdowns = "";
    if (platters && platters.length > 0) {
      itemBreakdowns = platters.map((item, index) => {
        return `• <b>Item ${index + 1}:</b> ${getPlatterDetailedDescription(item)}`;
      }).join("\n");
    } else {
      itemBreakdowns = `• <b>Dish:</b> Custom Platter Placed`;
    }

    const isPaid = orderData.paymentStatus === "success";
    const paymentLine = isPaid 
      ? `💳 <b>Payment Status:</b> 🟢 <b>PAID ONLINE (Paystack)</b>\n🔑 <b>Ref Code:</b> <code>${orderData.paymentReference}</code>` 
      : `💳 <b>Payment Status:</b> 🟡 <i>PRE-VERIFICATION PENDING</i>`;

    const tgMessage = 
      `🔥 <b>NEW WOODFIRE ORDER RECEIVED! [29foods]</b> 🔥\n\n` +
      `👤 <b>Patron:</b> ${orderData.name}\n` +
      `📞 <b>Phone Line:</b> ${orderData.phone}\n` +
      `🎟️ <b>Ticket ID:</b> <code>${orderData.id}</code>\n` +
      `⏰ <b>Target Time:</b> ${orderData.time}\n` +
      `📍 <b>Delivery/Fulfillment Method:</b> <b>${orderData.method.toUpperCase()}</b>\n` +
      `${orderData.method === "delivery" ? `🏠 <b>Deliver To:</b> ${orderData.address}\n` : ""}` +
      `💬 <b>Kitchen Remarks:</b> ${orderData.dietaryNotes || "None"}\n` +
      `${paymentLine}\n\n` +
      `🛒 <b>Meal Selection:</b>\n${itemBreakdowns}\n\n` +
      `💳 <b>Invoice Total:</b> <b>₦${orderData.totalPrice.toLocaleString()}</b>\n\n` +
      `<i>To review live orders, respond to /orders or check your admin dashboard!</i>`;

    // Alert admin bot
    await sendTelegramAlert(tgMessage);

    res.status(201).json({ success: true, order: orderData });
  } catch (err: any) {
    console.error("Order submission failed:", err);
    res.status(500).json({ error: err.message || "Failed to submit order to restaurant system" });
  }
});

// 2.5 Paystack Webhook Handler (Registers payment logs, hooks background verification)
app.post("/api/paystack-webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("Paystack background webhook payload received:", payload?.event);

    if (payload?.event === "charge.success") {
      const data = payload.data;
      const orderId = data.reference; 
      const amountPaid = data.amount / 100;

      // Scan local db list
      const orderIndex = dbStore.orders.findIndex((o: any) => o.id === orderId);
      if (orderIndex > -1) {
        dbStore.orders[orderIndex].paymentStatus = "success";
        dbStore.orders[orderIndex].paymentReference = data.reference;
        saveData(dbStore);

        // Sync update to Supabase orders ledger
        await querySupabase("orders", {
          method: "POST",
          body: JSON.stringify(dbStore.orders[orderIndex])
        });

        // Push detailed Telegram webhook alert
        await sendTelegramAlert(
          `💳 <b>[PAYSTACK WEBHOOK CONFIRMATION]</b>\n` +
          `Order Ticket <code>${orderId}</code> has been fully funded & cleared via standard Webhook callback!\n` +
          `💰 Credited Amount: <b>₦${amountPaid.toLocaleString()}</b>\n` +
          `👤 Patron Name: <b>${dbStore.orders[orderIndex].name}</b>`
        );
      }
    }

    res.status(200).json({ status: "success" });
  } catch (err: any) {
    console.error("Webhook processing trigger error:", err);
    res.status(200).json({ status: "success" }); // always status 200 for webhook acknowledgment
  }
});

// 3. Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const supabaseOrders = await querySupabase("orders?order=createdAt.desc");
    if (supabaseOrders && supabaseOrders.length > 0) {
      dbStore.orders = supabaseOrders;
      saveData(dbStore);
    }
    res.json(dbStore.orders);
  } catch (err) {
    res.json(dbStore.orders);
  }
});

// 4. Update order status (Can be changed from Admin UI or through the database simulation)
app.patch("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const orderIdx = dbStore.orders.findIndex((o: any) => o.id === id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: "Order ticket not found" });
    }

    dbStore.orders[orderIdx].status = status;
    saveData(dbStore);

    // Update in Supabase
    await querySupabase(`orders?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });

    // Alert Admin about dispatch status
    await sendTelegramAlert(
      `🔔 <b>ORDER TICKET UPDATE [29foods]</b> 🔔\n\n` +
      `🎟️ <b>Ticket:</b> <code>${id}</code>\n` +
      `👤 <b>Patron:</b> ${dbStore.orders[orderIdx].name}\n` +
      `⚙️ <b>New Status:</b> <b>${status.toUpperCase()}</b>\n` +
      `💳 <b>Billing Amount:</b> ₦${dbStore.orders[orderIdx].totalPrice.toLocaleString()}`
    );

    res.json({ success: true, order: dbStore.orders[orderIdx] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Apply discount checkout code verification
app.post("/api/discounts/validate", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    // Sync with Supabase
    const dbDiscounts = await querySupabase("discounts?select=*");
    if (dbDiscounts && dbDiscounts.length > 0) {
      dbStore.discounts = dbDiscounts;
      saveData(dbStore);
    }

    const discount = dbStore.discounts.find((d: any) => d.code === code.toUpperCase() && d.active);
    if (discount) {
      return res.json({ valid: true, percentage: discount.percentage });
    } else {
      return res.json({ valid: false, error: "Invalid or expired coupon offer!" });
    }
  } catch (err) {
    // Fail safe with local
    const discount = dbStore.discounts.find((d: any) => d.code === code.toUpperCase() && d.active);
    if (discount) {
      res.json({ valid: true, percentage: discount.percentage });
    } else {
      res.json({ valid: false, error: "Invalid coupon code" });
    }
  }
});

// 6. Admin simulation endpoints to seed, change parameters and query environments
app.get("/api/config", (req, res) => {
  const config = getSupabaseConfig();
  const telegram = getTelegramConfig();
  res.json({
    supabaseConfigured: config.configured,
    telegramConfigured: telegram.configured,
    telegramAdminChatID: telegram.chatId,
    envExampleAvailable: fs.existsSync(DATA_FILE),
  });
});

app.post("/api/config/simulation-trigger", async (req, res) => {
  const { type, payload } = req.body;
  const { token, chatId, configured } = getTelegramConfig();

  if (type === "telegram_test") {
    if (!configured) {
      return res.status(400).json({ error: "Telegram Bot Token is not configured in environment variables!" });
    }
    
    try {
      await sendTelegramAlert(
        `⚡ <b>CONNECTION TESTING ALERT // 29foods Spot</b> ⚡\n\n` +
        `Congratulations! Your AI Studio custom full-stack dev server successfully established connection to your Admin Telegram bot!`
      );
      return res.json({ success: true, message: "Test alert dispatched to Telegram admin account!" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(400).json({ error: "Unknown simulation action request" });
});


// -------------------------------------------------------------
// PREMIUM ADMIN CORE API ENDPOINTS (FULL CRUD & PROVISIONING)
// -------------------------------------------------------------

// 1. Authenticate admin credentials
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.ADMIN_PASSWORD || "admin";
  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Incorrect admin credentials security pin!" });
  }
});

// 2. Create menu items (Full CRUD - CREATE)
app.post("/api/menu", async (req, res) => {
  const newItem = req.body;
  if (!newItem.id || !newItem.name) {
    return res.status(400).json({ error: "Item ID and Name are requested to declare a dish." });
  }

  // Update local file cache state
  const idx = dbStore.menu.findIndex((m: any) => m.id === newItem.id);
  if (idx > -1) {
    dbStore.menu[idx] = newItem;
  } else {
    dbStore.menu.push(newItem);
  }
  saveData(dbStore);

  // Sync to Supabase Rest
  try {
    await querySupabase("menu", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify(newItem)
    });
    res.status(201).json({ success: true, item: newItem, supabaseSynced: true });
  } catch (err: any) {
    res.status(201).json({ success: true, item: newItem, supabaseSynced: false, error: err.message });
  }
});

// 3. Update existing menu item properties (Full CRUD - UPDATE)
app.put("/api/menu/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const idx = dbStore.menu.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Dish not registered in local files catalog" });
  }

  dbStore.menu[idx] = { ...dbStore.menu[idx], ...updatedData, id };
  saveData(dbStore);

  // Sync to Supabase table
  try {
    const patchBody = { ...updatedData };
    delete patchBody.id; // do not patch primary key value
    await querySupabase(`menu?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(patchBody)
    });
    res.json({ success: true, item: dbStore.menu[idx], supabaseSynced: true });
  } catch (err: any) {
    res.json({ success: true, item: dbStore.menu[idx], supabaseSynced: false, error: err.message });
  }
});

// 4. Delete existing menu item (Full CRUD - DELETE)
app.delete("/api/menu/:id", async (req, res) => {
  const { id } = req.params;

  const initialLen = dbStore.menu.length;
  dbStore.menu = dbStore.menu.filter((m: any) => m.id !== id);
  saveData(dbStore);

  if (dbStore.menu.length === initialLen) {
    return res.status(404).json({ error: "Item was not found in database stack" });
  }

  // Sync delete to Supabase table
  try {
    await querySupabase(`menu?id=eq.${id}`, {
      method: "DELETE"
    });
    res.json({ success: true, deletedId: id, supabaseSynced: true });
  } catch (err: any) {
    res.json({ success: true, deletedId: id, supabaseSynced: false, error: err.message });
  }
});

// 5. Get all discount coupon codes
app.get("/api/discounts", async (req, res) => {
  try {
    const dbDiscounts = await querySupabase("discounts?select=*");
    if (dbDiscounts && dbDiscounts.length > 0) {
      dbStore.discounts = dbDiscounts;
      saveData(dbStore);
    }
    res.json(dbStore.discounts);
  } catch (err) {
    res.json(dbStore.discounts);
  }
});

// 6. Create Coupon promo discount code
app.post("/api/discounts", async (req, res) => {
  const { code, percentage, active } = req.body;
  if (!code || percentage === undefined) {
    return res.status(400).json({ error: "Code and Percentage values are required fields." });
  }

  const newDiscount = { code: code.toUpperCase(), percentage: Number(percentage), active: active ?? true };
  const idx = dbStore.discounts.findIndex(d => d.code === newDiscount.code);
  if (idx > -1) {
    dbStore.discounts[idx] = newDiscount;
  } else {
    dbStore.discounts.push(newDiscount);
  }
  saveData(dbStore);

  try {
    await querySupabase("discounts", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify(newDiscount)
    });
    res.json({ success: true, discount: newDiscount, supabaseSynced: true });
  } catch (err: any) {
    res.json({ success: true, discount: newDiscount, supabaseSynced: false, error: err.message });
  }
});

// 7. Delete Coupon promo discount code
app.delete("/api/discounts/:code", async (req, res) => {
  const { code } = req.params;
  const targetCode = code.toUpperCase();

  dbStore.discounts = dbStore.discounts.filter(d => d.code !== targetCode);
  saveData(dbStore);

  try {
    await querySupabase(`discounts?code=eq.${targetCode}`, {
      method: "DELETE"
    });
    res.json({ success: true, deletedCode: targetCode, supabaseSynced: true });
  } catch (err: any) {
    res.json({ success: true, deletedCode: targetCode, supabaseSynced: false, error: err.message });
  }
});

// 8. Provision & seed Supabase with core firewood recipe catalog
app.post("/api/admin/supabase-seed", async (req, res) => {
  try {
    const seededResults = [];

    // Seed Menu Item Rows
    for (const item of INITIAL_MENU_ITEMS) {
      try {
        await querySupabase("menu", {
          method: "POST",
          headers: { "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(item)
        });
        seededResults.push(`Synced dish '${item.name}'`);
      } catch (e: any) {
        seededResults.push(`Skipped/Failed '${item.name}': ${e.message}`);
      }
    }

    // Seed Standard Voucher Promos
    const defaultDiscounts = [
      { code: "WOODFIRE29", percentage: 15, active: true },
      { code: "DOYL29", percentage: 10, active: true }
    ];
    for (const disc of defaultDiscounts) {
      try {
        await querySupabase("discounts", {
          method: "POST",
          headers: { "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(disc)
        });
        seededResults.push(`Synced coupon code '${disc.code}'`);
      } catch (e: any) {
        seededResults.push(`Skipped code '${disc.code}': ${e.message}`);
      }
    }

    res.json({ 
      success: true, 
      message: "Seeding script execution completed.",
      log: seededResults 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// VITE CLIENT/SERVER PRODUCTION SPLIT HANDLERS
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched and ready! listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
