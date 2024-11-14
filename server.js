//controller: dieu huong | Nhan request tu routes roi push len cho services. Sau khi services done thi day len cho controller -> routes -> clients 
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./src/config/connectDB')
const authRouter = require('./src/routes/authRouter')
require('./passport')
 

const app = express()
app.use(cors({
    origin: process.env.URL_CLIENT
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//app.use('/', (req, res) => {res.send('app run') })
app.use('/api/auth', authRouter)
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET);
connectDB()

const port = process.env.PORT || 8888 
app.listen(port, () => {console.log('Server is running on the port ' + port) })