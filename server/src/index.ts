import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setupSocketIO } from './realtime/socket.js';
import { env } from './config/env.js';



//express i http server içine sarıyoruz. Gelen HTTP requestler Express'e gider(REST endpointleri çalısır.)
//Aynı server objesini Socket.IO da kullanabilir.
const server = http.createServer(app);


// Socket.IO kendi başına ayrı port açmıyor.
//Bu HTTP server'a "upgrade" mekanizmasıyla tutunuyor.
//Böylece client http://localhost:PORT üzerinden hem HTTP hem socket bağlantısı kurabiliyor.
const io = new Server(server, {
    cors: {
        origin: env.CLIENT_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true
    }
});

setupSocketIO(io);

const PORT = env.PORT;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
