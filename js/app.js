// function to hide or show the sidebar when the user clicks the menu button
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("content").classList.toggle("active");
}

var locations = [
    {
        name: 'Hawaiian Falls',
        address: '4400 Paige Rd, The Colony, TX 75056',
        lat: 33.0773723,
        lon: -96.875303
    },
    {
        name: 'Reunion Tower',
        address: '300 Reunion Blvd E, Dallas, TX 75207',
        lat: 32.7757814,
        lon: -96.8092789
    },
    {
        name: 'John F. Kennedy Memorial Plaza',
        address: '646 Main St, Dallas, TX 75202',
        lat: 32.7790594,
        lon: -96.8063683
    },
    {
        name: 'Fort Worth Zoo',
        address: '1989 Colonial Pkwy, Fort Worth, TX 76110',
        lat: 32.7210991,
        lon: -97.3560308
    },
    {
        name: 'The Dallas Arboretum and Botanical Gardens',
        address: '8525 Garland Rd, Dallas, TX 75218',
        lat: 32.8211836,
        lon: -96.7167133
    }];
        
var Location = function(data, auxIndex){
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.address);
    this.lat = ko.observable(data.lat);
    this.lon = ko.observable(data.lon);
    // yelp information filled with a placeholder until AJAX call response
    this.yelpUrl = ko.observable("Loadind Yelp...");
    this.yelpReviewCount = ko.observable("Loadind Yelp...");
    this.yelpRating = ko.observable("Loadind Yelp...");
    // auxIndex is to preserve the index before the filter is applied
    this.auxIndex = auxIndex;
};

var map;
var markers = [];
// this variable will store the viewModel for easy access
var myVm;

// This function shows an error message if Google Maps API fails to load.
function googleMapsError() {
    document.getElementById("map").innerHTML = '<div class="alert alert-danger gmap-error" role="alert">' +
    'Failed to load Google Maps API</div>';
}

// This function initialize the MAP if Google API call is successful
function initMap() {
    // Create a styles array to use with the map.
    var styles = [
        {
            featureType: 'water',
            stylers: [
            { color: '#19a0d8' }
            ]
        },{
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
            { color: '#ffffff' },
            { weight: 6 }
            ]
        },{
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
            { color: '#e85113' }
            ]
        },{
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
            { color: '#efe9e4' },
            { lightness: -40 }
            ]
        },{
            featureType: 'transit.station',
            stylers: [
            { weight: 9 },
            { hue: '#e85113' }
            ]
        },{
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
            { visibility: 'off' }
            ]
        },{
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
            { lightness: 100 }
            ]
        },{
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
            { lightness: -100 }
            ]
        },{
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
            { visibility: 'on' },
            { color: '#f0e4d3' }
            ]
        },{
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
            { color: '#efe9e4' },
            { lightness: -25 }
            ]
        }
    ];
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 32.7757814, lng: -96.8092789},
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    // viewModel stored in a variable for easy access
    myVm = new ViewModel(map);

    //ko.applyBindings(new ViewModel(map));
    ko.applyBindings(myVm);
}

function createMarker(map, location, index) {
    // This function takes in a COLOR, and then creates a new marker
    // icon of that color. The icon will be 21 px wide by 34 high, have an origin
    // of 0, 0 and be anchored at 10, 34).
    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
        return markerImage;
    }
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('ee0000');
    // I pre-fill the infoWindow of all markers because is a short list of locations
    // Yelp info is filled with a placeholder until Yelp AJAX response
    var infoWindowContent = "<div class='info-window'>" + location.name() + "<br>" + 
                    "<span>Yelp rating: Loading Yelp...</span><br>" +
                    "<span>Yelp reviews: Loading Yelp...</span></div>";
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat(), location.lon()),
        title: location.name(),
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        infoWindow: new google.maps.InfoWindow({
                        content: infoWindowContent, 
                        maxWidth:150
                    }),
        id: index
    });
    // make the marker bounce and show its infoWindow when
    // the user clicks it
    google.maps.event.addListener(marker, 'click', function() {
        markerBounce(this);
        showInfoWindow(map, this);
        myVm.currentFilteredLocation(myVm.locationList()[this.id]);
    });
    // Push the marker to our array of markers.
    markers.push(marker);
}

// this function shows the infoWindow of a marker.
// to save coding time I don't hide the other infoWindows
// because is not a requirement of the project
function showInfoWindow(map, marker) {
    marker.infoWindow.open(map, marker);
}

// this function makes the marker bounce for 2 seconds
function markerBounce(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 2000);
}

function showMarkers() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// viewmodel is the octopus
var ViewModel = function(map, infoWindow) {
    var self = this;
    this.locationList = ko.observableArray([]);
    this.filterString = ko.observable("");
    // create locationList and fill name, address, lat and lon
    locations.forEach(function(locationItem, index){
        self.locationList.push( new Location(locationItem, index) );
    });
    // create markers
    ko.utils.arrayForEach(self.locationList(), function(locationItem, index) {
        createMarker(map, locationItem, index);
    });

    showMarkers();

    // Computed KO array with the filtered locations, 
    // also filters the markers but the markers are not a KO object
    this.filteredLocations = ko.computed(function() {
        var filter = self.filterString().toLowerCase();
        // If filterString field is empty then return all locations and show them in the map
        // else return matching locations in sidebar and show only matching locations in the map
        if (!filter) {
            // Make all markers visible in the map
            markers.forEach(function(marker) {
                marker.setVisible(true);
            });
            return self.locationList();
        } else {
            return ko.utils.arrayFilter(self.locationList(), function(locationItem, index) {
                var locationFound = locationItem.name().toLowerCase().indexOf(filter) !== -1;
                // Show matching locations and hide the rest in the map 
                // The markers index is the same as the location index
                if (locationFound) {
                    markers[index].setVisible(true);
                } else {
                    markers[index].setVisible(false);
                    // Hides the infoWindow if the marker is filtered out
                    markers[index].infoWindow.close();
                }
                return locationFound;
            });
        }
    });
    // location info DOM filled only after user clicks a location
    this.currentFilteredLocation = ko.observable();
    // fill LocationList Yelp info for a given location and marker,
    // the marker is identified by the index
    function getYelpInfo(locationAJAX, index) {
        // Yelp API V3 doesnt accept AJAX calls when running from the file system,
        // not even using Jsonp. For that reason cors-anywhere.herokuapp.com 
        // is required to run from file system
        var cors_anywhere_url = 'https://cors-anywhere.herokuapp.com/';
        var yelp_url = "https://api.yelp.com/v3/businesses/search?term=" + 
                    encodeURI(locationAJAX.name()) +
                    "&location=" + encodeURI(locationAJAX.address()) + "&limit=1";
        var settings = {
            async: true,
            crossDomain: true,
            url: cors_anywhere_url + yelp_url,
            method: "GET",
            headers: {
              "Authorization": "Bearer YOUR-AUTHORIZAION-KEY-HERE",
              "cache-control": "no-cache",
              "postman-token": "01bb64c4-0b04-b2d8-c3a8-64f0f62860a2"
            }
        };
        $.ajax(settings)
        .done(function (response) {
            // refresh viewModel and markers Yelp info
            locationAJAX.yelpRating = response.businesses[0].rating;
            locationAJAX.yelpReviewCount = response.businesses[0].review_count;
            locationAJAX.yelpUrl = response.businesses[0].url;
            var infoWindowContent = "<div class='info-window'>" + locationAJAX.name() + "<br>" + 
                                "<span>Yelp rating: " + locationAJAX.yelpRating + "</span><br>" +
                                "<span>Yelp reviews: " + locationAJAX.yelpReviewCount + "</span><br>" +
                                "<a class='info-window-link' href=" + locationAJAX.yelpUrl + " target='_blank'>See in Yelp...</a></div>";
            markers[index].infoWindow.setContent(infoWindowContent);
        })
        .fail(function (response) {
            // refresh viewModel and markers Yelp info
            locationAJAX.yelpRating = "Failed to load Yelp";
            locationAJAX.yelpReviewCount = "Failed to load Yelp";
            locationAJAX.yelpUrl = "Failed to load Yelp";
            var infoWindowContent = "<div class='info-window'>" + locationAJAX.name() + "<br>" + 
                                "<span>Failed to load Yelp</span></div>";
            markers[index].infoWindow.setContent(infoWindowContent);
        });
    }

    // fills the yelp info for all locations and markers
    ko.utils.arrayForEach(self.locationList(), function(locationItem, index) {
        getYelpInfo(locationItem, index);
    });

    this.setFilteredLocation = function(data){
        // knockout 3.4.2 currently has a bug that swaps the value of index and data
        // when the respective DOM is clicked and data + index are passed to a function
        self.currentFilteredLocation(data);
        markerBounce(markers[data.auxIndex]);
        showInfoWindow(map, markers[data.auxIndex]);
    };
};