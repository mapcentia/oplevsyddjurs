/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {*|exports|module.exports}
 */
var switchLayer;

/**
 *
 * @type {*|exports|module.exports}
 */
var backboneEvents;

/**
 *
 * @type {*|exports|module.exports}
 */
var meta;

var prettyUnits = require("pretty-units");

var featuresWithKeys = {};

var handlebars = require('handlebars');

var showdown = require('showdown');

var converter = new showdown.Converter();

var position;

var vectorLayers;

var features = [];

var tripLayer = L.geoJson(null, {
    color: '#888888',
    opacity: 0.5
});

var highLightLayer = new L.FeatureGroup();

var React = require('react');

var ReactDOM = require('react-dom');

var urlparser = require('./../../../browser/modules/urlparser');

var urlVars = urlparser.urlVars;

var todoItems = [];

var googleUrl;

var taxPlaces = {};

var metaDataKeys;

var iconUrl = "https://webkort.syddjurs.dk/images/custom/map-icons/";

var icons = [];

var jRespond = require('jrespond');

handlebars.registerHelper('checklength', function (v1, v2, options) {
    'use strict';
    // if (v1.length > v2) {
    //     return options.fn(this);
    // }
    // return options.inverse(this);
});

var source1 =
    '<h1>{{{title}}}</h1>' +
    '<div>{{{text}}}</div>' +
    '<div id="myCarousel" class="carousel slide" data-ride="carousel">' +

    '{{#checklength images 1}}' +

    '<ol class="carousel-indicators">' +
    '{{#images}}' +
    '<li data-target="#myCarousel" data-slide-to="{{@index}}"  class="{{#if @first}}active{{/if}}"></li>' +
    '{{/images}}' +
    '</ol>' +

    '<div class="carousel-inner" role="listbox">' +
    '{{#images}}' +
    '<div class="item {{#if @first}}active{{/if}}">' +
    '<img style="width: 100%" src="https://s3-eu-west-1.amazonaws.com/mapcentia-www/vmus/{{.}}" alt="">' +
    '<div class="carousel-caption">' +
    //'<p>{{[1]}}</p>' +
    '</div>' +
    '</div>' +
    '{{/images}}' +
    '</div>' +
    '<a class="left carousel-control" href="#myCarousel" role="button" data-slide="prev">' +
    '<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' +
    '<span class="sr-only">Previous</span>' +
    '</a>' +
    '<a class="right carousel-control" href="#myCarousel" role="button" data-slide="next">' +
    '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
    '<span class="sr-only">Next</span>' +
    '</a>' +
    '</div>' +

    '{{else}}' +
    '<img style="width: 100%" src="https://s3-eu-west-1.amazonaws.com/mapcentia-www/vmus/{{images.[0]}}" alt="">' +

    '{{/checklength}}';

var sourceShare =
    '<div id="share-buttons" style="text-align: center" class="bs-component btn-group-sm">' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="facebook" data-poi-id="{{id}}"><i class="material-icons fa fa-facebook"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="twitter" data-poi-id="{{id}}"><i class="material-icons fa fa-twitter"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-todo-id="{{uuid}}"><i class="material-icons">directions</i></a>' +
    '</div>' +

    '<script>' +
    'window.disqus_config = function () {' +
    'this.page.url = "https://vidi.mapcentia.com/app/vmus?poi={{id}}";' +
    'this.page.identifier = "{{id}}"' +
    '};' +
    '</script>' +

    '<div id="disqus_thread"></div>';

var template1 = handlebars.compile(source1);

var templateShare = handlebars.compile(sourceShare);

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */
module.exports = module.exports = {
    set: function (o) {
        cloud = o.cloud;
        switchLayer = o.switchLayer;
        meta = o.meta;
        backboneEvents = o.backboneEvents;
        vectorLayers = o.extensions.vectorLayers.index;
        return this;
    },
    init: function () {

        var parent = this, layerName, metaData, i, styleFn;

        parent.getTaxPlaces();

        cloud.get().map.addLayer(tripLayer);
        cloud.get().map.addLayer(highLightLayer);

        // Disable automatic creation of layer tree. We need to set "On" functions first
        vectorLayers.setAutomatic(false);

        backboneEvents.get().on("ready:meta", function () {

            metaDataKeys = meta.getMetaDataKeys();
            metaData = meta.getMetaData();

            for (i = 0; i < metaData.data.length; ++i) {

                if (JSON.parse(metaData.data[i].meta) !== null && typeof JSON.parse(metaData.data[i].meta).usetiles !== "undefined" && JSON.parse(metaData.data[i].meta).usetiles === true) {
                    layerName = metaData.data[i].f_table_schema + "." + metaData.data[i].f_table_name;
                } else {
                    layerName = "v:" + metaData.data[i].f_table_schema + "." + metaData.data[i].f_table_name;
                }

                if (JSON.parse(metaData.data[i].meta) !== null && typeof JSON.parse(metaData.data[i].meta).vectorstyle !== "undefined") {
                    try {
                        styleFn = eval("(" + JSON.parse(metaData.data[i].meta).vectorstyle + ")");
                    } catch (e) {
                        console.error(styleFn);
                        console.error(e.message);
                        styleFn = function () {
                        };
                    }
                }

                vectorLayers.setOnEachFeature(layerName, function (feature, layer) {
                    layer.on("click", function () {
                        parent.createInfoContent(feature.properties.uuid);
                    });
                });

                vectorLayers.setOnLoad(layerName, function (store) {

                    features = store.geoJSON.features;

                    $.each(store.geoJSON.features, function (i, v) {

                        featuresWithKeys[v.properties.uuid] = v.properties;
                        featuresWithKeys[v.properties.uuid].geometry = v.geometry;

                    });

                    // Open POI if any
                    if (urlVars.poi !== undefined) {

                        var parr = urlVars.poi.split("#");
                        if (parr.length > 1) {
                            parr.pop();
                        }

                        parent.createInfoContent(parr.join());
                    }

                });

                vectorLayers.setOnSelect(layerName, function (id, layer) {

                    parent.createInfoContent(layer.feature.properties.uuid);

                });

                vectorLayers.setOnMouseOver(layerName, _.debounce(function (id, layer) {

                    var p = new R.Pulse(
                        [layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]],
                        30,
                        {'stroke': 'none', 'fill': 'none'},
                        {'stroke': '#30a3ec', 'stroke-width': 3}
                    );

                    cloud.get().map.addLayer(p);

                    setTimeout(function () {
                        cloud.get().map.removeLayer(p);
                    }, 800);

                }, 250));

                vectorLayers.setCM(layerName,
                    [
                        {
                            header: "Titel",
                            dataIndex: "navn",
                            sortable: true
                        }
                    ]
                );

                vectorLayers.setStyle(layerName, styleFn);

                try {
                    icons[layerName] = iconUrl + JSON.parse(metaDataKeys[layerName.split(":")[1]].meta).oplev_ikon;
                } catch (e) {

                }

                vectorLayers.setPointToLayer(layerName, function (ln, feature, latlng) {

                        return L.marker(latlng, {
                            icon: L.ExtraMarkers.icon({
                                innerHTML: "<img style='width: 20px; top: 8px; position: relative;' src='" + icons[ln] + "'>",
                                //number: 'V',
                                markerColor: 'black',
                                shape: 'circle',
                                prefix: 'fa',
                                iconColor: "#fff",
                                //innerHTML: '<svg width="20" height="30"> <circle cx="10" cy="15" r="10" stroke="green" stroke-width="1" fill="yellow" /> </svg>'
                            })
                        });
                    }.bind(this, layerName)
                );
            }

            backboneEvents.get().on("ready:vectorLayers", function () {
                // vectorLayers.switchLayer(layerName, true);
            });

            vectorLayers.createLayerTree();

            var vPanel = $('[id^="vectorlayer-panel"]');

            var jRes = jRespond([
                {
                    label: 'handheld',
                    enter: 0,
                    exit: 767
                },
                {
                    label: 'desktop',
                    enter: 768,
                    exit: 10000
                }
            ]);
            jRes.addFunc({
                breakpoint: ['handheld'],
                enter: function () {
                    console.log("Enter handheld");
                    $("#burger-btn").css("display", "block");
                    $(".slide-left").css("display", "block");
                    $("#vectorlayers").append(vPanel);
                    vPanel.css("float", "none");
                    vPanel.css("margin-left", "0");
                    vPanel.css("width", "100%");
                    $("[id^='vectorcollapse']").css("max-height", "none");
                    $("[id^='vectorcollapse']").css("overflow", "hidden");
                },
                exit: function () {
                    console.log("Exit handheld");

                }
            });
            jRes.addFunc({
                breakpoint: ['desktop'],
                enter: function () {
                    console.log("Enter desktop");
                    $("#burger-btn").css("display", "none");
                    $(".slide-left").css("display", "none");
                    $("#desktop-menu-container").append(vPanel);
                    vPanel.css("float", "left");
                    vPanel.css("margin-left", "20px");
                    vPanel.css("width", "250px");
                    $("[id^='vectorcollapse']").css("max-height", "calc(100vh - 50px)");

                    $("[id^='vectorcollapse']").on('mouseenter touchstart', function () {
                        $(this).css("overflow", "auto");
                    });

                    $("[id^='vectorcollapse']").on('mouseleave touchend', function () {
                        $(this).css("overflow", "hidden");
                    });

                },
                exit: function () {
                    console.log("Exit desktop");

                }
            });

        });

        try {
            ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));
        } catch (e) {
        }

        $("#locale-btn").append($(".leaflet-control-locate"));

    },

    createInfoContent: function (id) {

        console.log(id);
        console.log(featuresWithKeys[id]);
        console.log(taxPlaces);

        featuresWithKeys[id].text = (featuresWithKeys[id].beskrivels);
        featuresWithKeys[id].title = featuresWithKeys[id].title;
        //featuresWithKeys[id].images = featuresWithKeys[id].billeder;

        var html = template1(featuresWithKeys[id]);

        var htmlShare = templateShare(featuresWithKeys[id]);

        $("#click-modal").modal({});
        $("#click-modalLabel").html(featuresWithKeys[id].navn);
        $("#click-modal .modal-body").html(html);


        // DISQUS setup
        // ============

        /*if (typeof DISQUS === "undefined") {
            var d = document, s = d.createElement("script");
            s.src = "https://vidi-mapcentia-com.disqus.com/embed.js";
            s.setAttribute("data-timestamp", +new Date());
            (d.head || d.body).appendChild(s);
        }

        (function poll() {
            if (typeof DISQUS !== "undefined") {
                DISQUS.reset({
                    reload: true,
                    config: function () {
                        this.page.identifier = "" + id;
                        this.page.url = "https://vidi.mapcentia.com/app/vmus?poi=" + id;
                    }
                });
            } else {
                setTimeout(function () {
                    poll();
                }, 100)
            }

        })();*/

    },

    getTaxPlaces: function () {
        $.ajax({
            dataType: 'json',
            url: "/api/extension/oplevsyddjurs",
            type: "GET",
            success: function (data) {
                //console.log(data);

                data["tax-places"].map(function (v, i) {
                    // console.log(v);
                    taxPlaces[v.place["Term ID"]] = v.place;
                });

                //console.log(taxPlaces);


            },
            error: function (error) {
                console.error(error.responseJSON);

            }

        });
    },

    updateTodo: function (id, add) {
        todoItems.push({
            index: 3,
            value: featuresWithKeys[id].navn,
            done: false,
            geometry: featuresWithKeys[id].geometry
        });

        createOsrmTripUrl(todoItems)

            .then(
                function (res) {
                    return addTripLayer(res.url);
                },
                function () {
                    console.log(res);
                })

            .then(
                function (res) {
                    console.log(res);
                },
                function () {
                    console.log(res);
                });

        try {
            ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));
        } catch (e) {
        }

        return true;
    }
};

/**
 * Builds a OSRM Trip URL from array array of GeoJSON point geometries
 * First point is the geolocation
 * @param arr
 * @returns {Promise}
 */
var createOsrmTripUrl = function (arr) {

    console.log(arr);

    tripLayer.clearLayers();
    highLightLayer.clearLayers();

    return new Promise(function (resolve, reject) {


        var coords = arr.map(function (e) {

            var color = e.done ? "#00ff33" : "#ff0033";
            L.circleMarker([e.geometry.coordinates[1], e.geometry.coordinates[0]], {
                fillColor: color,
                fillOpacity: 0.2,
                stroke: false,
                radius: 20,
            }).addTo(highLightLayer);

            L.circleMarker([e.geometry.coordinates[1], e.geometry.coordinates[0]], {
                fillColor: color,
                fillOpacity: 0.4,
                stroke: false,
                radius: 10,
            }).addTo(highLightLayer);


            return e.geometry.coordinates[0] + "," + e.geometry.coordinates[1];
        });

        var coordsR = arr.map(function (e) {

            return e.geometry.coordinates[1] + "," + e.geometry.coordinates[0];

        });


        if ("geolocation" in navigator) {

            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var crd = pos.coords;

                    // Add home marker
                    L.marker([crd.latitude, crd.longitude], {
                        icon: L.AwesomeMarkers.icon({
                                icon: 'home',
                                markerColor: '#C31919',
                                prefix: 'fa'
                            }
                        )
                    }).addTo(tripLayer);

                    console.log('Your current position is:');
                    console.log(`Latitude : ${crd.latitude}`);
                    console.log(`Longitude: ${crd.longitude}`);
                    console.log(`More or less ${crd.accuracy} meters.`);

                    coords.unshift(crd.longitude + "," + crd.latitude);

                    if (coords.length > 1) {

                        googleUrl = "https://www.google.com/maps/dir/?api=1&origin=" + crd.latitude + "," + crd.longitude + "&destination=" + crd.latitude + "," + crd.longitude + "&waypoints=" + coordsR.join("|");

                        console.log(googleUrl);

                        resolve(
                            {
                                url: "https://router.project-osrm.org/trip/v1/driving/" + coords.join(";") + "?overview=simplified&steps=false&hints=;&geometries=geojson",
                                success: true
                            })
                    } else {
                        reject({
                            code: 1,
                            message: "Less than two points"
                        });
                    }
                },

                function () {
                    reject({
                        code: 2,
                        message: "ERROR"
                    });
                },

                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                },
            );

        } else {


        }
    })
};

/**
 * Fetches the GeoJSON from OSRM and add it to Leaflet
 * @param url
 * @returns {Promise}
 */
var addTripLayer = function (url) {

    return new Promise(function (resolve, reject) {

        if (!url) {
            reject({
                message: "No URL"
            });
        }

        $.getJSON(url, function (data) {

            tripLayer.addData(data.trips[0].geometry);
            resolve({
                message: "Trip added to map"
            })


        }).fail(function () {
            reject({
                message: "Trip NOT added to map"
            });

        })
    })
};

class TodoList extends React.Component {
    render() {
        var items = this.props.items.map((item, index) => {
            return (
                <TodoListItem key={index} item={item} index={index} removeItem={this.props.removeItem}
                              markTodoDone={this.props.markTodoDone}/>
            );
        });
        return (
            <ul className="list-group"> {items} </ul>
        );
    }
}

class TodoListItem extends React.Component {
    constructor(props) {
        super(props);
        this.onClickClose = this.onClickClose.bind(this);
        this.onClickDone = this.onClickDone.bind(this);
    }

    onClickClose() {
        var index = parseInt(this.props.index);
        this.props.removeItem(index);
    }

    onClickDone() {
        var index = parseInt(this.props.index);
        this.props.markTodoDone(index);
    }

    render() {
        var todoClass = this.props.item.done ?
            "done" : "undone";
        return (
            <li className="list-group-item">
                <div className={todoClass}>
                    <span className="glyphicon glyphicon-ok icon" aria-hidden="true" onClick={this.onClickDone}></span>
                    {this.props.item.value}
                    <button type="button" className="close" onClick={this.onClickClose}>&times;</button>
                </div>
            </li>
        );
    }
}

class TodoHeader extends React.Component {
    render() {
        return <p>Hvis du er interesseret i at besøge en seværdig, så klik i info-vinduet på <i
            className="material-icons inherit-size">directions</i> knappen. Så kommer seværdigen på listen. Kortet vil
            foreslå en rute du kan tage rundt til de forskellige seværdiger. God tur!</p>
    }
}

class TodoUpdateRouteBtn extends React.Component {
    constructor(props) {
        super(props);
        this.fullWidth = {
            width: "100%"
        };
    }

    render() {
        return <button className="btn btn-raised btn-default" style={this.fullWidth} onClick={function () {
            createOsrmTripUrl(todoItems)

                .then(
                    function (res) {
                        console.log(res);
                        return addTripLayer(res.url);
                    },
                    function (res) {
                        console.log(res);
                        if (res.code === 1) {
                            tripLayer.clearLayers();
                        }
                        return;
                    }
                )

                .then(
                    function (res) {
                        console.log(res);
                    },
                    function (res) {
                        console.log(res);
                    });
        }}>Opdaterer den foreslået rute</button>
    }
}

class TodoGoogleLink extends React.Component {
    render() {
        return <a target="_blank" href={googleUrl}>Google Maps</a>
    }
}

class TodoApp extends React.Component {
    constructor(props) {
        super(props);
        this.addItem = this.addItem.bind(this);
        this.removeItem = this.removeItem.bind(this);
        this.markTodoDone = this.markTodoDone.bind(this);
        this.state = {todoItems: todoItems};
    }

    addItem(todoItem) {
        todoItems.unshift({
            index: todoItems.length + 1,
            value: todoItem.newItemValue,
            done: false
        });
        this.setState({todoItems: todoItems});
    }

    removeItem(itemIndex) {
        todoItems.splice(itemIndex, 1);
        this.setState({todoItems: todoItems});

        createOsrmTripUrl(this.state.todoItems)

            .then(
                function (res) {
                    console.log(res);
                    return addTripLayer(res.url);
                },
                function (res) {
                    console.log(res);
                    if (res.code === 1) {
                        tripLayer.clearLayers();
                    }
                    return;
                }
            )

            .then(
                function (res) {
                    console.log(res);
                },
                function (res) {
                    console.log(res);
                });
    }

    markTodoDone(itemIndex) {
        var todo = todoItems[itemIndex];
        todoItems.splice(itemIndex, 1);
        todo.done = !todo.done;
        todo.done ? todoItems.push(todo) : todoItems.unshift(todo);
        this.setState({todoItems: todoItems});

        createOsrmTripUrl(this.state.todoItems)

            .then(
                function (res) {
                    console.log(res);
                    return addTripLayer(res.url);
                },
                function (res) {
                    console.log(res);
                    if (res.code === 1) {
                        tripLayer.clearLayers();
                    }
                    return;
                }
            )

            .then(
                function (res) {
                    console.log(res);
                },
                function (res) {
                    console.log(res);
                });
    }

    render() {
        return (
            <div id="main">
                <TodoHeader/>
                <TodoUpdateRouteBtn/>
                <TodoList items={this.props.initItems} removeItem={this.removeItem} markTodoDone={this.markTodoDone}/>
                <TodoGoogleLink/>
            </div>
        );
    }
}





