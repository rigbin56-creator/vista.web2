/**
 * js/games.js
 * Lógica para minijuegos (Tres en Raya)
 */

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let currentPlayer = "rigbin"; // Empieza Rigbin (X)
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameState[clickedCellIndex] !== "" || !gameActive) return;

    handleCellPlayed(clickedCell, clickedCellIndex);
    handleResultValidation();
}

function handleCellPlayed(cell, index) {
    gameState[index] = currentPlayer;
    // X para Rigbin, O para Candy
    const symbol = currentPlayer === "rigbin" ? "X" : "O";
    const className = currentPlayer === "rigbin" ? "x" : "o";

    cell.textContent = symbol;
    cell.classList.add(className);
}

function handleResultValidation() {
    let roundWon = false;
    for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];
        if (a === '' || b === '' || c === '') continue;
        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        const winnerName = CONFIG.AUTHORS[currentPlayer].name;
        statusText.innerHTML = `🏆 ¡Gana <span style="color:${CONFIG.AUTHORS[currentPlayer].color}">${winnerName}</span>!`;
        gameActive = false;
        return;
    }

    if (!gameState.includes("")) {
        statusText.textContent = "¡Empate!";
        gameActive = false;
        return;
    }

    // Cambio de turno
    currentPlayer = currentPlayer === "rigbin" ? "candy" : "rigbin";
    const nextName = CONFIG.AUTHORS[currentPlayer].name;
    statusText.innerHTML = `Turno de <span style="color:${CONFIG.AUTHORS[currentPlayer].color}">${nextName}</span>`;
}

function resetGame() {
    currentPlayer = "rigbin";
    gameActive = true;
    gameState = ["", "", "", "", "", "", "", "", ""];
    statusText.textContent = "Turno de Rigbin";
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell"; // Quitar clases x / o
    });
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
