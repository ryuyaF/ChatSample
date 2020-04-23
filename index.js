require('dotenv').config()
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {db} = require('./firebaseAdmin');
const PORT = process.env.PORT || 5000;

let messages = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    // firestoreから取得
    fetchMessages();

    // クライアントから新しいメッセージを受信
    socket.on('newMessage', (newMessage) => {
        const docRef = db.collection('messages').doc();
        const value = {
            ...newMessage,
            id: docRef.id,
            createdAt: new Date()
        };
        docRef.set(value)
            .then(() => {
                fetchMessages()
            })
    });

    // 接続クライアント数を送信
    io.emit('clientsCount', socket.client.conn.server.clientsCount)
});

server.listen(PORT, function () {
    console.log('server listen ' + PORT);
});

function fetchMessages() {
    db.collection('messages')
        .orderBy('createdAt')
        .get()
        .then((snapshot) => {
            let tempMessages = [];
            snapshot.forEach((doc) => {
                tempMessages.push(doc.data());
            });
            return tempMessages;
        })
        .then((tempMessages) => {
            messages = tempMessages
        })
        .then(() => {
            io.emit('messages', messages)
        })
        .catch((err) => {
            console.error('Getting collection errored.', err)
        })
}