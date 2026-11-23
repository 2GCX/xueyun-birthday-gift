(() => {
  const app = document.querySelector('#app');
  const progress = document.querySelector('#top-progress');
  const canvas = document.querySelector('#particle-canvas');
  const ctx = canvas.getContext('2d');
  const sceneLabels = { cover: '序章', wish: '第一站', food: '第二站', tasks: '第三站', puzzle: '第四站', balloons: '第五站', final: '完成', gift: '生日惊喜' };
  let currentScene = 'cover';
  let isTransitioning = false;
  let particles = [];
  let particleFrame = null;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function spawnTransitionParticles() {
    const originX = window.innerWidth * (.42 + Math.random() * .16);
    const originY = window.innerHeight * (.39 + Math.random() * .22);
    const colors = ['#fff1bf', '#bde9f4', '#f1b7c6', '#b9e7d9', '#ffffff'];
    const count = Math.min(180, Math.floor(window.innerWidth / 6));
    particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const force = 2.2 + Math.random() * 9;
      return { x: originX + (Math.random() - .5) * 90, y: originY + (Math.random() - .5) * 60, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force - (1 + Math.random() * 3), life: 1, decay: .012 + Math.random() * .018, size: .7 + Math.random() * 2.8, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .18, shape: Math.random() > .72 ? 'diamond' : 'dot' };
    });
    if (!particleFrame) particleFrame = requestAnimationFrame(renderParticles);
  }

  function renderParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((particle) => particle.life > 0);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += .055;
      particle.vx *= .985;
      particle.life -= particle.decay;
      particle.rotation += particle.spin;
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life) * .95;
      ctx.fillStyle = particle.color;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      if (particle.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -particle.size * 2.2);
        ctx.lineTo(particle.size * 1.2, 0);
        ctx.lineTo(0, particle.size * 2.2);
        ctx.lineTo(-particle.size * 1.2, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (particles.length) particleFrame = requestAnimationFrame(renderParticles);
    else { particleFrame = null; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }

  function burstBackground() {
    const vectors = [[-28, -18, -24], [28, -16, 24], [-12, 28, -16], [20, 24, 18], [-34, 8, -30]];
    $$('.swarm-butterfly').forEach((butterfly, index) => {
      const [x, y, r] = vectors[index % vectors.length];
      butterfly.style.setProperty('--burst-x', `${x}vw`);
      butterfly.style.setProperty('--burst-y', `${y}vh`);
      butterfly.style.setProperty('--burst-r', `${r}deg`);
    });
    app.classList.add('is-burst');
    window.setTimeout(() => app.classList.remove('is-burst'), 900);
  }

  function transitionTo(nextScene) {
    if (isTransitioning || nextScene === currentScene) return;
    const previous = document.querySelector(`[data-scene="${currentScene}"]`);
    const next = document.querySelector(`[data-scene="${nextScene}"]`);
    if (!previous || !next) return;
    isTransitioning = true;
    progress.textContent = sceneLabels[nextScene] || '';
    burstBackground();
    spawnTransitionParticles();
    next.classList.add('scene--active', 'scene--entering');
    previous.classList.add('scene--exiting');
    requestAnimationFrame(() => requestAnimationFrame(() => next.classList.add('scene--entered')));
    window.setTimeout(() => {
      previous.classList.remove('scene--active', 'scene--exiting');
      next.classList.remove('scene--entering', 'scene--entered');
      currentScene = nextScene;
      isTransitioning = false;
      onSceneEntered(nextScene);
    }, 980);
  }

  function onSceneEntered(sceneName) {
    if (sceneName === 'puzzle') resetPuzzle();
    if (sceneName === 'balloons') setupBalloons();
  }

  // Opening scene
  $('#start-button').addEventListener('click', () => transitionTo('wish'));

  // Wish scene
  let wishComplete = false;
  function extinguishWish() {
    if (wishComplete) return;
    wishComplete = true;
    $('#cake-stage').classList.add('is-extinguished');
    $('.wish-stage').classList.add('is-wished');
    $('#blow-button').disabled = true;
    $('#blow-button').textContent = '愿望已出发 ✦';
    spawnTransitionParticles();
    window.setTimeout(() => $('#wish-card').classList.add('is-visible'), 500);
  }
  $('#blow-button').addEventListener('click', extinguishWish);
  $('#wish-next').addEventListener('click', () => transitionTo('food'));

  // Food cards
  $$('.food-card').forEach((card) => card.addEventListener('click', () => card.classList.toggle('is-open')));
  $('#food-next').addEventListener('click', () => transitionTo('tasks'));

  // Birthday checklist
  const taskInputs = $$('.task-item input');
  const taskCount = $('#task-count');
  const taskProgressBar = $('#task-progress-bar');
  const taskMessage = $('#task-message');
  const tasksNext = $('#tasks-next');
  function updateTasks() {
    const completed = taskInputs.filter((input) => input.checked).length;
    taskCount.textContent = `${completed} / ${taskInputs.length}`;
    taskProgressBar.style.width = `${(completed / taskInputs.length) * 100}%`;
    if (completed === taskInputs.length) {
      taskMessage.textContent = '五件小事全部点亮，下一份祝福已经准备好了。';
      tasksNext.disabled = false;
    } else {
      taskMessage.textContent = '把五件小事全部点亮，继续收集下一份祝福。';
      tasksNext.disabled = true;
    }
  }
  taskInputs.forEach((input) => input.addEventListener('change', updateTasks));
  tasksNext.addEventListener('click', () => transitionTo('puzzle'));

  // Real 8-puzzle: 8 tiles + one empty space.
  const puzzleGrid = $('#puzzle-grid');
  const puzzleSuccess = $('#puzzle-success');
  const puzzleSuccessText = $('#puzzle-success-text');
  const puzzleNext = $('#puzzle-next');
  const puzzleHint = $('#puzzle-hint');
  const thinkButton = $('#think-button');
  const thinkPopover = $('#think-popover');
  const thinkAgain = $('#think-again');
  const skipPuzzle = $('#skip-puzzle');
  let puzzleValues = [...Array(9).keys()];
  let puzzleReady = false;
  let puzzleBuilt = false;
  let puzzleHintTimeout = null;

  function isPuzzleSolved() { return puzzleValues.every((value, index) => value === index); }
  function blankNeighbors(blankIndex) {
    const row = Math.floor(blankIndex / 3);
    const col = blankIndex % 3;
    const neighbors = [];
    if (row > 0) neighbors.push(blankIndex - 3);
    if (row < 2) neighbors.push(blankIndex + 3);
    if (col > 0) neighbors.push(blankIndex - 1);
    if (col < 2) neighbors.push(blankIndex + 1);
    return neighbors;
  }
  function shufflePuzzle() {
    puzzleValues = [...Array(9).keys()];
    let blankIndex = 8;
    let previousIndex = -1;
    for (let step = 0; step < 80; step += 1) {
      const options = blankNeighbors(blankIndex).filter((index) => index !== previousIndex);
      const nextIndex = options[Math.floor(Math.random() * options.length)];
      [puzzleValues[blankIndex], puzzleValues[nextIndex]] = [puzzleValues[nextIndex], puzzleValues[blankIndex]];
      previousIndex = blankIndex;
      blankIndex = nextIndex;
    }
    if (isPuzzleSolved()) shufflePuzzle();
  }
  function backgroundPositionFor(value) { return `${(value % 3) * 50}% ${Math.floor(value / 3) * 50}%`; }
  function drawPuzzle() {
    $$('.puzzle-piece', puzzleGrid).forEach((piece, index) => {
      const value = puzzleValues[index];
      piece.dataset.value = String(value);
      piece.dataset.hint = value === 8 ? '空' : String(value + 1);
      piece.querySelector('.puzzle-number').textContent = piece.dataset.hint;
      piece.classList.toggle('is-empty', value === 8);
      if (value === 8) {
        piece.style.backgroundImage = 'none';
        piece.style.backgroundPosition = '';
      } else {
        piece.style.backgroundImage = "url('assets/butterfly-user.png')";
        piece.style.backgroundSize = '300% 300%';
        piece.style.backgroundPosition = backgroundPositionFor(value);
      }
    });
  }
  function resetPuzzle() {
    puzzleReady = false;
    window.clearTimeout(puzzleHintTimeout);
    puzzleGrid.classList.remove('show-hints');
    puzzleHint.textContent = '看一眼编号';
    puzzleHint.setAttribute('aria-pressed', 'false');
    puzzleSuccess.classList.remove('is-visible');
    puzzleNext.disabled = true;
    thinkPopover.classList.remove('is-visible');
    thinkPopover.setAttribute('aria-hidden', 'true');
    if (!puzzleBuilt) {
      puzzleGrid.innerHTML = '';
      for (let index = 0; index < 9; index += 1) {
        const piece = document.createElement('button');
        piece.type = 'button';
        piece.className = 'puzzle-piece';
        piece.setAttribute('aria-label', `拼图格 ${index + 1}`);
      const numberBadge = document.createElement('span');
      numberBadge.className = 'puzzle-number';
      numberBadge.setAttribute('aria-hidden', 'true');
      piece.appendChild(numberBadge);
        piece.addEventListener('click', () => movePuzzlePiece(index));
        puzzleGrid.appendChild(piece);
      }
      puzzleBuilt = true;
    }
    shufflePuzzle();
    drawPuzzle();
  }
  function movePuzzlePiece(index) {
    if (puzzleReady) return;
    const blankIndex = puzzleValues.indexOf(8);
    if (!blankNeighbors(blankIndex).includes(index)) return;
    [puzzleValues[blankIndex], puzzleValues[index]] = [puzzleValues[index], puzzleValues[blankIndex]];
    drawPuzzle();
    if (isPuzzleSolved()) finishPuzzle('solved');
  }
  function finishPuzzle(mode) {
    if (puzzleReady) return;
    puzzleReady = true;
    puzzleSuccess.classList.add('is-visible');
    puzzleNext.disabled = false;
    puzzleSuccessText.textContent = mode === 'skip' ? '好啦，今天不为难你。愿你也像这只蝴蝶一样，带着自己的愿望，展翅飞翔。' : '愿你也像这只蝴蝶一样，带着自己的愿望，展翅飞翔。';
    spawnTransitionParticles();
  }
  thinkButton.addEventListener('click', () => {
    const visible = thinkPopover.classList.toggle('is-visible');
    thinkPopover.setAttribute('aria-hidden', String(!visible));
  });
  thinkAgain.addEventListener('click', () => { thinkPopover.classList.remove('is-visible'); thinkPopover.setAttribute('aria-hidden', 'true'); });
  skipPuzzle.addEventListener('click', () => {
    thinkPopover.classList.remove('is-visible');
    thinkPopover.setAttribute('aria-hidden', 'true');
    puzzleValues = [...Array(9).keys()];
    drawPuzzle();
    puzzleGrid.classList.add('is-auto-solved');
    window.setTimeout(() => {
      puzzleGrid.classList.remove('is-auto-solved');
      finishPuzzle('skip');
    }, 420);
  });
  puzzleHint.addEventListener('click', () => {
    window.clearTimeout(puzzleHintTimeout);
    puzzleGrid.classList.add('show-hints');
    puzzleHint.textContent = '提示已显示';
    puzzleHint.setAttribute('aria-pressed', 'true');
    puzzleHintTimeout = window.setTimeout(() => {
      puzzleGrid.classList.remove('show-hints');
      puzzleHint.textContent = '看一眼编号';
      puzzleHint.setAttribute('aria-pressed', 'false');
    }, 4500);
  });
  puzzleNext.addEventListener('click', () => transitionTo('balloons'));

  // Balloon wishes
  const balloonMessages = [
    '愿你新的一岁，有很多轻松的时刻。',
    '愿你每次点外卖，都能很快选到真正想吃的东西。',
    '愿你不用急着成为别人期待的样子，按照自己的节奏生活就好。',
    '愿你拥有很多小小但确定的快乐。',
    '今天的热量暂时免检，开心最重要。',
    '愿你遇到的每个选择，都越来越接近自己真正想要的生活。',
    '愿你喜欢的食物越来越多，讨厌的事情越来越少。',
    '愿你的快乐不需要理由，想吃东西也不需要理由。',
    '愿你一直保留那些让你觉得有趣的小习惯。',
    '愿今天的蛋糕、礼物和祝福，都刚刚好。'
  ];
  const balloonColors = ['#86c9da', '#d5b4e6', '#f1c87e', '#a3dfc9', '#e29aa5', '#9eb9eb'];
  const balloonPositions = [[9,25],[21,70],[31,31],[43,76],[53,23],[64,68],[74,31],[85,75],[91,25],[50,52]];
  let balloonsReady = false;
  let poppedBalloons = 0;
  function setupBalloons() {
    if (balloonsReady) return;
    balloonsReady = true;
    const field = $('#balloon-field');
    balloonMessages.forEach((message, index) => {
      const balloon = document.createElement('button');
      balloon.type = 'button'; balloon.className = 'balloon';
      balloon.style.left = `${balloonPositions[index][0]}%`; balloon.style.top = `${balloonPositions[index][1]}%`;
      balloon.style.setProperty('--balloon-color', balloonColors[index % balloonColors.length]); balloon.style.setProperty('--float-delay', `${(index % 5) * -.65}s`);
      balloon.setAttribute('aria-label', `打开第 ${index + 1} 个祝福气球`); balloon.innerHTML = '<span class="balloon__knot"></span>';
      balloon.addEventListener('click', () => {
        if (balloon.classList.contains('is-popped')) return;
        balloon.classList.add('is-popped'); poppedBalloons += 1;
        $('#balloon-count').textContent = `${poppedBalloons} / ${balloonMessages.length} 已收集`;
        $('#balloon-toast p').textContent = message; $('#balloon-toast').classList.remove('toast-pop');
        requestAnimationFrame(() => $('#balloon-toast').classList.add('toast-pop'));
        if (poppedBalloons === balloonMessages.length) { $('#balloons-next').disabled = false; window.setTimeout(() => { $('#balloon-toast p').textContent = '所有祝福都收集完成了。'; }, 650); }
      });
      field.appendChild(balloon);
    });
  }
  $('#balloons-next').addEventListener('click', () => transitionTo('final'));

  // Gift reveal after the final birthday message.
  const giftLayout = $('.gift-layout');
  const giftReveal = $('#gift-reveal');
  const giftOpenButton = $('#gift-open-button');
  function resetGiftScene() {
    giftLayout.classList.remove('is-open');
    giftReveal.setAttribute('aria-hidden', 'true');
    giftOpenButton.disabled = false;
    giftOpenButton.querySelector('span:first-child').textContent = '拆开看看';
  }
  $('#gift-transition-button').addEventListener('click', () => {
    resetGiftScene();
    transitionTo('gift');
  });
  giftOpenButton.addEventListener('click', () => {
    if (giftLayout.classList.contains('is-open')) return;
    giftLayout.classList.add('is-open');
    giftReveal.setAttribute('aria-hidden', 'false');
    giftOpenButton.disabled = true;
    giftOpenButton.querySelector('span:first-child').textContent = '礼物打开啦';
    spawnTransitionParticles();
  });
  $('#gift-back-button').addEventListener('click', () => transitionTo('final'));
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateTasks();
})();