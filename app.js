const clockElement = document.getElementById("clock");

function updateClock() {
  const now = new Date();
  clockElement.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

updateClock();
setInterval(updateClock, 1000);
