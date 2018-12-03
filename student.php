

<!DOCTYPE html>
<html lang="en">
    <head>
        
        <!-- Meeting.js library -->
		<script src="adapter-latest.js"></script>
		<script src="IceServersHandler.js"></script>
		<script src="meeting_student.js"> </script>
    </head>

    <body>
		<div id="local_streams"></div>
		
		<div id="remote_streams"></div>
		
		
		<script>
		var remoteMediaStreams = document.getElementById('remote_streams');
		var localMediaStream = document.getElementById('local_streams');
		var userid=11;
		
		var meeting = new Meeting(userid);
		//meeting.setup('test');

		//var meetingsList = document.getElementById('meetings-list');
		var meetingRooms = {};
		meeting.onmeeting = function (room) {
			meetingRooms[room.roomid] = room;
			if (room) meeting.meet(room);
			//alert(room);
		};

		

		// on getting media stream
		meeting.onaddstream = function (e) {
			if (e.type == 'local') localMediaStream.appendChild(e.video);
			if (e.type == 'remote') remoteMediaStreams.insertBefore(e.video, remoteMediaStreams.firstChild);
		};

		meeting.openSignalingChannel = function(onmessage) 
		{
			var channel = '1';//location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
			//alert(channel);
			var websocket = new WebSocket('wss://webrtcweb.com:9449/');
			websocket.onopen = function () {
				websocket.push(JSON.stringify({
				open: true,
				channel: channel
				}));
			};
			websocket.push = websocket.send;
			websocket.send = function (data) {
				if(websocket.readyState != 1) {
				return setTimeout(function() {
				websocket.send(data);
				}, 300);
				}

				websocket.push(JSON.stringify({
				data: data,
				channel: channel
				}));
			};
			websocket.onmessage = function(e) {
				onmessage(JSON.parse(e.data));
			};
			return websocket;
		};

		meeting.onuserleft = function (userid) //离开
		{
			var video = document.getElementById(userid);
			if (video) video.parentNode.removeChild(video);
		};
		meeting.check();// check pre-created meeting rooms


		</script>
            
          
        
    </body>
</html>
