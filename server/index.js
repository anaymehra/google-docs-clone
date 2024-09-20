import express from "express";
import { Server } from "socket.io";
import {createServer} from "http"
import cors from "cors"
import connectDB from "./db.js";
import dotenv from "dotenv";
import Document from "./models/documentModel.js";

dotenv.config();
const app = express();
const port = 3000;
const server = createServer(app);
connectDB();

app.use(express.json());

const allowedOrigins = [
    "http://localhost:5173", // Your local frontend
    "https://google-docs-clone-red.vercel.app" // Your deployed frontend
  ];

  app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }));

const io = new Server(server,{
    cors:{
        origin:"https://google-docs-clone-red.vercel.app",
        methods:["GET","POST"],
        credentials:true,
    }
})

const defaultValue = "";

io.on("connection",(socket)=>{
    socket.on('get-document', async documentId=>{
        const document = await findOrCreateDocument(documentId) 
        socket.join(documentId) 
        socket.emit('load-document',document.data) 

        socket.on('send-changes',(delta)=>{
            socket.broadcast.to(documentId).emit('receive-changes',delta) 
        })
        socket.on('save-document',async data=>{
            await Document.findByIdAndUpdate(documentId,{data})
        })
    })
    
});
async function findOrCreateDocument(id) {
    if (id == null) return 

    const document = await Document.findById(id) 
    if(document) return document 
    return await Document.create({_id:id,data:defaultValue}) 
}

server.listen(port,()=>{
    console.log("Server is running on port",port)
})