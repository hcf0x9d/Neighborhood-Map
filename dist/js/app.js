/**
 * The brains of the project
 *
 * Built on Knockout.js
 */


function CategoryItem(name, id) {
    var self = this;

    self.id = ko.observable(id);
    self.name = ko.observable(name);
    self.selected = ko.observable(false);
}

var Venue = function (data) {
    var self = this;

    self.id = data.id;
    self.loc = {lat: data.location.lat, lng: data.location.lng},
    self.name = data.name;
    if (data.categories.length !== 0) {
        self.type = data.categories[0];
    } else {
        self.type = {name: ''};
    }

    if (data.categories[0] !== undefined) {
        self.img = data.categories[0].icon.prefix + '32' + data.categories[0].icon.suffix;

    } else {
        self.img = '';
    }
    self.details = '';
};

var VenueDetail = function (data) {
    var self = this;

    self.address = data.location.formattedAddress[0] + '<br>' + data.location.formattedAddress[1];
    self.phone = data.contact.formattedPhone;
    self.description = data.description;
    if (data.hours !== undefined) {
        self.open = {isOpen: data.hours.isOpen, openStatus: data.hours.status};
    }
    if (data.page !== undefined) {
        self.url = data.page.pageInfo.links.items[0]; // access .url
    }

};

var viewModel = {
    categories:         ko.observableArray(),
    associatedItemIds:  ko.observableArray(),
    filteredList:       ko.observableArray(),
    locationSearch:     ko.observable('Bremerton'),
    cityName:           ko.observable(),
    epicenter:          [47.56732,-122.632936],
    markersArray:       ko.observableArray([]),
    availableItems:     ko.observableArray([]),
};

var infowindow;
var viewController = {
    init: function () {
        viewModel.categories.push(new CategoryItem('Food & Restaurants', '4d4b7105d754a06374d81259'));
        viewModel.categories.push(new CategoryItem('Arts & Entertainment', '4d4b7104d754a06370d81259'));
        viewModel.categories.push(new CategoryItem('Bars & Lounges', '4d4b7105d754a06376d81259'));
    },
    toggleAssociation: function (item) {
        if (item.selected() === true) {
            viewModel.filteredList.remove(item.id());
        } else {
            viewModel.filteredList.push(item.id());
        }
        viewController.updateVenues();
        item.selected(!(item.selected()));
        return true;
    },
    updateVenues: function () {
        var cats = '';

        for (var i = viewModel.filteredList().length - 1; i >= 0; i--) {
            cats += viewModel.filteredList()[i] + ',';
        }

        var url = {
            base: 'https://api.foursquare.com/v2/venues/search?client_id=I3N0JYKWCC5KANL2OJDPYSNSAULNFRT021AQXCI2IBDY31S2&client_secret=F225UYTYIO0T2QKMRQW1AF5UFN4GJELFL4133KQPLJJ43F45&v=20130815&ll=',
            client: viewModel.epicenter.join(','),
            opts: '&radius=1000&intent=browse&categoryId=' + cats
        };

        var obj = null;

        var fullUrl = function() {
            return url.base + url.client + url.opts;
        };


        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {

            if (xhr.readyState == XMLHttpRequest.DONE) {
                obj = JSON.parse(xhr.responseText);

                viewModel.availableItems([]);

                if (obj.meta.code === 200) {
                    obj.response.venues.forEach(function (venueItem) {
                        var t = new Venue(venueItem);
                        t.details = ko.observable();
                        t.isSelected = ko.observable(false);
                        viewModel.availableItems.push(t);
                    });
                    mapControl.update();
                }

            }
        };
        xhr.open('GET', fullUrl(), true);
        xhr.send(null);
    },
    venueDetail: function (idx) {
        if (infowindow !== undefined) {
            infowindow.close();
        }
        infowindow = new google.maps.InfoWindow({
            content: viewModel.availableItems()[idx].name
        });

        infowindow.open(map, viewModel.markersArray()[idx]);

        if (viewModel.availableItems()[idx].details() === undefined) {
            url = 'https://api.foursquare.com/v2/venues/' + viewModel.availableItems()[idx].id + '?client_id=I3N0JYKWCC5KANL2OJDPYSNSAULNFRT021AQXCI2IBDY31S2&client_secret=F225UYTYIO0T2QKMRQW1AF5UFN4GJELFL4133KQPLJJ43F45&v=20130815';
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {

                if (xhr.readyState == XMLHttpRequest.DONE) {
                    obj = JSON.parse(xhr.responseText);

                    if (obj.meta.code === 200) {
                        viewModel.availableItems()[idx].details(new VenueDetail(obj.response.venue));

                        sideBar.showDetail(idx);
                    }

                    var list = document.getElementById('venue-list');


                }
            };
            xhr.open('GET', url, true);
            xhr.send(null);
        } else {
            sideBar.showDetail(idx);
        }




    }
};

var sideBar = {
    update: function () {

        for (var i = 0; i < viewModel.availableItems().length; i++) {

            // console.log(viewModel.availableItems()[i].id);
        }
    },
    click: function () {
        var idx = viewModel.availableItems().indexOf(this);
        if (infowindow !== undefined) {
            infowindow.close();
        }
        viewController.venueDetail(idx);

    },
    showDetail: function (idx) {
        viewModel.availableItems().forEach(function (item) {
            item.isSelected(false);
        });
        viewModel.availableItems()[idx].isSelected(true);
        document.getElementById(viewModel.availableItems()[idx].id).scrollIntoView();
        // console.log(viewModel.availableItems()[idx].id);
    }
};

var mapControl = {

    init: function () {

        var mapLatLng = {lat: parseFloat(viewModel.epicenter[0]), lng: parseFloat(viewModel.epicenter[1])};

        map = new google.maps.Map(document.getElementById('map'), {
            center: mapLatLng,
            zoom: 16
        });
        geocoder = new google.maps.Geocoder();
        viewController.updateVenues();

    },

    update: function () {
        var marker;
        google.maps.Map.prototype.clearOverlays = function() {
          for (var i = 0; i < viewModel.markersArray().length; i++ ) {
            viewModel.markersArray()[i].setMap(null);
          }
          viewModel.markersArray([]);
        };

        map.clearOverlays();

        viewModel.availableItems().forEach(function (data, i) {
            marker = new google.maps.Marker({
                position:   {lat: parseFloat(data.loc.lat), lng: parseFloat(data.loc.lng)},
                map:        map,
                title:      data.name
            });

            viewModel.markersArray().push(marker);

            google.maps.event.addListener(marker, 'click', function(){
                viewController.venueDetail(i);
            });
        });

        sideBar.update();

    },

    search: function (value) {

        geocoder.geocode( {address: value}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                // viewModel.cityName(results[0].address_components[0].short_name);
                viewModel.epicenter = [];
                viewModel.epicenter.push(results[0].geometry.location.lat());
                viewModel.epicenter.push(results[0].geometry.location.lng());
                viewModel.locationSearch(results[0].address_components[0].short_name);
                viewController.updateVenues();
            }
        });
    }
};

ko.applyBindings(viewModel);
viewController.init();

viewModel.locationSearch.subscribe(function(newValue) {
    mapControl.search(newValue);
});