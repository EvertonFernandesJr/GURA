document.addEventListener("navbar:loaded", function () {
  const profileButton = document.getElementById("profile-btn");
  const modal = document.getElementById("modalProfile");
  const closeButton = document.getElementById("closeBtn");

  if (!profileButton || !modal || !closeButton) {
    return;
  }

  function openModal() {
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  profileButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });
});