import express from 'express'
import {
   getAllPeminjaman,
   getPeminjamanById,
   addPeminjaman,
   pengembalianBarang,
   usageReport
} from '../controllers/transaksi_controllers.js'

import {authorize} from '../controllers/auth_controllers.js'
import {IsMember, IsAdmin} from '../middleware/role_validation.js'
import { isAbsolute } from 'path'

const app = express()


app.get('/', authorize, getAllPeminjaman)
app.get('/:id',authorize, getPeminjamanById)
app.post('/borrow', authorize, [IsMember], addPeminjaman)
app.post('/return', authorize,[IsMember], pengembalianBarang)
app.post('/usage-report', authorize, usageReport)

export default app