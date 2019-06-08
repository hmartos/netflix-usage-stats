'use strict';

// Adds a link to viewing stats page in profile section
let profileSection = document.querySelector("*[data-uia='profile-section'] .account-subsection .account-section-group.left-align");
console.log('profile section', profileSection);

let statsSection = profileSection.firstChild.cloneNode(true);
statsSection.firstChild.href = '/viewingactivity?stats=true';
statsSection.firstChild.innerHTML = 'Estadísticas de visionado';

profileSection.prepend(statsSection);