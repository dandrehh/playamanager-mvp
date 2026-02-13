import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOperationalData() {
  console.log('🧹 Limpiando datos operativos...');

  try {
    // Limpiar datos de vendors (en orden correcto)
    await prisma.vendorSaleItem.deleteMany();
    console.log('✅ Ventas de vendedores eliminadas');

    await prisma.vendorSale.deleteMany();
    console.log('✅ Registros de ventas eliminados');

    await prisma.vendorInventoryAssignment.deleteMany();
    console.log('✅ Asignaciones de inventario eliminadas');

    await prisma.vendor.deleteMany();
    console.log('✅ Vendedores eliminados');

    // Limpiar datos de rentals
    await prisma.rentalItem.deleteMany();
    console.log('✅ Items de arriendos eliminados');

    await prisma.rental.deleteMany();
    console.log('✅ Arriendos eliminados');

    console.log('\n🎉 Limpieza completada exitosamente!');
    console.log('\n📋 Datos que se mantuvieron:');
    console.log('  ✅ Empresa y configuración');
    console.log('  ✅ Usuarios (admin, operator)');
    console.log('  ✅ Catálogo de productos');
    console.log('\n🗑️  Datos eliminados:');
    console.log('  ❌ Todos los vendedores');
    console.log('  ❌ Todas las ventas de vendedores');
    console.log('  ❌ Todos los arriendos');
    console.log('  ❌ Todo el historial de transacciones');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOperationalData();
