/*
  Warnings:

  - The primary key for the `barang` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_barang` on the `barang` table. All the data in the column will be lost.
  - Added the required column `id_baranG` to the `Barang` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `peminjaman` DROP FOREIGN KEY `Peminjaman_id_barang_fkey`;

-- AlterTable
ALTER TABLE `barang` DROP PRIMARY KEY,
    DROP COLUMN `id_barang`,
    ADD COLUMN `id_baranG` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id_baranG`);

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_id_barang_fkey` FOREIGN KEY (`id_barang`) REFERENCES `Barang`(`id_baranG`) ON DELETE RESTRICT ON UPDATE CASCADE;
