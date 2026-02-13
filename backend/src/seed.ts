import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Limpiar datos existentes (en orden correcto por dependencias)
  await prisma.vendorSaleItem.deleteMany();
  await prisma.vendorSale.deleteMany();
  await prisma.vendorInventoryAssignment.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.rentalItem.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Crear empresa de ejemplo
  const company = await prisma.company.create({
    data: {
      companyId: 'BK-001',
      name: 'Kiosko Playa Reñaca',
      location: 'Reñaca, Viña del Mar, Chile'
    }
  });

  console.log('✅ Company created:', company.companyId);

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN_KIOSK',
      fullName: 'Juan Pérez (Admin)',
      companyId: company.id
    }
  });

  const operatorUser = await prisma.user.create({
    data: {
      username: 'operator',
      password: hashedPassword,
      role: 'OPERATOR',
      fullName: 'María González (Operador)',
      companyId: company.id
    }
  });

  console.log('✅ Users created:', adminUser.username, operatorUser.username);

  // Crear productos de RENTAL (Arriendos)
  const rentalProducts = await prisma.product.createMany({
    data: [
      {
        name: 'Silla de Playa',
        description: 'Silla cómoda para disfrutar el día',
        price: 5000,
        category: 'RENTAL',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Quitasol Grande',
        description: 'Quitasol grande para 4-6 personas',
        price: 10000,
        category: 'RENTAL',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Reposera',
        description: 'Reposera reclinable',
        price: 7000,
        category: 'RENTAL',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Carpa Familiar',
        description: 'Carpa espaciosa para toda la familia',
        price: 15000,
        category: 'RENTAL',
        isActive: true,
        companyId: company.id
      }
    ]
  });

  console.log('✅ Rental products created:', rentalProducts.count);

  // Crear productos de VENDOR (Vendedores ambulantes)
  const vendorProducts = await prisma.product.createMany({
    data: [
      {
        name: 'Helado de Vainilla',
        description: 'Helado artesanal sabor vainilla',
        price: 2500,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Helado de Chocolate',
        description: 'Helado artesanal sabor chocolate',
        price: 2500,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Helado de Frutilla',
        description: 'Helado artesanal sabor frutilla',
        price: 2500,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Bebida Coca-Cola',
        description: 'Coca-Cola 500ml fría',
        price: 1500,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Bebida Sprite',
        description: 'Sprite 500ml fría',
        price: 1500,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Agua Mineral',
        description: 'Agua mineral 500ml',
        price: 1000,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Papas Fritas',
        description: 'Papas fritas tamaño grande',
        price: 2000,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Paleta de Frutas',
        description: 'Paleta helada de frutas naturales',
        price: 1500,
        category: 'VENDOR',
        isActive: true,
        companyId: company.id
      }
    ]
  });

  console.log('✅ Vendor products created:', vendorProducts.count);

  // Crear vendedores de ejemplo
  const vendor1 = await prisma.vendor.create({
    data: {
      name: 'Carlos Ramírez',
      phone: '+56912345678',
      status: 'INACTIVE',
      companyId: company.id
    }
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: 'Sofía Torres',
      phone: '+56987654321',
      status: 'INACTIVE',
      companyId: company.id
    }
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      name: 'Diego Muñoz',
      status: 'INACTIVE',
      companyId: company.id
    }
  });

  console.log('✅ Vendors created: 3');

  // Obtener productos para crear arriendos de ejemplo
  const allProducts = await prisma.product.findMany({
    where: { companyId: company.id, category: 'RENTAL' }
  });

  // Crear un arriendo activo de ejemplo
  const activeRental = await prisma.rental.create({
    data: {
      customerName: 'Pedro Martínez',
      totalAmount: 22000,
      status: 'ACTIVE',
      companyId: company.id,
      userId: operatorUser.id,
      items: {
        create: [
          {
            productId: allProducts[0].id, // Silla
            quantity: 2,
            unitPrice: 5000,
            subtotal: 10000
          },
          {
            productId: allProducts[1].id, // Quitasol
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000
          }
        ]
      }
    }
  });

  // Crear un arriendo cerrado de ejemplo
  const closedRental = await prisma.rental.create({
    data: {
      customerName: 'Ana Silva',
      totalAmount: 19000,
      status: 'CLOSED',
      endTime: new Date(),
      companyId: company.id,
      userId: operatorUser.id,
      items: {
        create: [
          {
            productId: allProducts[0].id, // Silla
            quantity: 4,
            unitPrice: 5000,
            subtotal: 20000
          }
        ]
      }
    }
  });

  console.log('✅ Sample rentals created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Company ID: BK-001');
  console.log('Username: admin (or operator)');
  console.log('Password: demo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
