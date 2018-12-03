// Last time updated On: May 15, 2018

// Latest file can be found here: https://cdn.webrtc-experiment.com/meeting.js

// Muaz Khan     - https://github.com/muaz-khan
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/meeting

// __________
// meeting.js

(function () {

	
    window.Meeting = function (channel) {
        var signaler, self = this;
        this.channel = channel ;

		
        this.onmeeting = function (room) {
            if (self.detectedRoom) return;
            self.detectedRoom = true;
            self.meet(room);
        };

        function initSignaler() {
            signaler = new Signaler(self);
        }

        function captureUserMedia(callback) {
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
				localMediaStream.appendChild(video);
				

                callback(stream);
            }

            function onerror(e) {
                console.error(e);
            }
        }
		
        this.meet = function (room) 
		{
            captureUserMedia(function () {
                !signaler && initSignaler();
                signaler.join({
                    to: room.userid,
                    roomid: room.roomid
                });
            });
        };
		
        this.check = initSignaler;
    };
	
    var peers = {};
	
    function Signaler(root) 
	{
        var userid = root.userid;
        var signaler = this;

        // object to store all connected participants's ids
        var participants = {};

        // it is called when your signaling implementation fires "onmessage"
        this.onmessage = function (message) 
		{
            // if new room detected
            if (message.roomid && message.broadcasting && !signaler.sentParticipationRequest)
                root.onmeeting(message);
			

            // if someone shared SDP
            if (message.sdp && message.to == userid) {
                this.onsdp(message);
            }

            // if someone shared ICE
            if (message.candidate && message.to == userid)
			{
				//alert(111);
				var candidates = [];
				var peer = peers[message.userid];
				if (peer) {
					peer.addIceCandidate(message.candidate);
					for (var i = 0; i < candidates.length; i++) {
						peer.addIceCandidate(candidates[i]);
					}
					candidates = [];
				} else candidates.push(candidates);
			}

            // if someone sent participation request
            if (message.participationRequest && message.to == userid) {
                participationRequest(message.userid);
            }

            // session initiator transmitted new participant's details
            // it is useful for multi-user connectivity
            if (message.conferencing && message.newcomer != userid && !!participants[message.newcomer] == false) 
			{
                participants[message.newcomer] = message.newcomer;
                root.stream && signaler.signal({
                    participationRequest: true,
                    to: message.newcomer
                });
            }
        };

        function participationRequest(_userid) 
		{
            
            if (!signaler.creatingOffer) {
                signaler.creatingOffer = true;
                createOffer(_userid);
                setTimeout(function () {
                    signaler.creatingOffer = false;
                    if (signaler.participants &&
                        signaler.participants.length) repeatedlyCreateOffer();
                }, 1000);
            } else {
                if (!signaler.participants) signaler.participants = [];
                signaler.participants[signaler.participants.length] = _userid;
            }
        }
		
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

        // if someone shared SDP
        this.onsdp = function (message) {
            var sdp = message.sdp;

            if (sdp.type == 'offer') 
			{
				//alert(111);
                var _options = options;
                _options.stream = root.stream;
                _options.sdp = sdp;
                _options.to = message.userid;
                peers[message.userid] = Answer.createAnswer(_options);
            }
			
        };
		
        // it is passed over Offer/Answer objects for reusability
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
                
                

                var video = document.createElement('video');
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
				remoteMediaStreams.appendChild(video);
				
				
                
            }
        };
		

        // called for each new participant
        this.join = function (_config) {
            signaler.roomid = _config.roomid;
            this.signal({
                participationRequest: true,
                to: _config.to
            });
            signaler.sentParticipationRequest = true;
        };

        window.onbeforeunload = function () {
            leaveRoom();
            // return 'You\'re leaving the session.';
        };

        window.onkeyup = function (e) {
            if (e.keyCode == 116)
                leaveRoom();
        };

        function leaveRoom() {
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

    

    // var answer = Answer.createAnswer(config);
    // answer.setRemoteDescription(sdp);
    // answer.addIceCandidate(candidate);
    var Answer = {
        createAnswer: function (config) {
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

            peer.oniceconnectionstatechange = peer.onsignalingstatechange = function() {
                if (peer && peer.iceConnectionState && peer.iceConnectionState.search(/disconnected|closed|failed/gi) !== -1) {
                    if(peers[config.to]) {
                        delete peers[config.to];
                    }

                    if (config.onuserleft) config.onuserleft(config.to);
                }
            };

            peer.setRemoteDescription(new RTCSessionDescription(config.sdp)).then(function() {
                peer.createAnswer(offerAnswerConstraints).then(function (sdp) {
                    // https://github.com/muaz-khan/RTCMultiConnection/blob/master/dev/CodecsHandler.js
                    if(typeof CodecsHandler !== 'undefined') {
                        sdp.sdp = CodecsHandler.preferCodec(sdp.sdp, 'vp9');
                    }

                    peer.setLocalDescription(sdp).then(function() {
                        config.onsdp(sdp, config.to);
                    }).catch(onSdpError);
                }).catch(onSdpError);
            }).catch(onSdpError);

            this.peer = peer;

            return this;
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