google.load("earth", "1");
   
var ge = null;


function init() {
	google.earth.createInstance("map-canvas", initCallback, failureCallback);

	if(!google.earth.isInstalled()) {
		$('#ISSView').hide();
	}
}

function initCallback(object) {
	ge = object;
	ge.getWindow().setVisibility(true);
	//     INITIAL_CAMERA_ALTITUDE = 809273.5;
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	camera.setTilt(camera.getTilt() + 43);
	camera.setRoll(camera.getRoll() + -15);

 
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
 			},1000);
}

function failureCallback(object) {
}

