const SIZE = 9;
const MINE_COUNT = 10;
const TOTAL_CELLS = SIZE * SIZE;
const RECORD_LIMIT = 10;
const RECORD_KEY = "minesweeper-records";

const boardEl = document.querySelector("#board");
const statusEl = document.querySelector("#game-status");
const flagsLeftEl = document.querySelector("#flags-left");
const timerEl = document.querySelector("#timer");
const recordsEl = document.querySelector("#records");
const firebaseStatusEl = document.querySelector("#firebase-status");
const newGameButton = document.querySelector("#new-game");

const state = {
  board: [],
  firstClick: true,
  gameOver: false,
  opened: 0,
  flags: 0,
  seconds: 0,
  timerId: null,
  records: [],
  firebase: null,
};

function createEmptyBoard() {
  return Array.from({ length: TOTAL_CELLS }, (_, index) => ({
    index,
    mine: false,
    open: false,
    flagged: false,
    adjacent: 0,
  }));
}

function getNeighbors(index) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;

      const nextRow = row + dr;
      const nextCol = col + dc;

      if (nextRow >= 0 && nextRow < SIZE && nextCol >= 0 && nextCol < SIZE) {
        neighbors.push(nextRow * SIZE + nextCol);
      }
    }
  }

  return neighbors;
}

function placeMines(safeIndex) {
  const blocked = new Set([safeIndex, ...getNeighbors(safeIndex)]);
  const candidates = state.board
    .map((cell) => cell.index)
    .filter((index) => !blocked.has(index));

  for (let placed = 0; placed < MINE_COUNT; placed += 1) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const [mineIndex] = candidates.splice(randomIndex, 1);
    state.board[mineIndex].mine = true;
  }

  state.board.forEach((cell) => {
    cell.adjacent = getNeighbors(cell.index).filter(
      (neighborIndex) => state.board[neighborIndex].mine,
    ).length;
  });
}

function renderBoard() {
  boardEl.innerHTML = "";

  state.board.forEach((cell) => {
    const button = document.createElement("button");
    button.className = "cell";
    button.type = "button";
    button.dataset.index = String(cell.index);
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", getCellLabel(cell));
    button.disabled = state.gameOver || cell.open;

    if (cell.open) {
      button.classList.add("open");
      if (cell.mine) {
        button.classList.add("mine");
        button.textContent = "*";
      } else if (cell.adjacent > 0) {
        button.dataset.number = String(cell.adjacent);
        button.textContent = String(cell.adjacent);
      }
    } else if (cell.flagged) {
      button.classList.add("flagged");
      button.textContent = "!";
    }

    button.addEventListener("click", () => openCell(cell.index));
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      toggleFlag(cell.index);
    });

    boardEl.append(button);
  });
}

function getCellLabel(cell) {
  const row = Math.floor(cell.index / SIZE) + 1;
  const col = (cell.index % SIZE) + 1;

  if (cell.open && cell.mine) return `${row}행 ${col}열 지뢰`;
  if (cell.open && cell.adjacent > 0) return `${row}행 ${col}열 숫자 ${cell.adjacent}`;
  if (cell.open) return `${row}행 ${col}열 빈 칸`;
  if (cell.flagged) return `${row}행 ${col}열 깃발`;
  return `${row}행 ${col}열 닫힌 칸`;
}

function openCell(index) {
  const cell = state.board[index];
  if (state.gameOver || cell.open || cell.flagged) return;

  if (state.firstClick) {
    placeMines(index);
    state.firstClick = false;
    startTimer();
  }

  if (cell.mine) {
    loseGame();
    return;
  }

  revealSafeArea(index);
  renderBoard();
  updateHud();

  if (state.opened === TOTAL_CELLS - MINE_COUNT) {
    winGame();
  }
}

function revealSafeArea(startIndex) {
  const queue = [startIndex];
  const visited = new Set();

  while (queue.length > 0) {
    const index = queue.shift();
    const cell = state.board[index];
    if (visited.has(index) || cell.open || cell.flagged || cell.mine) continue;

    visited.add(index);
    cell.open = true;
    state.opened += 1;

    if (cell.adjacent === 0) {
      getNeighbors(index).forEach((neighborIndex) => {
        if (!visited.has(neighborIndex)) queue.push(neighborIndex);
      });
    }
  }
}

function toggleFlag(index) {
  const cell = state.board[index];
  if (state.gameOver || cell.open) return;
  if (!cell.flagged && state.flags >= MINE_COUNT) return;

  cell.flagged = !cell.flagged;
  state.flags += cell.flagged ? 1 : -1;
  renderBoard();
  updateHud();
}

function loseGame() {
  state.gameOver = true;
  stopTimer();
  state.board.forEach((cell) => {
    if (cell.mine) cell.open = true;
  });
  statusEl.textContent = "패배";
  renderBoard();
}

async function winGame() {
  state.gameOver = true;
  stopTimer();
  state.board.forEach((cell) => {
    if (cell.mine) cell.flagged = true;
  });
  statusEl.textContent = "승리";
  renderBoard();
  updateHud();
  await saveRecord(state.seconds);
}

function updateHud() {
  flagsLeftEl.textContent = String(MINE_COUNT - state.flags);
  timerEl.textContent = String(state.seconds);

  if (!state.gameOver) {
    statusEl.textContent = state.firstClick ? "첫 칸을 열어주세요" : "진행 중";
  }
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    state.seconds += 1;
    timerEl.textContent = String(state.seconds);
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function resetGame() {
  stopTimer();
  state.board = createEmptyBoard();
  state.firstClick = true;
  state.gameOver = false;
  state.opened = 0;
  state.flags = 0;
  state.seconds = 0;
  renderBoard();
  updateHud();
}

function readLocalRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORD_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalRecords(records) {
  localStorage.setItem(RECORD_KEY, JSON.stringify(records.slice(0, RECORD_LIMIT)));
}

async function saveRecord(seconds) {
  const record = {
    seconds,
    board: `${SIZE}x${SIZE}`,
    mines: MINE_COUNT,
    createdAt: new Date().toISOString(),
  };

  state.records = [record, ...state.records]
    .sort((a, b) => a.seconds - b.seconds)
    .slice(0, RECORD_LIMIT);
  writeLocalRecords(state.records);
  renderRecords();

  if (state.firebase) {
    await state.firebase.save(record);
    state.records = await state.firebase.loadTopRecords();
    writeLocalRecords(state.records);
    renderRecords();
  }
}

function renderRecords() {
  if (state.records.length === 0) {
    recordsEl.innerHTML = '<li class="muted">아직 기록이 없습니다.</li>';
    return;
  }

  recordsEl.innerHTML = "";
  state.records.forEach((record) => {
    const item = document.createElement("li");
    item.textContent = `${record.seconds}초`;
    recordsEl.append(item);
  });
}

async function setupFirebase() {
  try {
    const configModule = await import("./firebase-config.js");

    if (!configModule.firebaseConfig?.apiKey || !configModule.firebaseConfig?.databaseURL) {
      throw new Error("Firebase config is empty");
    }

    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
    );
    const {
      getDatabase,
      ref,
      push,
      set,
      get,
      limitToFirst,
      orderByChild,
      query,
    } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");

    const app = initializeApp(configModule.firebaseConfig);
    const db = getDatabase(app);
    const recordsRef = ref(db, "minesweeperRecords");

    state.firebase = {
      async save(record) {
        const newRecordRef = push(recordsRef);
        await set(newRecordRef, record);
      },
      async loadTopRecords() {
        const snapshot = await get(
          query(recordsRef, orderByChild("seconds"), limitToFirst(RECORD_LIMIT)),
        );
        return snapshot.exists()
          ? Object.values(snapshot.val()).sort((a, b) => a.seconds - b.seconds)
          : [];
      },
    };

    state.records = await state.firebase.loadTopRecords();
    writeLocalRecords(state.records);

    firebaseStatusEl.textContent = "Firebase Realtime Database에 기록 저장 중";
    renderRecords();
  } catch (error) {
    console.error(error);
    firebaseStatusEl.textContent =
      "Firebase Realtime Database 설정 전입니다. firebase-config.js를 채우면 기록 저장이 연결됩니다.";
  }
}

newGameButton.addEventListener("click", resetGame);
boardEl.addEventListener("contextmenu", (event) => event.preventDefault());

state.records = readLocalRecords();
renderRecords();
resetGame();
setupFirebase();
