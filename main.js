

// --- Modal Gallery Logic ---
let currentImageIndex = 0;
let currentImages = [];

const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const captionText = document.getElementById("caption");

function showImage(index) {
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;
  currentImageIndex = index;
  modalImg.src = currentImages[currentImageIndex];
  captionText.innerHTML = `${currentImageIndex + 1} / ${currentImages.length}`;
}

// Close modal
document.querySelector(".close").onclick = function () {
    modal.style.display = "none";
};

// Navigation button
document.querySelector(".prev").onclick = function () {
    showImage(currentImageIndex - 1);
};

document.querySelector(".next").onclick = function () {
    showImage(currentImageIndex + 1);
};

// --- MapLibre GL JS Setup ---
var map = new maplibregl.Map({
        container: 'map', // container id
        style: './map_style.json', // style URL
        center: [-79.41162242337015, 43.70397602606088], // starting position [lng, lat]
        zoom: 16, // starting zoom
        //pitch: 45,         // Tilt the map for a 3D-like perspective
        //bearing: -45      // Rotate the map
    });

// --- MapLibre GL JS Run ---
map.on('load', () => {

    map.addSource('points_source', {
        'type': 'geojson',
        'data': './points_art.geojson'
    });

    map.addLayer({
        'id': 'points_layer',
        'type': 'circle',
        'source': 'points_source',
        'paint': {
            'circle-radius': 10,
            'circle-color': '#FFFFFF',
            'circle-stroke-width': 4,
            'circle-stroke-color':["get", "HEX"]
        }          
    });

    map.addSource('boundary_source', {
        'type': 'geojson',
        'data': './boundary_artwalk.geojson'
    });

    map.addLayer({
        'id': 'boundary_layer',
        'type': 'fill',
        'source': 'boundary_source',
        'paint': {
            'fill-color': '#D4B192',
            'fill-opacity': 0.2,
        }      
    }, 'landuse-residential');

    // Create a popup, but don't add it to the map yet.
    const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    // Make sure to detect marker change for overlapping markers
    // and use mousemove instead of mouseenter event
    let currentFeatureCoordinates = undefined;
    map.on('mousemove', 'points_layer', (e) => {
        const featureCoordinates = e.features[0].geometry.coordinates.toString();
        if (currentFeatureCoordinates !== featureCoordinates) {
            currentFeatureCoordinates = featureCoordinates;

            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';

            const coordinates = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;

            // Artwork Label
            const artworkLabel = `
                <div class="artwork-popup">
                    <h3 class="popup-title">${props.ARTIST_NAME}</h3>

                    <div class="artwork-subtitle">
                        <div class="popup-left-subtitle">${props.SCULPTURE_NAME},</div> 
                        <div class="popup-right-subtitle">${props.INSTALLATION_DATE}</div>
                    </div>

                    <div class="popup-strong">${props.MATERIALS}</div>
                    <p class="popup-description">${props.DESCRIPTION}</p>
                </div> 
            `;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates).setHTML(artworkLabel).addTo(map);
        }
    });

    // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
        map.on('click', 'points_layer', (e) => {
            map.flyTo({
                center: e.features[0].geometry.coordinates,
                zoom: 18,
                speed: .8
            });
        });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'points_layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'points_layer', () => {
        currentFeatureCoordinates = undefined;
        map.getCanvas().style.cursor = '';
        popup.remove();
    });


    // Show image gallery modal --------
    map.on('click', 'points_layer', function (e) {
        const feature = e.features[0];
        let images = feature.properties.images;
    
        // If images comes as a string, parse it
        if (typeof images === "string") {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = [];
            }
        };

        currentImages = images;
        currentImageIndex = 0;

        showImage(currentImageIndex);
        modal.style.display = "block";
    });


});