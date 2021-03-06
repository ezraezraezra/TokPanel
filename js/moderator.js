/*
 * Project:     TokPanel
 * Description: Panel-style video chat with up to three dedicated
 *              'artists' cameras and rotating audience camera.
 *              Includes 'artist' view, 'audience view' and 'moderator' view. 
 *              Based on the OpenTok API and my previous project, TokShow
 *              http://github.com/ezraezraezra/TokShow           
 * Website:     http://tokpanel.opentok.com
 * 
 * Author:      Ezra Velazquez
 * Website:     http://ezraezraezra.com
 * Date:        August 2011
 * 
 */
var load_js = function admin_load_js(){
	var apiKey = 3561082;
	var sessionId = '1bbafc0d8ebd134834f41bcbe30bb89baf5db281';
	var token;
	var session;
	var publisher;
	var subscribers = {};
	var user_connection_id;
	var conn_id_array = [];
	var conn_id_array_index = 0;
	var gaga_id = [];
	var queue_list = [];
	var stage;
	var me_publishing = false;
	var user_type = 2; // 1 = Moderator
	// 2 = Client, queue
	// 3 = Client, bat
	// 4 = Gaga
	// 5 = Done
	// Once person is removed, they won't need to be in the list anymore
	// Mod & Gaga change the vars to their liking, otherwise everyone is a client
	for (x = 0; x < 7; x++) {
		queue_list[x] = false;
	}
	var test_on_queue = [];
	var test_on_stage = [];
	var done_ids = [];
	var done_ids_index = 0;
	var mod_id = 'blah';
	var watchers = 0;
	var first_time = true;
	var temp_rand_ids = [];
	var temp_rand_ids_index = 0;
	var random_counter = 0;
	
	this.populate = populate;
	this.kick = kick;
	this.start_chat = start_chat;
	
	$(document).ready(function() {
		startTB(1);
	});
	
	function startTB(temp_var){
		user_type = temp_var;
		
		$.get('php/back.php', {
			comm: 'tbAPI'
		}, function(data){
			token = data.token;
			
			/*
			 * OPENTOK CODE
			 */
			TB.addEventListener("exception", exceptionHandler);
			
			if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) {
				alert("You don't have the minimum requirements to run this application." +
				"Please upgrade to the latest version of Flash.");
			}
			else {
				session = TB.initSession(sessionId);
				session.addEventListener('sessionConnected', sessionConnectedHandler);
				session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
				session.addEventListener('connectionCreated', connectionCreatedHandler);
				session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
				session.addEventListener('streamCreated', streamCreatedHandler);
				session.addEventListener('streamDestroyed', streamDestroyedHandler);
				session.addEventListener("signalReceived", signalReceivedHandler);
			}
			connect();
		});
	}
	
	//--------------------------------------
	//  LINK CLICK HANDLERS
	//--------------------------------------
	function connect(){
		$.get('php/back.php', {
			comm: 'clean'
		}, function(data){
			session.connect(apiKey, token);
		});
	}
	
	function disconnect(){
		session.disconnect();
	}
	
	function startPublishing(){
		if (!publisher) {
			var p_queue_index;
			for (x = 0; x < test_on_queue.length; x++) {
				if (test_on_queue[x] == user_connection_id) {
					p_queue_index = x + 1;
				}
			}
			var parentDiv = document.getElementById("queue_" + p_queue_index);
			parentDiv.style.zIndex = 10;
			var publisherDiv = document.createElement('div');
			publisherDiv.setAttribute('id', 'opentok_publisher');
			parentDiv.appendChild(publisherDiv);
			var publisherProps = {
				width: 150,
				height: 142,
				publishAudio: true
			};
			publisher = session.publish(publisherDiv.id, publisherProps);
			me_publishing = true;
		}
	}
	
	function stopPublishing(){
		if (publisher) {
			session.unpublish(publisher);
		}
		publisher = null;
	}
	
	function signal(){
		session.signal();
	}
	
	function forceDisconnectStream(streamId){
		session.forceDisconnect(subscribers[streamId].stream.connection.connectionId);
	}
	
	function forceUnpublishStream(streamId){
		session.forceUnpublish(subscribers[streamId].stream);
	}
	
	//--------------------------------------
	//  OPENTOK EVENT HANDLERS
	//--------------------------------------
	
	function sessionConnectedHandler(event){
		user_connection_id = session.connection.connectionId;
		show('populateLink');
		
		for (var i = 0; i < event.connections.length; i++) {
			if (event.connections[i].connectionId == user_connection_id) {
				// Can't add moderator to be eligle to chat
			}
			else {
				// Add to user's who can chat with gaga
				conn_id_array[conn_id_array_index] = event.connections[i].connectionId;
				conn_id_array_index = conn_id_array_index + 1;
			}
		}
		
		for (var i = 0; i < event.streams.length; i++) {
			addStream(event.streams[i]);
		}
		
		watchers += event.connections.length - 1;
		document.getElementById("watching_num").innerHTML = watchers;
		
	}
	
	function streamCreatedHandler(event){
		for (var i = 0; i < event.streams.length; i++) {
			addStream(event.streams[i]);
		}
	}
	
	function streamDestroyedHandler(event){
	}
	
	function signalReceivedHandler(event){
		mod_id = event.fromConnection.connectionId;
		if (event.fromConnection.connectionId == user_connection_id) {
		}
		else {
			$.get('php/back.php', {
				comm: 'state'
			}, function(data){
				test_on_queue = data.on_queue;
				test_on_stage = data.on_stage;
				if (data.on_queue != "err") {
					for (x = 0; x < data.on_queue.length; x++) {
						if (data.on_queue[x] == user_connection_id) {
							if (me_publishing === false) {
								startPublishing();
							}
							return;
						}
					}
				}
				if (data.on_stage != "err") {
					for (x = 0; x < data.on_stage.length; x++) {
						if (data.on_stage[x] == user_connection_id) {
							return;
						}
					}
				}
				if (me_publishing === true) {
					stopPublishing();
					me_publishing = false;
				}
			});
		}
	}
	
	function sessionDisconnectedHandler(event){
		publisher = null;
	}
	
	function connectionDestroyedHandler(event){
		for (var i = 0; i < event.connections.length; i++) {
			if (event.connections[i].connectionId == mod_id) {
				// Moderator left, unpublish everyone
				stopPublishing();
			}
			if (event.connections[i].connectionId == gaga_id[0]) {
				gaga_id[0] = gaga_id[1];
				gaga_id[1] = gaga_id[2];
				gaga_id.splice(2, 3);
				$("#left_speaker_2").attr("id", "left_speaker_temp");
				$("#left_speaker_0").attr("id", "left_speaker_2");
				$("#left_speaker_1").attr("id", "left_speaker_0");
				$("#left_speaker_temp").attr("id", "left_speaker_1");
				
				$.get('php/back.php', {
					comm: 'remove',
					tb_id: event.connections[i].connectionId,
					user_status: '5'
				}, function(data){
				});
				return;
			}
			else 
				if (event.connections[i].connectionId == gaga_id[1]) {
					gaga_id[0] = gaga_id[0];
					gaga_id[1] = gaga_id[2];
					gaga_id.splice(2, 3);
					$("#left_speaker_2").attr("id", "left_speaker_temp");
					$("#left_speaker_1").attr("id", "left_speaker_2");
					$("#left_speaker_temp").attr("id", "left_speaker_1");
					
					$.get('php/back.php', {
						comm: 'remove',
						tb_id: event.connections[i].connectionId,
						user_status: '5'
					}, function(data){
					});
					return;
				}
				else 
					if (event.connections[i].connectionId == gaga_id[2]) {
						gaga_id.splice(2, 3);
						
						$.get('php/back.php', {
							comm: 'remove',
							tb_id: event.connections[i].connectionId,
							user_status: '5'
						}, function(data){
						});
						return;
					}
			for (var x = 0; i < conn_id_array.length; x++) {
				if (conn_id_array[x] == event.connections[i].connectionId) {
					temp_id = event.connections[i].connectionId;
					done_ids[done_ids_index] = temp_id;
					done_ids_index = done_ids_index + 1;
					watchers = watchers - 1;
					document.getElementById("watching_num").innerHTML = watchers;
					return;
				}
			}
		}
	}
	
	function connectionCreatedHandler(event){
		for (var i = 0; i < event.connections.length; i++) {
			if (event.connections[i].connectionId == user_connection_id) {
				// Can't add moderator to be eligle to chat
			}
			else {
				// Add to user's who can chat with gaga
				conn_id_array[conn_id_array_index] = event.connections[i].connectionId;
				conn_id_array_index = conn_id_array_index + 1;
				watchers += event.connections.length;
				document.getElementById("watching_num").innerHTML = watchers;
			}
		}
	}
	
	function exceptionHandler(event){
		alert("Exception: " + event.code + "::" + event.message);
	}
	
	
	//--------------------------------------
	//  HELPER METHODS
	//--------------------------------------
	
	function addStream(stream){
		// Check if this is the stream that I am publishing, and if so do not publish.
		if (stream.connection.connectionId == session.connection.connectionId) {
			return;
		}
		
		//Check for the gaga variable
		if (gaga_id.length < 3) {
			$.get('php/back.php', {
				comm: 'gaga',
				view: '5'
			}, function(data){
				if (data.status != 400) {
					for (var x = 0; x < data.gaga_id.length; x++) {
						if (data.gaga_id[x] == stream.connection.connectionId) {
							if (data.gaga_id[x] != session.connection.connectionId) {
								gaga_id.push(data.gaga_id[x]);
								
								var subscriberDiv = document.createElement('div');
								subscriberDiv.setAttribute('id', stream.streamId);
								document.getElementById('left_speaker_' + (gaga_id.length - 1)).appendChild(subscriberDiv);
								var subscriberProps = {
									width: 200,
									height: 225,
									subscribeToAudio: true
								};
								subscribers[stream.streamId] = session.subscribe(stream, subscriberDiv.id, subscriberProps);
								watchers -= 1;
								document.getElementById("watching_num").innerHTML = watchers;
								return;
							}
						}
					}
					add_to_queue(stream);
				}
				else {
					add_to_queue(stream);
				}
			});
		}
		else {
			add_to_queue(stream);
		}
	}
	
	function add_to_queue(stream){
		var subscriberDiv = document.createElement('div');
		subscriberDiv.setAttribute('id', stream.streamId);
		for (x = 1; x < 6; x++) {
			if (queue_list[x] === false) {
				document.getElementById("queue_" + x).appendChild(subscriberDiv);
				var subscriberProps = {
					width: 150,
					height: 142,
					subscribeToAudio: true
				};
				subscribers[stream.streamId] = session.subscribe(stream, subscriberDiv.id, subscriberProps);
				queue_list[x] = stream.connection.connectionId;
				return;
			}
		}
	}
	
	function kick(vid_kick){
		done_ids[done_ids_index] = queue_list[vid_kick.substring(6)];
		done_ids_index = done_ids_index + 1;
		
		remove_user_id = queue_list[vid_kick.substring(6)];
		remove_user(remove_user_id, 5);
		queue_list[vid_kick.substring(6)] = false;
		add_user(2);
	}
	
	function start_chat(vid_kick){
		done_ids[done_ids_index] = queue_list[vid_kick.substring(6)];
		done_ids_index = done_ids_index + 1;
		
		remove_user_id = queue_list[vid_kick.substring(6)];
		remove_user(remove_user_id, 5);
		queue_list[vid_kick.substring(6)] = false;
	}
	
	function populate(){
		for (var x = 1; x < 6; x++) {
			if (queue_list[x] === false && x <= conn_id_array.length + 1) {
				add_user(2);
			}
		}
	}
	
	function random_user_generator(){
		random_counter += 1;
		if (random_counter >= 100) {
			return;
		}
		duplicate = false;
		rand_id = conn_id_array[Math.floor(Math.random() * conn_id_array.length)];
		for (x = 0; x < done_ids.length; x++) {
			if (rand_id == done_ids[x]) {
				duplicate = true;
			}
		}
		for (x = 0; x < queue_list.length; x++) {
			if (rand_id == queue_list[x]) {
				duplicate = true;
			}
		}
		for (x = 0; x < temp_rand_ids.length; x++) {
			if (rand_id == temp_rand_ids[x]) {
				duplicate = true;
			}
		}
		if (duplicate === true) {
			random_user_generator();
		}
		else {
			temp_rand_ids[temp_rand_ids_index] = rand_id;
			temp_rand_ids_index += 1;
		}
	}
	
	// Add ppl to the queue table
	function add_user(u_status){
		random_counter = 0;
		random_user_generator();
		if (random_counter >= 100) {
			return;
		}
		else {
			var temp_rand = rand_id;
			if (temp_rand != gaga_id[0] || temp_rand != gaga_id[1] || temp_rand != gaga_id[2]) {
				jQuery.ajaxSetup({
					async: false
				});
				$.get('php/back.php', {
					comm: 'add',
					tb_id: temp_rand,
					user_status: u_status
				}, function(data){
					if (data.status == '200') {
						signal();
					}
				});
				jQuery.ajaxSetup({
					async: true
				});
			}
			else {
				add_user(2);
			}
		}
	}
	
	function remove_user(u_id, u_status){
		$.get('php/back.php', {
			comm: 'remove',
			tb_id: u_id,
			user_status: u_status
		}, function(data){
			update_queue(true);
			
		});
	}
	
	function update_queue(repeat){
		for (var x = 0; x < 6; x++) {
			// Shift everyone over
			if (queue_list[x] === false) {
				for (var y = x; y < queue_list.length - 1/*2*/; y++) {
					next_value = y + 1;
					
					if (undefined != queue_list[next_value] && queue_list[next_value] !== false) {
						queue_list[y] = queue_list[next_value];
						document.getElementById("queue_" + y).innerHTML = document.getElementById("queue_" + next_value).innerHTML;
					}
					else {
						queue_list[y] = false;
						$('#queue_' + y).empty();
					}
					if (x === 0) {
						$.get('php/back.php', {
							comm: 'update',
							tb_id: queue_list[0],
							user_status: '3'
						}, function(data){
							if (queue_list[0] !== false) {
								stage_left_user = document.getElementById("queue_0").getElementsByTagName("object");
								stage_left_user[0].setAttribute("height", "225");
								stage_left_user[0].setAttribute("width", "200");
							}
						});
					}
				}
				signal();
				if (repeat === true) {
					update_queue(false);
				}
				return;
			}
		}
	}
	
	function show(id){
		document.getElementById(id).style.display = 'block';
	}
	
	function hide(id){
		document.getElementById(id).style.display = 'none';
	}
}();
