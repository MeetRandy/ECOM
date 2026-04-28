import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import * as schema from "../schema";
import { tenants, users } from "../schema/tenants";
import { storeSettings } from "../schema/store";
import { categories, products, variants } from "../schema/products";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  featured?: boolean;
  imageUrl: string;
  sku: string;
  price: string;
  cost: string;
  compareAtPrice?: string;
  qty: number;
};

async function main() {
  console.log("Seeding ECOM database…");

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "VeldCom",
      slug: "veldcom",
      plan: "starter",
    })
    .onConflictDoNothing()
    .returning();

  if (!tenant) {
    console.log("Tenant 'veldcom' already exists, skipping seed.");
    await sql.end();
    return;
  }

  console.log(`Created tenant: ${tenant.name} (${tenant.id})`);

  const passwordHash = await bcrypt.hash("password123", 12);
  await db.insert(users).values({
    tenantId: tenant.id,
    email: "admin@veldcom.co.za",
    name: "Store Manager",
    role: "owner",
    passwordHash,
  });
  console.log("Created user: admin@veldcom.co.za / password123");

  await db.insert(storeSettings).values({
    tenantId: tenant.id,
    storeName: "VeldCom",
    storeEmail: "admin@veldcom.co.za",
    storePhone: "+27 11 312 1234",
    address: "Shop 12, Vorna Valley Shopping Centre, 1 Levinia Street",
    city: "Midrand",
    province: "Gauteng",
    postalCode: "1686",
    country: "ZA",
    currency: "ZAR",
    vatEnabled: true,
  });

  // ── Categories ────────────────────────────────────────────────────────────
  const mkCat = (name: string, slug: string, order: number) =>
    db
      .insert(categories)
      .values({ tenantId: tenant.id, name, slug, displayOrder: order })
      .returning()
      .then(([c]) => c!);

  const [
    catElec,
    catHome,
    catGaming,
    catPhoto,
    catOutdoor,
    catTools,
    catBaby,
    catFurni,
  ] = await Promise.all([
    mkCat("Electronics & TV", "electronics-tv", 0),
    mkCat("Home & Kitchen", "home-kitchen", 1),
    mkCat("Gaming", "gaming", 2),
    mkCat("Photography", "photography", 3),
    mkCat("Outdoors & Sports", "outdoors-sports", 4),
    mkCat("Tools & Hardware", "tools-hardware", 5),
    mkCat("Baby & Kids", "baby-kids", 6),
    mkCat("Furniture & Storage", "furniture-storage", 7),
  ]);

  // ── Product helper ────────────────────────────────────────────────────────
  async function seed(p: ProductSeed) {
    const [prod] = await db
      .insert(products)
      .values({
        tenantId: tenant.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        status: "active",
        featured: p.featured ?? false,
        imageUrl: p.imageUrl,
      })
      .returning();
    await db.insert(variants).values({
      tenantId: tenant.id,
      productId: prod!.id,
      name: "Default",
      sku: p.sku,
      price: p.price,
      cost: p.cost,
      compareAtPrice: p.compareAtPrice,
      stockQty: p.qty,
    });
  }

  // ── Electronics & TV ──────────────────────────────────────────────────────
  await seed({
    name: 'Samsung 32" Full HD LED TV',
    slug: "samsung-32-ua32n5003br",
    description:
      "Samsung 32\" Full HD (1080p) LED TV. Features 2× HDMI, USB media playback, and Samsung's PurColour technology. Ideal for bedroom or kitchen. Model: UA32N5003BR.",
    categoryId: catElec.id,
    featured: true,
    imageUrl: "https://image-us.samsung.com/SamsungUS/home/televisions-and-home-theater/tvs/full-hd/pd/un32n5300afxza/gallery/DT-UN32N5300AFXZA-heroimage-050118.jpg",
    sku: "WVVNV001890",
    price: "2199.00",
    cost: "1400.00",
    compareAtPrice: "2999.00",
    qty: 3,
  });

  await seed({
    name: 'Sinotec 58" 4K UHD Smart TV',
    slug: "sinotec-58-stl-58u20um",
    description:
      "Sinotec 58\" 4K Ultra HD Smart TV with built-in Wi-Fi, 3× HDMI, and USB. Enjoy streaming services and crisp 4K content on this large-screen smart TV. Model: STL-58U20UM.",
    categoryId: catElec.id,
    featured: true,
    imageUrl: "https://www.sinotec.co.za/wp-content/uploads/2022/05/58U20AT-resize-web.png",
    sku: "WVNV001736",
    price: "4000.00",
    cost: "3800.00",
    compareAtPrice: "6999.00",
    qty: 1,
  });

  await seed({
    name: 'Sinotec 39" LED TV',
    slug: "sinotec-39-stl-39vn88e",
    description:
      "Sinotec 39\" HD LED TV — slim bezel design with 2× HDMI and USB. Great value mid-size television for lounge or bedroom. Model: STL-39VN88E.",
    categoryId: catElec.id,
    featured: false,
    imageUrl: "https://www.sinotec.co.za/wp-content/uploads/2022/04/39VN86D-HR.png",
    sku: "WVVNV001888",
    price: "2000.00",
    cost: "1450.00",
    compareAtPrice: "3499.00",
    qty: 1,
  });

  await seed({
    name: 'Skyworth 55" FHD Smart TV',
    slug: "skyworth-55-ss586",
    description:
      "Skyworth 55\" Full HD Smart TV with Android OS, built-in Wi-Fi, Netflix, and 3× HDMI. Thin-frame design with vivid colour reproduction. Model: SS586.",
    categoryId: catElec.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Wall-mounted_36_inch_flat_panel_Panasonic_TV.JPG/600px-Wall-mounted_36_inch_flat_panel_Panasonic_TV.JPG",
    sku: "WVNV003103",
    price: "2599.00",
    cost: "1500.00",
    compareAtPrice: "3999.00",
    qty: 1,
  });

  await seed({
    name: 'Skyworth 32" Smart TV',
    slug: "skyworth-32-ss330",
    description:
      "Skyworth 32\" HD Smart TV with built-in Wi-Fi, smart app support, 2× HDMI, and USB. Compact size perfect for second rooms. Model: SS330.",
    categoryId: catElec.id,
    featured: false,
    imageUrl: "https://www.asianhomeappliance.com/resources/media/images/product/32STE4000.jpg",
    sku: "WVNV003101",
    price: "1799.00",
    cost: "900.00",
    compareAtPrice: "2799.00",
    qty: 1,
  });

  await seed({
    name: "LG Soundbar with Subwoofer",
    slug: "lg-soundbar-sqc1",
    description:
      "LG 2.1ch Soundbar with wireless subwoofer. 300W total output, Bluetooth connectivity, and DTS Virtual:X surround sound. A serious upgrade from your TV's built-in speakers. Model: SQC1.",
    categoryId: catElec.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/LG_LAS260B_Soundbar.jpg/600px-LG_LAS260B_Soundbar.jpg",
    sku: "WVNV003035",
    price: "1499.00",
    cost: "600.00",
    compareAtPrice: "2499.00",
    qty: 2,
  });

  await seed({
    name: "Sports Bass D21 Earphones",
    slug: "sports-bass-d21-earphones",
    description:
      "Sports Bass D21 wired in-ear earphones with enhanced bass, inline mic, and tangle-resistant cable. Comfortable ear tips for all-day wear. Great for workouts or daily commutes.",
    categoryId: catElec.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/IPod_Earbuds.JPG/600px-IPod_Earbuds.JPG",
    sku: "WVNV002917",
    price: "240.00",
    cost: "180.00",
    compareAtPrice: "349.00",
    qty: 12,
  });

  // ── Home & Kitchen ────────────────────────────────────────────────────────
  await seed({
    name: "Redisson CT23P 2.3L Electric Kettle",
    slug: "redisson-ct23p-kettle",
    description:
      "Redisson 2.3L stainless steel electric kettle with 360° rotational base, auto shut-off, and boil-dry protection. Boils water quickly and quietly. Model: CT23P.",
    categoryId: catHome.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Electric_kettle_-_%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D1%87%D0%B0%D0%B9%D0%BD%D0%B8%D0%BA.JPG/600px-Electric_kettle_-_%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D1%87%D0%B0%D0%B9%D0%BD%D0%B8%D0%BA.JPG",
    sku: "WVNV001105",
    price: "796.00",
    cost: "460.00",
    compareAtPrice: "999.00",
    qty: 5,
  });

  await seed({
    name: "Lexuco 1.7L Cordless Kettle",
    slug: "lexuco-lx1101-kettle",
    description:
      "Lexuco LX1101 1.7L cordless electric kettle in sleek white finish. 2200W rapid boil, hidden element, 360° base, and cool-touch handle.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Electric_kettle_-_%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D1%87%D0%B0%D0%B9%D0%BD%D0%B8%D0%BA.JPG/600px-Electric_kettle_-_%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D1%87%D0%B0%D0%B9%D0%BD%D0%B8%D0%BA.JPG",
    sku: "WVNV000917",
    price: "149.00",
    cost: "65.00",
    compareAtPrice: "229.00",
    qty: 1,
  });

  await seed({
    name: "Morphy Richards Jug Kettle",
    slug: "morphy-richards-evoke-jug-kettle",
    description:
      "Morphy Richards Evoke 1.5L jug kettle in classic white. Premium build quality, 360° cordless base, rapid boil, and illuminated water window.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Electric_kettle_-_%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D1%87%D0%B0%D0%B9%D0%BD%D0%B8%D0%BA.JPG/600px-Electric_kettle_-_%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D1%87%D0%B0%D0%B9%D0%BD%D0%B8%D0%BA.JPG",
    sku: "WVVNV001881",
    price: "550.00",
    cost: "550.00",
    compareAtPrice: "799.00",
    qty: 2,
  });

  await seed({
    name: "Condere 15-Piece Cookware Set",
    slug: "condere-15-piece-cookware-set",
    description:
      "Condere 15-piece non-stick cookware set including pots, pans, lids, and utensils. Suitable for all hob types. Durable non-stick coating for healthy, low-fat cooking.",
    categoryId: catHome.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Pans_%28113563802%29.jpg/600px-Pans_%28113563802%29.jpg",
    sku: "WVNV002960",
    price: "750.00",
    cost: "300.00",
    compareAtPrice: "1299.00",
    qty: 2,
  });

  await seed({
    name: "Hisense 20L Microwave Oven",
    slug: "hisense-h36mommi-microwave",
    description:
      "Hisense 20L microwave with 700W power, 5 power levels, 8 auto-cook menus, and a 35-minute timer. Compact design fits any kitchen. Model: H36MOMMI.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://hisense.co.za/wp-content/uploads/2024/07/Artboard-1-600x600.jpg",
    sku: "WVNV003034",
    price: "1400.00",
    cost: "900.00",
    compareAtPrice: "1999.00",
    qty: 1,
  });

  await seed({
    name: "Defy 7kg Top Loader Washing Machine",
    slug: "defy-dmo392-washing-machine",
    description:
      "Defy 7kg top loader washing machine with 12 wash programs, water-level selector, and stainless steel drum. Energy-efficient with cold-water wash capability. Model: DMO 392.",
    categoryId: catHome.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Washing_Machine_Beko.jpg/600px-Washing_Machine_Beko.jpg",
    sku: "WVNV003019",
    price: "1500.00",
    cost: "899.00",
    compareAtPrice: "2599.00",
    qty: 1,
  });

  await seed({
    name: "Condere 1850W Electric Fireplace Heater",
    slug: "condere-fireplace-1850w",
    description:
      "Condere freestanding electric fireplace heater with 1850W heating element, realistic flame effect, adjustable thermostat, and tip-over auto-shutoff. Warms a room quickly.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Electric_Fireplace.jpg/600px-Electric_Fireplace.jpg",
    sku: "WVVNV002504",
    price: "799.00",
    cost: "1.00",
    compareAtPrice: "1199.00",
    qty: 3,
  });

  await seed({
    name: "Condere 2000W Quartz Heater",
    slug: "condere-quartz-2000w-heater",
    description:
      "Condere 2000W quartz tube heater — instant heat output, 2 power settings, carry handle, and overheat protection. Lightweight and portable for any room.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Carbon_heater.jpg/600px-Carbon_heater.jpg",
    sku: "WVVNV002507",
    price: "449.00",
    cost: "1.00",
    compareAtPrice: "699.00",
    qty: 2,
  });

  await seed({
    name: "HARWA 4-in-1 Blender & Juicer",
    slug: "harwa-pk1001-blender",
    description:
      "HARWA multi-function blender and juicer combo. Powerful motor with 4 blending speeds, stainless steel blades, and easy-clean detachable parts. Model: PK-1001.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Vitamix_Blender.jpg/600px-Vitamix_Blender.jpg",
    sku: "WVNV002952",
    price: "150.00",
    cost: "50.00",
    compareAtPrice: "299.00",
    qty: 4,
  });

  await seed({
    name: "Smart Life 3-in-1 Spiraliser",
    slug: "smart-life-3in1-spiraliser",
    description:
      "Smart Life 3-in-1 vegetable spiraliser with 3 interchangeable blades for ribbons, thin and thick spirals. BPA-free, dishwasher-safe, and suction-cup base for stability.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/The_spiralizer_in_action%21_%284617278380%29.jpg/600px-The_spiralizer_in_action%21_%284617278380%29.jpg",
    sku: "WVVNV002360",
    price: "199.00",
    cost: "100.00",
    compareAtPrice: "299.00",
    qty: 1,
  });

  await seed({
    name: "Aorlis Electric Wine Opener",
    slug: "aorlis-ao78135-wine-opener",
    description:
      "Aorlis rechargeable electric wine opener — opens up to 30 bottles per charge, foil cutter included, LED battery indicator, and premium stainless steel finish. Model: AO-78135.",
    categoryId: catHome.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Tire-Bouchon.JPG/600px-Tire-Bouchon.JPG",
    sku: "WVVNV002362",
    price: "249.00",
    cost: "50.00",
    compareAtPrice: "399.00",
    qty: 1,
  });

  // ── Gaming ────────────────────────────────────────────────────────────────
  await seed({
    name: "Nintendo Switch OLED Console",
    slug: "nintendo-switch-oled",
    description:
      "Nintendo Switch OLED model with a vibrant 7\" OLED screen, enhanced audio, 64GB internal storage, adjustable stand, and a wide LAN port. Play at home or on the go. Includes Joy-Con controllers.",
    categoryId: catGaming.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Nintendo_Switch_%E2%80%93_OLED-Modell%2C_Konsole_und_Dock_20230506.png/600px-Nintendo_Switch_%E2%80%93_OLED-Modell%2C_Konsole_und_Dock_20230506.png",
    sku: "WVNV003095",
    price: "5499.00",
    cost: "3200.00",
    compareAtPrice: "6999.00",
    qty: 1,
  });

  await seed({
    name: "Sony PlayStation 4 Console",
    slug: "sony-ps4-console",
    description:
      "Sony PlayStation 4 500GB console. Play thousands of PS4 games, stream 4K video, and connect with PlayStation Network. Includes DualShock 4 controller.",
    categoryId: catGaming.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/PS4-Console-wDS4.jpg/600px-PS4-Console-wDS4.jpg",
    sku: "WVVNV002502",
    price: "399.00",
    cost: "10.00",
    compareAtPrice: "999.00",
    qty: 1,
  });

  await seed({
    name: "DoubleSHOCK 4 Wireless Controller",
    slug: "doubleshock4-wireless-controller",
    description:
      "Wireless DoubleSHOCK 4 compatible controller for PlayStation 4. Touchpad, built-in speaker, 3.5mm headphone jack, and up to 8 hours playtime per charge.",
    categoryId: catGaming.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/DualShock_4.jpg/600px-DualShock_4.jpg",
    sku: "WVVNV002350",
    price: "199.00",
    cost: "50.00",
    compareAtPrice: "449.00",
    qty: 1,
  });

  await seed({
    name: "Wireless Xbox-Compatible Controller",
    slug: "n1-wireless-xbox-controller",
    description:
      "Wireless controller compatible with Xbox One and Xbox Series X/S. Textured grip, 2.4GHz wireless, 10-hour battery life, and 3.5mm audio jack. Model: N-1.",
    categoryId: catGaming.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Microsoft-Xbox-One-controller.jpg/600px-Microsoft-Xbox-One-controller.jpg",
    sku: "WVVNV002364",
    price: "499.00",
    cost: "100.00",
    compareAtPrice: "699.00",
    qty: 1,
  });

  await seed({
    name: "Redragon H510W Zeus-X RGB Headset",
    slug: "redragon-h510w-rgb-headset",
    description:
      "Redragon H510W Zeus-X RGB wired gaming headset with 53mm drivers, 7.1 surround sound, detachable noise-cancelling mic, and full RGB lighting. Compatible with PC, PS4, Xbox.",
    categoryId: catGaming.id,
    featured: false,
    imageUrl: "https://redragonshop.com/cdn/shop/products/h510.png?v=1762457096&width=600",
    sku: "WVVNV001863",
    price: "400.00",
    cost: "400.00",
    compareAtPrice: "699.00",
    qty: 1,
  });

  await seed({
    name: "Redragon M200 RGB Gaming Mouse",
    slug: "redragon-gm100-gaming-mouse",
    description:
      "Redragon RGB gaming mouse with 3200 DPI optical sensor, 7 programmable buttons, 6-colour chroma RGB backlighting, and ergonomic right-hand design. Model: GM100.",
    categoryId: catGaming.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Razer_abyssus_gaming_mouse.jpeg/600px-Razer_abyssus_gaming_mouse.jpeg",
    sku: "WVVNV001869",
    price: "250.00",
    cost: "250.00",
    compareAtPrice: "399.00",
    qty: 1,
  });

  await seed({
    name: "Xtrike GM-216 Gaming Headset",
    slug: "xtrike-gm216-gaming-headset",
    description:
      "Xtrike GM-216 stereo gaming headset with 40mm speakers, omnidirectional mic, in-line volume control, and 3.5mm + USB adapter. Lightweight for extended gaming sessions.",
    categoryId: catGaming.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Sound_BlasterX_H5_Gaming_Headset.jpg/600px-Sound_BlasterX_H5_Gaming_Headset.jpg",
    sku: "WVVNV002394",
    price: "149.00",
    cost: "50.00",
    compareAtPrice: "249.00",
    qty: 1,
  });

  await seed({
    name: "Thumb Grips for PS4 & Xbox",
    slug: "thumb-grips-ps4-xbox",
    description:
      "Precision thumb grips for PS4 and Xbox One controllers. High-grip silicone material improves accuracy and reduces thumb fatigue during long gaming sessions. Set of 2.",
    categoryId: catGaming.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/DualShock_4.jpg/600px-DualShock_4.jpg",
    sku: "WVNV002944",
    price: "30.00",
    cost: "20.00",
    compareAtPrice: "59.00",
    qty: 2,
  });

  // ── Photography ───────────────────────────────────────────────────────────
  await seed({
    name: "Canon EOS 2000D DSLR Camera",
    slug: "canon-eos-2000d-dslr",
    description:
      "Canon EOS 2000D 24.1MP DSLR with 18-55mm IS II lens. Features Wi-Fi, NFC, Full HD 1080p video, and guided menu for beginners. Perfect first DSLR or upgrade from a compact.",
    categoryId: catPhoto.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/The_Canon_EOS_Rebel_T7_%282000D%29_Sitting_on_a_Park_Bench_3_%28cropped%29.jpg/600px-The_Canon_EOS_Rebel_T7_%282000D%29_Sitting_on_a_Park_Bench_3_%28cropped%29.jpg",
    sku: "WVNV003087",
    price: "5499.00",
    cost: "2800.00",
    compareAtPrice: "7499.00",
    qty: 2,
  });

  await seed({
    name: "Canon EOS 4000D DSLR Camera",
    slug: "canon-eos-4000d-dslr",
    description:
      "Canon EOS 4000D 18MP DSLR with 18-55mm DC III lens kit. Scene Intelligent Auto, Full HD video, and Wi-Fi connectivity. A capable entry-level DSLR for everyday photography.",
    categoryId: catPhoto.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Canon_EOS_4000D_6463.jpg/600px-Canon_EOS_4000D_6463.jpg",
    sku: "WVNV003091",
    price: "5499.00",
    cost: "2500.00",
    compareAtPrice: "7499.00",
    qty: 2,
  });

  // ── Outdoors & Sports ─────────────────────────────────────────────────────
  await seed({
    name: "Folding Camping Chair",
    slug: "folding-camping-chair",
    description:
      "Heavy-duty folding camping chair with Oxford fabric seat, steel frame, cup holder, and carry bag. Supports up to 120kg. Ideal for camping, braais, and outdoor events.",
    categoryId: catOutdoor.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Camping-Chair_001.jpg/600px-Camping-Chair_001.jpg",
    sku: "WVNV003012",
    price: "210.00",
    cost: "120.75",
    compareAtPrice: "349.00",
    qty: 5,
  });

  await seed({
    name: "Aruif Portable Single-Burner Gas Stove",
    slug: "aruif-portable-gas-stove",
    description:
      "Compact portable butane gas stove with piezo ignition, 2700BTU burner, and windshield guards. Runs on standard butane canisters (not included). Great for camping and load-shedding cooking.",
    categoryId: catOutdoor.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Primus_stove.jpg/600px-Primus_stove.jpg",
    sku: "WVNV002375",
    price: "200.00",
    cost: "149.04",
    compareAtPrice: "299.00",
    qty: 2,
  });

  await seed({
    name: "High-Grade 3-Person Camping Tent",
    slug: "high-grade-camping-tent",
    description:
      "3-person dome tent with fibreglass poles, waterproof flysheet (3000mm HH), taped seams, and mesh inner for ventilation. Sets up in under 10 minutes. Includes carry bag.",
    categoryId: catOutdoor.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tent_at_High_Shelf_Camp_cropped.jpg/600px-Tent_at_High_Shelf_Camp_cropped.jpg",
    sku: "WVVNV002380",
    price: "399.00",
    cost: "150.00",
    compareAtPrice: "699.00",
    qty: 1,
  });

  await seed({
    name: "Portable 8L Electric Cooler / Fridge",
    slug: "portable-electric-cooler-fridge",
    description:
      "Portable 8L thermoelectric cooler and warmer powered by 12V (car) or 220V (home). Cools up to 15°C below ambient. Perfect for road trips, picnics, and camping.",
    categoryId: catOutdoor.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Large_cooler_box.jpg/600px-Large_cooler_box.jpg",
    sku: "WVVNV002345",
    price: "299.00",
    cost: "100.00",
    compareAtPrice: "499.00",
    qty: 1,
  });

  await seed({
    name: "Aerbes Intelligent Wireless Tyre Inflator",
    slug: "aerbes-wireless-inflation-pump",
    description:
      "Aerbes cordless tyre inflator with digital pressure gauge, auto shut-off at set PSI, built-in LED light, and USB-C rechargeable battery. Inflates car tyres in minutes.",
    categoryId: catOutdoor.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Inflating_Temporary_Spare_-_Tire_Inflator_-_Air_Compressor_%2854122728542%29.jpg/600px-Inflating_Temporary_Spare_-_Tire_Inflator_-_Air_Compressor_%2854122728542%29.jpg",
    sku: "WVVNV002359",
    price: "349.00",
    cost: "100.00",
    compareAtPrice: "599.00",
    qty: 2,
  });

  // ── Tools & Hardware ──────────────────────────────────────────────────────
  await seed({
    name: "Sunsign 1000W Pure Sine Wave Inverter",
    slug: "sunsign-1000w-power-inverter",
    description:
      "Sunsign 1000W pure sine wave power inverter. Converts 12V DC to 220V AC. Features over-voltage, over-temperature, and overload protection. Ideal for load-shedding backup.",
    categoryId: catTools.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Inverter_CJC01.jpg/600px-Inverter_CJC01.jpg",
    sku: "WVVNV002389",
    price: "899.00",
    cost: "100.00",
    compareAtPrice: "1499.00",
    qty: 1,
  });

  await seed({
    name: "Sunny SN-1800 Petrol Generator",
    slug: "sunny-sn1800-generator",
    description:
      "Sunny SN-1800 1.8kVA petrol generator — 4-stroke single-cylinder engine, 2× 220V outlets, and 12V DC port. Quiet, reliable backup power for load-shedding. Pull-start with low-oil shutoff.",
    categoryId: catTools.id,
    featured: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Mobile_electric_generator.jpg/600px-Mobile_electric_generator.jpg",
    sku: "WVNV002937",
    price: "2800.00",
    cost: "900.00",
    compareAtPrice: "3999.00",
    qty: 1,
  });

  await seed({
    name: "Gas Hose Pipe & Regulator Kit",
    slug: "gas-pipe-regulator-kit",
    description:
      "Standard LPG regulator and rubber gas pipe kit for connection between gas cylinder and cooker. 1.5m hose, pressure tested, with POL fitting for standard 9kg and 19kg cylinders.",
    categoryId: catTools.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/LPG_cylinders.JPG/600px-LPG_cylinders.JPG",
    sku: "WVNV003042",
    price: "149.00",
    cost: "70.00",
    compareAtPrice: "199.00",
    qty: 1,
  });

  // ── Baby & Kids ───────────────────────────────────────────────────────────
  await seed({
    name: "720P Baby Monitor with Camera",
    slug: "baby-monitor-720p",
    description:
      "720P HD baby monitor with 2.4\" colour LCD parent unit, two-way audio, night vision, temperature sensor, lullaby player, and 300m range. Plug-in camera, 6-hour battery on parent unit.",
    categoryId: catBaby.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Babymonitor.JPG/600px-Babymonitor.JPG",
    sku: "WVVNV002348",
    price: "699.00",
    cost: "250.00",
    compareAtPrice: "999.00",
    qty: 1,
  });

  // ── Furniture & Storage ───────────────────────────────────────────────────
  await seed({
    name: '1.8m 5-Shelf Bookcase',
    slug: "bookshelf-18m-5shelf",
    description:
      "1.8m tall 5-shelf bookcase in a classic woodgrain finish. Sturdy MDF construction with adjustable shelves. Ideal for books, ornaments, or storage. Easy flat-pack assembly.",
    categoryId: catFurni.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Ikea_Billy_bookcase.jpg/600px-Ikea_Billy_bookcase.jpg",
    sku: "WVVNV000917",
    price: "850.00",
    cost: "600.00",
    compareAtPrice: "1199.00",
    qty: 1,
  });

  await seed({
    name: '1.2m 4-Shelf Bookcase',
    slug: "bookshelf-12m-4shelf",
    description:
      "1.2m tall 4-shelf bookcase in woodgrain finish. Space-saving design for smaller rooms. Sturdy MDF, adjustable middle shelf. Great for home office or kids' room.",
    categoryId: catFurni.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Ikea_Billy_bookcase.jpg/600px-Ikea_Billy_bookcase.jpg",
    sku: "WVVNV000918",
    price: "600.00",
    cost: "400.00",
    compareAtPrice: "899.00",
    qty: 1,
  });

  await seed({
    name: "Multi-Functional Storage Rack",
    slug: "multi-function-storage-rack",
    description:
      "Versatile 5-tier storage rack in steel and wood. Can be used as a shelving unit, shoe rack, or pantry organiser. Easy assembly with no tools required.",
    categoryId: catFurni.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Old-slotted-angle-shelving.jpg/600px-Old-slotted-angle-shelving.jpg",
    sku: "WVVNV002346",
    price: "387.00",
    cost: "150.00",
    compareAtPrice: "599.00",
    qty: 3,
  });

  await seed({
    name: "Stacking Shoe Rack",
    slug: "shoe-rack-stackable",
    description:
      "Stackable shoe rack with capacity for 10 pairs. Chrome-finished steel frame with PP plastic connectors. Saves floor space and keeps your entryway tidy.",
    categoryId: catFurni.id,
    featured: false,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Shoe_Rack.jpg/600px-Shoe_Rack.jpg",
    sku: "WVVNV002368",
    price: "149.00",
    cost: "50.00",
    compareAtPrice: "249.00",
    qty: 1,
  });

  console.log(`\nSeeded 41 products across 8 categories.`);
  console.log("\nDone!");
  console.log(`  Storefront → http://localhost:3001/veldcom`);
  console.log(`  Admin      → http://localhost:3001/admin`);
  console.log(`  Login      → admin@veldcom.co.za / password123`);

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
