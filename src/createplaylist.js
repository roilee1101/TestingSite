let accessToken = '';
let query = '';
const gsbKey = '6841f85f109ed5bb43076a588fb8d79d';

function setupEventListeners() {
    const searchButton = document.getElementById('search-button');
    const createPlaylistButton = document.getElementById('create-playlist-button');

    if (searchButton) {
        searchButton.addEventListener('click', searchSongs);
    } else {
        console.error("Search button not found in the DOM.");
    }

    if (createPlaylistButton) {
        createPlaylistButton.addEventListener('click', createPlaylist);
    } else {
        console.error("Create Playlist button not found in the DOM.");
    }
}

//Generate dropdown 1-50
lengthInput = document.getElementById('length-input');
for (let i=1; i< 50; i++) {
    option=document.createElement('option');
    option.value=i;
    option.textContent=i;
    lengthInput.appendChild(option);
}
lengthInput.value="10"; //sets default

//API deprecated by Spotify

// async function getTopSongs() {
//     if (!accessToken) {
//         return alert('Access token is missing. Please log in.');
//     }

//     try {
//         // Fetch the featured playlist with top songs
//         const response = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=1', {
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`
//             }
//         });

//         if (!response.ok) {
//             console.error('Failed to fetch top songs:', response.statusText);
//         }

//         const data = await response.json();
//         const topPlaylist = data.playlists.items[0]; // Assuming the first playlist is the top one

//         // Fetch the tracks from the top playlist
//         const tracksResponse = await fetch(topPlaylist.tracks.href, {
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`
//             }
//         });

//         if (!tracksResponse.ok) {
//             console.error('Failed to fetch playlist tracks:', tracksResponse.statusText);
//         }

//         const tracksData = await tracksResponse.json();

//         // Display only the top 10 tracks
//         const topTracks = tracksData.items.slice(0, 10).map(item => item.track);
//         displayResults(topTracks);

//         console.log('Top 10 songs fetched successfully.');
//     } catch (error) {
//         console.error('Error fetching top songs:', error);
//         alert('An error occurred while fetching the top songs.');
//     }

//     // Set the name the playlist
//     query = "Top 10 Playlist";
//     // Display the "Create Playlist" button
//     document.getElementById('create-playlist-button').style.display = 'block';
//     document.getElementById('create-playlist-button').trackUris= tracks.map(track => track.uri);
// }

async function searchSongs() {

    query = document.getElementById('song-input').value;
    const playlistLength = document.getElementById('length-input').value;
    if (!query) return alert('Please enter a song or artist.');

    if (!accessToken) {
        console.log("access token when not found: " + accessToken); // Debugging purposes (Delete me)
        return;
    }

    let numSongFetches = 0;
    let filteredTracks = [];
    while (filteredTracks.length < playlistLength) {
        const newTracks = await getSongsFromSpotify(query, playlistLength, (numSongFetches*playlistLength), filteredTracks.length);
        numSongFetches += 1;

        // Ensure playlist isn't too large by adding only enough tracks to meet the playlistLength
        for (let track of newTracks) {
            if (filteredTracks.length >= playlistLength) break;
            filteredTracks.push(track);
        }
    }
    // Display the filtered results
    displayResults(filteredTracks);

    // For testing purposes only (Delete me)
    console.log("Tracks length: " + filteredTracks.length)
}

async function getSongsFromSpotify(query, playlistLength, offset, filteredTracksLength) {
    console.log("tracks list: " + filteredTracksLength + "\nOffset: " + offset) // Delete me
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${playlistLength}&offset=${offset}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();

        // Filter out duplicates, remixes, remasters, and covers
        const newFilteredTracks = filterUniqueTracks(data.tracks.items);

        return newFilteredTracks;
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

function displayResults(tracks) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML='';
    const resultsBox = document.getElementById('results-box');
    resultsBox.style.display='block';
    if (tracks.length === 0) {
        resultsDiv.textContent = 'No results found.';
        return;
    }

    tracks.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track'); //Created a track class and moved the styling to the CSS page - Greg

        // Create an image element for the album cover
        const albumCover = document.createElement('img');
        albumCover.src = track.album.images[0]?.url || 'placeholder-image-url';
        albumCover.alt = `${track.name} album cover`;
        albumCover.style.width = 'auto'; // Adjust size as needed

        // Create a text element for song name and artist
        const trackInfo = document.createElement('p');
        
        // Set attribute to allow for track info to contain line breaks
        trackInfo.classList.add('track-info');
        // trackInfo.setAttribute('style', 'white-space: pre;');

        // Refactor track names to feed to getsongbpm API
        const trackNameWithoutFeatures = track.name.replace(/ *\([^)]*\) */g, "");
        const gsbTrack = trackNameWithoutFeatures.replaceAll(" ", "+");
        const gsbArtist = track.artists[0].name.replaceAll(" ", "+");

        trackInfo.textContent = `${track.name} by ${track.artists[0].name}`

        // Add indication of a song being explicit
        if (track.explicit){
            trackInfo.textContent += ` (Explicit)`
        }

        // Attempt to get song metadata and append
        var metadata = gsbSearch(gsbTrack, gsbArtist)
        .then(
            (result) => {
            trackInfo.textContent += `\r\nBPM: ${result.search[0].tempo}`
            trackInfo.textContent += `\r\nKey: ${result.search[0].key_of}`
        })
        .catch(
            (error) => {
            trackInfo.textContent += `\r\n Additional metadata unavailable`
        })

        // Append the album cover and track info to the track element
        trackElement.appendChild(albumCover);
        trackElement.appendChild(trackInfo);

        // Append the track element to the results div
        resultsDiv.appendChild(trackElement);
    })

    // display the "Create Playlist" button
    document.getElementById('create-playlist-button').style.display = 'block';
    document.getElementById('create-playlist-button').trackUris= tracks.map(track => track.uri);

    document.getElementById(`label-for-make-playlist-private-checkbox`).style.visibility = 'visible';
    document.getElementById(`make-playlist-private-checkbox`).style.display = 'block';
    }

async function createPlaylist() {
    const trackUris = document.getElementById('create-playlist-button').trackUris;

    try {
        // Get user's ID
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const userData = await userResponse.json();
        const userId = userData.id;
        const isPrivate = document.getElementById(`make-playlist-private-checkbox`)

        // Create a new playlist
        const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: query + ' from Music Generator',
                description: 'Playlist created from song search',
                public: !(isPrivate.checked)
            })
        });
        const playlistData = await playlistResponse.json();

        // Add songs to the playlist
        await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: trackUris
            })
        });

        alert('Playlist created successfully!');
    } catch (error) {
        console.error('Error creating playlist:', error);
    }
}

function filterUniqueTracks(tracks) {
    const uniqueTracks = [];
    const trackNames = new Set();  // To track unique track names
    
    tracks.forEach((track, index) => {

        // Check if user is filtering explicit or popular tracks 
        const filteringExplicitTracks = document.getElementById(`exclude-explicit-songs-checkbox`);
        const filteringPopularTracks = document.getElementById(`find-niche-songs-checkbox`)
        const popularityThreshhold = 10;

        // Always keep first result unless filtering out explicit songs
        if (index === 0 && (!(filteringExplicitTracks.checked && track.explicit))) {
            uniqueTracks.push(track);
            trackNames.add(track.name.toLowerCase());
            return;
        }

        // Normalize the track name to handle case sensitivity
        const normalizedTrackName = track.name.toLowerCase();
        
        // Check if the track is a remix, remaster, edit, version, or cover using keywords
        const isRemixOrRemaster = /remix|re-recorded|remaster|edit|version|cover|feat|live|acoustic|instrumental/i.test(normalizedTrackName);

        // If it's not a remix/version and the track name hasn't been added yet, include it
        if ((!isRemixOrRemaster && !trackNames.has(normalizedTrackName)) && !(filteringPopularTracks.checked && (track.popularity > popularityThreshhold)) && !(filteringExplicitTracks.checked && track.explicit)) {
            trackNames.add(normalizedTrackName);
            uniqueTracks.push(track);
        } 
    });

    return uniqueTracks;
}

// Function to extract the access token from the URL hash
function getAccessTokenFromURL() {
    // Check if the URL contains a hash fragment
    if (window.location.hash) {
        // Extract the hash and parse it into an object
        const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
            const parts = item.split('=');
            acc[parts[0]] = decodeURIComponent(parts[1]);
            return acc;
        }, {});

        // Get the access token from the parsed object

        if (hash.access_token) {
            accessToken = hash.access_token; // Set the global accessToken
            sessionStorage.setItem('accessToken', accessToken); 
        } else {
            console.error("No access token found in the URL."); // Delete me
        }

        // Clean up the URL to remove the hash
        window.history.pushState('', document.title, window.location.pathname);
    } else {
        console.error("No hash found in the URL.");
    }
}

async function gsbSearch(song, artist){
    try{
        const response = await fetch(`https://api.getsongbpm.com/search/?api_key=${gsbKey}&type=both&lookup=song:${song}artist:${artist}&limit=1`)
        if (!response.ok){
            throw new Error('metadata not found');
        }
        const data = response.json();
        return data;
    }
    catch(error){
        return error;
    }
}

// Run the function to get the access token when the page loads
accessToken=sessionStorage.getItem('accessToken'); //Could possibly bug if token expires - close and re-open browser to generate new token
if (!accessToken) {
    getAccessTokenFromURL();
}
    
