import express from 'express'
import {
   getAllUser,
   getUserById,
   addUser,
   updateUser,
   deleteUser
} from '../controllers/user_controllers.js'

import {authorize} from '../controllers/auth_controllers.js'
import {IsAdmin,} from '../middleware/role_validation.js'

const app = express()


app.get('/', authorize, getAllUser)
app.get('/:id', authorize, getUserById)
app.post('/', authorize, addUser)
app.put('/:id', authorize, [IsAdmin], updateUser)
app.delete('/:id', authorize, [IsAdmin], deleteUser)

export default app