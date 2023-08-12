/**
 *
 * Only allow to submit a talk description if it's longer than 30 characters
 * @param {string} talkDescriptionText
 * @returns
 */
function isTalkDescriptionValid(talkDescriptionText) {
  return talkDescriptionText && talkDescriptionText.length >= 120;
}

function setTalkDescriptionError(showError) {
  if (showError) {
    const errorElement = document.getElementById("btnGenerateTitleError");
    errorElement.style.visibility = "visible";
  } else {
    const errorElement = document.getElementById("btnGenerateTitleError");
    errorElement.style.visibility = "hidden";
  }
}

/**
 * Sets the UI into a "loading" state
 */
function setLoading() {
  const generatedTitle = document.getElementById("generatedTitleText");
  generatedTitle.innerText = "";

  const btnGenerateTitle = document.getElementById("btnGenerateTitle");
  btnGenerateTitle.disabled = true;

  const results = document.getElementById("results");
  results.style.visibility = "inherit";

  const loaders = document.querySelectorAll(".loader");
  loaders.forEach((loader) => {
    loader.style.visibility = "visible";
  });
}

/**
 *
 * Resets the "loading" state and given the generated title text
 * it updates the UI with the title
 * @param {string} generatedTitleText
 */
function setReady(generatedTitleText) {
  const results = document.getElementById("results");
  results.style.visibility = "inherit";

  const loaders = document.querySelectorAll(".loader");
  loaders.forEach((loaderElement) => {
    loaderElement.style.visibility = "hidden";
  });

  const generatedTitle = document.getElementById("generatedTitleText");
  generatedTitle.innerText = generatedTitleText;

  const btnGenerateTitle = document.getElementById("btnGenerateTitle");
  btnGenerateTitle.disabled = false;

  setTalkDescriptionError(false);
}

document.addEventListener("DOMContentLoaded", () => {
  const btnGenerateTitle = document.getElementById("btnGenerateTitle");
  btnGenerateTitle.addEventListener("click", (event) => {
    const talkDescriptionText = document.getElementById(
      "talkDescriptionText"
    ).value;

    event.preventDefault();

    if (isTalkDescriptionValid(talkDescriptionText)) {
      generateTitle(talkDescriptionText);
    } else {
      setTalkDescriptionError(true);
    }
  });
});

async function generateTitle(textOrigin) {
  // Set loading to true
  setLoading();

  // Clean up the textarea input from newlines and spaces
  const talkDescriptionText = textOrigin.trim();

  // Send a POST request to the server with the talk description
  // which ends up scheduling a new async job on Trigger.dev
  const response = await fetch("/api/titles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      talkDescriptionText,
    }),
  });

  // Can potentially do something with the data here
  // but unneeded
  await response.json();

  const title = await pollServerForTitle();

  // Update text on the page
  setReady(title);
}

/**
 *
 * To keep things simple in this async workflow, on clicking the generate button
 * we disable it to avoid multiple requests to the server and then start a loop
 * that polls the server every second to see if the title text was generated
 * and return it
 * @returns {Promise<string>} the generated title text
 */
async function pollServerForTitle() {
  let success = false;
  let title = null;

  while (!success) {
    const response = await fetch("/api/titles", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.title) {
      title = data.title;
      success = true;
    } else {
      await sleep();
    }
  }

  return title;
}

/**
 *
 * Simple 1s sleep function
 * @returns {Promise<void>}
 */
async function sleep() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}
