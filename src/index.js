const clientId = 'efe131fac3c74d3cac20ae0886b01ff9';
//Swap next two lines for github/local testing
//const redirectUri = 'http://127.0.0.1:5500/createplaylist.html';
const redirectUri = 'https://cmpt-276-fall-2024.github.io/project-22-vines/src/createplaylist.html';
// Old link: https://carbonate1.github.io/Test.github.io/createplaylist
// const redirectUri = 'http://127.0.0.1:5500/Code/createplaylist.html';
let accessToken = '';

function setupEventListeners() {
    const button = document.getElementById('log-in-button');
    if (button) {
        button.addEventListener('click', authorizeSpotify);
    } else {
        console.error("Login button not found in the DOM.");
    }
}

function authorizeSpotify() {
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const scope = 'playlist-modify-public playlist-modify-private';
    console.log("redirectUri: " + redirectUri);
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token&show_dialog=true`;
}

function getAccessToken() {
    if (window.location.hash) {
        const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
            const parts = item.split('=');
            acc[parts[0]] = decodeURIComponent(parts[1]);
            return acc;
        }, {});
        accessToken = hash.access_token;

        window.history.pushState('', document.title, window.location.pathname);
    }
}

module.exports = { setupEventListeners, authorizeSpotify, getAccessToken, getAccessTokenValue };

function getAccessTokenValue() {
    return accessToken;
}


