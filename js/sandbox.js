
var Venue = function (data) {
    this.id = data.id;
    this.loc = {lat: data.location.lat, lng: data.location.lng},
    this.address = data.location.formattedAddress;
    this.name = data.name;
    this.url = data.url;
    this.type = data.categories[0];
    this.stats = {checkins: data.stats.checkinsCount, verified: data.verified};
};

// ID I3N0JYKWCC5KANL2OJDPYSNSAULNFRT021AQXCI2IBDY31S2
// Secret F225UYTYIO0T2QKMRQW1AF5UFN4GJELFL4133KQPLJJ43F45

var map;

var VenueModel = {
    epicenter: ko.observable('47.56732,-122.632936'),
    locationList: ko.observableArray([]),
    currentLocation: ko.observable(),
    catObj: [
        {name: 'Food &amp; Restaurants', catId: '4d4b7105d754a06374d81259'},
        {name: 'Arts &amp; Entertainment', catId: '4d4b7104d754a06370d81259'},
        {name: 'Bars &amp; Lounges', catId: '4d4b7105d754a06376d81259'}
    ]
};

var MapControl = {
    init: function () {
        map = new Mapify();
        VenueView.update();
    }
};





var VenueView = {
    init: function () {
        map.placePins();
    },
    update: function () {
        map.placePins();
    }
};

var Mapify = function () {
    this.epicenter = VenueModel.epicenter().split(',');

    var mapLatLng = {lat: parseFloat(this.epicenter[0]), lng: parseFloat(this.epicenter[1])};

    var map = new google.maps.Map(document.getElementById('map'), {
        center: mapLatLng,
        zoom: 15
    });



    this.placePins = function () {

        VenueModel.locationList().forEach(function (data) {
            var marker = new google.maps.Marker({
                position: {lat: parseFloat(data.loc.lat), lng: parseFloat(data.loc.lng)},
                map: map,
                title: data.name
            });
        });

    };
};

/**
 * The brains of the project
 *
 * Built on Knockout.js
 */

// TODO: Initialize map using the preset neighborhood -> user can select another city
// TODO: Filters for places by type, rating, open now?
// TODO: Show locations on the map
// TODO: Click on location to bring up more information
// TODO: Animate markers on Click

// Model -> Location:  Generate a location object based on API results use Foursquarevenues....
// Model ->

var VenueControl = {
    update: function () {
        var vm = this;


    }

};

var Venue = function (data) {
    var self = this;

    self.id = data.id;
    self.loc = {lat: data.location.lat, lng: data.location.lng},
    self.address = data.location.formattedAddress;
    self.name = data.name;
    self.url = data.url;
    self.type = data.categories[0];
    self.stats = {checkins: data.stats.checkinsCount, verified: data.verified};
};

function VenueModel() {
    var self = this;

    self.epicenter = ko.observable('47.56732,-122.632936');

    self.availableItems = ko.observableArray();
    self.associatedItemIds = ko.observableArray();
    self.currentLocation = ko.observable();
    self.categories = ko.observableArray([
            {name: 'Food &amp; Restaurants', catId: '4d4b7105d754a06374d81259'},
            {name: 'Arts &amp; Entertainment', catId: '4d4b7104d754a06370d81259'},
            {name: 'Bars &amp; Lounges', catId: '4d4b7105d754a06376d81259'}
        ]);


    self.init = function () {
        var cats = [];

        self.catObj.forEach(function (obj) {
            cats.push(obj.catId);
        });

        this.url = {
            base: 'https://api.foursquare.com/v2/venues/search?client_id=I3N0JYKWCC5KANL2OJDPYSNSAULNFRT021AQXCI2IBDY31S2&client_secret=F225UYTYIO0T2QKMRQW1AF5UFN4GJELFL4133KQPLJJ43F45&v=20130815&ll=',
            client: VenueModel.epicenter,
            opts: '&radius=1000&intent=browse&categoryId=' + cats.join(',')
        };
        this.obj = null;

        this.fullUrl = ko.computed(function() {
            return this.url.base + this.url.client() + this.url.opts;
        }, this);


        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                obj = JSON.parse(xhr.responseText);

                if (obj.meta.code === 200) {
                    obj.response.venues.forEach(function (venueItem) {
                        var t = new Venue(venueItem);
                        self.availableItems.push(t);
                    });

                }
            }
        };

        xhr.open('GET', this.fullUrl(), true);
        xhr.send(null);
    };

    self.toggleAssociation = function (item) {

        if (item.Selected() === true) console.log("dissociate item " + item.catId());
        else console.log("associate item " + item.catId());
        item.Selected(!(item.Selected()));
        return true;
    };
}

var VenueModel = new VenueModel();
ko.applyBindings(VenueModel);
VenueModel.init();
