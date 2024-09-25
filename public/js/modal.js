// /public/js/modal.js

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function initModals() {
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modalId = button.parentElement.parentElement.id;
            closeModal(modalId);
        });
    });
}

// Function to toggle the "Add" tab dropdown
let addDropdownVisible = false;

function toggleAddDropdown() {
    const dropdown = document.getElementById('add-dropdown');

    if (dropdown) {
        if (addDropdownVisible) {
            dropdown.classList.remove('show'); // Hide the dropdown
            addDropdownVisible = false;
        } else {
            dropdown.classList.add('show'); // Show the dropdown
            addDropdownVisible = true;
        }
    }

    updateTabHighlight('add-tab', addDropdownVisible); // Update tab highlight for the add tab
}
