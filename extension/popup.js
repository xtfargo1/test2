const runtime = typeof browser !== "undefined" ? browser : chrome;
const storage = runtime.storage?.local;

const gainInput = document.getElementById("gain");
const applyButton = document.getElementById("apply");

const sendGainToTab = async (value) => {
  const [tab] = await runtime.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  await runtime.tabs.sendMessage(tab.id, { type: "set-gain", value });
};

const loadGain = async () => {
  if (!storage) {
    return;
  }

  const result = await storage.get({ gain: 1 });
  gainInput.value = result.gain;
};

const saveAndApply = async () => {
  const value = Number(gainInput.value);
  if (Number.isNaN(value)) {
    return;
  }

  if (storage) {
    await storage.set({ gain: value });
  }

  await sendGainToTab(value);
};

applyButton.addEventListener("click", () => {
  saveAndApply();
});

gainInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveAndApply();
  }
});

loadGain();
