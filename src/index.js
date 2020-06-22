const express = require('express');
const app = express();
const server = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(server);
const Filter = require('bad-words');
const { createMessage, createLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

let filter = new Filter();

const port = process.env.PORT || 3000


io.on('connection', (socket) => {
    socket.on('join', ({username, room}, callback) => {
        const {newUser, error} = addUser({
            room,
            username,
            id: socket.id
        });

        if (error) {
            return callback(error);
        }

        socket.join(newUser.room);

        socket.emit('message', createMessage(`Welcome, ${newUser.username}`));
        socket.to(newUser.room).broadcast.emit('message', createMessage(`${newUser.username} has joined!`));
        io.to(newUser.room).emit('roomData', {room: newUser.room, users: getUsersInRoom(newUser.room)});

        callback();
    });

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage',
            createLocationMessage(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, user.username));
        callback();
    });

    socket.on('sendMessage', (chatMessage, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', createMessage(filter.clean(chatMessage), user.username));

        if (filter.isProfane(chatMessage)) {
            return callback('Tsktsk!');
        }

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            socket.to(user.room).emit('message', createMessage(`Come back anytime, ${user.username}`));
            socket.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        }
    });
});

app.use(express.static(path.join(__dirname, '../public')));
server.listen(port);


