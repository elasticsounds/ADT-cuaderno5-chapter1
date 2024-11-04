const ActivityTypes = Object.freeze({
  MULTIPLE_CHOICE: "activity_multiple_choice",
  FILL_IN_THE_BLANK: "activity_fill_in_the_blank",
  SORTING: "activity_sorting",
  OPEN_ENDED_ANSWER: "activity_open_ended_answer",
  MATCHING: "activity_matching",
  TRUE_FALSE: "activity_true_false",
  FILL_IN_A_TABLE: "activity_fill_in_a_table",
});

// AUDIO FOR ACTIVITES
let activityAudio = null; // Will hold our audio elements

function initializeAudioElements() {
  if (!activityAudio) {
    activityAudio = {
      drop: new Audio('./assets/sounds/drop.mp3'),
      success: new Audio('./assets/sounds/success.mp3'),
      error: new Audio('./assets/sounds/error.mp3'),
      reset: new Audio('./assets/sounds/reset.mp3')  // New reset sound
    };

    // Configure audio elements
    Object.values(activityAudio).forEach(audio => {
      audio.volume = 0.5;
    });
  }
  return activityAudio;
}

// Add this function where we have our other audio-related code
function playActivitySound(soundKey) {
  if (!activityAudio || !activityAudio[soundKey]) {
    console.log(`Sound ${soundKey} not available`);
    return;
  }

  // Reset the audio to start if it's already playing
  activityAudio[soundKey].currentTime = 0;
  
  activityAudio[soundKey].play().catch(err => {
    console.log(`Error playing ${soundKey} sound:`, err);
  });
}

let validateHandler = null; // Store the current validation handler function
let retryHandler = null; // Store the current retry handler function

function prepareActivity() {

  // Initialize audio at the start of activity preparation
  initializeAudioElements();

  // Select all sections with role="activity"
  const activitySections = document.querySelectorAll(
    'section[role="activity"]'
  );

  // Select the submit button
  const submitButton = document.getElementById("submit-button");

  if (activitySections.length === 0) {
    submitButton.style.display = "none";
  } else {
    activitySections.forEach((section) => {
      const activityType = section.dataset.sectionType;

      switch (activityType) {
        case ActivityTypes.MULTIPLE_CHOICE:
          prepareMultipleChoiceActivity(section);
          validateHandler = () => validateInputs(ActivityTypes.MULTIPLE_CHOICE);
          break;
        case ActivityTypes.FILL_IN_THE_BLANK:
          validateHandler = () =>
            validateInputs(ActivityTypes.FILL_IN_THE_BLANK);
          break;
        case ActivityTypes.OPEN_ENDED_ANSWER:
          validateHandler = () =>
            validateInputs(ActivityTypes.OPEN_ENDED_ANSWER);
          break;
        case ActivityTypes.SORTING:
          prepareSortingActivity(section);
          validateHandler = () => validateInputs(ActivityTypes.SORTING);
          break;
        case ActivityTypes.MATCHING:
          prepareMatchingActivity(section);
          validateHandler = () => validateInputs(ActivityTypes.MATCHING);
          break;
        case ActivityTypes.TRUE_FALSE:
          prepareTrueFalseActivity(section);
          submitButton.addEventListener("click", () =>
            validateInputs(ActivityTypes.TRUE_FALSE)
          );
          break;
        case ActivityTypes.FILL_IN_A_TABLE:
          submitButton.addEventListener("click", () =>
            validateInputs(ActivityTypes.FILL_IN_A_TABLE)
          );
          break;
        default:
          console.error("Unknown activity type:", activityType);
      }
      if (validateHandler) {
        submitButton.removeEventListener("click", validateHandler);
        submitButton.addEventListener("click", validateHandler);
      }
    });
  }
}

function prepareMultipleChoiceActivity(section) {
  const activityOptions = section.querySelectorAll(".activity-option");

  // Remove any previous event listeners
  activityOptions.forEach((option) => {
    const newOption = option.cloneNode(true);
    option.parentNode.replaceChild(newOption, option);
  });

  // Add new event listeners
  section.querySelectorAll(".activity-option").forEach((option) => {
    option.addEventListener("click", () => selectInteractiveElement(option));
    
    // Add hover effect classes
    option.classList.add(
      'cursor-pointer',
      'transition-all',
      'duration-200',
      'hover:shadow-md'
    );

    // Ensure option label has proper styling
    const label = option.querySelector("span");
    if (label) {
      label.classList.add(
        'px-4',
        'py-2',
        'rounded-full',
        'font-medium',
        'transition-colors',
        'duration-200'
      );
    }
  });
}

// TRUE FALSE ACTIVITY
let selectedButton = null;

function prepareTrueFalseActivity(section) {
  // Select all radio inputs within the section
  const buttons = section.querySelectorAll("input[type='radio']");
  
  // Add event listeners to each radio button
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Set the clicked button as the selectedButton
      selectedButton = button;
      
      // Optional: Visually indicate the selection by toggling classes
      //buttons.forEach(btn => btn.parentElement.classList.remove("selected"));
      //button.parentElement.classList.add("selected");
    });
  });
}

/*
function prepareTrueFalseActivity(section) {
  //Select all elements with the button class. These are radio button input elements for accessbility purposes.
  const buttons = section.querySelectorAll(".button");
  buttons.forEach((button) => {
    button.onclick = function () {
      selectButton(button);
    };
  });
}
*/

function checkTrueFalse() {
  // Uncomment to add a no selection error message when the user hits submit.
  // const noSelectionMessage = document.getElementById(
  //   "no-selection-error-message"
  // );

  // if (!selectedButton) {
  //   noSelectionMessage.classList.remove("hidden");
  //   return;
  // }

    // Show error if no selection is made
    if (!selectedButton) {
      return;
    } 
    

  const dataActivityItem = selectedButton.getAttribute("data-activity-item");
  const isCorrect = correctAnswers[dataActivityItem];

  // If the activity includes a correction input.
  const correctionInput = document.getElementById("correction-input");

  //Show correction input if the correct answer in false.
  if (correctionInput) {
    if (
      isCorrect &&
      selectedButton.getAttribute("data-activity-item") === "item-2"
    ) {
      correctionInput.classList.remove("hidden");
    }
  }

  provideFeedback(selectedButton, isCorrect, correctAnswers[dataActivityItem]);

  if (isCorrect) {
    selectedButton.classList.add("bg-green-200");
    selectedButton.classList.add("text-black");
  } else {
    selectedButton.classList.add("bg-red-200");
    selectedButton.classList.add("text-black");
  }

  updateSubmitButtonAndToast(
    isCorrect,
    "Next Activity",
    ActivityTypes.TRUE_FALSE
  );
}

// function selectInteractiveElement(option) {
//   // Deselect all radio buttons in the same group

//   // Find the parent group of the clicked button
//   const radioGroup = option.closest('[role="group"]');

//   radioGroup.querySelectorAll(".activity-option").forEach((opt) => {
//     // Reset any button or div state within the option if they exist
//     const interactiveElement = opt.querySelector(
//       "[role='radio'], input[type='radio'], button, div"
//     );
//     if (interactiveElement) {
//       interactiveElement.setAttribute("aria-checked", "false");
//     }

//     // Remove any feedback
//     const feedback = opt.querySelector(".feedback");
//     if (feedback) {
//       feedback.remove();
//     }

//     // Select the span element inside the label and update its class
//     const associatedLabel = opt.querySelector("span");
//     if (associatedLabel) {
//       associatedLabel.classList.remove("bg-blue-500", "text-white");
//       associatedLabel.classList.add("bg-gray-200", "hover:bg-gray-300");
//     }
//   });

//   // Select the clicked option's associated label
//   const associatedLabel = option.querySelector("span");
//   if (associatedLabel) {
//     associatedLabel.classList.remove("bg-gray-200", "hover:bg-gray-300");
//     associatedLabel.classList.add("bg-blue-500", "text-white");
//   }

//   // Handle selection state for the option
//   const selectedInteractiveElement = option.querySelector(
//     "[role='radio'], input[type='radio'], button, div"
//   );
//   if (selectedInteractiveElement) {
//     selectedInteractiveElement.setAttribute("aria-checked", "true");
//   }

//   // Set the selected option
//   selectedOption = option;
// }

// Also update the selectInteractiveElement function to log selection

function selectInteractiveElement(option) {
  console.log("=== Selecting option ===");
  console.log("Option selected:", option);
  console.log("Option data-activity-item:", option.getAttribute("data-activity-item"));
  
  // Find the parent group of the clicked option
  const radioGroup = option.closest('[role="group"]');
  if (!radioGroup) {
    console.log("No radio group found");
    return;
  }

  // Deselect all options in the group
  radioGroup.querySelectorAll(".activity-option").forEach((opt) => {
    console.log("Resetting option:", opt);
    // Reset appearance
    opt.classList.remove('ring-2', 'ring-blue-500');
    const label = opt.querySelector("span");
    if (label) {
      label.classList.remove('bg-blue-500', 'text-white');
      label.classList.add('bg-gray-200', 'text-gray-800');
    }
    
    // Remove any previous feedback
    const feedback = opt.querySelector(".feedback");
    if (feedback) feedback.remove();
  });

  // Select the clicked option
  option.classList.add('ring-2', 'ring-blue-500');
  const label = option.querySelector("span");
  if (label) {
    label.classList.remove('bg-gray-200', 'text-gray-800');
    label.classList.add('bg-blue-500', 'text-white');
  }

  // Set selection state
  selectedOption = option;
  console.log("Selection complete. Current selectedOption:", selectedOption);
}

function validateInputs(activityType) {
  switch (activityType) {
    case ActivityTypes.MULTIPLE_CHOICE:
      checkMultipleChoice();
      break;
    case ActivityTypes.FILL_IN_THE_BLANK:
      checkFillInTheBlank();
      break;
    case ActivityTypes.OPEN_ENDED_ANSWER:
      checkTextInputs();
      break;
    case ActivityTypes.SORTING:
      checkSorting();
      break;
    case ActivityTypes.MATCHING:
      checkMatching();
      break;
    case ActivityTypes.TRUE_FALSE:
      checkTrueFalse();
      break;
    case ActivityTypes.FILL_IN_A_TABLE:
      checkTableInputs();
      break;
    default:
      console.error("Unknown validation type:", activityType);
  }
}

function autofillCorrectAnswers() {
  const inputs = document.querySelectorAll('input[type="text"]');

  inputs.forEach((input) => {
    const dataActivityItem = input.getAttribute("data-activity-item");
    const correctAnswer = correctAnswers[dataActivityItem];

    if (correctAnswer) {
      input.value = correctAnswer;
    }
  });
}

function provideFeedback(element, isCorrect, _correctAnswer, activityType) {
  // Create a new span element to show feedback message
  let feedback = document.createElement("span");
  feedback.classList.add(
    "feedback",
    "ml-2",
    "px-2",
    "py-1",
    "rounded-full",
    "text-lg",
    "w-32",
    "text-center"
  );
  feedback.setAttribute("role", "alert");

  // Use data-activity-item as the id for aria-labelledby
  const dataActivityItem = element.getAttribute("data-activity-item");
  if (dataActivityItem) {
    feedback.setAttribute("aria-labelledby", dataActivityItem);
  }

  // Append feedback next to the specific input element for fill-in-the-blank activity
  if (activityType === ActivityTypes.FILL_IN_THE_BLANK) {
    element.parentNode.appendChild(feedback); // Append feedback next to the input element
  }

  if (activityType === ActivityTypes.MULTIPLE_CHOICE) {
    // Find the container to place the feedback message for other activity types
    const feedbackContainer = document.querySelector(".questions");
    if (feedbackContainer) {
      feedbackContainer.appendChild(feedback);
    }
  }

  // Clear any previous feedback content and classes (for both correct/incorrect cases)
  feedback.innerText = "";
  feedback.classList.remove(
    "bg-green-200",
    "text-green-700",
    "bg-red-200",
    "text-red-700"
  );

  // Handle feedback specifically for fill-in-the-blank activities
  if (
    activityType === ActivityTypes.FILL_IN_THE_BLANK ||
    activityType === ActivityTypes.OPEN_ENDED_ANSWER ||
    activityType === ActivityTypes.FILL_IN_A_TABLE
  ) {
    if (isCorrect) {
      feedback.classList.add("bg-green-200", "text-green-700");
      feedback.innerText = translateText("well-done");
    } else {
      feedback.innerText = translateText("fill-in-the-blank-try-again");
      feedback.classList.add("bg-red-200", "text-red-700");
    }
  }

  // Handle feedback for multiple-choice activities
  if (activityType === ActivityTypes.MULTIPLE_CHOICE) {
    // Locate the label associated with the selected multiple-choice option
    const label = element.closest(".activity-option");

    // Ensure the label element exists, this is to handle multiple choice activity
    if (label) {
      // Find the span element within the label
      const associatedLabel = label.querySelector("span");

      // Check if the associated label exists
      if (associatedLabel) {
        // Remove any existing feedback marks (like checkmarks or cross marks)
        const existingMark = associatedLabel.querySelector(".mark");
        if (existingMark) {
          existingMark.remove();
        }

        // Create and add the new mark based on correctness
        const mark = document.createElement("span");
        mark.className = "mark";

        // If the answer is correct, provide a positive feedback message and mark
        if (isCorrect) {
          feedback.innerText = translateText("multiple-choice-correct-answer");
          feedback.classList.add("bg-green-200", "text-green-700");
          mark.classList.add("mark", "tick");
          mark.innerText = "✔️"; // or use a check mark icon
          associatedLabel.prepend(mark); // Add tick to the start of the span
          associatedLabel.classList.add("bg-green-600");
        } else {
          // If the answer is incorrect, provide negative feedback and mark
          feedback.classList.add("bg-red-200", "text-red-700");
          feedback.innerText = translateText("multiple-choice-try-again");
          mark.classList.add("mark", "cross");
          mark.innerText = "❌"; // or use a cross mark icon
          associatedLabel.prepend(mark); // Add cross to the start of the span
          associatedLabel.classList.add("bg-red-200", "text-black");
        }
      } // End of associated label check
    } // End of label check for multiple choice activity
  } // End of multiple choice activity check

  // Ensure aria-describedby is set
  feedback.id = `feedback-${dataActivityItem}`;
  element.setAttribute("aria-describedby", feedback.id);
}

function checkMultipleChoice() {
  console.log("=== Starting validation ===");
  
  // Check if an option is selected
  if (!selectedOption) {
    console.log("No option selected");
    const noSelectionMessage = document.getElementById("no-selection-error-message");
    if (noSelectionMessage) {
      noSelectionMessage.classList.remove("hidden");
    }
    return;
  }
  
  console.log("Selected option:", selectedOption);
  console.log("Selected option dataset:", selectedOption.dataset);
  
  // Get the data-activity-item value
  const dataActivityItem = selectedOption.getAttribute("data-activity-item");
  console.log("data-activity-item value:", dataActivityItem);
  
  // Log the correctAnswers object
  console.log("correctAnswers object:", correctAnswers);
  
  // Check if the answer is correct
  const isCorrect = correctAnswers[dataActivityItem];
  console.log("Is correct?", isCorrect);

  // Remove any existing feedback first
  document.querySelectorAll(".feedback").forEach(el => {
    console.log("Removing existing feedback:", el);
    el.remove();
  });

  // Create feedback container
  const feedbackContainer = document.createElement("div");
  feedbackContainer.className = `feedback flex items-center justify-center mt-4 ${
    isCorrect ? 'text-green-600' : 'text-red-600'
  }`;

  // Create feedback icon
  const icon = document.createElement("span");
  icon.className = `
    flex items-center justify-center
    w-8 h-8 rounded-full
    ${isCorrect ? 'bg-green-100' : 'bg-red-100'}
  `;
  icon.textContent = isCorrect ? '✓' : '✗';

  // Create feedback message
  const message = document.createElement("span");
  message.className = "ml-2 font-medium";
  message.textContent = isCorrect ? "¡Correcto!" : "Incorrect, try again";

  // Assemble and append feedback
  feedbackContainer.appendChild(icon);
  feedbackContainer.appendChild(message);
  selectedOption.appendChild(feedbackContainer);

  // Update option styling based on correctness
  selectedOption.classList.add(
    isCorrect ? 'bg-green-50' : 'bg-red-50',
    'transition-colors',
    'duration-200'
  );

  console.log("Updating submit button and toast with isCorrect:", isCorrect);
  
  // Update submit button and toast
  updateSubmitButtonAndToast(
    isCorrect,
    translateText("next-activity"),
    ActivityTypes.MULTIPLE_CHOICE
  );

  // Play appropriate sound
  if (isCorrect) {
    playActivitySound('success');
  } else {
    playActivitySound('error');
  }
  
  console.log("=== Validation complete ===");
}


/**
 * Counts unfilled inputs and moves focus to the first unfilled one.
 * @param {NodeList} inputs - List of input elements (e.g., text inputs, textareas).
 * @returns {number} - The number of unfilled inputs.
 */
function countUnfilledInputs(inputs) {
  let unfilledCount = 0; // Counter for unfilled inputs
  let firstUnfilledInput = null; // To store the first unfilled input

  // Loop through each input and check if it's filled
  inputs.forEach((input) => {
    const isFilled = input.value.trim() !== ""; // Check if the input has a value

    // Provide feedback based on whether the input is filled
    provideFeedback(input, isFilled, "");

    // Count the input as unfilled if it's empty
    if (!isFilled) {
      unfilledCount++;

      // Store the first unfilled input for focus
      if (!firstUnfilledInput) {
        firstUnfilledInput = input;
      }
    }
  });

  // If there's an unfilled input, move focus to the first one
  if (firstUnfilledInput) {
    firstUnfilledInput.focus(); // Focus on the first unfilled input
  }

  return unfilledCount; // Return the total count of unfilled inputs
}

function checkFillInTheBlank() {
  const inputs = document.querySelectorAll('input[type="text"]');

  // Remove old feedback before processing new inputs
  const oldFeedbacks = document.querySelectorAll(".feedback");
  oldFeedbacks.forEach((feedback) => feedback.remove());

  let allCorrect = true;
  let firstIncorrectInput = null; // boolean equivalent of null is false.

  inputs.forEach((input) => {
    const dataActivityItem = input.getAttribute("data-activity-item"); // Assuming each input has a data-activity-item attribute
    const correctAnswer = correctAnswers[dataActivityItem]; // Get the correct answer based on the data-activity-item

    // Safeguard in case correctAnswer is undefined or null
    const isCorrect =
      correctAnswer !== undefined &&
      correctAnswer !== null &&
      correctAnswer.toLowerCase() === input.value.trim().toLowerCase();

    provideFeedback(
      input,
      isCorrect,
      correctAnswer,
      ActivityTypes.FILL_IN_THE_BLANK
    );

    if (!isCorrect) {
      allCorrect = false;
      if (!firstIncorrectInput) {
        firstIncorrectInput = input; // Save the first incorrect input
      }

      const feedbackElement = input.parentNode.querySelector(".feedback");
      if (feedbackElement) {
        feedbackElement.setAttribute("aria-live", "assertive");
        feedbackElement.id = `feedback-${dataActivityItem}`;
        input.setAttribute("aria-describedby", feedbackElement.id);
      }
    }
  });

  //Move focus to the first incomplete input if there are any
  if (!allCorrect && firstIncorrectInput) {
    firstIncorrectInput.focus();
  }

  // Play appropriate sound based on correctness
  if (allCorrect) {
    playActivitySound('success');
  } else {
    playActivitySound('error');
  }

  // Use the countUnfilledInputs function here
  let unfilledCount = countUnfilledInputs(inputs);

  updateSubmitButtonAndToast(
    allCorrect,
    translateText("next-activity"),
    ActivityTypes.FILL_IN_THE_BLANK,
    unfilledCount
  );
}

function checkTextInputs() {
  const textInputs = document.querySelectorAll('input[type="text"], textarea');

  // Use the updated countUnfilledInputs function to count unfilled inputs and provide feedback
  const unfilledCount = countUnfilledInputs(textInputs);

  // Determine whether all inputs are filled
  const allFilled = unfilledCount === 0;

  // Play appropriate sound based on whether all inputs are filled
  if (allFilled) {
    playActivitySound('success');
  } else {
    playActivitySound('error');
  }

  updateSubmitButtonAndToast(
    allFilled,
    translateText("next-activity"),
    ActivityTypes.OPEN_ENDED_ANSWER,
    unfilledCount
  );
}

function checkTableInputs() {
  const textInputs = document.querySelectorAll('input[type="text"], textarea');

  // Use the updated countUnfilledInputs function to count unfilled inputs and provide feedback
  const unfilledCount = countUnfilledInputs(textInputs);

  // Determine whether all inputs are filled
  const allFilled = unfilledCount === 0;

  // Play appropriate sound based on whether all inputs are filled
  if (allFilled) {
    playActivitySound('success');
  } else {
    playActivitySound('error');
  }

  updateSubmitButtonAndToast(
    allFilled,
    translateText("next-activity"),
    ActivityTypes.FILL_IN_A_TABLE,
    unfilledCount
  );
}

function updateSubmitButtonAndToast(
  isCorrect,
  buttonText = translateText("next-activity"),
  activityType,
  unfilledCount = 0 // default value to maintain compatibility
) {
  const submitButton = document.getElementById("submit-button");
  const toast = document.getElementById("toast");

  // Remove all existing event listeners before adding new ones
  submitButton.removeEventListener("click", validateHandler);
  submitButton.removeEventListener("click", retryHandler);
  checkCurrentActivityCompletion(isCorrect);
  if (isCorrect) {
    submitButton.textContent = buttonText;
    
    if (toast) {
      toast.classList.remove("hidden");
      toast.classList.remove("bg-red-200", "text-red-700");
      toast.classList.add("bg-green-200", "text-green-700");

      if (
        activityType === ActivityTypes.OPEN_ENDED_ANSWER ||
        activityType === ActivityTypes.FILL_IN_A_TABLE
      ) {
        toast.textContent = translateText("answers-submitted");
      } else {
        toast.textContent = translateText("correct-answer");
      }
    }

    if (buttonText === translateText("next-activity")) {
      submitButton.addEventListener("click", nextPage); // Add the new click handler
      submitButton.setAttribute("aria-label", translateText("next-activity"));

      const activityId = location.pathname.substring(location.pathname.lastIndexOf("/") + 1).split(".")[0];
      localStorage.setItem(`${activityId}_success`, "true")
    }

    // Hide the Toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  } else {
    if (activityType === ActivityTypes.MULTIPLE_CHOICE) {
      // Show Retry button only for multiple-choice
      submitButton.textContent = translateText("retry"); // Change button text to Retry
      submitButton.setAttribute("aria-label", translateText("retry")); // Add an aria-label for screen readers

      retryHandler = retryActivity; // Assign the retry activity to retryHandler
      submitButton.addEventListener("click", retryHandler); // Use retryHandler to manage the retry click
    } else {
      // For non-multiple-choice activities, keep the submit button
      submitButton.textContent = translateText("submit-text"); // Keep the Submit button text
      submitButton.setAttribute("aria-label", translateText("submit-text"));
      submitButton.addEventListener("click", validateHandler);
    }

    // Update the toast message for incorrect answers
    toast.classList.remove("hidden");
    toast.classList.add("bg-red-200", "text-red-700");

    // Handle unfilled inputs for OPEN_ENDED_ANSWER activity
    if (
      activityType === ActivityTypes.OPEN_ENDED_ANSWER ||
      activityType === ActivityTypes.FILL_IN_THE_BLANK ||
      activityType === ActivityTypes.FILL_IN_A_TABLE
    ) {
      if (unfilledCount > 0) {
        toast.textContent = translateText("fill-in-the-blank-not-complete", {
          unfilledCount: unfilledCount,
        });
      } else if (
        unfilledCount == 0 &&
        !isCorrect &&
        activityType === ActivityTypes.FILL_IN_THE_BLANK
      ) {
        toast.textContent = translateText(
          "fill-in-the-blank-correct-the-answers"
        );
      }
    } else {
      toast.textContent = translateText("fill-in-the-blank-try-again");
    }

    // Hide the Toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }
}

function retryActivity() {
  // Remove all feedback messages
  const allFeedbacks = document.querySelectorAll(".feedback");
  allFeedbacks.forEach((feedback) => feedback.remove());

  // Remove toast message
  const toast = document.getElementById("toast");
  if (toast) {
    toast.remove();
  }

  // Remove cross marks from incorrect options
  const allMarks = document.querySelectorAll(".mark");
  allMarks.forEach((mark) => mark.remove());

  // Reset background color and enable clicking again
  const allLabels = document.querySelectorAll(".activity-option span");
  allLabels.forEach((label) => {
    label.classList.remove("bg-green-600", "bg-red-200", "text-black");
    label.classList.add("bg-gray-200", "hover:bg-gray-300");
  });

  // Reset button text and remove event listener
  const submitButton = document.getElementById("submit-button");

  if (submitButton) {
    submitButton.textContent = translateText("submit-text");
    submitButton.setAttribute("aria-label", translateText("submit-text")); // Add an aria-label for screen readers

    // Remove any lingering event listeners
    submitButton.removeEventListener("click", retryHandler);
    submitButton.removeEventListener("click", validateHandler);

    submitButton.addEventListener("click", validateHandler);
  }
}

// SORTING ACTIVITY

function prepareSortingActivity(section) {
  const wordCards = document.querySelectorAll(".word-card");
  wordCards.forEach((wordCard) => {
    wordCard.addEventListener("click", () => selectWordSort(wordCard));
    wordCard.addEventListener('dragstart', handleDragStart);
    wordCard.addEventListener("mousedown", () => highlightBoxes(true));
    wordCard.addEventListener("mouseup", () => highlightBoxes(false));
    
    // Make sure the card is draggable
    //wordCard.setAttribute('draggable', 'true');
    
    wordCard.classList.add(
      "cursor-pointer",
      "transition",
      "duration-300",
      "hover:bg-yellow-300",
      "transform",
      "hover:scale-105"
    );

    // Make images inside cards not draggable individually
    const cardImage = wordCard.querySelector('img');
    if (cardImage) {
      cardImage.setAttribute('draggable', 'false');
      cardImage.style.pointerEvents = 'none'; // Prevent image from intercepting drag
    }
  });

  const categories = document.querySelectorAll('.category');
  categories.forEach((category) => {
    category.addEventListener('dragover', allowDrop);
    category.addEventListener('drop', dropSort);
    
    // Simplified category click handler
    category.addEventListener('click', (e) => {
      if (currentWord) {
        // If we clicked on a placed word, don't remove it, just add the new word
        if (e.target.closest('.placed-word')) {
          e.stopPropagation();
        }
        placeWord(category.getAttribute('data-activity-category'));
      }
    });
  });

  document.getElementById("feedback").addEventListener("click", resetActivity);
}

// New drag start handler
function handleDragStart(event) {
  // Ensure we're dragging the word card even if drag started on child element
  const wordCard = event.target.closest('.word-card');
  if (!wordCard) return;

  // Prevent dragging if card is already placed
  if (wordCard.classList.contains('bg-gray-300')) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.setData('text', wordCard.getAttribute('data-activity-item'));
  wordCard.classList.add('selected');
  
  // Create a drag image that includes the entire card
  if (event.dataTransfer.setDragImage) {
    event.dataTransfer.setDragImage(wordCard, 0, 0);
  }

  highlightBoxes(true);
}

function highlightBoxes(state) {
  const categories = document.querySelectorAll(".category");
  categories.forEach((category) => {
    if (state) {
      category.classList.add("bg-blue-100");

      category.classList.add("border-blue-400");
    } else {
      category.classList.remove("bg-blue-100");
      category.classList.remove("border-blue-400");
    }
  });
}

function selectWordSort(wordCard) {
  if (wordCard.classList.contains("bg-gray-300")) return;

  document
    .querySelectorAll(".word-card")
    .forEach((card) => card.classList.remove("border-blue-700"));
  wordCard.classList.add("border-blue-700", "border-2", "box-border");

  currentWord = wordCard.getAttribute("data-activity-item");

  highlightBoxes(true);
}

// Modified placeWord function to handle different card types
function placeWord(category) {
  if (!currentWord) {
    console.log("No word selected.");
    return;
  }

  playActivitySound('drop');

  const categoryDiv = document.querySelector(
    `div[data-activity-category="${category}"]`
  );
  const listElement = categoryDiv?.querySelector(".word-list");

  if (!listElement) {
    console.error(`Category "${category}" not found or no word list available.`);
    return;
  }

  const wordCard = document.querySelector(
    `.word-card[data-activity-item="${currentWord}"]`
  );
  if (!wordCard) {
    console.error(`Word card for "${currentWord}" not found.`);
    return;
  }

  const clonedWordCard = wordCard.cloneNode(true);
  
  // Handle different card types
  if (clonedWordCard.querySelector('img')) {
    // Cards with images: Create structured layout
    const contentContainer = document.createElement('div');
    contentContainer.classList.add(
      'content-container',
      'flex',
      'flex-col',
      'items-center',
      'w-full',
      'space-y-2'
    );

    const textWrapper = document.createElement('div');
    textWrapper.classList.add(
      'text-wrapper',
      'flex',
      'items-center',
      'justify-center'
    );

    // Move content into appropriate containers
    const image = clonedWordCard.querySelector('img');
    const text = clonedWordCard.querySelector('.word-text, span:not(.validation-mark)');

    if (image) {
      contentContainer.appendChild(image);
    }
    if (text) {
      textWrapper.appendChild(text);
    }
    contentContainer.appendChild(textWrapper);

    // Clear and add new structure
    while (clonedWordCard.firstChild) {
      clonedWordCard.removeChild(clonedWordCard.firstChild);
    }
    clonedWordCard.appendChild(contentContainer);
  } else {
    // Text-only or text+icon cards: Simpler inline layout
    const textWrapper = document.createElement('div');
    textWrapper.classList.add(
      'text-wrapper',
      'flex',
      'items-center',
      'justify-center',
      'w-full'
    );

    // Move all content to wrapper
    while (clonedWordCard.firstChild) {
      textWrapper.appendChild(clonedWordCard.firstChild);
    }
    clonedWordCard.appendChild(textWrapper);
  }

  // Common setup for all card types
  clonedWordCard.classList.remove("border-blue-700", "border-2", "box-border");

  clonedWordCard.classList.add(
    'placed-word',
    'max-w-40',
    'm-2',
    'p-2',
    'cursor-pointer',
    'hover:bg-gray-100'
  );


  // Disable dragging
  clonedWordCard.setAttribute('draggable', 'false');
  const clonedImage = clonedWordCard.querySelector('img');
  if (clonedImage) {
    clonedImage.setAttribute('draggable', 'false');
    clonedImage.style.pointerEvents = 'none';
  }

  // Add click handler for removal
  clonedWordCard.addEventListener("click", function() {
    removeWord(this);
  });

  // Add to category list
  listElement.classList.add("flex", "flex-wrap");
  listElement.appendChild(clonedWordCard);

  // Update original word card styling
  wordCard.classList.add(
    "bg-gray-300",
    "cursor-not-allowed",
    "text-gray-400",
    "hover:bg-gray-300",
    "hover:scale-100"
  );
  wordCard.style.border = "none";
  wordCard.classList.remove("selected", "shadow-lg");
  wordCard.removeEventListener("click", () => selectWordSort(wordCard));

  currentWord = "";
  highlightBoxes(false);
}

function removeWord(listItem) {
  if (currentWord) {
    console.log("Cannot remove - currently in placement mode");
    return;
  }

  console.log("=== Starting removeWord function ===");
  
  // Get the placed card's text and data-activity-item
  const placedText = listItem.textContent.trim();
  const placedItemId = listItem.getAttribute('data-activity-item');
  
  console.log("Placed card details:");
  console.log("- Text:", placedText);
  console.log("- Item ID:", placedItemId);

  // Find the original disabled card at the bottom, excluding placed cards
  const wordCard = Array.from(document.querySelectorAll('.word-card:not(.placed-word)'))
    .find(card => card.getAttribute('data-activity-item') === placedItemId);

  if (wordCard) {
    console.log("\nFound original card in bottom row:");
    console.log("- Text:", wordCard.textContent.trim());
    console.log("- Current classes:", wordCard.classList.toString());
    console.log("- Is bottom card:", !wordCard.classList.contains('placed-word'));
    console.log("- Parent element:", wordCard.parentElement.tagName);
    
    console.log("\nRemoving disabled classes...");
    wordCard.classList.remove(
      "bg-gray-300",
      "cursor-not-allowed",
      "text-gray-400",
      "hover:bg-gray-300",
      "hover:scale-100"
    );
    
    console.log("\nAdding back active classes...");
    wordCard.classList.add(
      "bg-white",
      "cursor-pointer",
      "hover:bg-gray-100",
      "transform",
      "hover:scale-105"
    );

    console.log("Classes after update:", wordCard.classList.toString());

    // Clear any inline styles
    wordCard.style = '';
    
    console.log("\nRe-enabling dragging...");
    wordCard.setAttribute('draggable', 'true');
    console.log("Draggable attribute now:", wordCard.getAttribute('draggable'));

    console.log("\nRe-adding event listeners...");
    // Remove old listeners first
    const newClickHandler = () => selectWordSort(wordCard);
    wordCard.removeEventListener('click', newClickHandler);
    wordCard.addEventListener('click', newClickHandler);
    
    // Re-add drag handlers
    const dragStartHandler = (e) => handleDragStart(e);
    wordCard.removeEventListener('dragstart', dragStartHandler);
    wordCard.addEventListener('dragstart', dragStartHandler);

    const mouseDownHandler = () => highlightBoxes(true);
    const mouseUpHandler = () => highlightBoxes(false);
    wordCard.removeEventListener('mousedown', mouseDownHandler);
    wordCard.removeEventListener('mouseup', mouseUpHandler);
    wordCard.addEventListener('mousedown', mouseDownHandler);
    wordCard.addEventListener('mouseup', mouseUpHandler);

    console.log("\nFinal card state:");
    console.log("- Classes:", wordCard.classList.toString());
    console.log("- Draggable:", wordCard.getAttribute('draggable'));
    console.log("- Style:", wordCard.style.cssText);

    playActivitySound('reset');
  } else {
    console.error(`Could not find original card with id: ${placedItemId}`);
    console.log("All bottom word-cards:", 
      Array.from(document.querySelectorAll('.word-card:not(.placed-word)'))
        .map(card => `${card.textContent.trim()} (${card.getAttribute('data-activity-item')})`));
  }

  console.log("\nRemoving placed card from category");
  listItem.remove();
  console.log("=== removeWord function complete ===\n");
}

// function removeWord(listItem) {
//   if (currentWord) return; // Don't remove if we're in placement mode
//   removeAndRestoreWord(listItem);
// }

function checkSorting() {
  const feedbackElement = document.getElementById("feedback");
  let correctCount = 0;
  let incorrectCount = 0;

  console.log("Starting validation check...");

  const categories = document.querySelectorAll('.category');
  
  categories.forEach(category => {
    const categoryType = category.getAttribute('data-activity-category');
    const placedWords = category.querySelectorAll('.placed-word');
    
    placedWords.forEach(placedWord => {
      const wordKey = placedWord.getAttribute('data-activity-item');
      const correctCategory = correctAnswers[wordKey];
      
      // Remove any existing validation marks
      const existingMark = placedWord.querySelector('.validation-mark');
      if (existingMark) {
        existingMark.remove();
      }

      // Create validation mark
      const mark = document.createElement('span');
      mark.classList.add(
        'validation-mark',
        'ml-2',  // margin left for spacing
        'inline-flex',
        'items-center',
        'text-lg'
      );

      if (categoryType === correctCategory) {
        console.log("✓ CORRECT placement");
        placedWord.classList.remove('bg-red-100', 'border-red-300');
        placedWord.classList.add('bg-green-100', 'border-green-300', 'border');
        mark.textContent = '✓';
        mark.classList.add('text-green-700');
        correctCount++;
      } else {
        console.log("✗ INCORRECT placement");
        placedWord.classList.remove('bg-green-100', 'border-green-300');
        placedWord.classList.add('bg-red-100', 'border-red-300', 'border');
        mark.textContent = '✗';
        mark.classList.add('text-red-700');
        incorrectCount++;
      }

      // Handle different card layouts based on content
      if (placedWord.querySelector('img')) {
        // Cards with images: Create structured layout
        let contentContainer = placedWord.querySelector('.content-container');
        if (!contentContainer) {
          contentContainer = document.createElement('div');
          contentContainer.classList.add(
            'content-container',
            'flex',
            'flex-col',
            'items-center',
            'w-full',
            'space-y-2'
          );
          
          // Move existing content into container
          while (placedWord.firstChild) {
            contentContainer.appendChild(placedWord.firstChild);
          }
          placedWord.appendChild(contentContainer);
        }

        // Create/update text wrapper
        let textWrapper = placedWord.querySelector('.text-wrapper');
        if (!textWrapper) {
          textWrapper = document.createElement('div');
          textWrapper.classList.add(
            'text-wrapper',
            'flex',
            'items-center',
            'justify-center'
          );
          
          // Move the text element into the wrapper
          const textElement = contentContainer.querySelector('.word-text, span:not(.validation-mark)');
          if (textElement) {
            textWrapper.appendChild(textElement);
          }
          contentContainer.appendChild(textWrapper);
        }
        
        // Add the mark to the text wrapper
        textWrapper.appendChild(mark);

      } else {
        // For text-only or text+icon cards: Simpler inline layout
        let textWrapper = placedWord.querySelector('.text-wrapper');
        if (!textWrapper) {
          textWrapper = document.createElement('div');
          textWrapper.classList.add(
            'text-wrapper',
            'flex',
            'items-center',
            'justify-center',
            'w-full'
          );
          
          // Move all existing content to the wrapper
          while (placedWord.firstChild) {
            textWrapper.appendChild(placedWord.firstChild);
          }
          placedWord.appendChild(textWrapper);
        }
        
        // Add the mark after the content
        textWrapper.appendChild(mark);
      }

      // Ensure proper spacing and layout
      placedWord.classList.add('p-2', 'rounded');
    });
  });

  // Rest of the validation logic remains the same...
  const totalPlacedWords = document.querySelectorAll('.placed-word').length;
  const totalWords = Object.keys(correctAnswers).length;
  const allWordsPlaced = totalPlacedWords === totalWords;
  const allCorrect = correctCount === totalWords;

  if (!allWordsPlaced) {
    const message = `Please place all words in categories before submitting. (${totalPlacedWords}/${totalWords} words placed)`;
    feedbackElement.textContent = message;
    feedbackElement.classList.remove("text-green-500");
    feedbackElement.classList.add("text-red-500");
    activityAudio.error.play().catch(err => console.log('Audio play failed:', err));
    return;
  }

  if (allCorrect) {
    activityAudio.success.play().catch(err => console.log('Audio play failed:', err));
  } else {
    activityAudio.error.play().catch(err => console.log('Audio play failed:', err));
  }

  const feedbackMessage = `You have ${correctCount} correct answers and ${incorrectCount} incorrect answers.${allCorrect ? ' Great job!' : ' Try again!'}`;
  feedbackElement.textContent = feedbackMessage;
  feedbackElement.classList.remove("text-red-500", "text-green-500");
  feedbackElement.classList.add(allCorrect ? "text-green-500" : "text-red-500");

  updateSubmitButtonAndToast(
    allCorrect,
    allCorrect ? translateText("next-activity") : translateText("retry"),
    ActivityTypes.SORTING
  );
}

function resetActivity() {
  console.log("Starting reset activity...");
  
  // Play reset sound at the start of reset
  if (activityAudio?.reset) {
    activityAudio.reset.play().catch(err => console.log('Audio play failed:', err));
  }

  currentWord = "";
  
  // Reset all placed words
  console.log("Looking for placed words to remove...");
  const placedWords = document.querySelectorAll('.placed-word');
  console.log(`Found ${placedWords.length} placed words`);
  
  // First remove all validation marks and reset card styling
  placedWords.forEach(word => {
    // Remove validation mark
    const mark = word.querySelector('.validation-mark');
    if (mark) mark.remove();
    
    // Reset background and border classes
    word.classList.remove(
      'bg-green-100',
      'bg-red-100',
      'border-green-300',
      'border-red-300',
      'border'
    );
    
    // Reset to original structure if needed
    const textWrapper = word.querySelector('.text-wrapper');
    if (textWrapper) {
      word.innerHTML = textWrapper.innerHTML.replace(/<span.*?validation-mark.*?span>/g, '');
    }
  });

  // Then remove the placed words
  placedWords.forEach((word, index) => {
    console.log(`Removing placed word ${index + 1}: "${word.textContent.trim()}"`);
    if (word.parentElement) {
      word.parentElement.removeChild(word);
    }
  });

  // Clear out any word lists in categories
  console.log("\nClearing category word lists...");
  const categories = document.querySelectorAll('.category');
  categories.forEach((category, index) => {
    console.log(`Clearing category ${index + 1}`);
    const wordList = category.querySelector('.word-list');
    if (wordList) {
      console.log(`- Found word list, clearing contents`);
      wordList.innerHTML = '';
    }
  });

  // Reset all original word cards
  console.log("\nResetting original word cards...");
  const wordCards = document.querySelectorAll('.word-card');
  console.log(`Found ${wordCards.length} word cards to reset`);
  wordCards.forEach((card, index) => {
    console.log(`Resetting word card ${index + 1}: "${card.textContent.trim()}"`);
    
    // Remove ALL background color classes
    card.classList.remove(
      'bg-gray-300',
      'cursor-not-allowed',
      'bg-blue-300',
      'text-gray-400',
      'hover:bg-gray-300',
      'hover:scale-100',
      'border-blue-700',
      'border-2',
      'box-border',
      'bg-yellow-200',
      'bg-yellow-100',
      'bg-green-100',
      'bg-red-100',
      'border-green-300',
      'border-red-300'
    );
    
    // Add the white background and other default styles
    card.classList.add(
      'bg-white',
      'cursor-pointer',
      'transition',
      'duration-300',
      'hover:bg-gray-100',
      'transform',
      'hover:scale-105'
    );
    
    // Re-enable the click event
    card.style.border = '';
    card.style.cursor = 'pointer';
    
    // Remove and re-add the click event listener to ensure it's fresh
    card.removeEventListener('click', () => selectWordSort(card));
    card.addEventListener('click', () => selectWordSort(card));
  });

  // Reset category boxes highlighting and restore original colors
  console.log("\nResetting category boxes...");
  categories.forEach((category, index) => {
    // Remove any temporary highlighting or feedback colors
    category.classList.remove(
      'bg-green-200',
      'bg-red-200',
      'bg-blue-100',
      'border-blue-400'
    );

    // Restore original category colors based on type
    const categoryType = category.getAttribute('data-activity-category');
    switch(categoryType) {
      case 'language':
        category.classList.add('bg-yellow-200', 'border-yellow-300');
        break;
      case 'social-science':
        category.classList.add('bg-blue-200', 'border-blue-300');
        break;
      case 'natural-science':
        category.classList.add('bg-green-200', 'border-green-300');
        break;
      case 'mathematics':
        category.classList.add('bg-red-200', 'border-red-300');
        break;
      case 'visual-arts':
        category.classList.add('bg-purple-200', 'border-purple-300');
        break;
    }
  });
  
  // Clear feedback message
  console.log("Clearing feedback message...");
  const feedbackElement = document.getElementById("feedback");
  if (feedbackElement) {
    feedbackElement.textContent = "";
  }

  console.log("Reset complete!");
}

function allowDrop(event) {
  event.preventDefault();
}

function dragSort(event) {
  event.dataTransfer.setData("text", event.target.getAttribute("data-activity-item"));
  event.target.classList.add("selected");
  highlightBoxes(true);
}

function dropSort(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text");
  currentWord = data;
  const category = event.target.closest(".category").dataset.activityCategory;
  
  // Play drop sound
  activityAudio.drop.play().catch(err => console.log('Audio play failed:', err));
  
  placeWord(category);
  highlightBoxes(false);
}

//MATCHING ACTIVITY

function prepareMatchingActivity(section) {
  // Add event listeners to word buttons
  const wordButtons = document.querySelectorAll(".activity-item");
  wordButtons.forEach((button) => {
    button.addEventListener("click", () => selectWord(button));
    button.addEventListener("dragstart", (event) => drag(event));
    button.style.cursor = "pointer"; // Change cursor to hand
  });

  // Add event listeners to dropzones
  const dropzones = document.querySelectorAll(".dropzone");
  dropzones.forEach((dropzone) => {
    dropzone.addEventListener("click", () => dropWord(dropzone.id));
    dropzone.addEventListener("drop", (event) => drop(event));
    dropzone.addEventListener("dragover", (event) => allowDrop(event));
    dropzone.style.cursor = "pointer"; // Change cursor to hand
  });
}

let selectedWord = null;

// Duplicate function is commented
// function allowDrop(event) {
//   event.preventDefault();
// }

function drag(event) {
  event.dataTransfer.setData(
    "text",
    event.target.getAttribute("data-activity-item")
  );
}

function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text");
  const target = event.currentTarget.querySelector("div[role='region']");
  const wordElement = document.querySelector(
    `.activity-item[data-activity-item='${data}']`
  );
  const existingWord = target.firstElementChild;

  // Check if the dropzone already has a word and return it to the original list
  if (existingWord) {
    // Move the existing word back to the original word list or swap positions
    const originalParent = wordElement.parentElement;

    // Swap the selected word with the existing word
    originalParent.appendChild(existingWord);
  }

  target.appendChild(wordElement);

  // Reset the selected word highlight
  if (selectedWord) {
    selectedWord.classList.remove("border-4", "border-blue-500");
    selectedWord = null;
  }
}

function selectWord(button) {
  // If a word is already selected, deselect it
  if (selectedWord) {
    selectedWord.classList.remove("border-4", "border-blue-500");
  }

  // Mark the current word as selected
  button.classList.add("border-4", "border-blue-500");
  selectedWord = button;
}

function dropWord(dropzoneId) {
  if (!selectedWord) return;

  const target = document
    .getElementById(dropzoneId)
    .querySelector("div[role='region']");
  const existingWord = target.firstElementChild;

  if (existingWord) {
    // Move the existing word back to the original word list or swap positions
    const originalParent = selectedWord.parentElement;

    // Swap the selected word with the existing word
    originalParent.appendChild(existingWord);
  }

  // Place the selected word in the dropzone
  target.appendChild(selectedWord);

  // Reset the selected word highlight
  selectedWord.classList.remove("border-4", "border-blue-500");
  selectedWord = null;
}

// Select all elements with the class 'activity-item'
const activityItems = document.querySelectorAll(".activity-item");

// Add event listeners to each 'activity-item'
activityItems.forEach(item => {
  item.addEventListener("click", (event) => {
    const dropzone = event.target.closest(".dropzone");
    if (dropzone) {
      dropWord(dropzone.id);
    }
  });
});

function checkMatching() {
  let correctCount = 0;

  // Reset all dropzones to default background color
  const dropzones = document.querySelectorAll(".dropzone");
  dropzones.forEach((dropzone) => {
    dropzone.classList.remove("bg-green-200", "bg-red-200");
  });

  // Loop through each item in the correctAnswers object
  Object.keys(correctAnswers).forEach((item) => {
    // Find the element with the corresponding data-activity-item
    const wordElement = document.querySelector(
      `.activity-item[data-activity-item='${item}']`
    );

    if (wordElement) {
      // Find the dropzone that contains this word element
      const parentDropzone = wordElement.closest(".dropzone");

      // Check if the item's dropzone is the correct one
      if (
        parentDropzone &&
        parentDropzone.querySelector("div[role='region']").id ===
          correctAnswers[item]
      ) {
        correctCount++;
        parentDropzone.classList.add("bg-green-200");
      } else {
        if (parentDropzone) {
          parentDropzone.classList.add("bg-red-200");
        }
      }
    }
  });

  // Update feedback
  const feedback = document.getElementById("feedback");
  const isAllCorrect = correctCount === Object.keys(correctAnswers).length;

  // Play appropriate sound based on correctness
  if (isAllCorrect) {
    playActivitySound('success');
    feedback.textContent = translateText("matching-correct-answers");
    feedback.classList.remove("text-red-500");
    feedback.classList.add("text-green-500");
  } else {
    playActivitySound('error');
    feedback.textContent = translateText("matching-correct-answers-count", {
      correctCount: correctCount,
    });
    feedback.classList.remove("text-green-500");
    feedback.classList.add("text-red-500");
  }

  if (correctCount === Object.keys(correctAnswers).length) {
    feedback.textContent = translateText("matching-correct-answers");
    feedback.classList.remove("text-red-500");
    feedback.classList.add("text-green-500");
  } else {
    feedback.textContent = translateText("matching-correct-answers-count", {
      correctCount: correctCount,
    });
    feedback.classList.remove("text-green-500");
    feedback.classList.add("text-red-500");
  }
}