google.load("earth", "1");
   
var ge = null;

var aspectRatio = 2000 / 1325;

var fps = 10;
var issPollInterval = 10000; //10 sec

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

	//document.getElementById('issnoise').play();
	myAudio = new Audio('ISSAmbient.mp3'); 
	myAudio.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
	myAudio.play();
}

function initCallback(object) {
	ge = object;
	ge.getWindow().setVisibility(true);

	//First call for cordinates, do some special stuff when we get them
 	$.getJSON('API.php', function(data) {
 		var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
		camera.setTilt(camera.getTilt() + 43);
		camera.setRoll(camera.getRoll() + -15);
		camera.setLatitude(data.iss_position.latitude);
		camera.setLongitude(data.iss_position.longitude);
		camera.setAltitude(1809273.5);
		ge.getView().setAbstractView(camera);
		ge.getOptions().setFlyToSpeed(ge.SPEED_TELEPORT);
		initScreenOverlay();
	});

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
	},1000/fps);
 
	setInterval(function(){	
		fetchISSLoc();
	},issPollInterval);

	setTimeout(fetchISSLoc,2000);
	setTimeout(fetchISSLoc,4000);
}

function failureCallback(object) {
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
	camera.setAltitude(1809273.5);

	ge.getView().setAbstractView(camera);
}

function initScreenOverlay() {
	// Create the ScreenOverlay
	var screenOverlay = ge.createScreenOverlay('');

	// Specify a path to the image and set as the icon
	var icon = ge.createIcon('');
	icon.setHref(document.URL + 'iss-view-sharper.png');
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

