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
        .getElementById("toggle-eli5-mode-button")
        .addEventListener("click", toggleEli5Mode);
      document
        .getElementById("language-dropdown")
        .addEventListener("change", switchLanguage);
      document
        .getElementById("toggle-easy-read-button")
        .addEventListener("click", toggleEasyReadMode);

      document
        .getElementById("play-pause-button")
        .addEventListener("click", togglePlayPause);
      document
        .getElementById("toggle-read-aloud")
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
      // document
      //   .getElementById("submit-button")
      //   .addEventListener("click", validateInputs);

      // left nav bar
      document.getElementById("nav-popup").addEventListener("click", toggleNav);
      document.getElementById("nav-close").addEventListener("click", toggleNav);
      const navToggle = document.querySelector(".nav__toggle");
      const navLinks = document.querySelectorAll(".nav__list-link");
      const navPopup = document.getElementById("navPopup");

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
          "pt-2",
          "pb-2",
          "flex",
          "items-center"
        );
        link.classList.add(
          "flex-grow",
          "flex",
          "items-center",
          "w-full",
          "h-full",
          "space-x-2"
        );

        // Add border top to the first element
        if (index === 0) {
          item.classList.add("border-t");
        }

        const href = link.getAttribute("href");
        const pageSectionMatch = href.match(/(\d+)_(\d+)/);
        const textId = link.getAttribute("data-text-id");

        if (pageSectionMatch) {
          const [_, pageNumber, sectionNumber] = pageSectionMatch.map(Number);
          link.innerHTML =
            "<div class='whitespace-normal'><span class='inline' data-id='page'></span><span class='inline'> " +
            `${pageNumber + 1}.${sectionNumber + 1}: ` + `</span><span class='inline' data-id='${textId}'>` + "</span></div>";
        } else {
          link.innerHTML =
            `<div class='whitespace-normal'></span><span class='inline' data-id='${textId}'></span></div>`;
        }

        if (href === window.location.pathname.split("/").pop()) {
          item.classList.add("min-h-[3rem]");
          link.classList.add(
            "border-l-4",
            "border-blue-500",
            "bg-blue-100",
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

      // Unhide navigation and sidebar after a short delay to allow animations
      setTimeout(() => {
        navPopup.classList.remove("hidden");
        document.getElementById("sidebar").classList.remove("hidden");
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
    "toggle-eli5-mode-button",
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

// Audio functionality
function gatherAudioElements() {
  audioElements = Array.from(document.querySelectorAll("[data-id]"))
    .map((el) => {
      const id = el.getAttribute("data-id");
      if (id.startsWith("sectioneli5")) return null; // Skip elements with data-id starting with sectioneli5

      let audioSrc = audioFiles[id]; // Default audio source

      // Check if Easy-Read mode is enabled and if an easy-read version exists
      if (easyReadMode) {
        const easyReadAudioId = `easyread-${id}`;
        if (audioFiles.hasOwnProperty(easyReadAudioId)) {
          audioSrc = audioFiles[easyReadAudioId]; // Use easy-read audio source if available
        }
      }

      return {
        element: el,
        id: id,
        audioSrc: audioSrc,
      };
    })
    .filter((item) => item && item.audioSrc); // Filter out null values
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

function toggleReadAloud() {
  readAloudMode = !readAloudMode;
  setCookie("readAloudMode", readAloudMode);
  document
    .getElementById("toggle-read-aloud-icon")
    .classList.toggle("fa-toggle-on", readAloudMode);
  document
    .getElementById("toggle-read-aloud-icon")
    .classList.toggle("fa-toggle-off", !readAloudMode);
  togglePlayBar();
}

function loadToggleButtonState() {
  // Ensure all required elements exist before proceeding
  const readAloudIcon = document.getElementById("toggle-read-aloud-icon");
  const eli5Icon = document.getElementById("toggle-eli5-icon");
  const eli5Content = document.getElementById("eli5-content");

  if (!readAloudIcon || !eli5Icon || !eli5Content) {
    // If elements aren't ready, retry after a short delay
    setTimeout(loadToggleButtonState, 100);
    return;
  }

  const readAloudModeCookie = getCookie("readAloudMode");
  const eli5ModeCookie = getCookie("eli5Mode");

  if (readAloudModeCookie) {
    readAloudMode = readAloudModeCookie === "true";
    document
      .getElementById("toggle-read-aloud-icon")
      .classList.toggle("fa-toggle-on", readAloudMode);
    document
      .getElementById("toggle-read-aloud-icon")
      .classList.toggle("fa-toggle-off", !readAloudMode);
  }

  if (eli5ModeCookie) {
    eli5Mode = eli5ModeCookie === "true";
    document
      .getElementById("toggle-eli5-icon")
      .classList.toggle("fa-toggle-on", eli5Mode);
    document
      .getElementById("toggle-eli5-icon")
      .classList.toggle("fa-toggle-off", !eli5Mode);

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
  document
    .getElementById("toggle-eli5-icon")
    .classList.toggle("fa-toggle-on", eli5Mode);
  document
    .getElementById("toggle-eli5-icon")
    .classList.toggle("fa-toggle-off", !eli5Mode);

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
  setCookie("eli5Mode", eli5Mode, 7); // Save state in cookie
}

function initializePlayBar() {
  let playBarVisible = getCookie("playBarVisible");
  if (playBarVisible === "true") {
    document.getElementById("play-bar").classList.remove("hidden");
  } else {
    document.getElementById("play-bar").classList.add("hidden");
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

  if (!navList.hasAttribute("hidden")) {
    navToggle.setAttribute("aria-expanded", "false");
    navList.setAttribute("hidden", "true");
  } else {
    navToggle.setAttribute("aria-expanded", "true");
    navList.removeAttribute("hidden");

    // Set focus on first link
    navLinks[0].focus();
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
  for (let i = 0; i < navItems.length; i++) {
    if (navItems[i].getAttribute("href") === currentHref) {
      if (i > 0) {
        const prevItem = navItems[i - 1];
        window.location.href = prevItem.getAttribute("href");
        document.getElementById("page-number").innerText = prevItem.innerText;
      }
      break;
    }
  }
}

function nextPage() {
  const currentHref = window.location.href.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav__list-link");
  for (let i = 0; i < navItems.length; i++) {
    if (navItems[i].getAttribute("href") === currentHref) {
      if (i < navItems.length - 1) {
        const nextItem = navItems[i + 1];
        window.location.href = nextItem.getAttribute("href");
        document.getElementById("page-number").innerText = nextItem.innerText;
      }
      break;
    }
  }
}

// Easy-Read Mode Functionality

// Function to toggle Easy-Read mode
function toggleEasyReadMode() {
  easyReadMode = !easyReadMode;

  const toggleButton = document.getElementById("toggle-easy-read-button");
  const toggleIcon = document.getElementById("toggle-easy-read-icon");

  // Toggle the icon classes
  toggleIcon.classList.toggle("fa-toggle-on", easyReadMode);
  toggleIcon.classList.toggle("fa-toggle-off", !easyReadMode);

  // Update the aria-pressed attribute
  toggleButton.setAttribute("aria-pressed", easyReadMode);

  stopAudio();
  currentLanguage = document.getElementById("language-dropdown").value;
  fetchTranslations();
  gatherAudioElements(); // Call this after fetching translations to update audio elements

  // Save the Easy-Read mode state to a cookie
  setCookie("easyReadMode", easyReadMode, 7);
}

// Function to load Easy-Read mode state from the cookie
function loadEasyReadMode() {
  const easyReadModeCookie = getCookie("easyReadMode");
  const toggleButton = document.getElementById("toggle-easy-read-button");
  const toggleIcon = document.getElementById("toggle-easy-read-icon");

  if (easyReadModeCookie !== "") {
    easyReadMode = easyReadModeCookie === "true";

    // Toggle the icon classes
    toggleIcon.classList.toggle("fa-toggle-on", easyReadMode);
    toggleIcon.classList.toggle("fa-toggle-off", !easyReadMode);

    // Update the aria-pressed attribute
    toggleButton.setAttribute("aria-pressed", easyReadMode);

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
