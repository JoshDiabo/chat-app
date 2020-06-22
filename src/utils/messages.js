function createMessage(text, username='admin') {
    return {
        text,
        createdAt: new Date().getTime(),
        username
    }
}

function createLocationMessage(url, username='admin') {
    return {
        url,
        createdAt: new Date().getTime(),
        username
    }
}

module.exports = {
    createMessage,
    createLocationMessage
}