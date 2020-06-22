const socket = io('http://localhost:3000');



const $form = document.querySelector('#message');
const $locationBtn = document.querySelector('#send-location');
const $messageSubmit = document.querySelector('#submit-message');
const $messageInput = document.querySelector('#chatMessage');
const $messages = document.querySelector('#messages');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

function autoscroll() {
    const $newMessage = $messages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;
    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if ((containerHeight - newMessageHeight) <= scrollOffset) {
        $newMessage.scrollIntoView();
    }
}

$locationBtn.addEventListener('click', (e) => {
    $locationBtn.setAttribute('disabled', 'disabled');

    if (!navigator.geolocation) {
        return alert('get fucked!');
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationBtn.removeAttribute('disabled');
        });
    });
});

$form.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageSubmit.setAttribute('disabled', 'disabled');
    const chatMessage = $messageInput.value;
    socket.emit('sendMessage', chatMessage, (message) => {
        $messageSubmit.removeAttribute('disabled');
        $messageInput.value = "";
        $messageInput.focus();
    });
});

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:ss A'),
        username: message.username
    });
    $messages.insertAdjacentHTML('beforeend', html);

    autoscroll();

});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm:ss A'),
        username: message.username
    });

    $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        users,
        room
    });

    document.querySelector('#sidebar').innerHTML = html;
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'
    }
});



