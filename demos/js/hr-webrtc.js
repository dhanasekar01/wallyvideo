window.enableAdapter = true; // enable adapter.js

var baseUrl = "https://13.78.183.109:8443/ServicePoc/";


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
	
	var sourcevideo = document.getElementById('Sourcevideo');
	
    var existing = document.getElementById(event.streamid);
    if(existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
	
	if(sourcevideo){
		var rmDetails = getRoomDetails(document.getElementById('room-id').value);
		$("#entryContent").remove();
		connection.videosContainer = document.getElementById('bigVideo');
		
		var video = document.createElement('video');
		video.controls = true;
		
		video.srcObject = event.stream;
		
		
		var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
		var mediaElement = getHTMLMediaElement(video, {
			title: roomid != 0 ? "Conference - "+ roomid : "Waiting",
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
}

// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {

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


var roomid = params.roomid;
document.getElementById('room-id').value = roomid;

console.log(roomid);

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

function connectRoom(){
	var url = baseUrl+"/updateVideoConf"
	var result = {};
	$.ajax({
		async: false,
		type: "POST",
		url: url,
		contentType: "application/json",
		data: JSON.stringify({"rID": roomid,"firstname": params.fname,"lastname": "","storenumber": 100,"timestamp": "","status": "Connected","attendedBy": localStorage.getItem("username")}),
		complete: function (jqxhr, txt_status) {
			result = jqxhr;
		}
	});

	if (result.responseText)
		return result.responseText;

	return "";
}


function disconnectRoom(){
	var url = baseUrl+"updateVideoConf"
	var result = {};
	$.ajax({
		async: false,
		type: "POST",
		url: url,
		contentType: "application/json",
		data: JSON.stringify({"rID": roomid,"firstname": params.fname,"lastname": "","storenumber": 100,"timestamp": "","status": "Closed","attendedBy": ""}),
		complete: function (jqxhr, txt_status) {
			result = jqxhr;
		}
	});

	if (result.responseText)
		return result.responseText;

	return "";
}

function disconnectConnection(isReceiver){
	if(isReceiver){
		
	}else{
		disconnectRoom();
		connection.closeEntireSession(function(){
			$("#sourceDiv").remove();
			$("#remoteDiv").remove();
			$('body').html($("#exitTemplate").html());
		});
	}
}

function getRoomDetails(roomid){
	var url = baseUrl+"videoConfById?rID="+roomid
	var result = {};
	$.ajax({
		async: false,
		type: "POST",
		url: url,
		complete: function (jqxhr, txt_status) {
			result = jqxhr;
		}
	});

	if (result.responseText)
		return result.responseText;

	return "";
}

$(document).ready(function(){
		connectRoom();
        $("#sourceDiv").removeClass("hide");
         connection.join(roomid, function(isRoomExist, roomid) {
			if (!isRoomExist) {
				showRoomURL(roomid);
			}
		});
        $("#remoteDiv").removeClass("hide");
		
		$("#disconnect").bind("click",function(){
			disconnectConnection(false);
		});
		
});