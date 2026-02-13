// Initialize map
    const map = L.map('map').setView([31.6340, 74.8723], 11);

    // Base map (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Load ward GeoJSON
    fetch('/data/amritsar_wards_final.geojson')
      .then(res => res.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: 'transparent',
            weight: 0,
            fillColor: '#111',
            fillOpacity: 0.5
          }
        }).addTo(map);
      })
      .catch(err => {
        console.error('Failed to load ward data:', err);
      });

      map.on('click', function(e) {

  const point = turf.point([e.latlng.lng, e.latlng.lat]);

  fetch('/public/data/amritsar_wards_final.geojson')
    .then(res => res.json())
    .then(data => {

      data.features.forEach(feature => {

        const polygon = turf.polygon(feature.geometry.coordinates);

        if (turf.booleanPointInPolygon(point, polygon)) {

          alert("Your ward is: " + feature.properties.ward_id);

        }

      });

    });

});

const form = document.getElementById("complaintForm");

// Get user location automatically when page loads
window.onload = function () {

    if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        document.getElementById("latitude").value = position.coords.latitude;
        document.getElementById("longitude").value = position.coords.longitude;
    }, function () {
        alert("Please allow location access for accurate complaint registration.");
    });
};


// Handle form submission
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    try {
        const response = await fetch("/submit-complaint", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        alert(result.message);

        form.reset();

    } catch (error) {
        console.error(error);
        alert("Something went wrong.");
    }
});
