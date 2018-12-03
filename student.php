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
        <script src="meeting_student.js"> </script>
    </head>

    <body>
        
			
			<div id="local_streams"></div>
		
			<div id="remote_streams"></div>
			<button onclick="start();" style="width:10vh;height:3vh">通话</button>
            <script>
				var remoteMediaStreams = document.getElementById('remote_streams');
				var localMediaStream = document.getElementById('local_streams');
				var channel='66';
				
                var meeting = new Meeting(channel);
				meeting.userid='11';
                meeting.check();

                function start() 
				{
					meeting.onmeeting0();
					
				}
            </script>
            
            
    </body>
</html>
