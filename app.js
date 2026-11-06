"use strict";

// GET запрашивает пять записей; POST создает тестовую запись.

// адреса вынесены отдельно
const GET_URL = "https://jsonplaceholder.typicode.com/posts?_limit=5";
const POST_URL = "https://jsonplaceholder.typicode.com/posts";

// находим элементы страницы. DOM = объектная модель HTML-документа.
const loadButton = document.getElementById("load-button");
const loadStatus = document.getElementById("load-status");
const postsList = document.getElementById("posts-list");
const postForm = document.getElementById("post-form");
const titleInput = document.getElementById("post-title");
const bodyInput = document.getElementById("post-body");
const createButton = document.getElementById("create-button");
const createStatus = document.getElementById("create-status");
const createdPost = document.getElementById("created-post");

// показывает сообщение и назначает цвет по типу (info, success, error)
function showStatus(element, message, type = "info") {
  // textContent выводит текст, не превращая его в HTML-код
  element.textContent = message;
  element.className = `status ${type}`;
}

// Создает карточку с заголовком, текстом и (необязательно) ID
function makePostCard(title, body, id = null) {
  const card = document.createElement("article");
  card.className = "post-card";

  // для загруженных GET-записей ID не нужен; для POST выводим ID ответа.
  if (id !== null) {
    const idLabel = document.createElement("span");
    idLabel.className = "post-id";
    idLabel.textContent = `ID публикации: ${id}`;
    card.append(idLabel);
  }

  const heading = document.createElement("h3");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = body;
  card.append(heading, paragraph);
  return card;
}

// загружает публикации, проверяет HTTP-ответ и обновляет список через DOM
async function loadPosts() {
  // отключаем кнопку на время запроса, чтобы избежать повторных нажатий
  loadButton.disabled = true;
  showStatus(loadStatus, "Загрузка публикаций...");

  try {
    // await приостанавливает функцию до завершения асинхронного fetch
    const response = await fetch(GET_URL);

    // при HTTP 404/500 fetch не выбрасывает ошибку: проверка ok обязательна
    if (!response.ok) {
      throw new Error(`Ошибка HTTP ${response.status}`);
    }

    // получаем массив объектов, преобразовав тело ответа из JSON
    const posts = await response.json();
    if (!Array.isArray(posts)) {
      throw new Error("Сервер вернул данные в неожиданном формате");
    }

    // готовим карточки и заменяем прежний список без перезагрузки страницы
    const cards = document.createDocumentFragment();
    posts.slice(0, 5).forEach((post) => {
      cards.append(makePostCard(post.title, post.body));
    });
    postsList.replaceChildren(cards);
    showStatus(loadStatus, `Публикации загружены: ${Math.min(posts.length, 5)}.`, "success");
  } catch (error) {
    // обрабатываем сетевые сбои, HTTP-ошибки и некорректный JSON
    showStatus(loadStatus, `Не удалось загрузить публикации. ${error.message}. Попробуйте ещё раз.`, "error");
  } finally {
    // finally выполняется и при успехе, и при ошибке: разрешаем повторный клик
    loadButton.disabled = false;
  }
}

// проверяет форму, отправляет POST и показывает ID новой публикации
async function createPost(event) {
  // отменяем обычную отправку формы, чтобы не перезагружать страницу
  event.preventDefault();

  // trim удаляет пробелы по краям, в том числе у строк из одних пробелов
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title || !body) {
    showStatus(createStatus, "Заполните и заголовок, и текст публикации.", "error");
    return; // не отправляем запрос, если есть незаполненное поле
  }

  createButton.disabled = true;
  showStatus(createStatus, "Отправка публикации...");
  createdPost.replaceChildren();

  try {
    // POST передает JSON в теле запроса; Content-Type указывает формат
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 })
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP ${response.status}`);
    }

    // сервер возвращает JSON с созданной записью, включая ее ID
    const newPost = await response.json();
    if (newPost.id === undefined || newPost.id === null) {
      throw new Error("Сервер не вернул ID публикации");
    }

    createdPost.append(makePostCard(title, body, newPost.id));
    showStatus(createStatus, "Публикация успешно создана!", "success");
    postForm.reset(); // очищаем поля только после успешного запроса
  } catch (error) {
    showStatus(createStatus, `Не удалось создать публикацию. ${error.message}. Попробуйте ещё раз.`, "error");
    // введенные данные при ошибке остаются для повторной попытки
  } finally {
    createButton.disabled = false;
  }
}

// регистрируем обработчики событий кнопки и формы
loadButton.addEventListener("click", loadPosts);
postForm.addEventListener("submit", createPost);
