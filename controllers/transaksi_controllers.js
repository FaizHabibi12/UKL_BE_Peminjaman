import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllPeminjaman = async (req, res) => {
  try {
    const result = await prisma.peminjaman.findMany();
    const formattedData = result.map((record) => {
      const formattedBorrowDate = new Date(record.borrow_date)
        .toISOString()
        .split("T")[0];
      const formattedReturnDate = new Date(record.return_date)
        .toISOString()
        .split("T")[0];
      return {
        ...record,
        borrow_date: formattedBorrowDate,
        return_date: formattedReturnDate,
      };
    });

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.log(error);
    res.json({
      msg: error,
    });
  }
};
export const getPeminjamanById = async (req, res) => {
  try {
    const result = await prisma.presensi.findMany({
      where: {
        id_user: Number(req.params.id),
      },
    });
    const formattedData = result.map((record) => {
      const formattedBorrowDate = new Date(record.borrow_date)
        .toISOString()
        .split("T")[0];
      const formattedReturnDate = new Date(record.return_date)
        .toISOString()
        .split("T")[0];
      return {
        ...record,
        borrow_date: formattedBorrowDate,
        return_date: formattedReturnDate,
      };
    });
    if (formattedData) {
      res.json({
        success: true,
        data: formattedData,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "data not found",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: error,
    });
  }
};
export const addPeminjaman = async (req, res) => {
  const { id_user, item_id, borrow_date, return_date, qty } = req.body;

  const formattedBorrowDate = new Date(borrow_date).toISOString(); 
  const formattedReturnDate = new Date(return_date).toISOString();

  const [getUserId, getBarangId] = await Promise.all([
    prisma.user.findUnique({ where: { id_user: Number(id_user) } }),
    prisma.barang.findUnique({ where: { id_baranG: Number(item_id) } }),
  ]);

  if (getUserId && getBarangId) {
    try {
      // Validasi stok barang
      if (getBarangId.quantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Jumlah barang yang diminta (${qty}) melebihi stok yang tersedia (${getBarangId.quantity}).`,
        });
      }

      // Jika stok mencukupi, lanjutkan proses pencatatan peminjaman
      const result = await prisma.peminjaman.create({
        data: {
          user: {
            connect: {
              id_user: Number(id_user),
            },
          },
          barang: {
            connect: {
              id_baranG: Number(item_id),
            },
          },
          qty: qty,
          borrow_date: formattedBorrowDate,
          return_date: formattedReturnDate,
        },
      });

      if (result) {
        const item = await prisma.barang.findUnique({
          where: { id_baranG: Number(item_id) },
        });

        if (!item) {
          throw new Error(
            `barang dengan id_barang ${item_id} tidak ditemukan`
          );
        } else {
          const minQty = item.quantity - qty;
          await prisma.barang.update({
            where: {
              id_baranG: Number(item_id),
            },
            data: {
              quantity: minQty,
            },
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Peminjaman Berhasil Dicatat",
        data: {
          id_user: result.id_user,
          id_baranG: result.id_baranG,
          qty: result.qty,
          borrow_date: result.borrow_date.toISOString().split("T")[0], 
          return_date: result.return_date.toISOString().split("T")[0], 
          status: result.status,
        },
      });
    } catch (error) {
      console.log(error);
      res.json({
        msg: error.message,
      });
    }
  } else {
    res.json({ msg: "user dan barang belum ada" });
  }
};

export const pengembalianBarang = async (req, res) => {
  const { borrow_id, return_date } = req.body;

  const formattedReturnDate = new Date(return_date).toISOString();

  const cekBorrow = await prisma.peminjaman.findUnique({
    where: { id_peminjaman: Number(borrow_id) },
  });

  if (cekBorrow.status == "dipinjam") {
    try {
      const result = await prisma.peminjaman.update({
        where: {
          id_peminjaman: borrow_id,
        },
        data: {
          return_date: formattedReturnDate,
          status: "kembali",
        },
      });
      if (result) {
        const item = await prisma.barang.findUnique({
          where: { id_baranG: Number(cekBorrow.id_barang) },
        });

        if (!item) {
          throw new Error(
            `barang dengan id_barang ${id_baranG} tidak ditemukan`
          );
        } else {
          const restoreQty = cekBorrow.qty + item.quantity;
          const result = await prisma.barang.update({
            where: {
              id_baranG: Number(cekBorrow.id_barang),
            },
            data: {
              quantity: restoreQty,
            },
          });
        }
      }
      res.status(201).json({
        success: true,
        message: "Pengembalian Berhasil Dicatat",
        data: {
          id_peminjaman: result.id_peminjaman,
          id_user: result.id_user,
          id_barang: result.id_barang,
          qty: result.qty,
          return_date: result.return_date.toISOString().split("T")[0], 
          status: result.status,
        },
      });
    } catch (error) {
      console.log(error);
      res.json({
        msg: error,
      });
    }
  } else {
    res.json({ msg: "user dan barang belum ada" });
  }
};
export const usageReport = async (req, res) => {
  const { start_date, end_date, category, location, group_by, nama_baraNG, group } = req.body;

  // Log the input dates
  console.log("Start Date:", start_date);
  console.log("End Date:", end_date);

  // Create Date objects and check for validity
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid date format. Please provide valid start_date and end_date.",
    });
  }

  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate.toISOString();

  try {
    // Conditional filters for category and location
    const items = await prisma.barang.findMany({
      where: {
        AND: [
          category ? { kategori: { contains: category } } : {},
          location ? { location: { contains: location } } : {},
        ],
      },
    });

    // Check if any items were found
    if (items.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No items found for the given filters.",
      });
    }

    // Get borrow records within the date range
    const borrowRecords = await prisma.peminjaman.findMany({
      where: {
        borrow_date: { gte: formattedStartDate },
        return_date: { lte: formattedEndDate },
      },
    });

    // Group data based on item category
    const analysis = items.map((item) => {
      const relevantBorrows = borrowRecords.filter(
        (record) => record.id_barang === item.id_barang
      );
    
      const totalBorrowed = relevantBorrows.reduce(
        (sum, record) => sum + record.quantity,
        0
      );
    
      const totalReturned = relevantBorrows.reduce(
        (sum, record) => (record.status === "kembali" ? sum + record.quantity : sum),
        0
      );
    
      return {
        group: group_by === 'kategori' ? item.kategori : item.location,
        nama: item.nama_barang,
        item_id: item.id_barang,
        totalBorrowed: totalBorrowed,
        totalReturned: totalReturned,
        items_in_use: totalBorrowed - totalReturned
      };
    });

    // Send the response with usage analysis
    res.status(200).json({
      status: "success",
      data: {
        analysis_period: {
          start_date,
          end_date,
          group,
          nama_baraNG
        },
        usage_analysis: analysis,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while processing the usage report.",
      error: `${error}`,
    });
  }
};
