import { Cell, Universe } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // pixels
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext("2d");

let animationId = null;

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }
    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE,
            );
        }
    }
    ctx.stroke();
};

const drawPulsar = (row, col) => {
    // TODO: I am going to do this longhand for now...

    // Upper left arm
    universe.toggle(row - 1, col - 2);
    universe.toggle(row - 1, col - 3);
    universe.toggle(row - 1, col - 4);
    universe.toggle(row - 2, col - 1);
    universe.toggle(row - 3, col - 1);
    universe.toggle(row - 4, col - 1);
    universe.toggle(row - 6, col - 2);
    universe.toggle(row - 6, col - 3);
    universe.toggle(row - 6, col - 4);
    universe.toggle(row - 2, col - 6);
    universe.toggle(row - 3, col - 6);
    universe.toggle(row - 4, col - 6);

    // Upper right arm
    universe.toggle(row - 1, col + 2);
    universe.toggle(row - 1, col + 3);
    universe.toggle(row - 1, col + 4);
    universe.toggle(row - 2, col + 1);
    universe.toggle(row - 3, col + 1);
    universe.toggle(row - 4, col + 1);
    universe.toggle(row - 6, col + 2);
    universe.toggle(row - 6, col + 3);
    universe.toggle(row - 6, col + 4);
    universe.toggle(row - 2, col + 6);
    universe.toggle(row - 3, col + 6);
    universe.toggle(row - 4, col + 6);

    // Lower left arm
    universe.toggle(row + 1, col - 2);
    universe.toggle(row + 1, col - 3);
    universe.toggle(row + 1, col - 4);
    universe.toggle(row + 2, col - 1);
    universe.toggle(row + 3, col - 1);
    universe.toggle(row + 4, col - 1);
    universe.toggle(row + 6, col - 2);
    universe.toggle(row + 6, col - 3);
    universe.toggle(row + 6, col - 4);
    universe.toggle(row + 2, col - 6);
    universe.toggle(row + 3, col - 6);
    universe.toggle(row + 4, col - 6);

    // Lower right arm
    universe.toggle(row + 1, col + 2);
    universe.toggle(row + 1, col + 3);
    universe.toggle(row + 1, col + 4);
    universe.toggle(row + 2, col + 1);
    universe.toggle(row + 3, col + 1);
    universe.toggle(row + 4, col + 1);
    universe.toggle(row + 6, col + 2);
    universe.toggle(row + 6, col + 3);
    universe.toggle(row + 6, col + 4);
    universe.toggle(row + 2, col + 6);
    universe.toggle(row + 3, col + 6);
    universe.toggle(row + 4, col + 6);
};
const drawGlider = (row, col) => {
    // TODO: Do this in one pass? With some kind of array?
    universe.toggle(row, col);
    universe.toggle(row + 1, col);
    universe.toggle(row, col + 1);
    universe.toggle(row - 1, col + 1);
    universe.toggle(row - 1, col - 1);
};

const fps = new class {
    constructor() {
        this.fps = document.getElementById("fps");
        this.frames = [];
        this.lastFrameTimestamp = performance.now();
    }

    render() {
        const now = performance.now();
        const delta = now - this.lastFrameTimestamp;
        this.lastFrameTimestamp = now;
        const fps = 1 / delta * 1000;

        this.frames.push(fps);

        if (this.frames.length > 100) {
            // moves array along by one, earliest entry gone
            this.frames.shift();
        }

        let min = Infinity;
        let max = -Infinity;

        let sum = 0;

        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        }

        let mean = sum / this.frames.length;

        this.fps.textContent = `
        Frames per second:
        latest = ${Math.round(fps)}
        avg of last 100 = ${Math.round(mean)}
        min of last 100 = ${Math.round(min)}
        max of last 100 = ${Math.round(max)}
        `.trim();

    }
        
}

canvas.addEventListener("click", (e) => {
    console.log(e);
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (e.clientX - boundingRect.left) * scaleX;
    const canvasTop = (e.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    switch (true) {
        case e.ctrlKey:
        case e.metaKey:
            drawGlider(row, col);
            break;
        case e.shiftKey:
            drawPulsar(row, col);
            break;
        default:
            universe.toggle(row, col);
            break;
    }

    drawGrid();
    drawCells();
});

const isPaused = () => {
    return animationId === null;
};

const renderLoop = () => {
    fps.render();
    //debugger;
    universe.tick();

    drawGrid();
    drawCells();

    animationId = requestAnimationFrame(renderLoop);
};

const playPauseButton = document.getElementById("play-pause");
const clearButton = document.getElementById("clear");
const restartButton = document.getElementById("restart");

const play = () => {
    playPauseButton.textContent = "⏸️";
    renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶️";
    cancelAnimationFrame(animationId);
    animationId = null;
};

const clear = () => {
    // TODO:
    console.log('clear button clicked');
    pause();
    universe.clear();
    drawGrid();
    drawCells();
}

// TODO: getting a weird loop here
const restart = () => {
    universe.reset();
    play();
}

clearButton.addEventListener("click", () => {
    clear();
})

playPauseButton.addEventListener("click", () => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

restartButton.addEventListener("click", () => {
    restart();
});

play();
