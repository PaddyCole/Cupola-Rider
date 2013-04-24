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

var cupolaShowing = false;


function init() {
	google.earth.createInstance("map-canvas", initGECallback, failureGECallback);
}

function initGECallback(object) {
	ge = object;
	ge.getWindow().setVisibility(true);

	initCupolaOverlay();

	fetchISSLoc();
	setTimeout(fetchISSLoc,4000);
	setInterval(function(){	
		fetchISSLoc();
	},issPollInterval);

	//addLogoOverlay();

	$(window).resize(updateCupolaOverlay);

	if(Modernizr.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			// Create the placemark.
			var placemark = ge.createPlacemark('');
			placemark.setName("");

			// Define a custom icon.
			var icon = ge.createIcon('');
			icon.setHref(document.URL + 'space-apps-marker.png');
			var style = ge.createStyle('');
			style.getIconStyle().setIcon(icon);
			style.getIconStyle().setScale(5.0);
			placemark.setStyleSelector(style);

			// Set the placemark's location.  
			var point = ge.createPoint('');
			point.setLatitude(position.coords.latitude);
			point.setLongitude(position.coords.longitude);
			placemark.setGeometry(point);

			// Add the placemark to Earth.
			ge.getFeatures().appendChild(placemark);

			//Fly to own location
			flyToMe(position.coords.latitude, position.coords.longitude);

			//Then fly to spacestation
			setTimeout(function(){
				flyToISS();
			}, 7000);
		}, function() {
			console.log("html5 geo location service return no position");
			flyToISS();
		},{ timeout: 5000 });
	} else {
		console.log("no html5 geo location service availibal");
		setTimeout(function(){
			flyToISS();
		}, 5000);
	}
}

function failureGECallback(object) {
	//No Google Earth then, don't know what to do..
}

function flyToMe(latitude, longitude) {
	console.log("flyToMe " + latitude + ":" + longitude);
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	camera.setLatitude(latitude);
	camera.setLongitude(longitude);
	camera.setAltitude(200);
	ge.getOptions().setFlyToSpeed(.3);
	ge.getView().setAbstractView(camera);
}

function flyOutOverMe(latitude, longitude) {
	console.log("flyOutOverMe " + latitude + ":" + longitude);
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	camera.setAltitude(issAltitude*4);
	camera.setLatitude(latitude);
	camera.setLongitude(longitude);
	ge.getOptions().setFlyToSpeed(.3);
	ge.getView().setAbstractView(camera);
}

function flyToISS() {
	console.log("flyToISS");

	$.getJSON('API.php', function(data) {
 		var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
		camera.setTilt(camera.getTilt() + 43);
		camera.setRoll(camera.getRoll() + -15);
		camera.setLatitude(data.iss_position.latitude);
		camera.setLongitude(data.iss_position.longitude);
		camera.setAltitude(issAltitude);
		ge.getView().setAbstractView(camera);
		google.earth.addEventListener(ge.getView(), 'viewchangeend', GEFEeventHandler);
	});
}
var GEFEeventHandler = function flyToISSevent() {
	if(window['timer'] != undefined){
		clearTimeout(timer);
	}
	timer = setTimeout(flyToISSdone, 200);
};
function flyToISSdone() {
	console.log("flyToISSdone");

	google.earth.removeEventListener(ge.getView(), 'viewchangeend', GEFEeventHandler);
	
	ge.getOptions().setFlyToSpeed(ge.SPEED_TELEPORT);
	
	showCupolaOverlay();
	startCupolaNosie();

	//Then set up animation
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

function startCupolaNosie() {
	myAudio = new Audio('ISSAmbient.mp3'); 
	myAudio.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
	myAudio.play();
}

function initCupolaOverlay() {
	// Create the ScreenOverlay
	var screenOverlay = ge.createScreenOverlay('');

	// Specify a path to the image and set as the icon
	var icon = ge.createIcon('');
	icon.setHref(document.URL + 'cupola.png');
	screenOverlay.setIcon(icon);

	screenOverlay.getSize().setXUnits(ge.UNITS_PIXELS);
	screenOverlay.getSize().setYUnits(ge.UNITS_PIXELS);

	screenOverlay.getOverlayXY().setX(2);
	screenOverlay.getOverlayXY().setY(2);

	ge.getFeatures().appendChild(screenOverlay);
}

function showCupolaOverlay() {
	cupolaShowing = true;
	ge.getFeatures().getLastChild().getOverlayXY().setX(0.5);
	ge.getFeatures().getLastChild().getOverlayXY().setY(0.5);
	updateCupolaOverlay();
}

function updateCupolaOverlay() {
	if(cupolaShowing) {
		if ( ($(window).width() / $(window).height()) > aspectRatio ) {
			ge.getFeatures().getLastChild().getSize().setX($(window).width());
			ge.getFeatures().getLastChild().getSize().setY($(window).width()/1.509);
		} else {
			ge.getFeatures().getLastChild().getSize().setX($(window).height()/0.6255);
			ge.getFeatures().getLastChild().getSize().setY($(window).height());
		}
	}
}

function addLogoOverlay() {
	// Create the ScreenOverlay
	var screenOverlay = ge.createScreenOverlay('');

	// Specify a path to the image and set as the icon
	var icon = ge.createIcon('');
	icon.setHref(document.URL + 'logo200.png');
	screenOverlay.setIcon(icon);

	ge.getFeatures().appendChild(screenOverlay);
	ge.getFeatures().getLastChild().getSize().setX($(window).width()/10);
	ge.getFeatures().getLastChild().getSize().setY($(window).width()/10);

	ge.getFeatures().getLastChild().getOverlayXY().setX(0.15);
	ge.getFeatures().getLastChild().getOverlayXY().setY(0.15);

}

