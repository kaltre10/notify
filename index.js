import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { configureWebPush } from './config/webpush.js';
import router from './router.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
configureWebPush();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ ok: true });
});

router(app)

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
    });
}

export default app;