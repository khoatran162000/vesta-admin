// FILE: prisma/seed.ts — Seed data voi studentCode

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // Staff accounts — login bằng email
  await prisma.user.upsert({
    where: { email: "admin@vestauni.vn" },
    update: {},
    create: { email: "admin@vestauni.vn", passwordHash: hash("Admin@123"), fullName: "Admin VESTA", role: "ADMIN", isActive: true },
  });

  await prisma.user.upsert({
    where: { email: "marketing@vestauni.vn" },
    update: {},
    create: { email: "marketing@vestauni.vn", passwordHash: hash("Marketing@123"), fullName: "Marketing VESTA", role: "CONTENT_CREATOR", isActive: true },
  });

  await prisma.user.upsert({
    where: { email: "teacher@vestauni.vn" },
    update: {},
    create: { email: "teacher@vestauni.vn", passwordHash: hash("Teacher@123"), fullName: "Giáo viên VESTA", phone: "0901234567", role: "TEACHER", isActive: true },
  });

  // Student accounts — login bằng studentCode
  await prisma.user.upsert({
    where: { studentCode: "VS20250001" },
    update: {},
    create: {
      studentCode: "VS20250001",
      email: "nguyenvana@gmail.com",
      passwordHash: hash("Student@123"),
      fullName: "Nguyễn Văn A",
      phone: "0912345678",
      address: "123 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
      role: "STUDENT",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { studentCode: "VS20250002" },
    update: {},
    create: {
      studentCode: "VS20250002",
      email: "tranthib@gmail.com",
      passwordHash: hash("Student@123"),
      fullName: "Trần Thị B",
      phone: "0987654321",
      address: "456 Xuân Thủy, Cầu Giấy, Hà Nội",
      role: "STUDENT",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { studentCode: "VS20250003" },
    update: {},
    create: {
      studentCode: "VS20250003",
      passwordHash: hash("Student@123"),
      fullName: "Lê Văn C",
      phone: "0909090909",
      role: "STUDENT",
      isActive: true,
    },
  });

  console.log("✅ Seed hoàn tất!");
  console.log("");
  console.log("Tài khoản đăng nhập:");
  console.log("  Staff (email + password):");
  console.log("    admin@vestauni.vn / Admin@123");
  console.log("    marketing@vestauni.vn / Marketing@123");
  console.log("    teacher@vestauni.vn / Teacher@123");
  console.log("");
  console.log("  Student (mã HV + password):");
  console.log("    VS20250001 / Student@123 (Nguyễn Văn A)");
  console.log("    VS20250002 / Student@123 (Trần Thị B)");
  console.log("    VS20250003 / Student@123 (Lê Văn C)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
