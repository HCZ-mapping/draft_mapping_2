// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto, option, input */

var map = L.map('map',{maxZoom:19}).setView([40.811000, -73.944334], 14);
 
        // populate dropdown menu
        populateDropDown()

        // add basemaps to map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
          maxZoom: 22,
          attribution: "Map data &copy; <a href='http://hcz.org'>Harlem Children's Zone</a>"
        }).addTo(map);

        // set CARTO client
        const client = new carto.Client({
          apiKey: 'default_public',
          username: 'vonwildsau'
        });

// ************************************************** Point LAYER ************************************************************

        const pointSource = new carto.source.SQL(`
            SELECT * FROM hcz_livedata
        `);
        // define CartoCSS code to style data on map
        const pointStyle = new carto.style.CartoCSS(`
            #layer {
              marker-width: 10;
              marker-fill: #009aff;
              marker-fill-opacity: 0.9;
              marker-allow-overlap: true;
              marker-line-width: 1;
              marker-line-color: #000000;
              marker-line-opacity: 1;
              [zoom < 15] {marker-width: 0}
            }
        `);
        // create CARTO layer from source and style variables
        const pointLayer = new carto.layer.Layer(pointSource, pointStyle, {
            featureClickColumns: ['site', 'the_geom', 'bin', 's_type', 'p_type', 'add', 'link']
        });

// *************************************************** POLYGON ******************************************************************

   const polySource = new carto.source.SQL(`
            SELECT * FROM finalbuildings
        `);
        // define CartoCSS code to style data on map
        const polyStyle = new carto.style.CartoCSS(`
            #layer {
              polygon-fill: #282828;
              polygon-opacity: 0.6;
              [zoom > 16] {polygon-opacity: 0.2}
            ::outline {
              line-color: #282828;
              line-width: 4;
              line-opacity: 1;
              line-dasharray: 1, 6;
              line-cap: round;
              [zoom < 17] {line-width: 0}
              }
            }
        `);
        // create CARTO layer from source and style variables
        const polyLayer = new carto.layer.Layer(polySource, polyStyle, {
            featureClickColumns: ['bin']
        });

// ****************************************** ADDING SECOND LAYER: HCZ Boundary **************************************************

const boundarySource = new carto.source.Dataset('hczboundary');

const boundaryStyle = new carto.style.CartoCSS(`
    #layer {
      polygon-fill: #ffffff;
      polygon-opacity: 0;
      }    
    #layer::outline {
      line-width: 1;
      line-color: black;
      line-opacity: 0.6;
      }
`);

const boundaryLayer = new carto.layer.Layer(boundarySource, boundaryStyle);

// ****************************************** THIRD LAYER: HCZ INVERTED Boundary **************************************************

var geojson 

$.getJSON('https://cdn.glitch.com/8dca7616-ca8f-4ca1-b8f4-2dce1973abc9%2Fboundary.geojson?1555981242638', function (data) {
  geojson = L.geoJson(data, {
     
      // Add invert: true to invert the geometries in the GeoJSON file
      invert: true,
     
      style: {
        color: 'black',
        stroke: false,
        fillOpacity: 0.4,
        interactive: false,
      }
    }).addTo(map);
  });



// ********************* add CARTO layer to the client and get tile from client and add them to the map object **************************

  client.addLayers([boundaryLayer, polyLayer, pointLayer]);
  client.getLeafletLayer().addTo(map);
    

// ****************************** THIS ADDS Feature Content IN THE SIDEBAR WHEN FEATURE IS CLICKED *****************************************

    // this is needed because the layer that is clicked contains the data but not the LATITUDE AND LONGITUDE
map.on("click", function(e) {
        var pixelPosition = e.layerPoint;
        var latLng = map.layerPointToLatLng(pixelPosition);
        console.log("LatLng = " + latLng);
   
    // adding data to the sidebar
var sidebar = document.querySelector('.sidebar-feature-content');
pointLayer.on('featureClicked', function (event) {
    var content = '<br><div class="schoolBox">'  
    content += '<h1>' + event.data['site'] + '</h1>'
    content += '<h3><b>School type: </b>' + event.data['s_type'] + '</h3>'
    content += '<h3><b>Program type: </b>' + event.data['p_type'] + '</h3>'
    content += '<h3><b>Address: </b>' + event.data['add'] + '</h3>'
    content += '<h3><b>BIN: </b>' + event.data['bin'] + '</h3>'
    content += '<h3><b>Learn more:</b>' + '<a href=' + event.data['link'] + ' target= "_blank">by clicking here</a></h3>'
    //content += '<br><img src="' + event.data['photo'] + '"' +'>'
    content += '</div>'
    sidebar.innerHTML = content;
      // opening the sidebar 
    document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
    document.getElementById("mySidenav").style.maxWidth = "550px";
    document.getElementById("openbtn").style.display = "none";
    document.getElementById("openBoundingBox").style.display = "none";
      // flyTo instead of setView animates the move
    console.log("Zoom level: " + map.getZoom());
    map.setView([event.latLng.lat,event.latLng.lng+0.0004], 19);
  
  });

});


// *********************************** NEW DROPDOWN MENU **************************************************

          function populateDropDown(){
            return fetch (
              `https://vonwildsau.carto.com/api/v2/sql?&q=SELECT site FROM hcz_livedata` 
              //"https://vonwildsau.carto.com/api/v2/sql?&q=SELECT site FROM hcz_livedata"+window.inputForDrop
            )
              .then(response => response.json()) // EB: slightly annoying, but this is how we get the JSON out of the response from Carto
              .then((response) => {
                // EB sometimes it's helpful to log out the data you have so you know what to do with it
                console.log(response);
                   return response['rows'].map(function(feature){
                        option = document.createElement("option")
                        option.setAttribute("value", feature.site) // EB: had to change this, properties is not part of the returned feature because it's not GeoJSON
                        option.textContent = feature.site // EB: same as above
                        document.getElementById("js-select-drop").appendChild(option);
                    });
                }).catch((error) => {
                    console.log(error)
                })
        }
       

// ***************************************** THIS IS DROPDOWN MENU ***************************************************
    
    // this initiates the sidebar feature content
var sidebar = document.querySelector('.sidebar-feature-content');  
     // when option is selected from downdown menu, change bounding box of map to the geometry 
  document.getElementById('js-select-drop').addEventListener("change", function (event) {
        input = event.currentTarget.selectedOptions[0].attributes[0].value;
        return  fetch(`https://vonwildsau.carto.com/api/v2/sql?&q=SELECT * FROM hcz_livedata where site like '${input}'`)
        .then((response) => response.json())
        .then((response) => {
            return response['rows'].map(function(feature){
              console.log(feature['site']);
              map.setView([feature['latitude'], feature['longitude']+0.0004], 19);
              
                 
//           this is the data for the sidebar
            var content = '<br><div class="schoolBox">'  
            content += '<h1>' + feature['site'] + '</h1>'
            content += '<h3><b>School type: </b>' + feature['s_type'] + '</h3>'
            content += '<h3><b>Program type: </b>' + feature['p_type'] + '</h3>'
            content += '<h3><b>Address: </b>' + feature['add'] + '</h3>'
            content += '<h3><b>BIN: </b>' + feature['bin'] + '</h3>'
            content += '<h3><b>Learn more:</b>' + '<a href=' + feature['link'] + ' target= "_blank">by clicking here</a></h3>'
            content += '<br><img src="' + feature['photo'] + '"' +'>'
            content += '</div>'
            sidebar.innerHTML = content;
          
          // this opens the sidebar
            document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
            document.getElementById("mySidenav").style.maxWidth = "550px";
            document.getElementById("openbtn").style.display = "none";
            document.getElementById("openBoundingBox").style.display = "none";
            });
        });
    });



// ************************************** Filter School and Program TYPE by Checkboxes ******************************************
            
    function handleCheckboxChange() {
          // First we find every checkbox and store them in separate variables
      var famCheckbox = document.querySelector('.fam');
      var childCheckbox = document.querySelector('.child');
      var elemenCheckbox = document.querySelector('.elemen');
      var middleCheckbox = document.querySelector('.middle');
      var highCheckbox = document.querySelector('.high');
      var collegeCheckbox = document.querySelector('.college');
      var aCheckbox = document.querySelector('.a');
      var bCheckbox = document.querySelector('.b');
      var cCheckbox = document.querySelector('.c');
      var dCheckbox = document.querySelector('.d');
      var eCheckbox = document.querySelector('.e');
      var fCheckbox = document.querySelector('.f');
      var gCheckbox = document.querySelector('.g');
      var hCheckbox = document.querySelector('.h');

          // Logging out to make sure we get the checkboxes correctly
      console.log('S_Family:', famCheckbox.checked);
      console.log('S_Early Childhood:', childCheckbox.checked);
      console.log('S_Elementary:', elemenCheckbox.checked);
      console.log('S_Middle School:', middleCheckbox.checked);
      console.log('S_High School:', highCheckbox.checked);
      console.log('S_College:', collegeCheckbox.checked);
      console.log('P_After School:', aCheckbox.checked);
      console.log('P_Charter School/After School:', bCheckbox.checked);
      console.log('P_College and Career:', cCheckbox.checked);
      console.log('P_Community:', dCheckbox.checked);
      console.log('P_Early Head Start:', eCheckbox.checked);
      console.log('P_Parenting:', fCheckbox.checked);
      console.log('P_Pre - School:', gCheckbox.checked);
      console.log('P_Social Services:', hCheckbox.checked);

          // Create an array of all of the values corresponding to checked boxes. If a checkbox is checked, add that filter value to our array.

      var schoolType = [];
      map.setView([40.811000, -73.934334], 15);
      sidebar.innerHTML = ' ';
      if (famCheckbox.checked) {schoolType.push("'Family and Community'");}
      if (childCheckbox.checked) {schoolType.push("'Early Childhood'");}
      if (elemenCheckbox.checked) {schoolType.push("'Elementary School'");}
      if (middleCheckbox.checked) {schoolType.push("'Middle School'");}
      if (highCheckbox.checked) {schoolType.push("'High School'");}
      if (collegeCheckbox.checked) {schoolType.push("'College'");}
      
      var programType = [];
      map.setView([40.811000, -73.934334], 15);
      sidebar.innerHTML = ' ';
      if (aCheckbox.checked) {programType.push("'After School'");}
      if (bCheckbox.checked) {programType.push("'Charter School/After School'");}
      if (cCheckbox.checked) {programType.push("'College and Career'");}
      if (dCheckbox.checked) {programType.push("'Community'");}
      if (eCheckbox.checked) {programType.push("'Early Head Start'");}
      if (fCheckbox.checked) {programType.push("'Parenting'");}
      if (gCheckbox.checked) {programType.push("'Pre - School'");}
      if (hCheckbox.checked) {programType.push("'Social Services'");}

          // If there are any values to filter on, do an SQL IN condition on those values, otherwise select all features

       // create a variable here which contains all the options below                               !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!      IMPORTANT!      !!!!!!!!!!!!!!!!
      if ((schoolType.length && programType.length)) {
        var sql = "SELECT * FROM hcz_livedata WHERE s_type IN ("+schoolType.join(',')+") AND p_type IN ("+programType.join(',')+")";
        console.log('Both School and Program: ' + sql);
        pointSource.setQuery(sql);
        var inputSQL = "%20WHERE s_type IN ("+schoolType.join(',')+") AND p_type IN ("+programType.join(',')+")";
       // populateDropDown();
      }
      
      else if (schoolType.length) {
        var sql_1 = "SELECT * FROM hcz_livedata WHERE s_type IN ("+schoolType.join(',')+")";
        console.log('School only: ' + sql_1);
        pointSource.setQuery(sql_1);
        var inputSQL_1 = "%20WHERE s_type IN ("+schoolType.join(',')+")";
       // populateDropDown();
      }
    
      else if (programType.length) {
        var sql_2 = "SELECT * FROM hcz_livedata WHERE p_type IN ("+programType.join(',')+")";
        console.log('Program only: ' + sql_2);
        pointSource.setQuery(sql_2);
        var inputSQL_2 = "%20WHERE p_type IN ("+programType.join(',')+")";
      //  populateDropDown();
      }
            
      else {
        var sql_3 = "SELECT * FROM hcz_livedata"
        pointSource.setQuery(sql_3);
        var inputSQL_3 = "";
       // populateDropDown();
     } 
      var sql_output = (inputSQL || inputSQL_1 || inputSQL_2 || inputSQL_3);
      window.inputForDrop = (sql_output);
      console.log(window.inputForDrop);
 
    //  populateDropDown();
      
//       console.log(populateDropDown);
//      "SELECT%20*%20FROM%20hcz_livedata%20WHERE%20s_type%20IN%20("+schoolType.join(',')+")%20AND%20p_type%20IN%20("+programType.join(',')+")";
//      "SELECT%20*%20FROM%20hcz_livedata%20WHERE%20s_type%20IN%20("+schoolType.join(',')+")";
//      "SELECT%20*%20FROM%20hcz_livedata%20WHERE%20p_type%20IN%20("+programType.join(',')+")";
//      "SELECT%20*%20FROM%20hcz_livedata"
      
      
     // at the end here I will call the PopulateDropDown with the filter variable                    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!       IMPORTANT!        !!!!!!!!!!!!!!!!!!!!!! 
}
  
  

        // Listen for changes on any checkbox*/

    var famCheckbox = document.querySelector('.fam');
    famCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var childCheckbox = document.querySelector('.child');
    childCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var elemenCheckbox = document.querySelector('.elemen');
    elemenCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var middleCheckbox = document.querySelector('.middle');
    middleCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var highCheckbox = document.querySelector('.high');
    highCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var collegeCheckbox = document.querySelector('.college');
    collegeCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });


    var aCheckbox = document.querySelector('.a');
    aCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var bCheckbox = document.querySelector('.b');
    bCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var cCheckbox = document.querySelector('.c');
    cCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var dCheckbox = document.querySelector('.d');
    dCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var eCheckbox = document.querySelector('.e');
    eCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var fCheckbox = document.querySelector('.f');
    fCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var gCheckbox = document.querySelector('.g');
    gCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });
    var hCheckbox = document.querySelector('.h');
    hCheckbox.addEventListener('change', function () {
      handleCheckboxChange();
    });



// ********************************** THIS IS THE MOVING SIDE BAR ************************************

    // This opens the sidebar
    var element = document.getElementById('openbtn');
      element.onclick = function () { 
        console.log('OPENED  by javascript'); 
        document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
        document.getElementById("mySidenav").style.maxWidth = "550px";
        document.getElementById("openbtn").style.display = "none";
        document.getElementById("openBoundingBox").style.display = "none";
        // map.setView([40.811000, -73.934334],15);
    };

    // this closes the sidebar
    var element = document.getElementById('closebtn');
    element.onclick = function () {
      console.log("this was closed");
      document.getElementById("mySidenav").style.width = "0";
      document.getElementById("openbtn").style.display = "block";
      document.getElementById("openBoundingBox").style.display = "block";
      sidebar.innerHTML = ' ';
      // map.setView([40.811000, -73.944334], 15, {
      //   // animate: true,
      //   // duration: 1,
      // });
      document
    };
      

// ************************************ ADDING AN Enter BUTTON ******************************************

// Step 1: Find the button by its class. If you are using a different class, change this.
 var enterButton = document.querySelector('.enter-screen');

// Step 2: Add an event listener to the button. We will run some code whenever the button is clicked.
   enterButton.addEventListener('click', function (e) {
     console.log('Zoom Level: ' + map.getZoom());
     console.log('Button was clicked');
     map.setView([40.811000, -73.934334], 15, {
        // animate: true,
        // duration: 2,
      });
      document.querySelector('.enter-text').style.display = "none";
      document.querySelector('.enter-screen').style.display = "none";
      map.removeLayer(geojson);
      document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
      document.getElementById("mySidenav").style.maxWidth = "550px";
      document.getElementById("openbtn").style.display = "none";
      document.getElementById("openBoundingBox").style.display = "none";
     
  });


// ************************************ ADDING MOUSE OVER POP-UPS ******************************************

const popup = L.popup({ closeButton: false });
pointLayer.on(carto.layer.events.FEATURE_OVER, featureEvent => {
  popup.setLatLng(featureEvent.latLng);
  if (!popup.isOpen()) {
    popup.setContent('<h2>' + featureEvent.data['site'] + '</h2>');
    popup.openOn(map);
  }
});

pointLayer.on(carto.layer.events.FEATURE_OUT, featureEvent => {
  popup.removeFrom(map);
});

// ********************************* COLLAPSIBLE DIV **************************************

let myLabels = document.querySelectorAll('.lbl-toggle');

Array.from(myLabels).forEach(label => {
  label.addEventListener('keydown', e => {
    // 32 === spacebar
    // 13 === enter
    if (e.which === 32 || e.which === 13) {
      e.preventDefault();
      label.click();
    };
  });
});

