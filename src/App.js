import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const App = () => {
  const canvasRef = useRef(null);
  const [playerName, setPlayerName] = useState(
    localStorage.getItem("playerName") || ""
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Save name to localStorage when it changes
  useEffect(() => {
    if (playerName.trim()) {
      localStorage.setItem("playerName", playerName);
    }
  }, [playerName]);

  // Handle game start
  const handleStartGame = () => {
    if (playerName.trim()) {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
    } else {
      alert("Please enter your name!");
    }
  };

  // Clear cached name
  const clearCache = () => {
    localStorage.removeItem("playerName");
    setPlayerName("");
  };

  // Game logic
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = 600; // Fixed width
      canvas.height = window.innerHeight; // Full screen height
    };

    // Initialize canvas dimensions
    setCanvasDimensions();

    // Handle window resize
    const handleResize = () => {
      setCanvasDimensions();
    };

    window.addEventListener("resize", handleResize);

    // Game state
    const missile = { x: 300, y: canvas.height - 30, radius: 10, dx: 0, dy: 0 };
    const bullets = [];
    const blocks = [];
    const particles = [];
    let blockSpeed = 2;

    // Audio effects
    const bulletHitSound = new Audio("/sounds/bullet-hit.mp3"); // Path to sound file
    const missileCollisionSound = new Audio("/sounds/missile-collision.mp3"); // Path to sound file

    // Particle class for visual effects
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.velocity = {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        };
        this.alpha = 1;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
      }
    }

    // Handle missile movement
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") missile.dy = -5;
      if (e.key === "ArrowDown") missile.dy = 5;
      if (e.key === "ArrowLeft") missile.dx = -5;
      if (e.key === "ArrowRight") missile.dx = 5;
    };

    const handleKeyUp = () => {
      missile.dx = 0;
      missile.dy = 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Spawn blocks with random weight
    const spawnBlock = () => {
      const width = Math.random() * 50 + 30;
      const height = Math.random() * 50 + 30;
      const x = Math.random() * (canvas.width - width);
      const weight = Math.floor(Math.random() * 10) + 1; // Random weight between 1 and 10
      blocks.push({ x, y: 0, width, height, weight, color: "#6B5B95" });
    };

    const spawnInterval = setInterval(spawnBlock, 1000);

    // Increase block speed
    const speedInterval = setInterval(() => {
      blockSpeed += 0.1;
    }, 5000);

    // Automatic firing
    const fireInterval = setInterval(() => {
      bullets.push({
        x: missile.x,
        y: missile.y - missile.radius,
        radius: 5,
        dy: -10,
      });
    }, 500); // Fire every 500ms

    // Game loop
    const gameLoop = () => {
      if (gameOver) {
        clearInterval(spawnInterval);
        clearInterval(speedInterval);
        clearInterval(fireInterval);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("resize", handleResize);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move missile
      missile.x = Math.max(
        missile.radius,
        Math.min(canvas.width - missile.radius, missile.x + missile.dx)
      );
      missile.y = Math.max(
        missile.radius,
        Math.min(canvas.height - missile.radius, missile.y + missile.dy)
      );

      // Draw missile
      ctx.beginPath();
      ctx.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FF6F61";
      ctx.fill();
      ctx.closePath();

      // Move and draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y += bullet.dy;

        // Draw bullet
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        ctx.closePath();

        // Remove off-screen bullets
        if (bullet.y < 0) {
          bullets.splice(i, 1);
        }
      }

      // Move and draw blocks
      for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        block.y += blockSpeed;

        // Draw block
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);

        // Draw block weight
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          block.weight,
          block.x + block.width / 2,
          block.y + block.height / 2 + 6
        );

        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
          const bullet = bullets[j];
          if (
            bullet.x > block.x &&
            bullet.x < block.x + block.width &&
            bullet.y > block.y &&
            bullet.y < block.y + block.height
          ) {
            block.weight -= 1; // Reduce block weight
            setScore((prev) => prev + 1); // Add score
            bullets.splice(j, 1); // Remove bullet

            // Add particle effect
            for (let k = 0; k < 10; k++) {
              particles.push(new Particle(bullet.x, bullet.y, "#FFD700"));
            }

            // Play bullet hit sound
            bulletHitSound.currentTime = 0;
            bulletHitSound.play();

            if (block.weight <= 0) {
              blocks.splice(i, 1); // Remove block if weight is zero
            }
          }
        }

        // Check collision with missile
        if (
          missile.x + missile.radius > block.x &&
          missile.x - missile.radius < block.x + block.width &&
          missile.y + missile.radius > block.y &&
          missile.y - missile.radius < block.y + block.height
        ) {
          // Add explosion effect
          for (let k = 0; k < 50; k++) {
            particles.push(new Particle(missile.x, missile.y, "#FF6F61"));
          }

          // Play missile collision sound
          missileCollisionSound.currentTime = 0;
          missileCollisionSound.play();

          setGameOver(true);
        }

        // Remove off-screen blocks
        if (block.y > canvas.height) {
          blocks.splice(i, 1);
        }
      }

      // Draw and update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        // Remove particles with alpha <= 0
        if (particles[i].alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // Request next frame
      requestAnimationFrame(gameLoop);
    };

    // Start game loop
    requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      clearInterval(spawnInterval);
      clearInterval(speedInterval);
      clearInterval(fireInterval);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="App">
      {!gameStarted ? (
        <div className="menu">
          <h1>Missile Game</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={handleStartGame}>Start Game</button>
          {playerName && (
            <button onClick={clearCache} className="clear-cache">
              Clear Name
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="score-board">
            <h2>Player: {playerName}</h2>
            <h2>Score: {score}</h2>
          </div>
          <canvas ref={canvasRef} />
          {gameOver && (
            <div className="game-over">
              <h2>Game Over!</h2>
              <p>Your score: {score}</p>
              <button onClick={() => window.location.reload()}>
                Play Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
