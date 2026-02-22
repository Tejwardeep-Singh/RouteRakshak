function togglePassword() {
    const input = document.getElementById("passwordInput");

    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

function toggleMenu() {
    console.log("CLICKED");
    const nav = document.getElementById("navLinks");
    nav.classList.toggle("active");
}

let detectedWardNumber = null;

function openWardModal() {
    document.getElementById("wardModal").style.display = "flex";
    detectWard();
}

function closeWardModal() {
    document.getElementById("wardModal").style.display = "none";
    document.getElementById("detectedWardResult").innerText = "";
    document.getElementById("wardError").innerText = "";
    document.getElementById("confirmWardBtn").disabled = true;
}

async function detectWard() {
    if (!navigator.geolocation) {
        document.getElementById("wardError").innerText =
            "Geolocation not supported.";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
            const res = await fetch("/detect-ward", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat, lng })
            });

            const data = await res.json();
            console.log("Server Response:", data);

            if (data.wardNo !== null && data.wardNo !== undefined) {

                detectedWardNumber = data.wardNo;

                document.getElementById("detectingText").style.display = "none";

                document.getElementById("detectedWardResult").innerText =
                    "Detected Ward: " + data.wardNo;

                const currentWard =
                    document.getElementById("currentWard").innerText;

                if (Number(currentWard) === Number(data.wardNo)) {
                    document.getElementById("wardError").innerText =
                        "You are already registered in this ward.";
                } else {
                    document.getElementById("confirmWardBtn").disabled = false;
                }

            } else {
                document.getElementById("wardError").innerText =
                    "Unable to detect ward.";
            }

        } catch (err) {
            console.error(err);
            document.getElementById("wardError").innerText =
                "Something went wrong.";
        }

    }, () => {
        document.getElementById("wardError").innerText =
            "Location permission denied.";
    });
}
async function confirmWard() {

    await fetch("/update-ward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newWard: detectedWardNumber })
    });

    location.reload();
}



 const map = L.map('map').setView([31.6340, 74.8723], 11);

    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    
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

