const PLACEHOLDER_TITLE = "Accessible Digital Textbook";
document.addEventListener("DOMContentLoaded", function () {
  // Set the language on page load to currentLanguage cookie or the html lang attribute.
  let languageCookie = getCookie("currentLanguage");
  if (!languageCookie) {
    currentLanguage = document
      .getElementsByTagName("html")[0]
      .getAttribute("lang");
  } else {
    currentLanguage = languageCookie;
  }

  //save function 
  function saveActivities() {
    const activities = document.querySelectorAll(
      "input[type='text'], textarea, .word-card"
    );
    const submitButton = document.getElementById("submit-button");
    const dropzones = document.querySelectorAll(".dropzone");
    const activityId = location.pathname
      .substring(location.pathname.lastIndexOf("/") + 1)
      .split(".")[0];
    // Add event listeners to dropzones
    dropzones.forEach((dropzone) => {
      const dropzonesData = JSON.parse(localStorage.getItem(activityId)) || {};
      const dropzoneRegion = dropzone.querySelector("div[role='region']");
      const dropzoneId = dropzoneRegion.getAttribute("id");
      if (dropzoneId in dropzonesData) {
        const { itemId } = dropzonesData[dropzoneId];
        const wordElement = document.querySelector(
          `.activity-item[data-activity-item='${itemId}']`
        );
        dropzoneRegion.appendChild(wordElement);
      }
      dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        const itemId = event.dataTransfer.getData("text");
        const regexItem = /^item-/;
        if (!regexItem.test(itemId)) {
          return;
        }
        if (!itemId || itemId === "null") {
          return;
        }
        let dataActivity = JSON.parse(localStorage.getItem(activityId)) || {};
        if (
          dataActivity[dropzoneId] &&
          dataActivity[dropzoneId].itemId === itemId
        ) {
          console.log("El elemento ya está presente en esta zona");
          return;
        }
        dataActivity[dropzoneId] = { itemId };
        localStorage.setItem(activityId, JSON.stringify(dataActivity));
      });
    });

    // Add event listeners to other activities
    activities.forEach((nodo) => {
      const id = nodo.getAttribute("data-aria-id")
      const localStorageNodeId = `${activityId}_${id}`
      nodo.value = localStorage.getItem(localStorageNodeId)

      nodo.addEventListener("input", (event) => {
        const value = event.target.value
        localStorage.setItem(localStorageNodeId, value)
      })
    })

    /* submitButton.addEventListener("click", ()=> {
      localStorage.setItem(`${activityId}_success`, "true")
    }) */
  }


  // Fetch interface.html and nav.html, and activity.js concurrently
  Promise.all([
    fetch("assets/interface.html").then((response) => response.text()),
    fetch("assets/nav.html").then((response) => response.text()),
    fetch("assets/activity.js").then((response) => response.text()),
    fetch("assets/config.html").then((response) => response.text()),
  ])
    .then(async ([interfaceHTML, navHTML, activityJS, configHTML]) => {
      // Inject fetched HTML into respective containers
      document.getElementById("interface-container").innerHTML = interfaceHTML;
      document.getElementById("nav-container").innerHTML = navHTML;
      const parser = new DOMParser();
      const configDoc = parser.parseFromString(configHTML, "text/html");
      const newTitle = configDoc.querySelector("title").textContent;
      const newAvailableLanguages = configDoc
        .querySelector('meta[name="available-languages"]')
        .getAttribute("content");

      // Add the new title.
      if (newTitle !== PLACEHOLDER_TITLE) {
        document.title = newTitle;
      }
      // Add the new available languages.
      const availableLanguages = document.createElement("meta");
      availableLanguages.name = "available-languages";
      availableLanguages.content = newAvailableLanguages;
      document.head.appendChild(availableLanguages);

      // Inject the JavaScript code from activity.js dynamically into the document
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.text = activityJS;
      document.body.appendChild(script);

      // Iterate over the available languages added in the html meta tag to populate the language dropdown
      const dropdown = document.getElementById("language-dropdown");
      // Check if there is a more dynamic way to populate the available languages
      const metaTag = document.querySelector(
        'meta[name="available-languages"]'
      );
      const languages = metaTag.getAttribute("content").split(",");

      languages.forEach((language) => {
        const option = document.createElement("option");
        option.value = language;
        option.textContent = language;
        dropdown.appendChild(option);
      });

      // Manage sidebar state:
      const sidebarState = getCookie("sidebarState" || "closed");
      const sidebar = document.getElementById("sidebar");
      const openSidebar = document.getElementById("open-sidebar");
      const sideBarActive = sidebarState === "open";

      // Updated to target <main> tag as content id was glitching.
      if (sideBarActive) {
        sidebar.classList.remove("translate-x-full");
        document.getElementsByTagName("main")[0].classList.add("lg:ml-32");
        document.getElementsByTagName("main")[0].classList.remove("lg:mx-auto");
      } else {
        sidebar.classList.add("translate-x-full");
        document.getElementsByTagName("main")[0].classList.remove("lg:ml-32");
        document.getElementsByTagName("main")[0].classList.add("lg:mx-auto");
      }
      // Hide specific elements initially for accessibility
      const elements = [
        "close-sidebar",
        "language-dropdown",
        "toggle-eli5-mode-button",
        "sidebar",
      ];
      elements.forEach((id) => {
        const element = document.getElementById(id);
        if (sideBarActive) {
          element.setAttribute("aria-hidden", "false");
          element.removeAttribute("tabindex");
          openSidebar.setAttribute("aria-expanded", "true");
        } else {
          element.setAttribute("aria-hidden", "true");
          element.setAttribute("tabindex", "-1");
          openSidebar.setAttribute("aria-expanded", "false");
        }
      });

      //saveActivities()

      // Initialize left nav bar state from cookie
      const navState = getCookie("navState") || "closed";
      const navPopup = document.getElementById("navPopup");
      const navToggle = document.querySelector(".nav__toggle");
      const navList = document.querySelector(".nav__list");
      const navLinks = document.querySelectorAll(".nav__list-link");
      const savedPosition = getCookie("navScrollPosition");

      if (navState === "open") {
        navPopup.classList.remove("-translate-x-full");
        navPopup.classList.add("left-2");
        navPopup.setAttribute("aria-hidden", "false");
        if (navList) {
          navList.removeAttribute("hidden");
          // Wait for nav list to be visible before setting scroll
          setTimeout(() => {
            if (savedPosition) {
              console.log("Setting scroll after delay to:", savedPosition);
              navList.scrollTop = parseInt(savedPosition);
              console.log("Actual scroll position:", navList.scrollTop);
            }
          }, 300); // Increased delay
        }
        if (navToggle) {
          navToggle.setAttribute("aria-expanded", "true");
        }
      }
      
      // Restore nav scroll position
      //navList = document.querySelector(".nav__list");
      console.log("DOMContentLoaded - Retrieved saved position:", savedPosition);
      console.log("DOMContentLoaded - Current navList:", navList);
      
      if (navList && savedPosition) {
        navList.scrollTop = parseInt(savedPosition);
        
        // Only handle focus if nav is open
        if (navState === "open") {
          setTimeout(() => {
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            const activeLink = Array.from(document.querySelectorAll(".nav__list-link")).find(
              link => link.getAttribute("href") === currentPath
            );
            
            if (activeLink) {
              const linkRect = activeLink.getBoundingClientRect();
              const navRect = navList.getBoundingClientRect();
              const isInView = (
                linkRect.top >= navRect.top &&
                linkRect.bottom <= navRect.bottom
              );
              
              if (!isInView) {
                activeLink.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              activeLink.setAttribute("tabindex", "0");
              activeLink.focus({ preventScroll: true });
            }
          }, 300);
        }
      }

      // Add event listeners to various UI elements
      prepareActivity();
      // right side bar
      document
        .getElementById("open-sidebar")
        .addEventListener("click", toggleSidebar);
      document
        .getElementById("close-sidebar")
        .addEventListener("click", toggleSidebar);
      document
        .getElementById("toggle-eli5")
        .addEventListener("click", toggleEli5Mode);
      document
        .getElementById("language-dropdown")
        .addEventListener("change", switchLanguage);
      document
        .getElementById("toggle-easy")
        .addEventListener("click", toggleEasyReadMode);
      document
        .getElementById("play-pause-button")
        .addEventListener("click", togglePlayPause);
      document
        .getElementById("toggle-tts")
        .addEventListener("click", toggleReadAloud);
      document
        .getElementById("audio-previous")
        .addEventListener("click", playPreviousAudio);
      document
        .getElementById("audio-next")
        .addEventListener("click", playNextAudio);
      document
        .getElementById("play-bar-settings-toggle")
        .addEventListener("click", togglePlayBarSettings);
      document
        .getElementById("read-aloud-speed")
        .addEventListener("click", togglePlayBarSettings);

      // Add event listeners to all buttons with the class 'read-aloud-change-speed'
      document
        .querySelectorAll(".read-aloud-change-speed")
        .forEach((button) => {
          button.addEventListener("click", changeAudioSpeed);
        });

      // set the language dropdown to the current language
      document.getElementById("language-dropdown").value = currentLanguage;

      // bottom bar
      document
        .getElementById("back-button")
        .addEventListener("click", previousPage);
      document
        .getElementById("forward-button")
        .addEventListener("click", nextPage);

      // left nav bar
      document.getElementById("nav-popup").addEventListener("click", toggleNav);
      document.getElementById("nav-close").addEventListener("click", toggleNav);
      //const navToggle = document.querySelector(".nav__toggle");
      //const navLinks = document.querySelectorAll(".nav__list-link");
      //const navPopup = document.getElementById("navPopup");

      navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          // Save the current scroll position before navigation
          if (navList) {
            const scrollPosition = navList.scrollTop;
            setCookie("navScrollPosition", scrollPosition, 7, basePath);
          }
        });
      });

      if (navToggle) {
        navToggle.addEventListener("click", toggleNav);
      }

      // Append page and section numbers to nav list items
      const navListItems = document.querySelectorAll(".nav__list-item");

      navListItems.forEach((item, index) => {
        const link = item.querySelector(".nav__list-link");
        item.classList.add(
          "border-b",
          "border-gray-300",          
          "flex",
          "items-center"
        );
        link.classList.add(
          "flex-grow",
          "flex",
          "items-center",
          "w-full",
          "h-full",
          "py-2",
          "space-x-2"
        );

        // Add border top to the first element
        if (index === 0) {
          item.classList.add("border-t");
        }
        let itemIcon = "";
        let itemSubtitle = "";
        const href = link.getAttribute("href");
        const pageSectionMatch = href.match(/(\d+)_(\d+)/);
        
        if (item.classList.contains("activity")) {
          const activityId = href.split(".")[0];
          const success = JSON.parse(localStorage.getItem(`${activityId}_success`)) || false;
          itemIcon = '<i class="fas fa-pen-to-square"></i>';
          if (success) {
            itemIcon = '<i class="fas fa-check-square text-green-500"></i>';
            itemSubtitle = "<span data-id='activity-completed'></span>";
          } else {
            itemIcon = '<i class="fas fa-pen-to-square"></i>';
            itemSubtitle = "<span data-id='activity-to-do'></span>";
          }
        }

        const activityId = href.split(".")[0];
        
        const textId = link.getAttribute("data-text-id");

        if (pageSectionMatch) {
          const [_, pageNumber, sectionNumber] = pageSectionMatch.map(Number);
          link.innerHTML =
            "<div class='flex items-top space-x-2'>" +
            itemIcon +
            "<div>" +
            `<div>${pageNumber + 1}.${sectionNumber + 1}: </span><span class='inline' data-id='${textId}'></div>` +
            "<div class='text-sm text-gray-500'>" +
            itemSubtitle +
            "</div></div></div>";
        }

        if (href === window.location.pathname.split("/").pop()) {
          item.classList.add("min-h-[3rem]");
          link.classList.add(
            "border-l-4",
            "border-blue-500",
            "bg-blue-50",
            "p-2"
          );
        }
      });

      // Set the initial page number
      const pageSectionMetaTag = document.querySelector(
        'meta[name="page-section-id"]'
      );
      const pageSectionContent = pageSectionMetaTag.getAttribute("content");
      if (pageSectionContent) {
        const parts = pageSectionContent.split("_").map(Number);
        let humanReadablePage;

        if (parts.length === 2) {
          if (parts[1] === 0) {
            humanReadablePage =
              "<span data-id='page'></span> " + `${parts[0] + 1}`;
          } else {
            humanReadablePage =
              "<span data-id='page'></span> " +
              `${parts[0] + 1}.${parts[1] + 1}`;
          }
        } else {
          humanReadablePage =
            "<span data-id='page'></span> " + ` ${parts[0] + 1}`;
        }

        document.getElementById("page-section-id").innerHTML =
          humanReadablePage;
      }

      // Fetch translations and set up click handlers for elements with data-id
      await fetchTranslations();
      document.querySelectorAll("[data-id]").forEach((element) => {
        element.addEventListener("click", handleElementClick);
      });

      // Add keyboard event listeners for navigation
      document.addEventListener("keydown", handleKeyboardShortcuts);

      //Load status of AI controls in right sidebar on load from cookie.
      initializePlayBar();
      initializeAudioSpeed();
      loadToggleButtonState();
      loadEasyReadMode();
      loadAutoplayState();
      document.getElementById("toggle-autoplay").addEventListener("click", toggleAutoplay);
      window.addEventListener("load", initializeAutoplay);
      document.getElementById("toggle-describe-images").addEventListener("click", toggleDescribeImages);
      loadDescribeImagesState();


      // Unhide navigation and sidebar after a short delay to allow animations
      setTimeout(() => {
        navPopup.classList.remove("hidden");
        document.getElementById("sidebar").classList.remove("hidden");
        console.log("DOMContentLoaded - Actual scroll position:", navList.scrollTop);

      }, 100); // Adjust the timeout duration as needed

      // Add click handler specifically for eli5-content area
      document
        .getElementById("eli5-content")
        .addEventListener("click", function () {
          if (readAloudMode && eli5Mode) {
            const mainSection = document.querySelector(
              'section[data-id^="sectioneli5"]'
            );
            if (mainSection) {
              const eli5Id = mainSection.getAttribute("data-id");
              const eli5AudioSrc = audioFiles[eli5Id];

              if (eli5AudioSrc) {
                stopAudio();
                eli5Active = true;
                eli5Audio = new Audio(eli5AudioSrc);
                eli5Audio.playbackRate = parseFloat(audioSpeed);
                eli5Audio.play();

                highlightElement(this);

                eli5Audio.onended = () => {
                  unhighlightElement(this);
                  eli5Active = false;
                  isPlaying = false;
                  setPlayPauseIcon();
                };

                eli5Audio.onerror = () => {
                  unhighlightElement(this);
                  eli5Active = false;
                  isPlaying = false;
                  setPlayPauseIcon();
                };

                isPlaying = true;
                setPlayPauseIcon();
              }
            }
          }
        });
    })
    .then(() => {
      MathJax.typeset();
    })
    .catch((error) => {
      console.error("Error loading HTML:", error);
    });
});

// Handle keyboard events for navigation
function handleKeyboardShortcuts(event) {
  const activeElement = document.activeElement;
  const isInTextBox =
    activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";

  // disable shortcut keys if user is in a textbox
  if (isInTextBox) {
    return; // Exit if the user is inside a text box
  }

  switch (event.key) {
    case "x":
      toggleNav();
      break;
    case "a":
      toggleSidebar();
      break;
    case "ArrowRight":
      nextPage();
      break;
    case "ArrowLeft":
      previousPage();
      break;
  }

  const isAltShift = event.altKey && event.shiftKey;

  // Additional shortcuts for screen reader users (Alt + Shift + key)
  if (isAltShift) {
    switch (event.key) {
      case "x":
        toggleNav();
        break;
      case "a":
        toggleSidebar();
        break;
      case "ArrowRight":
        nextPage();
        break;
      case "ArrowLeft":
        previousPage();
        break;
    } // end switch
  } // end if
}

let translations = {};
let audioFiles = {};
let currentAudio = null;
let isPlaying = false;
let currentIndex = 0;
let audioElements = [];
let audioQueue = [];
let eli5Active = false;
let eli5Element = null;
let eli5Audio = null;
let eli5Mode = false;
let readAloudMode = false;
let sideBarActive = false;
let easyReadMode = false;
let audioSpeed = 1;
let autoplayMode = true;
let describeImagesMode = false;

// Add this function to handle loading the autoplay state
function loadAutoplayState() {
  const autoplayModeCookie = getCookie("autoplayMode");
  if (autoplayModeCookie !== null) {
    autoplayMode = autoplayModeCookie === "true";
    const autoplayIcon = document.getElementById("toggle-autoplay-icon");
    if (autoplayIcon) {
      toggleCheckboxState("toggle-autoplay", autoplayMode);
    }
  }
}

function toggleDescribeImages() {
  describeImagesMode = !describeImagesMode;
  toggleCheckboxState("toggle-describe-images", describeImagesMode);
  setCookie("describeImagesMode", describeImagesMode, 7);

  // Regather audio elements to update the sequence with or without images
  if (readAloudMode) {
      gatherAudioElements();
      if (isPlaying) {
          stopAudio();
          currentIndex = 0;
          playAudioSequentially();
      }
  }
}

// Add function to load the describe images state
function loadDescribeImagesState() {
  const describeImagesModeCookie = getCookie("describeImagesMode");
  if (describeImagesModeCookie !== null) {
      describeImagesMode = describeImagesModeCookie === "true";
      toggleCheckboxState("toggle-describe-images", describeImagesMode);
      
  }
}

// Get the base path of the current URL
const currentPath = window.location.pathname;
const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);

// Check if sideBarActive state has been pulled from the cookie
const sidebarStateCookie = getCookie("sidebarState");
if (sidebarStateCookie) {
  sideBarActive = sidebarStateCookie === "open";
}

// Toggle the right nav bar (Smart Utility Sidebar)
function toggleSidebar() {
  const languageDropdown = document.getElementById("language-dropdown");
  const sideLinks = document.querySelectorAll(".sidebar-item");
  const sidebar = document.getElementById("sidebar");
  const openSidebar = document.getElementById("open-sidebar");
  sideBarActive = !sideBarActive;

  // Set the sidebar state in the cookie referring to the base path
  setCookie("sidebarState", sideBarActive ? "open" : "closed", 7, basePath);
  sidebar.classList.toggle("translate-x-full");
  if (window.innerWidth <= 768) {
    // Apply full width only on mobile
    sidebar.classList.toggle("w-full", sideBarActive);
  }

  //Shift content to left when sidebar is open
  document
    .getElementsByTagName("main")[0] //Update to use main tag vs id="content"
    .classList.toggle("lg:ml-32", sideBarActive);
  document
    .getElementsByTagName("main")[0] //Update to use main tag vs id="content"
    .classList.toggle("lg:mx-auto", !sideBarActive);

  // Manage focus and accessibility attributes based on sidebar state
  const elements = [
    "close-sidebar",
    "language-dropdown",
    "sidebar",
  ];
  elements.forEach((id) => {
    const element = document.getElementById(id);
    if (sideBarActive) {
      element.setAttribute("aria-hidden", "false");
      element.removeAttribute("tabindex");
      openSidebar.setAttribute("aria-expanded", "true");

      // Set focus on the first element of the sidebar after a delay
      setTimeout(() => {
        languageDropdown.focus();
      }, 500);
    } else {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("tabindex", "-1");
      openSidebar.setAttribute("aria-expanded", "false");
    }
  });
}

// Language functionality
function switchLanguage() {
  stopAudio();
  currentLanguage = document.getElementById("language-dropdown").value;
  setCookie("currentLanguage", currentLanguage, 7, basePath);
  fetchTranslations();
  document
    .getElementsByTagName("html")[0]
    .setAttribute("lang", currentLanguage);
  fetchTranslations();
}

async function fetchTranslations() {
  try {
    // This loads the static interface translation file
    const interface_response = await fetch(
      `assets/interface_translations.json`
    );
    const interface_data = await interface_response.json();
    const response = await fetch(`translations_${currentLanguage}.json`);
    const data = await response.json();
    if (interface_data[currentLanguage]) {
      translations = {
        ...data.texts,
        ...interface_data[currentLanguage],
      };
      // Iterate over the language dropdown and populate the correct name of each language
      const dropdown = document.getElementById("language-dropdown");
      const options = Array.from(dropdown.options); // Convert HTMLCollection to Array

      options.forEach((option) => {
        // Change the text of each option
        option.textContent = interface_data[option.value]["language-name"];
      });
    } else {
      translations = data.texts; // Fallback if the language is not found in interface_data
    }
    audioFiles = data.audioFiles;
    applyTranslations();
    gatherAudioElements(); // Ensure audio elements are gathered after translations are applied
  } catch (error) {
    console.error("Error loading translations:", error);
  } finally {
    // Update the MathJax typesetting after translations are applied.
    MathJax.typeset();
  }
}

function applyTranslations() {
  unhighlightAllElements();

  for (const [key, value] of Object.entries(translations)) {
    // Skip elements with data-id starting with sectioneli5
    if (key.startsWith("sectioneli5")) continue;

    let translationKey = key;

    // Check if Easy-Read mode is enabled and if an easy-read version exists
    if (easyReadMode) {
      const easyReadKey = `easyread-${key}`;
      if (translations.hasOwnProperty(easyReadKey)) {
        translationKey = easyReadKey; // Use easy-read key if available
      }
    }

    const elements = document.querySelectorAll(`[data-id="${key}"]`);
    elements.forEach((element) => {
      if (element) {
        if (element.tagName === "IMG") {
          element.setAttribute("alt", translations[translationKey]); // Set the alt text for images
        } else {
          element.textContent = translations[translationKey]; // Set the text content for other elements
        }
      }
    });
    const placeholderElements = document.querySelectorAll(
      `[data-placeholder-id="${key}"]`
    );
    placeholderElements.forEach((element) => {
      if (element) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.setAttribute("placeholder", translations[translationKey]); // Set the placeholder text for input elements
        }
      }
    });
  }

  // Update eli5 content if eli5 mode is active
  if (eli5Mode) {
    const mainSection = document.querySelector(
      'section[data-id^="sectioneli5"]'
    );
    if (mainSection) {
      const eli5Id = mainSection.getAttribute("data-id");
      const eli5Text = translations[eli5Id];

      if (eli5Text) {
        const eli5Container = document.getElementById("eli5-content");
        eli5Container.textContent = eli5Text;
      }
    }
  }

  if (isPlaying) {
    stopAudio();
    currentIndex = 0;
    playAudioSequentially();
  }
  // Gather the audio elements again based on the current mode (easy-read or normal)
  gatherAudioElements();
}

function translateText(textToTranslate, variables = {}) {
  var newText = translations[textToTranslate];
  if (!newText) return textToTranslate; // Return the original text if no translation is found

  return newText.replace(/\${(.*?)}/g, (match, p1) => variables[p1] || "");
}

// Add this new function
function initializeAutoplay() {
  if (readAloudMode && autoplayMode) {
    gatherAudioElements();
    currentIndex = 0;
    isPlaying = true;
    setPlayPauseIcon();
    playAudioSequentially();
  }
}

// Add this new function to toggle autoplay
function toggleAutoplay() {
  autoplayMode = !autoplayMode;
  const autoplayIcon = document.getElementById("toggle-autoplay-icon");
  
  autoplayIcon.classList.toggle("fa-toggle-on", autoplayMode);
  autoplayIcon.classList.toggle("fa-toggle-off", !autoplayMode);
  
  setCookie("autoplayMode", autoplayMode, 7);

  if (readAloudMode && autoplayMode && !isPlaying) {
    currentIndex = 0;
    isPlaying = true;
    setPlayPauseIcon();
    playAudioSequentially();
  }
}

// Audio functionality
function gatherAudioElements() {
  audioElements = Array.from(document.querySelectorAll("[data-id]"))
      .filter(el => {
          // Filter out navigation elements
          const isNavElement = el.closest('.nav__list') !== null;
          
          // Skip images if describe images mode is off
          const isImage = el.tagName.toLowerCase() === 'img';
          if (isImage && !describeImagesMode) {
              return false;
          }
          
          return !isNavElement && !el.getAttribute("data-id").startsWith("sectioneli5");
      })
      .map(el => {
          const id = el.getAttribute("data-id");
          let audioSrc = audioFiles[id];

          // If it's an image, try to get its aria description audio
          if (el.tagName.toLowerCase() === 'img') {
              const ariaId = el.getAttribute("data-aria-id");
              if (ariaId && audioFiles[ariaId]) {
                  audioSrc = audioFiles[ariaId];
              }
          }

          // Check if Easy-Read mode is enabled and if an easy-read version exists
          if (easyReadMode) {
              const easyReadAudioId = `easyread-${id}`;
              if (audioFiles.hasOwnProperty(easyReadAudioId)) {
                  audioSrc = audioFiles[easyReadAudioId];
              }
          }

          return {
              element: el,
              id: id,
              audioSrc: audioSrc,
          };
      })
      .filter(item => item && item.audioSrc);
}

function playAudioSequentially() {
  if (currentIndex < 0) {
    currentIndex = 0;
  } else if (currentIndex >= audioElements.length) {
    stopAudio();
    return;
  }

  const { element, audioSrc } = audioElements[currentIndex];
  highlightElement(element);

  currentAudio = new Audio(audioSrc);
  // Set the playback rate of the audio
  currentAudio.playbackRate = parseFloat(audioSpeed);
  currentAudio.play();

  currentAudio.onended = () => {
    unhighlightElement(element);
    currentIndex++;
    playAudioSequentially();
  };

  currentAudio.onerror = () => {
    unhighlightElement(element);
    currentIndex++;
    playAudioSequentially();
  };
}

function playPreviousAudio() {
  currentIndex -= 1;
  stopAudio();
  unhighlightAllElements();
  isPlaying = true;
  setPlayPauseIcon();
  playAudioSequentially();
}

function playNextAudio() {
  currentIndex += 1;
  stopAudio();
  unhighlightAllElements();
  isPlaying = true;
  setPlayPauseIcon();
  playAudioSequentially();
}

function togglePlayPause() {
  if (isPlaying) {
    if (currentAudio) currentAudio.pause();
    if (eli5Audio) eli5Audio.pause();
    isPlaying = !isPlaying;
  } else {
    if (eli5Active && eli5Audio) {
      eli5Audio.play();
    } else {
      if (currentAudio) {
        currentAudio.play();
      } else {
        gatherAudioElements();
        currentIndex = 0;
        playAudioSequentially();
      }
    }
    isPlaying = !isPlaying;
  }
  setPlayPauseIcon();
}

function toggleCheckboxState(inputId, toState = null) {
  const checkbox = document.getElementById(inputId);
  if (checkbox) {
    if (toState !== null) {
      checkbox.checked = toState;
    } else {
      checkbox.checked = !checkbox.checked;
    }
  } else {
      console.error(`No element found with ID: ${inputId}`);
  }
}

function toggleReadAloud() {
  readAloudMode = !readAloudMode;
  setCookie("readAloudMode", readAloudMode);
  
  const readAloudIcon = document.getElementById("toggle-read-aloud-icon");
  const autoplayContainer = document.getElementById("autoplay-container");
  const describeImagesContainer = document.getElementById("describe-images-container");
  const sidebar = document.getElementById("sidebar");
  
  toggleCheckboxState("toggle-tts", readAloudMode);
  
  if (autoplayContainer && describeImagesContainer) {
    if (readAloudMode) {
      autoplayContainer.classList.remove("hidden");
      describeImagesContainer.classList.remove("hidden");
      sidebar.setAttribute("aria-hidden", "false");
    } else {
      autoplayContainer.classList.add("hidden");
      describeImagesContainer.classList.add("hidden");
      // Only set aria-hidden if no elements in the sidebar have focus
      if (!sidebar.contains(document.activeElement)) {
        sidebar.setAttribute("aria-hidden", "true");
      }
    }
  }
  
  togglePlayBar();

  if (readAloudMode) {
    gatherAudioElements();
    if (autoplayMode) {
      currentIndex = 0;
      isPlaying = true;
      setPlayPauseIcon();
      playAudioSequentially();
    }
  } else {
    stopAudio();
    unhighlightAllElements();
  }
}

function loadToggleButtonState() {
  // Ensure all required elements exist before proceeding
  const readAloudItem = document.getElementById("toggle-easy");
  const eli5Item = document.getElementById("toggle-eli5");
  const autoplayContainer = document.getElementById("autoplay-container");
  const describeImagesContainer = document.getElementById("describe-images-container");

  if (!readAloudItem || !eli5Item) {
    // If elements aren't ready, retry after a short delay
    setTimeout(loadToggleButtonState, 100);
    return;
  }

  const readAloudModeCookie = getCookie("readAloudMode");
  const eli5ModeCookie = getCookie("eli5Mode");

  if (readAloudModeCookie) {
    readAloudMode = readAloudModeCookie === "true";
    toggleCheckboxState("toggle-tts", readAloudMode);
    
    // Show/hide autoplay container based on readAloudMode
    if (autoplayContainer) {
      if (readAloudMode) {
        autoplayContainer.classList.remove("hidden");
        describeImagesContainer.classList.remove("hidden");
      } else {
        autoplayContainer.classList.add("hidden");
        describeImagesContainer.classList.add("hidden");
      }
    }
  }

  // Initialize autoplay after a brief delay to ensure everything is loaded
  setTimeout(() => {
    if (readAloudMode && autoplayMode) {
      gatherAudioElements();
      currentIndex = 0;
      isPlaying = true;
      setPlayPauseIcon();
      playAudioSequentially();
    }
  }, 500);

  if (eli5ModeCookie) {
    eli5Mode = eli5ModeCookie === "true";
    toggleCheckboxState("toggle-eli5", eli5Mode);

    // Automatically display ELI5 content if mode is enabled
    if (eli5Mode && translations) {
      const mainSection = document.querySelector(
        'section[data-id^="sectioneli5"]'
      );
      if (mainSection) {
        const eli5Id = mainSection.getAttribute("data-id");
        const eli5Text = translations[eli5Id];
        if (eli5Text) {
          const eli5Container = document.getElementById("eli5-content");
          eli5Container.textContent = eli5Text;
          eli5Container.classList.remove("hidden");
        }
      }
    }
  }
  togglePlayBar();
}

function toggleEli5Mode() {
  eli5Mode = !eli5Mode;
  setCookie("eli5Mode", eli5Mode, 7);
  toggleCheckboxState("toggle-eli5", eli5Mode);

  if (isPlaying) stopAudio();
  unhighlightAllElements();

  // Automatically display ELI5 content when mode is toggled on
  if (eli5Mode) {
    // Find the main section element that contains the eli5 data-id
    const mainSection = document.querySelector(
      'section[data-id^="sectioneli5"]'
    );
    if (mainSection) {
      const eli5Id = mainSection.getAttribute("data-id");
      const eli5Text = translations[eli5Id];

      if (eli5Text) {
        // Update the ELI5 content in the sidebar
        const eli5Container = document.getElementById("eli5-content");
        eli5Container.textContent = eli5Text;
        eli5Container.classList.remove("hidden");

        // Highlight both the main section and the ELI5 content
        //highlightElement(mainSection);

        // If read aloud mode is active, start playing the audio
        if (readAloudMode) {
          highlightElement(eli5Container);
          const eli5AudioSrc = audioFiles[eli5Id];
          if (eli5AudioSrc) {
            stopAudio();
            eli5Active = true;
            eli5Audio = new Audio(eli5AudioSrc);
            eli5Audio.playbackRate = parseFloat(audioSpeed);
            eli5Audio.play();

            eli5Audio.onended = () => {
              unhighlightElement(eli5Container);
              eli5Active = false;
              isPlaying = false;
              setPlayPauseIcon();
            };

            isPlaying = true;
            setPlayPauseIcon();
          }
        }
      }
    }
  } else {
    // Clear the ELI5 content when mode is turned off
    document.getElementById("eli5-content").textContent = "";
    document.getElementById("eli5-content").classList.add("hidden");
  }
}

function initializePlayBar() {
  let playBarVisible = getCookie("playBarVisible");
  if (playBarVisible === "true") {
    document.getElementById("play-bar").classList.remove("hidden");
  } else {
    document.getElementById("play-bar").classList.add("hidden");
  }
}

function initializeAutoplay() {
  if (readAloudMode && autoplayMode) {
    gatherAudioElements();
    currentIndex = 0;
    isPlaying = true;
    setPlayPauseIcon();
    playAudioSequentially();
  }
}

function initializeAudioSpeed() {
  let savedAudioSpeed = getCookie("audioSpeed");
  if (savedAudioSpeed) {
    audioSpeed = savedAudioSpeed;
    document.getElementById("read-aloud-speed").textContent = audioSpeed + "x";

    // Set the playback rate for currentAudio and eli5Audio if they exist
    if (currentAudio) {
      currentAudio.playbackRate = audioSpeed;
    }
    if (eli5Audio) {
      eli5Audio.playbackRate = audioSpeed;
    }

    // Update button styles
    document.querySelectorAll(".read-aloud-change-speed").forEach((btn) => {
      let speedClass = Array.from(btn.classList).find((cls) =>
        cls.startsWith("speed-")
      );
      let btnSpeed = speedClass.split("-").slice(1).join(".");
      if (btnSpeed === audioSpeed) {
        btn.classList.remove("bg-black", "text-gray-300");
        btn.classList.add("bg-white", "text-black");
      } else {
        btn.classList.remove("bg-white", "text-black");
        btn.classList.add("bg-black", "text-gray-300");
      }
    });
  }
}

function togglePlayBar() {
  if (readAloudMode) {
    document.getElementById("play-bar").classList.remove("hidden");
    setCookie("playBarVisible", "true", 7); // Save state in cookie
  } else {
    document.getElementById("play-bar").classList.add("hidden");
    setCookie("playBarVisible", "false", 7); // Save state in cookie
    stopAudio();
    unhighlightAllElements();
  }
}

function togglePlayBarSettings() {
  let readAloudSettings = document.getElementById("read-aloud-settings");
  if (readAloudSettings.classList.contains("opacity-0")) {
    readAloudSettings.classList.add(
      "opacity-100",
      "pointer-events-auto",
      "h-auto"
    );
    readAloudSettings.classList.remove(
      "opacity-0",
      "pointer-events-none",
      "h-0"
    );
  } else {
    readAloudSettings.classList.remove(
      "opacity-100",
      "pointer-events-auto",
      "h-auto"
    );
    readAloudSettings.classList.add("h-0", "opacity-0", "pointer-events-none");
  }
}

function setPlayPauseIcon() {
  if (isPlaying) {
    document.getElementById("read-aloud-play-icon").classList.add("hidden");
    document.getElementById("read-aloud-pause-icon").classList.remove("hidden");
  } else {
    document.getElementById("read-aloud-play-icon").classList.remove("hidden");
    document.getElementById("read-aloud-pause-icon").classList.add("hidden");
  }
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (eli5Audio) {
    eli5Audio.pause();
    eli5Audio = null;
  }
  isPlaying = false;
  setPlayPauseIcon();
}

function changeAudioSpeed(event) {
  // Get the button that was clicked
  let button = event.target;

  // Extract the speed value from the class
  let speedClass = Array.from(button.classList).find((cls) =>
    cls.startsWith("speed-")
  );
  audioSpeed = speedClass.split("-").slice(1).join(".");
  document.getElementById("read-aloud-speed").textContent = audioSpeed + "x";

  // Save the audio speed to a cookie
  setCookie("audioSpeed", audioSpeed, 7);

  // Check if currentAudio or eli5Audio is not empty
  if (currentAudio || eli5Audio) {
    // Change the playBackRate to the current speed
    if (currentAudio) {
      currentAudio.playbackRate = audioSpeed;
    }
    if (eli5Audio) {
      eli5Audio.playbackRate = audioSpeed;
    }
  }

  // Update button styles
  document.querySelectorAll(".read-aloud-change-speed").forEach((btn) => {
    if (btn === button) {
      btn.classList.remove("bg-black", "text-gray-300");
      btn.classList.add("bg-white", "text-black");
    } else {
      btn.classList.remove("bg-white", "text-black");
      btn.classList.add("bg-black", "text-gray-300");
    }
  });
}

// Highlight text while audio is playing
function highlightElement(element) {
  if (element) {
    element.classList.add(
      "outline-dotted",
      "outline-yellow-500",
      "outline-4",
      "box-shadow-outline",
      "rounded-lg"
    );
  }
}

function unhighlightElement(element) {
  if (element) {
    element.classList.remove(
      "outline-dotted",
      "outline-yellow-500",
      "outline-4",
      "box-shadow-outline",
      "rounded-lg"
    );
  }
}

function unhighlightAllElements() {
  document.querySelectorAll(".outline-dotted").forEach((element) => {
    element.classList.remove(
      "outline-dotted",
      "outline-yellow-500",
      "outline-4",
      "box-shadow-outline",
      "rounded-lg"
    );
  });
}

function handleElementClick(event) {
  if (readAloudMode) {
    const element = event.currentTarget;
    const dataId = element.getAttribute("data-id");

    document.querySelectorAll(".outline-dotted").forEach((el) => {
      if (el !== element && !element.contains(el)) {
        unhighlightElement(el);
      }
    });

    // Always handle main content clicks, regardless of eli5 mode
    if (!dataId.startsWith("sectioneli5")) {
      const audioSrc = audioFiles[dataId];
      if (audioSrc) {
        stopAudio();
        currentAudio = new Audio(audioSrc);
        highlightElement(element);
        currentAudio.playbackRate = parseFloat(audioSpeed);
        currentAudio.play();
        currentIndex = audioElements.findIndex((item) => item.id === dataId);

        currentAudio.onended = () => {
          unhighlightElement(element);
          currentIndex =
            audioElements.findIndex((item) => item.id === dataId) + 1;
          playAudioSequentially();
        };

        currentAudio.onerror = () => {
          unhighlightElement(element);
          currentIndex =
            audioElements.findIndex((item) => item.id === dataId) + 1;
          playAudioSequentially();
        };

        isPlaying = true;
        setPlayPauseIcon();
      }
    }
  }
}

// Toggle the left nav bar, Toggle Menu
function toggleNav() {
  const navToggle = document.querySelector(".nav__toggle");
  const navList = document.querySelector(".nav__list");
  const navLinks = document.querySelectorAll(".nav__list-link");
  const navPopup = document.getElementById("navPopup");

  if (!navList || !navToggle || !navLinks || !navPopup) {
    return; // Exit if elements are not found
  }

  const isNavOpen = !navList.hasAttribute("hidden");
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  console.log("toggleNav - Nav is open:", isNavOpen);

  if (isNavOpen) {
    const scrollPosition = navList.scrollTop;
    setCookie("navScrollPosition", scrollPosition, 7, basePath);
    navToggle.setAttribute("aria-expanded", "false");
    navList.setAttribute("hidden", "true");
    setCookie("navState", "closed", 7, basePath);
  } else {
    navToggle.setAttribute("aria-expanded", "true");
    navList.removeAttribute("hidden");
    setCookie("navState", "open", 7, basePath);

    // First restore the saved position immediately
    const savedPosition = getCookie("navScrollPosition");
    if (savedPosition) {
      navList.scrollTop = parseInt(savedPosition);
    }

    // Find the active link
    const activeLink = Array.from(navLinks).find(
      link => link.getAttribute("href") === currentPath
    );

    if (activeLink) {
      // Make the active link focusable and give it focus for keyboard navigation
      activeLink.setAttribute("tabindex", "0");
      
      setTimeout(() => {
        const linkRect = activeLink.getBoundingClientRect();
        const navRect = navList.getBoundingClientRect();
        const isInView = (
          linkRect.top >= navRect.top &&
          linkRect.bottom <= navRect.bottom
        );
        
        if (!isInView) {
          activeLink.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        activeLink.focus({ preventScroll: true });
      }, 100);
    }
  }

  navPopup.classList.toggle("-translate-x-full");
  navPopup.setAttribute(
    "aria-hidden",
    navPopup.classList.contains("-translate-x-full") ? "true" : "false"
  );
  navPopup.classList.toggle("left-2");
}

// Next and previous pages
function previousPage() {
  const currentHref = window.location.href.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav__list-link");
  const navList = document.querySelector(".nav__list");

  // // Save current scroll position before navigation
  // if (navList) {
  //   const scrollPosition = navList.scrollTop;
  //   setCookie("navScrollPosition", scrollPosition, 7, basePath);
  // }
  
  for (let i = 0; i < navItems.length; i++) {
    if (navItems[i].getAttribute("href") === currentHref && i > 0) {
      const scrollPosition = navList?.scrollTop || 0;
      setCookie("navScrollPosition", scrollPosition, 7, basePath);
      window.location.href = navItems[i - 1].getAttribute("href");
      break;
    }
  }
}

function nextPage() {
  const currentHref = window.location.href.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav__list-link");
  const navList = document.querySelector(".nav__list");

  for (let i = 0; i < navItems.length; i++) {
    if (navItems[i].getAttribute("href") === currentHref && i < navItems.length - 1) {
      const scrollPosition = navList?.scrollTop || 0;
      setCookie("navScrollPosition", scrollPosition, 7, basePath);
      window.location.href = navItems[i + 1].getAttribute("href");
      break;
    }
  }
}

// Easy-Read Mode Functionality

// Function to toggle Easy-Read mode
function toggleEasyReadMode() {
  easyReadMode = !easyReadMode;
  setCookie("easyReadMode", easyReadMode, 7);
  toggleCheckboxState("toggle-easy", easyReadMode);

  // Update the aria-pressed attribute
  // toggleButton.setAttribute("aria-pressed", easyReadMode);

  stopAudio();
  currentLanguage = document.getElementById("language-dropdown").value;
  fetchTranslations();
  gatherAudioElements(); // Call this after fetching translations to update audio elements
}

// Function to load Easy-Read mode state from the cookie
function loadEasyReadMode() {
  const easyReadModeCookie = getCookie("easyReadMode");
  

  if (easyReadModeCookie !== "") {
    easyReadMode = easyReadModeCookie === "true";

    toggleCheckboxState("toggle-easy", easyReadMode);

    // Update the aria-pressed attribute
    //toggleButton.setAttribute("aria-pressed", easyReadMode);

    stopAudio();
    currentLanguage = document.getElementById("language-dropdown").value;
    fetchTranslations();
    gatherAudioElements(); // Call this after fetching translations to update audio elements
  }
}

// Functionalities to store variables in the cookies
function setCookie(name, value, days = 7, path = "/") {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=" + path;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name + "=; Max-Age=-99999999; path=" + path;
}
