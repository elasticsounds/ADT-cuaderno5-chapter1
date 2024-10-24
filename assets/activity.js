const ActivityTypes = Object.freeze({
  MULTIPLE_CHOICE: "activity_multiple_choice",
  FILL_IN_THE_BLANK: "activity_fill_in_the_blank",
  SORTING: "activity_sorting",
  OPEN_ENDED_ANSWER: "activity_open_ended_answer",
  MATCHING: "activity_matching",
  TRUE_FALSE: "activity_true_false",
  FILL_IN_A_TABLE: "activity_fill_in_a_table",
});

let validateHandler = null; // Store the current validation handler function
let retryHandler = null; // Store the current retry handler function

function prepareActivity() {
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

  activityOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectInteractiveElement(option);
    });
  });
}

// TRUE FALSE ACTIVITY
let selectedButton = null;

function prepareTrueFalseActivity(section) {
  //Select all elements with the button class. These are radio button input elements for accessbility purposes.
  const buttons = section.querySelectorAll(".button");
  buttons.forEach((button) => {
    button.onclick = function () {
      selectButton(button);
    };
  });
}

function checkTrueFalse() {
  // Uncomment to add a no selection error message when the user hits submit.
  // const noSelectionMessage = document.getElementById(
  //   "no-selection-error-message"
  // );

  // if (!selectedButton) {
  //   noSelectionMessage.classList.remove("hidden");
  //   return;
  // }

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

function selectInteractiveElement(option) {
  // Deselect all radio buttons in the same group

  // Find the parent group of the clicked button
  const radioGroup = option.closest('[role="group"]');

  radioGroup.querySelectorAll(".activity-option").forEach((opt) => {
    // Reset any button or div state within the option if they exist
    const interactiveElement = opt.querySelector(
      "[role='radio'], input[type='radio'], button, div"
    );
    if (interactiveElement) {
      interactiveElement.setAttribute("aria-checked", "false");
    }

    // Remove any feedback
    const feedback = opt.querySelector(".feedback");
    if (feedback) {
      feedback.remove();
    }

    // Select the span element inside the label and update its class
    const associatedLabel = opt.querySelector("span");
    if (associatedLabel) {
      associatedLabel.classList.remove("bg-blue-500", "text-white");
      associatedLabel.classList.add("bg-gray-200", "hover:bg-gray-300");
    }
  });

  // Select the clicked option's associated label
  const associatedLabel = option.querySelector("span");
  if (associatedLabel) {
    associatedLabel.classList.remove("bg-gray-200", "hover:bg-gray-300");
    associatedLabel.classList.add("bg-blue-500", "text-white");
  }

  // Handle selection state for the option
  const selectedInteractiveElement = option.querySelector(
    "[role='radio'], input[type='radio'], button, div"
  );
  if (selectedInteractiveElement) {
    selectedInteractiveElement.setAttribute("aria-checked", "true");
  }

  // Set the selected option
  selectedOption = option;
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
  const noSelectionMessage = document.getElementById(
    "no-selection-error-message"
  );

  // Check if any option is selected by querying for activity-option with aria-checked="true"
  const selectedOption = document.querySelector(
    '.activity-option [aria-checked="true"]'
  );

  if (!selectedOption) {
    noSelectionMessage.classList.remove("hidden");
    return;
  }

  //const dataActivityItem = selectedOption.closest('.activity-option').getAttribute("data-activity-item");

  // Find the first child element that is a radio button, button, or div within the selected option
  const selectedInteractiveElement = selectedOption.closest(
    '[role="radio"], input[type="radio"], button, div'
  );
  let dataActivityItem = null;

  if (selectedInteractiveElement) {
    dataActivityItem =
      selectedInteractiveElement.getAttribute("data-activity-item");
  }

  const isCorrect = correctAnswers[dataActivityItem];
  console.log("is correct value ", isCorrect); // Debugging purposes

  // Remove previous feedback if the correct answer is selected
  const allFeedbacks = document.querySelectorAll(".feedback");
  allFeedbacks.forEach((feedback) => feedback.remove());

  provideFeedback(
    selectedOption,
    isCorrect,
    correctAnswers[dataActivityItem],
    ActivityTypes.MULTIPLE_CHOICE
  );

  const associatedLabel = selectedOption
    .closest(".activity-option")
    .querySelector("span");

  if (isCorrect) {
    associatedLabel.classList.add("bg-green-600");
  } else {
    associatedLabel.classList.add("bg-red-200", "text-black");
  }

  updateSubmitButtonAndToast(
    isCorrect,
    translateText("next-activity"),
    ActivityTypes.MULTIPLE_CHOICE
  );
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
    wordCard.addEventListener("dragstart", dragSort);
    wordCard.addEventListener("mousedown", () => highlightBoxes(true));
    wordCard.addEventListener("mouseup", () => highlightBoxes(false));
    wordCard.classList.add(
      "cursor-pointer",
      "transition",
      "duration-300",
      "hover:bg-yellow-300",
      "transform",
      "hover:scale-105"
    );
  });

  const categories = document.querySelectorAll(".category");
  categories.forEach((category) => {
    category.addEventListener("dragover", allowDrop);
    category.addEventListener("drop", dropSort);
    category.addEventListener("click", () => placeWord(category.dataset.activityCategory));
  });

  document.getElementById("feedback").addEventListener("click", resetActivity);
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

function placeWord(category) {
  if (!currentWord) {
    console.log("No word selected.");
    return;
  }

  // Correct query to target the div with the exact data-activity-category value
  const categoryDiv = document.querySelector(
    `div[data-activity-category="${category}"]`
  );
  const listElement = categoryDiv
    ? categoryDiv.querySelector(".word-list")
    : null;

  if (!listElement) {
    console.error(
      `Category "${category}" not found or no word list available.`
    );
    return;
  }

  // Find the word card and get the wordKey
  const wordCard = document.querySelector(
    `.word-card[data-activity-item="${currentWord}"]`
  );
  if (!wordCard) {
    console.error(`Word card for "${currentWord}" not found.`);
    return;
  }

  //const wordKey = wordCard.getAttribute("data-activity-item");

  // Clone the word card to include the image
  const clonedWordCard = wordCard.cloneNode(true);
  clonedWordCard.classList.remove("border-blue-700", "border-2", "box-border");
  clonedWordCard.classList.add("placed-word", "max-w-40", "m-2", "p-2");
  clonedWordCard.addEventListener("click", () => removeWord(clonedWordCard));

  // Ensure the container uses flexbox
  listElement.classList.add("flex", "flex-wrap");

  // Append the cloned card to the category's word list
  listElement.appendChild(clonedWordCard);

  // Apply styles to the word card
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

//Commented out code for being able to remove a word from a box
function removeWord(listItem) {
  const wordCard = Array.from(document.querySelectorAll(".word-card")).find(
    (card) => card.textContent === listItem.textContent
  );
  if (wordCard) {
    wordCard.classList.remove(
      "bg-gray-300",
      "cursor-not-allowed",
      "bg-blue-300",
      "text-gray-400",
      "hover:bg-gray-300",
      "hover:scale-100"
    );
    wordCard.classList.add("bg-yellow-200");
  }
  listItem.remove();
}

function checkSorting() {
  const feedbackElement = document.getElementById("feedback");
  let correctCount = 0;
  let incorrectCount = 0;

  // Declare the wordCards array by iterating over all elements with the class 'word-card'
  const wordCards = Array.from(document.querySelectorAll(".word-card"));

  wordCards.forEach((wordCard) => {
    const word = wordCard.textContent.trim();
    const wordKey = wordCard.getAttribute("data-activity-item");
    const correctCategory = correctAnswers[wordKey];
    const listItems = document.querySelectorAll(`li[data-activity-category]`);

    listItems.forEach((item) => {
      if (item.textContent === word) {
        if (
          item.getAttribute("data-activity-category").split("-")[0] ===
          correctCategory
        ) {
          item.classList.add("bg-green-200");
          item.classList.remove("bg-red-200");
          item.innerHTML += ' <i class="fas fa-check"></i>';
          correctCount++;
        } else {
          item.classList.add("bg-red-200");
          item.classList.remove("bg-green-200");
          item.innerHTML += ' <i class="fas fa-times"></i>';
          incorrectCount++;
        }
      }
    });
  });
  const allCorrect = correctCount === wordCards.length;

  feedbackElement.textContent = translateText("sorting-results", {
    correctCount: correctCount,
    incorrectCount: incorrectCount,
  });
  feedbackElement.classList.remove("text-red-500", "text-green-500");
  feedbackElement.classList.add(
    correctCount === wordCards.length ? "text-green-500" : "text-red-500"
  );

  // Update the submit button and toast based on whether all answers are correct
  updateSubmitButtonAndToast(
    allCorrect,
    allCorrect ? translateText("next-activity") : translateText("retry"),
    ActivityTypes.SORTING
  );
}

function resetActivity() {
  currentWord = "";
  document.querySelectorAll("li").forEach((item) => item.remove());
  document.querySelectorAll(".word-card").forEach((card) => {
    card.classList.remove(
      "bg-gray-300",
      "cursor-not-allowed",
      "bg-blue-300",
      "text-gray-400",
      "hover:bg-gray-300",
      "hover:scale-100"
    );
    card.classList.add("bg-yellow-100", "shadow-lg");
  });

  highlightBoxes(false);
  document.getElementById("feedback").textContent = "";
}

function allowDrop(event) {
  event.preventDefault();
}

function dragSort(event) {
  event.dataTransfer.setData("text", event.target.textContent);
  event.target.classList.add("selected");
  highlightBoxes(true);
}

function dropSort(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text");
  currentWord = data;
  const category = event.target.closest(".category").dataset.activityCategory;
  const categoryName = category;
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

// Adding event listeners to existing words after being added to a dropzone
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("activity-item")) {
    const dropzone = event.target.closest(".dropzone");
    if (dropzone) {
      dropWord(dropzone.id);
    }
  }
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