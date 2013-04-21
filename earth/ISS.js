google.load("earth", "1");
   
var ge = null;

var aspectRatio = 2000 / 1325;

var fps = 10;
var issPollInterval = 10000; //10 sec
var issAltitude = 1809273.5;

var lastTimestamp = 0;
var currentTimestamp = 0;
var timestampIteration = 1;

var lastLatitude = 0;
var lastLongitude = 0;
var currentLatitude = 0;
var currentLongitude = 0;
var projectedLatitude = 0;
var projectedLongitude = 0;


function init() {
	google.earth.createInstance("map-canvas", initCallback, failureCallback);

	if(!google.earth.isInstalled()) {
		$('#ISSView').hide();
	}

	$(window).resize(updateScreenOverlay);

	myAudio = new Audio('ISSAmbient.mp3'); 
	myAudio.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
	myAudio.play();

	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			//Fly to own location
			flyToMe(position.coords.latitude, position.coords.longitude);

			//Then fly to spacestation
			setTimeout(flyToISS, 7000);
		}, function() {
			handleNoGeolocation(true);
			//flyToISS();
		});
	}
}

function initCallback(object) {
	ge = object;
	ge.getWindow().setVisibility(true);

	
 
	
}

function failureCallback(object) {
}

function flyToMe(latitude, longitude) {
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	camera.setLatitude(latitude);
	camera.setLongitude(longitude);
	camera.setAltitude(200);
	ge.getOptions().setFlyToSpeed(.3);
	ge.getView().setAbstractView(camera);
}

function flyToISS() {
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	camera.setAltitude(issAltitude*4);
	camera.setLatitude(55);
	camera.setLongitude(55);
	ge.getOptions().setFlyToSpeed(.3);
	ge.getView().setAbstractView(camera);

	setTimeout(function(){
		$.getJSON('API.php', function(data) {
	 		var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
			camera.setTilt(camera.getTilt() + 43);
			camera.setRoll(camera.getRoll() + -15);
			camera.setLatitude(data.iss_position.latitude);
			camera.setLongitude(data.iss_position.longitude);
			camera.setAltitude(issAltitude);
			ge.getView().setAbstractView(camera);
			//ge.getOptions().setFlyToSpeed(ge.SPEED_TELEPORT);
			setTimeout(initScreenOverlay,2000);

			//Then set up animation
			setTimeout(fetchISSLoc,1000);
			setTimeout(fetchISSLoc,4000);
			setInterval(function(){	
				fetchISSLoc();
			},issPollInterval);

			setTimeout(function(){
				setInterval(function(){
					timestampIteration = timestampIteration + 1;
					if(lastTimestamp != 0) {
						var timeDiff = currentTimestamp - lastTimestamp;
						var timeIterations = timeDiff * fps;
						projectedLatitude = currentLatitude 
								+ ((currentLatitude - lastLatitude) 
									* (timestampIteration / timeIterations)
								);
						projectedLongitude = currentLongitude
								+ ((currentLongitude - lastLongitude) 
									* (timestampIteration / timeIterations)
								);
						updateCamera(projectedLatitude,	projectedLongitude);
					}
				},1000/fps)
			},5000);
		});
	},2000);
}

function fetchISSLoc() {
	$.getJSON('API.php', function(data) {
		lastTimestamp = currentTimestamp;
		lastLatitude = currentLatitude;
		lastLongitude = currentLongitude;
		currentTimestamp = data.timestamp;
		currentLatitude = data.iss_position.latitude;
		currentLongitude = data.iss_position.longitude;
		timestampIteration = 0;
	});
}

function updateCamera(latitude, longitude) {
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);

	camera.setLatitude(latitude);
	camera.setLongitude(longitude);
	camera.setAltitude(issAltitude);

	ge.getView().setAbstractView(camera);
}

function initScreenOverlay() {
	// Create the ScreenOverlay
	var screenOverlay = ge.createScreenOverlay('');

	// Specify a path to the image and set as the icon
	var icon = ge.createIcon('');
	icon.setHref(document.URL + 'cupola.png');
	screenOverlay.setIcon(icon);

	screenOverlay.getSize().setXUnits(ge.UNITS_PIXELS);
	screenOverlay.getSize().setYUnits(ge.UNITS_PIXELS);

	ge.getFeatures().appendChild(screenOverlay);

	updateScreenOverlay();

}

function updateScreenOverlay() {
	if ( ($(window).width() / $(window).height()) > aspectRatio ) {
		ge.getFeatures().getFirstChild().getSize().setX($(window).width());
		ge.getFeatures().getFirstChild().getSize().setY($(window).width()/1.509);
	} else {
		ge.getFeatures().getFirstChild().getSize().setX($(window).height()/0.6255);
		ge.getFeatures().getFirstChild().getSize().setY($(window).height());
	}
}

