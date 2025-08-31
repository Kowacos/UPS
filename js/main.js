let map;
let directionsService;
let directionsRenderer;
let deliveryPoints = [];
let deliveredPoints = [];
let undeliveredPoints = [];
let markers = [];
let startMarker = null;
let endMarker = null;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 6,
        center: { lat: 49.8, lng: 15.5 },
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(map);

    const startInput = document.getElementById("start");
    const deliveryInput = document.getElementById("delivery");

    const autocompleteStart = new google.maps.places.Autocomplete(startInput, { componentRestrictions: { country: "cz" } });
    autocompleteStart.bindTo("bounds", map);

    const autocompleteDelivery = new google.maps.places.Autocomplete(deliveryInput, { componentRestrictions: { country: "cz" } });
    autocompleteDelivery.bindTo("bounds", map);

    document.getElementById("add-delivery").addEventListener("click", addDelivery);
    document.getElementById("resetRoute").addEventListener("click", resetRoute);
    document.getElementById("optimizeRoute").addEventListener("click", optimizeRoute);
    document.getElementById("endRoute").addEventListener("click", endRoute);

    deliveryInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addDelivery();
        }
    });

    document.querySelectorAll(".form-group button").forEach(button => {
        button.addEventListener("mouseenter", () => {
            gsap.to(button, { scale: 1.05, duration: 0.3, ease: "power2.out" });
        });
        button.addEventListener("mouseleave", () => {
            gsap.to(button, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
    });
}

function addDelivery() {
    const address = document.getElementById("delivery").value.trim();
    if (!address) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results[0]) {
            const loc = results[0].geometry.location;

            deliveryPoints.push({
                location: loc,
                stopover: true,
                address: results[0].formatted_address,
                reason: ""
            });

            const marker = new google.maps.Marker({
                position: loc,
                map: map,
                label: String(deliveryPoints.length)
            });
            markers.push(marker);

            addDeliveryToList(results[0].formatted_address);
            document.getElementById("delivery").value = "";
        } else {
            alert("Nepodařilo se najít adresu: " + status);
        }
    });
}

function addDeliveryToList(address) {
    const li = document.createElement("li");
    li.className = "delivery-item";

    const span = document.createElement("span");
    span.className = "address";
    span.textContent = address;

    const buttons = document.createElement("div");
    buttons.className = "delivery-buttons";

    const deliveredBtn = document.createElement("button");
    deliveredBtn.innerHTML = "✅";
    deliveredBtn.title = "Doručeno";
    deliveredBtn.onclick = () => {
        gsap.to(li, {
            opacity: 0,
            height: 0,
            margin: 0,
            padding: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                const itemIndex = deliveryPoints.findIndex(point => point.address === span.textContent);
                if (itemIndex > -1) {
                    const deliveredItem = deliveryPoints.splice(itemIndex, 1)[0];
                    deliveredPoints.push(deliveredItem);

                    li.remove();

                    if (markers[itemIndex]) {
                        markers[itemIndex].setMap(null);
                        markers.splice(itemIndex, 1);
                    }
                }

                const audio = document.getElementById("delivery-sound");
                audio.play();

                directionsRenderer.set("directions", null);
                document.getElementById("routeList").innerHTML = "";
            }
        });
    };

    const notDeliveredBtn = document.createElement("button");
    notDeliveredBtn.innerHTML = "❌";
    notDeliveredBtn.title = "Nedoručeno";
    notDeliveredBtn.onclick = () => {
        gsap.to(reasonBox, {
            display: "block",
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                reasonBox.querySelector("input").focus();
            }
        });
    };

    buttons.appendChild(deliveredBtn);
    buttons.appendChild(notDeliveredBtn);

    const reasonBox = document.createElement("div");
    reasonBox.className = "reason-box";

    const reasonInput = document.createElement("input");
    reasonInput.type = "text";
    reasonInput.placeholder = "Důvod nedoručení...";
    reasonBox.appendChild(reasonInput);

    li.appendChild(span);
    li.appendChild(buttons);
    li.appendChild(reasonBox);

    document.getElementById("deliveryList").appendChild(li);

    gsap.from(li, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out"
    });

    buttons.querySelectorAll("button").forEach(button => {
        button.addEventListener("mouseenter", () => {
            gsap.to(button, { scale: 1.1, duration: 0.3, ease: "power2.out" });
        });
        button.addEventListener("mouseleave", () => {
            gsap.to(button, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
    });

    reasonInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const reason = reasonInput.value;
            gsap.to(li, {
                opacity: 0,
                height: 0,
                margin: 0,
                padding: 0,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    const itemIndex = deliveryPoints.findIndex(point => point.address === span.textContent);
                    if (itemIndex > -1) {
                        const undeliveredItem = deliveryPoints.splice(itemIndex, 1)[0];
                        undeliveredItem.reason = reason;
                        undeliveredPoints.push(undeliveredItem);

                        li.remove();

                        if (markers[itemIndex]) {
                            markers[itemIndex].setMap(null);
                            markers.splice(itemIndex, 1);
                        }
                    }
                }
            });
        }
    });
}

function resetRoute() {
    const mainContent = document.getElementById("main-content");
    const mapDiv = document.getElementById("map");
    const rightPanel = document.querySelector(".right-panel");

    gsap.to(mapDiv, {
        width: "90%",
        maxWidth: "800px",
        height: "400px",
        duration: 0.8,
        ease: "power4.inOut"
    });

    gsap.to(rightPanel, {
        width: "100%",
        maxWidth: "520px",
        duration: 0.8,
        ease: "power4.inOut"
    });

    gsap.to(mainContent, {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        duration: 0.8,
        ease: "power4.inOut",
        onComplete: () => {
            mainContent.classList.remove("optimized-layout");
            document.querySelector(".form-group").style.display = "flex";
            document.querySelector(".delivery-box").style.display = "block";
            document.getElementById("map").style.display = "block";
        }
    });

    deliveryPoints = [];
    deliveredPoints = [];
    undeliveredPoints = [];
    document.getElementById("deliveryList").innerHTML = "";
    document.getElementById("routeList").innerHTML = "";
    document.getElementById("summary-box").style.display = "none";

    directionsRenderer.set("directions", null);

    markers.forEach(m => m.setMap(null));
    markers = [];

    if (startMarker) { startMarker.setMap(null); startMarker = null; }
    if (endMarker) { endMarker.setMap(null); endMarker = null; }

    document.getElementById("start").value = "";
}

function optimizeRoute() {
    const start = document.getElementById("start").value.trim();

    if (!start) {
        alert("Zadej startovní a konečnou adresu!");
        return;
    }

    const waypoints = deliveryPoints.map(p => ({ location: p.location, stopover: true }));

    directionsService.route({
        origin: start,
        destination: start,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);

            const route = result.routes[0];
            const summaryPanel = document.getElementById("routeList");
            summaryPanel.innerHTML = "<h3>Optimalizovaná trasa</h3>";

            markers.forEach(m => m.setMap(null));
            markers = [];

            let currentTime = new Date();

            route.legs.forEach((leg, i) => {
                const arrivalTime = new Date(currentTime.getTime() + leg.duration.value * 1000);
                const arrivalStr = arrivalTime.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });

                const routeItem = document.createElement("p");
                routeItem.innerHTML = `<b>${i + 1}.</b> ${leg.end_address} – <b>${arrivalStr}</b>`;
                summaryPanel.appendChild(routeItem);

                gsap.from(routeItem, {
                    opacity: 0,
                    x: -20,
                    duration: 0.5,
                    ease: "power2.out",
                    delay: i * 0.2
                });

                const marker = new google.maps.Marker({
                    position: leg.end_location,
                    map: map,
                    label: String(i + 1)
                });
                markers.push(marker);

                currentTime = arrivalTime;
            });

            const mainContent = document.getElementById("main-content");
            const mapDiv = document.getElementById("map");
            const rightPanel = document.querySelector(".right-panel");

            // GSAP Timeline pro plynulý přechod
            const tl = gsap.timeline();
            tl.to(mainContent, {
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "center",
                duration: 0.8,
                ease: "power4.inOut"
            }, 0);

            tl.to(mapDiv, {
                width: "60%",
                maxWidth: "700px",
                height: "600px",
                duration: 0.8,
                ease: "power4.inOut"
            }, 0);

            tl.to(rightPanel, {
                width: "40%",
                maxWidth: "520px",
                duration: 0.8,
                ease: "power4.inOut"
            }, 0);

            mainContent.classList.add("optimized-layout");

        } else {
            alert("Nepodařilo se naplánovat trasu: " + status);
        }
    });
}

function endRoute() {
    document.querySelector(".delivery-box").style.display = "none";
    document.getElementById("routeList").style.display = "none";
    document.getElementById("map").style.display = "none";
    document.querySelector(".form-group").style.display = "none";

    const deliveredList = document.getElementById("deliveredList");
    const undeliveredList = document.getElementById("undeliveredList");

    deliveredList.innerHTML = '';
    undeliveredList.innerHTML = '';

    const deliveredCount = deliveredPoints.length;
    document.getElementById("deliveredSummary").querySelector("h3").textContent = `Doručené zásilky ✅ (${deliveredCount})`;

    deliveredPoints.forEach(point => {
        const li = document.createElement("li");
        li.textContent = point.address;
        deliveredList.appendChild(li);
    });

    const undeliveredCount = undeliveredPoints.length;
    document.getElementById("undeliveredSummary").querySelector("h3").textContent = `Nedoručené zásilky ❌ (${undeliveredCount})`;

    undeliveredPoints.forEach(point => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${point.address}</span>
            <br>
            <small>Důvod: ${point.reason || "Nezadán"}</small>
        `;
        undeliveredList.appendChild(li);
    });

    const summaryBox = document.getElementById("summary-box");
    summaryBox.style.display = "block";
    gsap.from(summaryBox, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power2.out"
    });
}

window.initMap = initMap;