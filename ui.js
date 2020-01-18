$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navLinks = $("#nav-links");
  const $navSubmit = $("#nav-submit");
  const $navFavorites = $("#nav-favorites");
  const $navMyStories = $("#nav-my-stories");
  const $favoritedList = $("#favorited-articles");


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event Handler for Clicking Submit Link
   */

  $navSubmit.on("click", function () {
    // Show the Login and Create Account Forms
    $submitForm.slideToggle();
  });

  /**
   * Event Handler for Article Form Submit
   */

  $submitForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // Get data from submit form
    const $author = $("#author").val();
    const $title = $("#title").val();
    const $url = $("#url").val();

    // Add story to story list
    const newStory = {
      author: $author,
      title: $title,
      url: $url
    }
    // call addStory
    const addedStory = await storyList.addStory(currentUser, newStory);
    // convert story to html item
    const $newStoryMarkup = generateStoryHTML(addedStory);

    //clears author, title, url
    $("#author").val("");
    $("#title").val("");
    $("#url").val("");

    // prepend markup to list
    $allStoriesList.prepend($newStoryMarkup);

    $submitForm.slideToggle();

  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();

    if (currentUser) {
      $favoritedList.hide();
    }
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A rendering function to generate Favorite List. Then render it.
   */

  async function generateFavorites() {
    // loop through all of our favorites and generate HTML for them
    for (let favorite of currentUser.favorites) {
      const result = generateStoryHTML(favorite);
      $favoritedList.append(result);
    }
  }

  /**
   * Toggles star class for favorites;
   * If there is a solid star on article, remove the story, else add story to list
   */

  $(".articles-container").on("click", ".star-class", async function () {
    let storyId = $(this).parent()[0].id;
    let isFavorited = $(this).children().hasClass("fas");
    
    currentUser.favorites = isFavorited ? 
      await currentUser.removeFavorite(currentUser, storyId) : 
      await currentUser.addFavorite(currentUser, storyId);
    
      $(this).children().toggleClass("fas far");
  })

  /**
   * Toggles favorites list
   */

  $navFavorites.on("click", function () {
    $allStoriesList.hide();
    $ownStories.hide();
    $favoritedList.show();

    $favoritedList.empty();
    generateFavorites();
  })

  /**
   * Toggles my stories list
   */

  $navMyStories.on("click", function () {
    hideElements();
    $favoritedList.hide();
    $ownStories.show();
    $ownStories.empty();
    // await  currentUser =  User.getLoggedInUser(currentUser.loginToken, currentUser.username);
    generateOwnStories();
  })
/**
   * A function to generate own story list
   */
  function generateOwnStories() {
    console.log(currentUser.ownStories);

    for (let ownStory of currentUser.ownStories) {
      const result = generateStoryHTML(ownStory);
      
      $("i").removeClass("hidden"); // delete trashcan icon appears
      
      $ownStories.append(result);
    }
  }
  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let star = "far";

    // Finds favorited article in favorites arr and keeps it favorited
    // on homepage
    if (currentUser) {
      for (let i = 0; i < currentUser.favorites.length; i++) {
        if (currentUser.favorites[i].storyId === story.storyId) {
          star = "fas";
        }
      }
    }

    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span class="star-class">
          <i class="fas fa-trash-alt hidden" id="trash"></i>
        </span> 
        <span class="star-class">
          <i class="${star} fa-star" id="star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    //shows nav links after login
    $navLinks.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
