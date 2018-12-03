// Last time updated On: May 15, 2018

// Latest file can be found here: https://cdn.webrtc-experiment.com/meeting.js

// Muaz Khan     - https://github.com/muaz-khan
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/meeting

// __________
// meeting.js

(function () {
	
    window.Meeting = function (channel) 
	{
        var signaler, self = this;
        this.channel = channel ;
		this.userid = channel;
		
        function initSignaler() {
            signaler = new Signaler(self);
        }

        function captureUserMedia(callback) 
		{
            var constraints = {
                audio: true,
                video: true
            };

            navigator.mediaDevices.getUserMedia(constraints).then(onstream).catch(onerror);

            function onstream(stream) {
                
                self.stream = stream;

                var video = document.createElement('video');
                video.id = 'self';
                video.muted = true;
                video.volume = 0;
                
                try {
                        video.setAttributeNode(document.createAttribute('autoplay'));
                        video.setAttributeNode(document.createAttribute('playsinline'));
                        video.setAttributeNode(document.createAttribute('controls'));
                    } catch (e) {
                        video.setAttribute('autoplay', true);
                        video.setAttribute('playsinline', true);
                        video.setAttribute('controls', true);
                    }

                video.srcObject = stream;
				
				var audio = document.getElementById(video.id);
				if (audio) audio.parentNode.removeChild(audio);
				
				localMediaStream.appendChild(video);

                callback(stream);
            }

            function onerror(e) {
                console.error(e);
            }
        }
		
        this.setup = function () 
		{
            captureUserMedia(function () {
                !signaler && initSignaler();
				signaler.isbroadcaster = true;
				(function transmit() {
					signaler.signal({
						roomid: self.channel,
						broadcasting: true
					});

					if (!signaler.stopBroadcasting && !this.transmitOnce)
						setTimeout(transmit, 1000);
				})();
				
				if (socket.onDisconnect) socket.onDisconnect().remove();
				
				
				
				
            });
        };
		
		this.onuserleft = function (userid) {
			//alert(111);
			var video = document.getElementById(userid);
			if (video) video.parentNode.removeChild(video);
		};
		
		this.openSignalingChannel = function(onmessage) 
		{
			//var channel = '66';
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
		
		
        this.check = initSignaler;
		
    };

    var peers = {};

	
    function Signaler(root) 
	{
        var userid = root.userid;
        var signaler = this;
        var participants = {};

        this.onmessage = function (message) 
		{
            if (message.sdp && message.to == userid) {
                var sdp = message.sdp;
				if (sdp.type == 'answer') {
					peers[message.userid].setRemoteDescription(sdp);
				}
            }
			
            if (message.candidate && message.to == userid)
			{
				/*
				var candidates = [];
				var peer = peers[message.userid];
				if (peer) {
					peer.addIceCandidate(message.candidate);
					for (var i = 0; i < candidates.length; i++) {
						peer.addIceCandidate(candidates[i]);
					}
					candidates = [];
				} else candidates.push(candidates);*/
				
			}

			
            if (message.participationRequest && message.to == userid) //加入对话
			{
                
				if (!signaler.creatingOffer) 
				{
					
					signaler.creatingOffer = true;
					createOffer(message.userid);
					setTimeout(function () 
					{
						signaler.creatingOffer = false;
						if (signaler.participants &&
							signaler.participants.length) repeatedlyCreateOffer();
					}, 1000);
				} else {
					if (!signaler.participants) signaler.participants = [];
					signaler.participants[signaler.participants.length] = message.userid;
				}
            }
			
            if (message.conferencing && message.newcomer != userid && !!participants[message.newcomer] == false) 
			{
                participants[message.newcomer] = message.newcomer;
                root.stream && signaler.signal({
                    participationRequest: true,
                    to: message.newcomer
                });
            }
        };


        function createOffer(to) {
            var _options = options;
            _options.to = to;
            _options.stream = root.stream;
            peers[to] = Offer.createOffer(_options);
        }

        // reusable function to create new offer repeatedly

        function repeatedlyCreateOffer() {
            var firstParticipant = signaler.participants[0];
            if (!firstParticipant) return;

            signaler.creatingOffer = true;
            createOffer(firstParticipant);

            // delete "firstParticipant" and swap array
            delete signaler.participants[0];
            signaler.participants = swap(signaler.participants);

            setTimeout(function () {
                signaler.creatingOffer = false;
                if (signaler.participants[0])
                    repeatedlyCreateOffer();
            }, 1000);
        }

        
		
        var options = 
		{
            onsdp: function (sdp, to) {
                signaler.signal({
                    sdp: sdp,
                    to: to
                });
            },
            onicecandidate: function (candidate, to) {
                signaler.signal({
                    candidate: candidate,
                    to: to
                });
            },
            onuserleft: function(_userid) {
                if (root.onuserleft) root.onuserleft(_userid);
            },
            onaddstream: function (stream, _userid) 
			{
                
                var video = document.createElement('audio');
                video.id = _userid;
                
                try {
                        video.setAttributeNode(document.createAttribute('autoplay'));
                        video.setAttributeNode(document.createAttribute('playsinline'));
                        video.setAttributeNode(document.createAttribute('controls'));
                    } catch (e) {
                        video.setAttribute('autoplay', true);
                        video.setAttribute('playsinline', true);
                        video.setAttribute('controls', true);
                    }
                video.srcObject = stream;
				
				var audio = document.getElementById(video.id);
				if (audio) audio.parentNode.removeChild(audio);
				
				remoteMediaStreams.appendChild(video);
                
            }
        };

		
        window.onbeforeunload = function () {
			
            leaveRoom();
        };

        window.onkeyup = function (e) {
            
			if (e.keyCode == 116)
                leaveRoom();
        };

        function leaveRoom() 
		{
            signaler.signal({
                leaving: true
            });

            // stop broadcasting room
            if (signaler.isbroadcaster) signaler.stopBroadcasting = true;

            // leave user media resources
            if (root.stream) {
                if('stop' in root.stream) {
                    root.stream.stop();
                }
                else {
                    root.stream.getTracks().forEach(function(track) {
                        track.stop();
                    });
                }
            }

            // if firebase; remove data from their servers
            if (window.Firebase) socket.remove();
        }
        root.leave = leaveRoom;

        var socket;

        socket = root.openSignalingChannel(function (message) {
			message = JSON.parse(message);
			if (message.userid != userid) {
				if (!message.leaving) signaler.onmessage(message);
				else if (root.onuserleft) root.onuserleft(message.userid);
			}
		});

		// method to signal the data
		this.signal = function (data) {
			data.userid = userid;
			socket.send(JSON.stringify(data));
		};
    }

    // reusable stuff
    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

    var iceServers = [];

    if(typeof IceServersHandler !== 'undefined') {
        iceServers = IceServersHandler.getIceServers();
    }

    iceServers = {
        iceServers: iceServers,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        iceCandidatePoolSize: 0
    };

    if(adapter.browserDetails.browser !== 'chrome') {
        iceServers = {
            iceServers: iceServers.iceServers
        };
    }

    var offerAnswerConstraints = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    };

    if(adapter.browserDetails.browser === 'chrome' || adapter.browserDetails.browser === 'safari') {
        offerAnswerConstraints = {
            mandatory: offerAnswerConstraints,
            optional: []
        };
    }

    var dontDuplicateOnAddTrack = {};

    

    function onSdpError(e) {
        console.error('sdp error:', e);
    }

    
    var Offer = {
        createOffer: function (config) {
            var peer = new RTCPeerConnection(iceServers);

            if('addStream' in peer) {
                peer.onaddstream = function(event) {
                    config.onaddstream(event.stream, config.to);
                };

                if (config.stream) {
                    peer.addStream(config.stream);
                }
            }
            else if('addTrack' in peer) {
                peer.onaddtrack = function(event) {
                    event.stream = event.streams.pop();

                    if(dontDuplicateOnAddTrack[event.stream.id] && adapter.browserDetails.browser !== 'safari') return;
                    dontDuplicateOnAddTrack[event.stream.id] = true;

                    config.onaddstream(event.stream, config.to);
                };

                if (config.stream) {
                    config.stream.getTracks().forEach(function(track) {
                        peer.addTrack(track, config.stream);
                    });
                }
            }
            else {
                throw new Error('WebRTC addStream/addTrack is not supported.');
            }

            peer.onicecandidate = function (event) {
                config.onicecandidate(event.candidate, config.to);
            };

            peer.oniceconnectionstatechange = peer.onsignalingstatechange = function() 
			{
                if (peer && peer.iceConnectionState && peer.iceConnectionState.search(/disconnected|closed|failed/gi) !== -1) 
				{
                    if(peers[config.to]) {
                        delete peers[config.to];
                    }
					//alert(111);
                    //if (config.onuserleft) config.onuserleft(config.to);
                }
            };

            peer.createOffer(offerAnswerConstraints).then(function (sdp) {
                
                if(typeof CodecsHandler !== 'undefined') {
                    sdp.sdp = CodecsHandler.preferCodec(sdp.sdp, 'vp9');
                }

                peer.setLocalDescription(sdp).then(function() {
                    config.onsdp(sdp, config.to)
                }).catch(onSdpError);
            }).catch(onSdpError);

            function sdpCallback() {
                config.onsdp(peer.localDescription, config.to);
            }

            this.peer = peer;

            return this;
        },
        setRemoteDescription: function (sdp) {
            this.peer.setRemoteDescription(new RTCSessionDescription(sdp)).catch(onSdpError);
        },
        addIceCandidate: function (candidate) {
            this.peer.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));
        }
    };
	

    // swap arrays

    function swap(arr) {
        var swapped = [],
            length = arr.length;
        for (var i = 0; i < length; i++)
            if (arr[i] && arr[i] !== true)
                swapped[swapped.length] = arr[i];
        return swapped;
    }

    
})();