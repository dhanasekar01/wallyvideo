window.enableAdapter = true; // enable adapter.js

var localStream = null;


// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................

var connection = new RTCMultiConnection();

// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = '/';

// comment-out below line if you do not have your own socket.io server
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketMessageEvent = 'video-conference-demo';

connection.session = {
    audio: true,
    video: true
};

connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

connection.videosContainer = document.getElementById('smallVideo');

connection.onstream = function(event) {
	console.log(event);
	var sourcevideo = document.getElementById('Sourcevideo');
	
    var existing = document.getElementById(event.streamid);
    if(existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
	
	if(sourcevideo){
		$("#entryContent").remove();
		connection.videosContainer = document.getElementById('bigVideo');
		
		var video = document.createElement('video');
		video.controls = true;
		
		video.srcObject = event.stream;
		
		
		var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
		var mediaElement = getHTMLMediaElement(video, {
			title: 'HR',
			buttons: [''],
			width: width,
			showOnMouseEnter: false
		});
		
		connection.videosContainer.appendChild(mediaElement);
		setTimeout(function() {
			mediaElement.media.play();
		}, 5000);

		mediaElement.id = event.streamid;
		
		$("#disconnect").removeClass("hide");
	}else{
		var video = document.createElement('video');
		video.id = "Sourcevideo"
		video.controls = true;

		video.srcObject = event.stream;
		
		var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
		var mediaElement = getHTMLMediaElement1(video, {
			title: '',
			buttons: [''],
			width: width,
			showOnMouseEnter: false
		});
		
		connection.videosContainer.appendChild(mediaElement);
		setTimeout(function() {
			mediaElement.media.play();
		}, 5000);

		mediaElement.id = event.streamid;
		
		localStream = event.stream;
		
		$("#mute").on("click",function(){
			if($(this).hasClass('unmute')){
				connection.streamEvents[event.streamid].stream.mute('audio');
				$(this).removeClass('unmute').addClass('mute');
				$(this).find('img').attr('src','images/micmute.png');
			}else{
				$(this).removeClass('mute').addClass('unmute');
				$(this).find('img').attr('src','images/mic.png');
				connection.streamEvents[event.streamid].stream.unmute('audio');
			}
			
		});
	}
};

connection.onleave = function(userid){
	connection.attachStreams[0].stop();
	disconnectConnection(false);
}

connection.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);
    }
};

connection.onMediaError = function(e) {
    if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
            alert('Please select external microphone. Check github issue number 483.');
            return;
        }

        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        connection.mediaConstraints.audio = {
            deviceId: secondaryMic
        };

        connection.join(connection.sessionid);
    }
};



function disableInputButtons() {
    document.getElementById('open-or-join-room').disabled = true;
    document.getElementById('open-room').disabled = true;
    document.getElementById('join-room').disabled = true;
    document.getElementById('room-id').disabled = true;
}

// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = '?roomid=' + roomid;

    var html = '<h2>Unique URL for your room:</h2><br>';

    html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
    html += '<br>';
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';

    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;

    roomURLsDiv.style.display = 'block';
}

(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1)))
        params[d(match[1])] = d(match[2]);
    window.params = params;
})();

var roomid = 'wally';

document.getElementById('room-id').value = roomid;
document.getElementById('room-id').onkeyup = function() {
    localStorage.setItem(connection.socketMessageEvent, this.value);
};

var hashString = location.hash.replace('#', '');
if (hashString.length && hashString.indexOf('comment-') == 0) {
    hashString = '';
}

var roomid = params.roomid;
if (!roomid && hashString.length) {
    roomid = hashString;
}

if (roomid && roomid.length) {
    document.getElementById('room-id').value = roomid;
    localStorage.setItem(connection.socketMessageEvent, roomid);

    // auto-join-room
    (function reCheckRoomPresence() {
        connection.checkPresence(roomid, function(isRoomExist) {
            if (isRoomExist) {
                connection.join(roomid);
                return;
            }

            setTimeout(reCheckRoomPresence, 5000);
        });
    })();

    disableInputButtons();
}

function disconnectConnection(isReceiver){
	if(isReceiver){
		
	}else{
		connection.closeEntireSession(function(){
			$("#sourceDiv").remove();
			$("#remoteDiv").remove();
			$('body').html($("#exitTemplate").html());
		});
	}
}

$(document).ready(function(){
        
        $("#sourceDiv").removeClass("hide");
         connection.openOrJoin(document.getElementById('room-id').value, function(isRoomExist, roomid) {
			if (!isRoomExist) {
				showRoomURL(roomid);
			}
		});
        $("#remoteDiv").removeClass("hide");
		
		$("#disconnect").bind("click",function(){
			disconnectConnection(false);
		});
		
});