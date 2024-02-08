const app = require("express")();
const express = require("express");
const server = require("http").createServer(app);
const cors = require("cors");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const userModel = require(__dirname + "/models/User");
const gmModel = require(__dirname + "/models/Message");

const PORT = 8080 || process.env.PORT;

app.use(cors());
app.use(
    express.urlencoded({
        extended: true,
    })
);

// const formatMessage = require("./models/messages");
// const {
//     userJoin,
//     getCurrentUser,
//     userLeave,
//     getRoomUsers,
// } = require("./models/users");

//create server side socket
const io = require("socket.io")(server);

// Run when client connects
io.on("connection", (socket) => {
    console.log("Connected ");
    socket.on("message", async (data) => {
        const message = {
            id: socket.id,
            username: data.username,
            message: data.message,
        };
        socket.broadcast.to(data.room).emit("newMessage", message);

        console.log(`${data.username} send a message to ${data.room}`);
        try {
            const newMsg = gmModel({
                from_user: data.username,
                room: data.room,
                message: data.message,
            });
            await newMsg.save();
        } catch (e) {
            console.error(e)
        }
    });
    //Get User name
    socket.on("newUser", (name) => {
        if (!users.includes(name)) {
            users.push(name);
        }
        socket.id = name;
    });

    //Group/Room Join
    socket.on("joinroom", (id, room, username) => {
        socket.join(room);
        socket.broadcast.to(room).emit("joined", username);
    });
    
    socket.on("leaveRoom", (room, username) => {
        socket.broadcast.to(room).emit("left", username);
    });
    //Disconnected
    socket.on("disconnect", () => {
        console.log(`${socket.id} disconnected`);
    });
});

app.use(express.json());
mongoose
    .connect(
        "mongodb+srv://patelkushal846:GmSq0RXPVPuXKs9x@cluster0.vw5bhmh.mongodb.net/comp3133_labtest_01?retryWrites=true&w=majority",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then((success) => {
        console.log("Success Mongodb connection");
    })
    .catch((err) => {
        console.log("Error Mongodb connection");
    });

app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/Pages/signup.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/Pages/login.html");
});

app.post("/signup", async (req, res) => {
    const user = new userModel(req.body);
    try {
        await user.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    return res.redirect("/signup?err=username");
                }
                res.send(err);
            } else {
                res.redirect("/login");
            }
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await userModel.findOne({ username: username });
    try {
        if (user != null) {
            if (user.password == password) {
                return res.redirect("/rooms?uname=" + username);
            } else {
                return res.redirect("/login?wrong=pass");
            }
        } else {
            return res.redirect("/login?wrong=uname");
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

app.get("/rooms", (req, res) => {
    res.sendFile(__dirname + "/Pages/rooms.html");
});

app.get("/chat", (req, res) => {
    res.sendFile(__dirname + "/Pages/chat.html");
});

app.get("/chat/:room", async (req, res) => {
    const room = req.params.room;
    const msg = await gmModel
        .find({ room: room })
        .sort({ date_sent: "desc" })
        .limit(10);
    res.sendFile(__dirname + "/Pages/chat.html");
});

app.post("/chathistory", async (req, res) => {
    try {
        const { room } = req.body;
        const result = await gmModel.find({ room: room });
        res.status(200).send(result);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
