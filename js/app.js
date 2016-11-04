/**
 * The "brains" of the project
 *
 * Built on Knockout.js
 */

window.onload = function () {
    var menuLaunch = document.getElementById('burger');
    var sidebar = document.getElementById('sidebar');

    menuLaunch.addEventListener('click', toggleOpen);


    function toggleOpen() {
        if (menuLaunch.className.split(' ').indexOf('is-active') >= 0) {
            menuLaunch.className = menuLaunch.className.replace(' is-active', '');
            sidebar.className = sidebar.className.replace(' open', '');
        } else {
            menuLaunch.className += ' is-active';
            sidebar.className += ' open';
        }
    }
};

function CategoryItem(name, id) {
    var self = this;

    self.id = ko.observable(id);
    self.name = ko.observable(name);
    self.selected = ko.observable(false);
}

var Venue = function (data, category) {
    var self = this;

    self.id = data.id;
    self.loc = {lat: data.location.lat, lng: data.location.lng};
    self.name = data.name;
    self.group = category;
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
    self.marker = '';

};

var VenueDetail = function (data) {
    var self = this;

    self.address = data.location.formattedAddress[0] + '<br>' + data.location.formattedAddress[1];
    self.phone = data.contact.formattedPhone;
    self.description = data.description;
    if (data.hours !== undefined) {
        self.openStatus = data.hours.status;
    }
};

var viewModel = {
    categories:         ko.observableArray(),
    associatedItemIds:  ko.observableArray(),
    filteredList:       ko.observableArray(),
    locationSearch:     ko.observable('Bremerton'),
    cityName:           ko.observable(),
    epicenter:          [47.56732,-122.632936],
    availableItems:     ko.observableArray([]),
    venueMap:           {}
};

// 34234234: [1,2,3],

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
    getVenues: function () {
        var cats = '';

        var url = {
            base: 'https://api.foursquare.com/v2/venues/search?client_id=I3N0JYKWCC5KANL2OJDPYSNSAULNFRT021AQXCI2IBDY31S2&client_secret=F225UYTYIO0T2QKMRQW1AF5UFN4GJELFL4133KQPLJJ43F45&v=20130815&ll=',
            client: viewModel.epicenter.join(','),
            opts: '&radius=1000&intent=browse&categoryId='
        };

        for (var i = viewModel.categories().length - 1; i >= 0; i--) {
            var fullUrl = url.base + url.client + url.opts + viewModel.categories()[i].id();
            viewController.api(fullUrl, viewModel.categories()[i].id());
        }

    },
    googleError: function () {
        alert('Google Ran into a problem');
    },
    api: function (fullUrl, category) {

        $.ajax(fullUrl)
            .done(function (obj) {
                obj.response.venues.forEach(function (venueItem) {
                    var t = new Venue(venueItem, category);
                    t.details = ko.observable();
                    t.isSelected = ko.observable(false);
                    t.visible = ko.observable(true);

                    var marker = new google.maps.Marker({
                        position:   {lat: parseFloat(venueItem.location.lat), lng: parseFloat(venueItem.location.lng)},
                        map:        map,
                        title:      venueItem.name,
                        group:      category
                    });


                    google.maps.event.addListener(marker, 'click', function(){

                        viewController.venueDetail(t);
                        mapControl.toggleBounce(t);
                    });

                    t.marker = marker;


                    viewModel.availableItems.push(t);
                });
                // mapControl.update();
            })
            .fail(function (obj) {
                alert('We couldn\'t get the venues.  Try again later');
                console.log(':: ERROR :: ', obj);
        });

    },
    updateVenues: function () {
        if (viewModel.filteredList().length > 0) {
            for (var i = viewModel.availableItems().length - 1; i >= 0; i--) {
                if (viewModel.filteredList().indexOf(viewModel.availableItems()[i].group) >= 0) {

                    viewModel.availableItems()[i].marker.setVisible(true);
                    viewModel.availableItems()[i].visible(true);

                } else {
                    viewModel.availableItems()[i].marker.setVisible(false);
                    viewModel.availableItems()[i].visible(false);
                }
            }
        } else {
            viewModel.availableItems().forEach(function (v, i) {
                viewModel.availableItems()[i].marker.setVisible(true);
                viewModel.availableItems()[i].visible(true);
            });
        }


    },
    venueDetail: function (venue) {
        if (infowindow !== undefined) {
            infowindow.close();
        }

        if (venue.details() === undefined) {
            url = 'https://api.foursquare.com/v2/venues/' + venue.id + '?client_id=I3N0JYKWCC5KANL2OJDPYSNSAULNFRT021AQXCI2IBDY31S2&client_secret=F225UYTYIO0T2QKMRQW1AF5UFN4GJELFL4133KQPLJJ43F45&v=20130815';

            $.ajax(url)
                .done(function (obj) {
                    var infowindowContent = '';
                    venue.details(new VenueDetail(obj.response.venue));
                    sideBar.showDetail(venue);
                })
                .fail(function (obj) {
                    alert('We couldn\'t get the details of this venue.  Try again later');
                    console.log(':: ERROR :: ', obj);
            });

        } else {
            sideBar.showDetail(venue);
        }




    }
};

var sideBar = {
    click: function () {
        var idx = viewModel.availableItems().indexOf(this);
        if (infowindow !== undefined) {
            infowindow.close();
        }
        viewController.venueDetail(viewModel.availableItems()[idx]);
        mapControl.toggleBounce(viewModel.availableItems()[idx]);

    },
    showDetail: function (venue) {
        var infowindowContent = '';
        var sidebarItems = document.getElementsByClassName('venue-item');

        for (var i = sidebarItems.length - 1; i >= 0; i--) {
            sidebarItems[i].className = sidebarItems[i].className.replace(' is-active', '');
        }

        for(var index in venue.details()) {

           if (venue.details().hasOwnProperty(index)) {
               var attr = venue.details()[index];
               if (attr !== undefined) {
                    infowindowContent += '<p>' + attr + '</p>';
               }
           }
        }

        infowindow = new google.maps.InfoWindow({
            content: '<h2 class="infowindow-title">' + venue.name + '</h2>' + infowindowContent,
            maxWidth: 300
        });

        infowindow.open(map, venue.marker);

        document.getElementById(venue.id).scrollIntoView();
        document.getElementById(venue.id).className += ' is-active';
    }
};

var mapControl = {

    init: function () {

        var mapLatLng = {lat: parseFloat(viewModel.epicenter[0]), lng: parseFloat(viewModel.epicenter[1])};

        map = new google.maps.Map(document.getElementById('map'), {
            center: mapLatLng,
            zoom: 15
        });
        geocoder = new google.maps.Geocoder();
        viewController.getVenues();

    },

    update: function () {
        var marker;

        viewModel.availableItems().forEach(function (data, i) {
            marker = new google.maps.Marker({
                position:   {lat: parseFloat(data.loc.lat), lng: parseFloat(data.loc.lng)},
                map:        map,
                title:      data.name,
                group:      data.group
            });

            viewModel.availableItems()[i].marker = marker;

            google.maps.event.addListener(marker, 'click', function(){
                viewController.venueDetail(i);
                mapControl.toggleBounce(i);
            });
        });

    },
    toggleBounce: function (venue) {
        venue.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
            venue.marker.setAnimation(null);
        }, 750);
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