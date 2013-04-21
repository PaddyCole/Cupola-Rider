google.load("earth", "1");
   
var ge = null;

var aspectRatio = 2000 / 1325;


function init() {
	google.earth.createInstance("map-canvas", initCallback, failureCallback);

	if(!google.earth.isInstalled()) {
		$('#ISSView').hide();
	}

	$(window).resize(updateScreenOverlay);
}

function initCallback(object) {
	ge = object;
	ge.getWindow().setVisibility(true);
	//     INITIAL_CAMERA_ALTITUDE = 809273.5;
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	camera.setTilt(camera.getTilt() + 43);
	camera.setRoll(camera.getRoll() + -15);

	initScreenOverlay();

 
	setInterval(function(){	
 				var feed = "API.php";
 				$.getJSON(feed, function(data) {
 					var latitude = data.iss_position.latitude;
 					var longitude = data.iss_position.longitude;

 					// Set new latitude and longitude values.
 					camera.setLatitude(latitude);
 					camera.setLongitude(longitude);
 					camera.setAltitude(1809273.5);

 					// Update the view in Google Earth.
 					ge.getView().setAbstractView(camera);
 				});
 			},5000);
}

function failureCallback(object) {
}

function initScreenOverlay() {
	// Create the ScreenOverlay
	var screenOverlay = ge.createScreenOverlay('');

	// Specify a path to the image and set as the icon
	var icon = ge.createIcon('');
	icon.setHref(document.URL + 'iss-view-sharper.png');
	screenOverlay.setIcon(icon);

	// Set the ScreenOverlay's position in the window
	//screenOverlay.getOverlayXY().setXUnits(ge.UNITS_PIXELS);
	//screenOverlay.getOverlayXY().setYUnits(ge.UNITS_PIXELS);
	//screenOverlay.getOverlayXY().setX(200);
	//screenOverlay.getOverlayXY().setY(100);

	// Set the overlay's size in pixels
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

