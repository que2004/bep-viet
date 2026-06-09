const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product  = require('./models/Product');
const User     = require('./models/User');
const Order    = require('./models/Order');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db';

const categories = [
  { name: 'Món Miền Bắc', slug: 'mien-bac', icon: '🏮', order: 1, description: 'Tinh hoa ẩm thực đất Bắc' },
  { name: 'Món Miền Trung', slug: 'mien-trung', icon: '🌶️', order: 2, description: 'Hương vị cay nồng xứ Huế' },
  { name: 'Món Miền Nam', slug: 'mien-nam', icon: '🌴', order: 3, description: 'Đậm đà ẩm thực phương Nam' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Promise.all([
      Category.deleteMany(),
      Product.deleteMany(),
      User.deleteMany(),
      Order.deleteMany(),
    ]);
    console.log('🗑️  Đã xoá dữ liệu cũ');

    const savedCategories = await Category.insertMany(categories);
    console.log(`✅ Đã tạo ${savedCategories.length} danh mục`);

    const getId = (slug) => savedCategories.find((c) => c.slug === slug)?._id;

    const products = [
      // ────────────────────────────────────────────
      // MIỀN BẮC
      // ────────────────────────────────────────────
      {
        name: 'Phở Bò Hà Nội',
        description: 'Phở bò truyền thống Hà Nội, nước dùng trong vắt ninh từ xương ống 10 tiếng, thịt bò tái hồng, bánh phở mềm dai',
        price: 65000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Pho_Bo_Kho.jpg',
        isFeatured: true,
        preparationTime: 8,
        tags: ['đặc sản', 'truyền thống'],
      },
      {
        name: 'Bún Chả Hà Nội',
        description: 'Bún chả đặc sản Hà Nội với chả viên và chả miếng nướng than hoa, nước chấm chua ngọt, rau sống tươi',
        price: 60000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/BunCha_7157.jpg',
        isFeatured: true,
        preparationTime: 15,
        tags: ['đặc sản', 'nướng'],
      },
      {
        name: 'Chả Cá Lã Vọng',
        description: 'Cá lăng tẩm nghệ nướng trên than, áp chảo với thì là, hành lá, ăn kèm bún, đậu phộng rang và mắm tôm',
        price: 120000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Ch%E1%BA%A3_c%C3%A1_L%C3%A3_V%E1%BB%8Dng.jpg',
        isFeatured: true,
        preparationTime: 20,
        tags: ['đặc sản', 'cá'],
      },
      {
        name: 'Bánh Cuốn Thanh Trì',
        description: 'Bánh cuốn tráng tay từ gạo tẻ thơm, nhân thịt heo và mộc nhĩ, chấm nước mắm cà cuống pha loãng',
        price: 45000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Banh_cuon_cha.jpg',
        preparationTime: 10,
      },
      {
        name: 'Xôi Xéo',
        description: 'Xôi nếp vàng ươm với đậu xanh xéo mịn, hành phi vàng giòn, mỡ gà béo ngậy',
        price: 35000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Xoi_Xeo_Hanoi.jpg',
        preparationTime: 5,
      },
      {
        name: 'Bún Riêu Cua',
        description: 'Bún riêu cua đồng miền Bắc, nước dùng cà chua đỏ thơm, gạch cua béo, đậu phụ chiên vàng',
        price: 55000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Bun_rieu_cua.jpg',
        preparationTime: 8,
      },
      {
        name: 'Nem Rán Hà Nội',
        description: 'Nem rán giòn rụm nhân thịt heo, miến, nấm mộc nhĩ, cà rốt, ăn kèm rau sống và nước chấm chua ngọt',
        price: 50000,
        category: getId('mien-bac'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Nem_r%C3%A1n.jpg',
        preparationTime: 12,
        tags: ['giòn'],
      },

      // ────────────────────────────────────────────
      // MIỀN TRUNG
      // ────────────────────────────────────────────
      {
        name: 'Bún Bò Huế',
        description: 'Bún bò Huế đậm đà cay nồng, nước dùng sả ớt thơm, chả bò, giò heo, huyết heo, rau sống ăn kèm',
        price: 60000,
        category: getId('mien-trung'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Bun_bo_Hue.jpg',
        isFeatured: true,
        preparationTime: 8,
        tags: ['cay', 'đặc sản Huế'],
      },
      {
        name: 'Mì Quảng',
        description: 'Mì Quảng sợi vàng nghệ đậm, nước nhân tôm thịt béo ngậy, ăn kèm bánh tráng nướng và rau sống',
        price: 55000,
        category: getId('mien-trung'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mi_Quang_1_gs.jpg',
        isFeatured: true,
        preparationTime: 10,
        tags: ['đặc sản Quảng Nam'],
      },
      {
        name: 'Bánh Xèo Miền Trung',
        description: 'Bánh xèo giòn rụm nhân tôm thịt giá đỗ, cuốn cùng bánh tráng mỏng và rau thơm, chấm nước mắm cay',
        price: 65000,
        category: getId('mien-trung'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Banh-xeo.jpg',
        preparationTime: 15,
        tags: ['giòn', 'cay'],
      },
      {
        name: 'Cao Lầu Hội An',
        description: 'Cao lầu sợi dai độc đáo chỉ có ở Hội An, thịt xá xíu, tép mỡ giòn, rau húng quế, nước tương đặc',
        price: 60000,
        category: getId('mien-trung'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Cao_L%E1%BA%A7u.jpg',
        isFeatured: true,
        preparationTime: 10,
        tags: ['đặc sản Hội An'],
      },
      {
        name: 'Bánh Căn Đà Lạt',
        description: 'Bánh căn nướng trên khuôn đất nung, nhân tôm hoặc bạch tuộc, ăn kèm cá kho và mắm nêm',
        price: 45000,
        category: getId('mien-trung'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/B%C3%A1nh_c%C4%83n.jpg',
        isNew: true,
        preparationTime: 12,
      },
      {
        name: 'Cơm Hến Huế',
        description: 'Cơm hến Huế thanh đạm, hến xào gia vị, rau sống nhiều loại, tóp mỡ giòn, ớt tương cay nồng',
        price: 45000,
        category: getId('mien-trung'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Com_hen_hue.jpg',
        preparationTime: 8,
        tags: ['đặc sản Huế', 'cay'],
      },

      // ────────────────────────────────────────────
      // MIỀN NAM
      // ────────────────────────────────────────────
      {
        name: 'Cơm Tấm Sườn Bì Chả',
        description: 'Cơm tấm Sài Gòn chuẩn vị với sườn nướng mật ong, bì heo trộn thính, chả trứng, mỡ hành, đồ chua',
        price: 70000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/af/C%C6%A1m_t%E1%BA%A5m.jpg',
        isFeatured: true,
        preparationTime: 15,
        tags: ['đặc sản Sài Gòn'],
      },
      {
        name: 'Hủ Tiếu Nam Vang',
        description: 'Hủ tiếu Nam Vang nước dùng trong ngọt từ xương heo, tôm sú, thịt nạc, gan heo, hẹ xanh thơm',
        price: 60000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Hu_Tieu_Nam_Vang.jpg',
        isFeatured: true,
        preparationTime: 10,
        tags: ['đặc sản'],
      },
      {
        name: 'Bánh Mì Sài Gòn',
        description: 'Bánh mì giòn tan nhân thịt nguội, chả lụa, pate, dưa leo, đồ chua, rau thơm và ớt tương',
        price: 35000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Banhmi.jpg',
        preparationTime: 5,
        tags: ['nhanh', 'đặc sản Sài Gòn'],
      },
      {
        name: 'Bún Mắm Miền Tây',
        description: 'Bún mắm đặc sản miền Tây, nước dùng mắm cá linh đậm đà, tôm sú, mực, cá thác lác, bông điên điển',
        price: 65000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Bun_mam.jpg',
        isFeatured: true,
        preparationTime: 10,
        tags: ['đặc sản miền Tây', 'đậm đà'],
      },
      {
        name: 'Lẩu Mắm',
        description: 'Lẩu mắm miền Tây chua cay đậm đà với cá linh, tôm, mực, rau nhút, bông súng, kèo nèo, phục vụ 2-3 người',
        price: 280000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Lau_mam_mien_tay.jpg',
        preparationTime: 25,
        tags: ['cho nhóm', 'đặc sản miền Tây'],
      },
      {
        name: 'Bánh Xèo Miền Nam',
        description: 'Bánh xèo miền Nam to giòn, nhân tôm thịt và giá đỗ, cuốn lá cải xanh và rau thơm, chấm nước mắm ngọt',
        price: 60000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Banh-xeo.jpg',
        isNew: true,
        preparationTime: 15,
        tags: ['giòn'],
      },
      {
        name: 'Chè Thái',
        description: 'Chè Thái miền Nam đầy màu sắc với thạch, trái cây nhiệt đới, nước cốt dừa béo, đá bào mát lạnh',
        price: 35000,
        category: getId('mien-nam'),
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Che_Ba_Mau.jpg',
        preparationTime: 5,
        tags: ['ngọt', 'mát'],
      },
    ];

    const savedProducts = await Product.insertMany(products);
    console.log(`✅ Đã tạo ${savedProducts.length} món ăn`);

    // Tài khoản demo
    await User.create({ name: 'Admin', username: 'admin', password: 'admin123', role: 'admin', phone: '0901234567' });
    await User.create({ name: 'Shipper Nguyễn', username: 'shipper', password: 'ship123', role: 'shipper', phone: '0901234569' });

    console.log('\n✅ Tài khoản demo:');
    console.log('   Admin   → admin / admin123');
    console.log('   Shipper → shipper / ship123');
    console.log('\n🎉 Seed thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed lỗi:', error);
    process.exit(1);
  }
}

seed();
