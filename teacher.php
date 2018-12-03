<!--
> Muaz Khan     - https://github.com/muaz-khan 
> MIT License   - https://www.webrtc-experiment.com/licence/
> Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/meeting
-->
<!DOCTYPE html>
<html lang="en">
    <head>
        
		
        <style>
            audio, video {
                width: 300px;
                vertical-align:top;
            }
            
        </style>
       
        
        <!-- Meeting.js library -->
        <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
        <script src="https://cdn.webrtc-experiment.com/CodecsHandler.js"></script>
        <script src="https://cdn.webrtc-experiment.com/IceServersHandler.js"></script>
        <script src="meeting_teacher.js"> </script>
    </head>

    <body>
        
			
            <div id="local_streams"></div>
		
			<div id="remote_streams"></div>
        
            <script>
				var remoteMediaStreams = document.getElementById('remote_streams');
				var localMediaStream = document.getElementById('local_streams');
				var userid=00;
				
                var meeting = new Meeting(userid);
				meeting.setup();
				
                meeting.onaddstream = function (e) {
                    if (e.type == 'local') localMediaStream.appendChild(e.video);
                    if (e.type == 'remote') remoteMediaStreams.insertBefore(e.video, remoteMediaStreams.firstChild);
                };
					
                meeting.openSignalingChannel = function(onmessage) 
				{
                    var channel = '66';
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

				
                meeting.onuserleft = function (userid) {
                    var video = document.getElementById(userid);
                    if (video) video.parentNode.removeChild(video);
                };

					
                meeting.check();

                
            </script>
            
            
    </body>
</html>
