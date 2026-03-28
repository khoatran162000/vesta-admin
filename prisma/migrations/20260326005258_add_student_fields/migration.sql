/*
  Warnings:

  - A unique constraint covering the columns `[studentCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `studentCode` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_studentCode_key` ON `users`(`studentCode`);

-- CreateIndex
CREATE INDEX `users_studentCode_idx` ON `users`(`studentCode`);
