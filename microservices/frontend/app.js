(() => {
  const apiFetch = async (path, options = {}) => {
    const finalOptions = { ...options, headers: { ...(options.headers || {}) } };
    if (finalOptions.body && !finalOptions.headers["Content-Type"]) {
      finalOptions.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(path, finalOptions);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed." }));
      throw new Error(error.message || "Request failed.");
    }

    return response.json();
  };

  const state = {
    users: [],
    tags: [],
    notes: [],
    weather: null,
  };

  const elements = {
    notesList: document.getElementById("notes-list"),
    noteUser: document.getElementById("note-user"),
    noteTag: document.getElementById("note-tag"),
    usersCount: document.getElementById("users-count"),
    notesCount: document.getElementById("notes-count"),
    tagsCount: document.getElementById("tags-count"),
    weatherCard: document.getElementById("weather-card"),
    statusMessage: document.getElementById("status-message"),
    weatherCity: document.getElementById("weather-city"),
  };

  const formatDate = value => new Date(value).toLocaleString();
  const findUser = userId => state.users.find(user => user.id === userId);
  const findTag = tagId => state.tags.find(tag => tag.id === tagId);

  const setStatus = message => {
    elements.statusMessage.textContent = message;
  };

  const renderSelectOptions = () => {
    elements.noteUser.innerHTML = "";
    elements.noteTag.innerHTML = "";

    if (state.users.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Create a user first";
      option.value = "";
      elements.noteUser.appendChild(option);
    } else {
      state.users.forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.name} (${user.email})`;
        elements.noteUser.appendChild(option);
      });
    }

    const noTagOption = document.createElement("option");
    noTagOption.value = "";
    noTagOption.textContent = "No tag";
    elements.noteTag.appendChild(noTagOption);

    state.tags.forEach(tag => {
      const option = document.createElement("option");
      option.value = tag.id;
      option.textContent = tag.name;
      elements.noteTag.appendChild(option);
    });
  };

  const renderSummary = () => {
    elements.usersCount.textContent = String(state.users.length);
    elements.notesCount.textContent = String(state.notes.length);
    elements.tagsCount.textContent = String(state.tags.length);
  };

  const renderWeather = () => {
    if (!state.weather) {
      elements.weatherCard.innerHTML = "";
      const heading = document.createElement("h4");
      heading.textContent = "Weather";
      const message = document.createElement("p");
      message.textContent = "Run a lookup to populate this panel.";
      elements.weatherCard.appendChild(heading);
      elements.weatherCard.appendChild(message);
      return;
    }

    elements.weatherCard.innerHTML = "";
    const heading = document.createElement("h4");
    heading.textContent = state.weather.displayName;
    const condition = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = state.weather.condition;
    condition.appendChild(strong);
    const details = document.createElement("p");
    details.textContent = `${state.weather.temperatureF} F, humidity ${state.weather.humidity}%, wind ${state.weather.windMph} mph`;
    const updated = document.createElement("p");
    updated.textContent = `Updated ${formatDate(state.weather.queriedAt)}`;
    elements.weatherCard.appendChild(heading);
    elements.weatherCard.appendChild(condition);
    elements.weatherCard.appendChild(details);
    elements.weatherCard.appendChild(updated);
  };

  const renderNotes = () => {
    elements.notesList.innerHTML = "";

    if (state.notes.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.textContent = "No notes yet. Save one on the left to see it here.";
      elements.notesList.appendChild(placeholder);
      return;
    }

    state.notes.forEach(note => {
      const user = findUser(note.userId);
      const tags = note.tagIds.map(findTag).filter(Boolean);
      const item = document.createElement("li");
      const article = document.createElement("article");
      const header = document.createElement("div");

      const title = document.createElement("h4");
      title.textContent = note.title;
      const date = document.createElement("span");
      date.textContent = formatDate(note.createdAt);

      const content = document.createElement("p");
      content.textContent = note.content;

      const meta = document.createElement("div");
      const author = document.createElement("span");
      author.textContent = user ? `By ${user.name}` : `User ${note.userId}`;
      const tagWrap = document.createElement("span");

      if (tags.length === 0) {
        tagWrap.textContent = "No tag";
      } else {
        tags.forEach(tag => {
          const pill = document.createElement("span");
          pill.textContent = tag.name;
          tagWrap.appendChild(pill);
          tagWrap.appendChild(document.createTextNode(" "));
        });
      }

      header.appendChild(title);
      header.appendChild(date);
      meta.appendChild(author);
      meta.appendChild(tagWrap);
      article.appendChild(header);
      article.appendChild(content);
      article.appendChild(meta);
      item.appendChild(article);
      elements.notesList.appendChild(item);
    });
  };

  const renderAll = () => {
    renderSelectOptions();
    renderSummary();
    renderWeather();
    renderNotes();
  };

  const loadDashboard = async city => {
    setStatus("Loading dashboard from the API gateway.");
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    const dashboard = await apiFetch(`/api/dashboard${query}`);
    state.users = dashboard.users;
    state.notes = dashboard.notes;
    state.tags = dashboard.tags;
    state.weather = dashboard.weather;
    renderAll();
    setStatus(`Loaded ${dashboard.summary.totalNotes} notes from Project 3.`);
  };

  document.getElementById("user-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
      }),
    });

    form.reset();
    await loadDashboard(elements.weatherCity.value.trim() || "phoenix");
  });

  document.getElementById("tag-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await apiFetch("/api/tags", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") || "").trim(),
        color: String(formData.get("color") || "").trim() || "#2563eb",
      }),
    });

    form.reset();
    document.getElementById("tag-color").value = "#2563eb";
    await loadDashboard(elements.weatherCity.value.trim() || "phoenix");
  });

  document.getElementById("notes-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const userId = String(formData.get("userId") || "").trim();
    const tagId = String(formData.get("tagId") || "").trim();

    await apiFetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({
        title: String(formData.get("title") || "").trim(),
        content: String(formData.get("content") || "").trim(),
        userId,
        tagIds: tagId ? [tagId] : [],
      }),
    });

    form.reset();
    renderSelectOptions();
    await loadDashboard(elements.weatherCity.value.trim() || "phoenix");
  });

  document.getElementById("weather-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const city = elements.weatherCity.value.trim() || "phoenix";
    const weather = await apiFetch(`/api/weather?city=${encodeURIComponent(city)}`);
    state.weather = weather;
    renderWeather();
    setStatus(`Weather loaded for ${weather.displayName}.`);
  });

  loadDashboard("phoenix").catch(error => {
    setStatus(error.message);
  });
})();
