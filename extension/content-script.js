(() => {
  const runtime = typeof browser !== "undefined" ? browser : chrome;
  const storage = runtime.storage?.local;

  if (!storage) {
    return;
  }

  let audioContext;
  let gainNode;
  const mediaNodes = new WeakMap();

  const ensureAudioGraph = () => {
    if (!audioContext) {
      audioContext = new AudioContext();
      gainNode = audioContext.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  };

  const connectElement = (element) => {
    if (mediaNodes.has(element)) {
      return;
    }

    ensureAudioGraph();

    try {
      const source = audioContext.createMediaElementSource(element);
      source.connect(gainNode);
      mediaNodes.set(element, source);
    } catch (error) {
      // Ignore elements that cannot be connected (e.g., already connected elsewhere).
    }
  };

  const scanMediaElements = () => {
    const elements = document.querySelectorAll("audio, video");
    elements.forEach((element) => connectElement(element));
  };

  const applyGain = (value) => {
    ensureAudioGraph();
    gainNode.gain.value = value;
  };

  const loadInitialGain = async () => {
    const result = await storage.get({ gain: 1 });
    const value = Number(result.gain);
    if (!Number.isNaN(value)) {
      applyGain(value);
    }
  };

  const observer = new MutationObserver(() => {
    scanMediaElements();
  });

  const resumeOnInteraction = () => {
    if (!audioContext || audioContext.state !== "suspended") {
      return;
    }
    audioContext.resume().catch(() => {});
  };

  document.addEventListener("click", resumeOnInteraction, { passive: true });
  document.addEventListener("keydown", resumeOnInteraction, { passive: true });

  runtime.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "set-gain") {
      return;
    }

    const value = Number(message.value);
    if (!Number.isNaN(value)) {
      applyGain(value);
    }
  });

  loadInitialGain();
  scanMediaElements();
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
